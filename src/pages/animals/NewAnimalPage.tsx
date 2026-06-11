// NewAnimalPage
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import type { AnimalSpecies, AnimalSex, IntakeType } from '@/types'

export function NewAnimalPage() {
  const { org, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', species: 'dog' as AnimalSpecies, breed: '', sex: 'unknown' as AnimalSex,
    age_years: '', age_months: '', color: '', weight_lbs: '',
    intake_type: 'stray' as IntakeType, intake_date: new Date().toISOString().split('T')[0],
    intake_notes: '', microchip_id: '', shelter_id: '', location: '', altered: false,
  })

  function set(field: string, value: string | boolean) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { data, error } = await supabase.from('animals').insert({
      org_id: org!.id, name: form.name || null, species: form.species, breed: form.breed || null,
      sex: form.sex, age_years: form.age_years ? parseInt(form.age_years) : null,
      age_months: form.age_months ? parseInt(form.age_months) : null,
      color: form.color || null, weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      intake_type: form.intake_type, intake_date: form.intake_date, intake_notes: form.intake_notes || null,
      intake_by: user?.id, microchip_id: form.microchip_id || null, shelter_id: form.shelter_id || null,
      location: form.location || null, altered: form.altered, status: 'available',
    }).select().single()
    if (error) { setError(error.message); setLoading(false); return }
    queryClient.invalidateQueries({ queryKey: ['animals'] })
    navigate(`/animals/${data.id}`)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/animals" className="btn-ghost px-2"><ChevronLeft size={18} /></Link>
        <div><h1 className="page-title">New intake</h1><p className="text-sm text-gray-500">Record a new animal entering your shelter.</p></div>
      </div>
      {error && <div className="mb-5 p-3 bg-coral-50 text-coral-400 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name <span className="text-gray-400 font-normal">(optional)</span></label><input className="input" placeholder="Buddy" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="label">Species</label><select className="input" value={form.species} onChange={e => set('species', e.target.value)}><option value="dog">Dog</option><option value="cat">Cat</option><option value="rabbit">Rabbit</option><option value="bird">Bird</option><option value="reptile">Reptile</option><option value="small_animal">Small animal</option><option value="other">Other</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Breed</label><input className="input" placeholder="Labrador mix" value={form.breed} onChange={e => set('breed', e.target.value)} /></div>
            <div><label className="label">Sex</label><select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}><option value="unknown">Unknown</option><option value="male">Male</option><option value="female">Female</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Age (years)</label><input className="input" type="number" min="0" max="30" placeholder="2" value={form.age_years} onChange={e => set('age_years', e.target.value)} /></div>
            <div><label className="label">Age (months)</label><input className="input" type="number" min="0" max="11" placeholder="6" value={form.age_months} onChange={e => set('age_months', e.target.value)} /></div>
            <div><label className="label">Weight (lbs)</label><input className="input" type="number" step="0.1" placeholder="45.5" value={form.weight_lbs} onChange={e => set('weight_lbs', e.target.value)} /></div>
          </div>
          <div><label className="label">Color</label><input className="input" placeholder="Black and white" value={form.color} onChange={e => set('color', e.target.value)} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="altered" checked={form.altered} onChange={e => set('altered', e.target.checked)} className="w-4 h-4 accent-teal-400" /><label htmlFor="altered" className="text-sm text-gray-700">Spayed / neutered</label></div>
        </div>
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Intake details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Intake type</label><select className="input" value={form.intake_type} onChange={e => set('intake_type', e.target.value)}><option value="stray">Stray</option><option value="owner_surrender">Owner surrender</option><option value="transfer">Transfer</option><option value="born_in_care">Born in care</option><option value="other">Other</option></select></div>
            <div><label className="label">Intake date</label><input className="input" type="date" value={form.intake_date} onChange={e => set('intake_date', e.target.value)} required /></div>
          </div>
          <div><label className="label">Location</label><input className="input" placeholder="Kennel 4B" value={form.location} onChange={e => set('location', e.target.value)} /></div>
          <div><label className="label">Notes</label><textarea className="input min-h-[70px] resize-none" placeholder="Any notes…" value={form.intake_notes} onChange={e => set('intake_notes', e.target.value)} /></div>
        </div>
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Identification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Microchip ID</label><input className="input" placeholder="985112345678900" value={form.microchip_id} onChange={e => set('microchip_id', e.target.value)} /></div>
            <div><label className="label">Shelter ID</label><input className="input" placeholder="2024-001" value={form.shelter_id} onChange={e => set('shelter_id', e.target.value)} /></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save intake'}</button>
          <Link to="/animals" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
