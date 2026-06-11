import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SHELTERLUV_BASE = 'https://www.shelterluv.com/api/v1'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function mapAnimal(a: Record<string, unknown>, orgId: string) {
  const speciesMap: Record<string, string> = { 'Dog':'dog','Cat':'cat','Rabbit':'rabbit','Bird':'bird','Reptile':'reptile','Small Animal':'small_animal','Guinea Pig':'small_animal' }
  const statusMap: Record<string, string> = { 'Available':'available','Adoptable':'available','Adopted':'adopted','Foster':'fostered','Hold':'hold','Medical Hold':'medical','Transferred':'transferred','Transferred Out':'transferred','Deceased':'deceased','Stray Hold':'stray_hold' }
  const intakeMap: Record<string, string> = { 'Stray':'stray','Owner Surrender':'owner_surrender','Transfer':'transfer','Born In Care':'born_in_care' }

  // Dates are Unix timestamps
  let intakeDate = new Date().toISOString().split('T')[0]
  const rawDate = a['LastIntakeUnixTime']
  if (rawDate) {
    const d = new Date(parseInt(rawDate as string) * 1000)
    if (!isNaN(d.getTime())) intakeDate = d.toISOString().split('T')[0]
  }

  // Photos: use Photos array first, fall back to CoverPhoto
  // Skip default placeholder images
  const DEFAULT_PHOTOS = ['default_cat.png', 'default_dog.png', 'default_animal.png']
  const rawPhotos = (a['Photos'] as Array<Record<string, string>>) ?? []
  let photoUrls = rawPhotos.map(p => p.large ?? p.Large ?? p.URL ?? p.url).filter(Boolean) as string[]
  
  // Fall back to CoverPhoto if no Photos and it's not a default
  if (photoUrls.length === 0 && a['CoverPhoto']) {
    const cover = a['CoverPhoto'] as string
    const isDefault = DEFAULT_PHOTOS.some(d => cover.includes(d))
    if (!isDefault) photoUrls = [cover]
  }

  // DOB from Unix timestamp
  let dob = null
  if (a['DOBUnixTime']) {
    const d = new Date((a['DOBUnixTime'] as number) * 1000)
    if (!isNaN(d.getTime())) dob = d.toISOString().split('T')[0]
  }

  const animal = {
    org_id: orgId,
    name: (a['Name'] as string) || null,
    species: speciesMap[a['Type'] as string] ?? 'other',
    breed: (a['Breed'] as string) || null,
    sex: (a['Sex'] as string)?.toLowerCase() === 'male' ? 'male' : (a['Sex'] as string)?.toLowerCase() === 'female' ? 'female' : 'unknown',
    color: (a['Color'] as string) || null,
    weight_lbs: a['CurrentWeightPounds'] ? parseFloat(a['CurrentWeightPounds'] as string) : null,
    dob,
    microchip_id: ((a['Microchips'] as Array<{Number:string}>)?.[0]?.Number) || null,
    shelter_id: (a['Internal-ID'] as string)?.toString() || null,
    altered: (a['Altered'] as string) === 'Yes',
    location: (a['CurrentLocation'] as Record<string,string>)?.Name || null,
    status: statusMap[a['Status'] as string] ?? 'available',
    intake_type: intakeMap[a['Intake Type'] as string] ?? 'other',
    intake_date: intakeDate,
    intake_notes: (a['Description'] as string) || null,
  }

  return { animal, photoUrls }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { apiKey, orgId } = await req.json()
    if (!apiKey || !orgId) return new Response(JSON.stringify({ error: 'apiKey and orgId required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })

    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } })
    const { data: membership } = await supabase.from('org_memberships').select('role').eq('org_id', orgId).single()
    if (!membership) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })

    // Paginate all animals
    const allAnimals: Record<string, unknown>[] = []
    let offset = 0
    while (true) {
      const res = await fetch(`${SHELTERLUV_BASE}/animals?limit=100&offset=${offset}`, { headers: { 'X-Api-Key': apiKey } })
      if (!res.ok) {
        const text = await res.text()
        return new Response(JSON.stringify({ error: `ShelterLuv error: ${res.status} ${text}` }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
      }
      const data = await res.json()
      const animals = data.animals ?? data.data ?? []
      allAnimals.push(...animals)
      if (animals.length < 100) break
      offset += 100
    }

    const mapped = allAnimals.map(a => mapAnimal(a, orgId))
    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Clear existing imported animals
    await adminClient.from('animals').delete().eq('org_id', orgId).not('shelter_id', 'is', null)

    let imported = 0
    const errors: string[] = []

    for (let i = 0; i < mapped.length; i += 50) {
      const batch = mapped.slice(i, i + 50)
      const { data: inserted, error } = await adminClient.from('animals').insert(batch.map(m => m.animal)).select('id, shelter_id')
      if (error) { errors.push(error.message); continue }
      imported += inserted.length

      // Insert photos
      const photoRows: { org_id: string; animal_id: string; url: string; is_primary: boolean }[] = []
      for (const ins of inserted) {
        const orig = mapped.find(m => m.animal.shelter_id === ins.shelter_id)
        if (!orig) continue
        orig.photoUrls.forEach((url, idx) => photoRows.push({ org_id: orgId, animal_id: ins.id, url, is_primary: idx === 0 }))
      }
      if (photoRows.length > 0) await adminClient.from('animal_photos').insert(photoRows)
    }

    return new Response(JSON.stringify({ imported, total: allAnimals.length, errors }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
