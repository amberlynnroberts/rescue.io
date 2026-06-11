import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, PawPrint, Stethoscope, FileText, Camera, ClipboardList, AlertTriangle } from 'lucide-react'
import { PhotoUpload, PhotoGallery } from '@/components/animals/PhotoUpload'
import { ObservationForm } from '@/components/animals/ObservationForm'
import type { Animal, AnimalPhoto, DailyObservation, MedicalRecord, Medication } from '@/types'
import { format } from 'date-fns'

type Tab = 'overview' | 'photos' | 'observations' | 'medical' | 'medications'

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { org } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showObsForm, setShowObsForm] = useState(false)

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('animals')
        .select('*')
        .eq('id', id!)
        .eq('org_id', org!.id)
        .single()
      return data as Animal | null
    },
    enabled: !!id && !!org?.id,
  })

  const { data: photos = [], refetch: refetchPhotos } = useQuery({
    queryKey: ['photos', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('animal_photos')
        .select('*')
        .eq('animal_id', id!)
        .order('is_primary', { ascending: false })
        .order('created_at')
      return (data ?? []) as AnimalPhoto[]
    },
    enabled: !!id,
  })

  const { data: observations = [] } = useQuery({
    queryKey: ['observations', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_observations')
        .select('*, profiles(full_name)')
        .eq('animal_id', id!)
        .order('observed_at', { ascending: false })
        .limit(30)
      return (data ?? []) as DailyObservation[]
    },
    enabled: !!id && tab === 'observations',
  })

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['medical', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*')
        .eq('animal_id', id!)
        .order('date', { ascending: false })
      return (data ?? []) as MedicalRecord[]
    },
    enabled: !!id && tab === 'medical',
  })

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('animal_id', id!)
        .order('active', { ascending: false })
      return (data ?? []) as Medication[]
    },
    enabled: !!id && tab === 'medications',
  })

  async function updateStatus(status: string) {
    await supabase.from('animals').update({ status }).eq('id', id!)
    queryClient.invalidateQueries({ queryKey: ['animal', id] })
    queryClient.invalidateQueries({ queryKey: ['animals'] })
  }

  async function setPrimaryPhoto(photoId: string) {
    await supabase.from('animal_photos').update({ is_primary: false }).eq('animal_id', id!)
    await supabase.from('animal_photos').update({ is_primary: true }).eq('id', photoId)
    refetchPhotos()
  }

  async function deletePhoto(photoId: string) {
    await supabase.from('animal_photos').delete().eq('id', photoId)
    refetchPhotos()
  }

  const primaryPhoto = photos.find(p => p.is_primary)?.url ?? photos[0]?.url

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Animal not found.</p>
        <Link to="/animals" className="text-teal-600 hover:underline text-sm mt-2 block">Back</Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: PawPrint },
    { id: 'photos', label: `Photos${photos.length > 0 ? ` (${photos.length})` : ''}`, icon: Camera },
    { id: 'observations', label: 'Observations', icon: ClipboardList },
    { id: 'medical', label: 'Medical', icon: Stethoscope },
    { id: 'medications', label: 'Medications', icon: FileText },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost px-2 mt-0.5">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-4 flex-1">
          {primaryPhoto && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 hidden sm:block">
              <img src={primaryPhoto} alt={animal.name ?? ''} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">{animal.name ?? 'Unnamed'}</h1>
              <span className={`status-${animal.status}`}>{animal.status?.replace('_', ' ') ?? ''}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              {animal.species}
              {animal.breed ? ` · ${animal.breed}` : ''}
              {animal.sex !== 'unknown' ? ` · ${animal.sex}` : ''}
              {animal.location ? ` · ${animal.location}` : ''}
            </p>
          </div>
        </div>
        <PhotoUpload animalId={animal.id} onUploaded={refetchPhotos} compact />
      </div>

      {/* Quick status */}
      <div className="card mb-5 p-4">
        <p className="section-title">Update status</p>
        <div className="flex flex-wrap gap-2">
          {(['available', 'hold', 'medical', 'quarantine', 'fostered', 'transferred', 'adopted'] as const).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                animal.status === s
                  ? 'bg-teal-400 text-white border-teal-400'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-gray-100 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-teal-400 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Animal details</h3>
            <Row label="Species" value={animal.species} />
            <Row label="Breed" value={animal.breed} />
            <Row label="Sex" value={animal.sex} />
            <Row label="Age" value={
              [
                animal.age_years ? `${animal.age_years}y` : null,
                animal.age_months ? `${animal.age_months}m` : null
              ].filter(Boolean).join(' ') || null
            } />
            <Row label="Weight" value={animal.weight_lbs ? `${animal.weight_lbs} lbs` : null} />
            <Row label="Color" value={animal.color} />
            <Row label="Altered" value={animal.altered ? 'Yes' : 'No'} />
            <Row label="Microchip" value={animal.microchip_id} />
            <Row label="Shelter ID" value={animal.shelter_id} />
          </div>
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Intake</h3>
            <Row label="Type" value={animal.intake_type?.replace('_', ' ')} />
            <Row label="Date" value={animal.intake_date ? new Date(animal.intake_date).toLocaleDateString() : null} />
            <Row label="Location" value={animal.location} />
            {animal.intake_notes && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{animal.intake_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photos */}
      {tab === 'photos' && (
        <div className="space-y-5 max-w-lg">
          <PhotoGallery photos={photos} onSetPrimary={setPrimaryPhoto} onDelete={deletePhoto} />
          <PhotoUpload animalId={animal.id} onUploaded={refetchPhotos} />
        </div>
      )}

      {/* Observations */}
      {tab === 'observations' && (
        <div className="max-w-xl">
          {!showObsForm ? (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{observations.length} recorded</p>
              <button onClick={() => setShowObsForm(true)} className="btn-primary">
                + Complete observation
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">New observation</h2>
              <ObservationForm
                animalId={animal.id}
                onSaved={() => setShowObsForm(false)}
                onCancel={() => setShowObsForm(false)}
              />
            </div>
          )}

          {!showObsForm && observations.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No observations yet.</p>
            </div>
          )}

          {!showObsForm && observations.length > 0 && (
            <div className="space-y-3">
              {observations.map(obs => <ObservationCard key={obs.id} obs={obs} />)}
            </div>
          )}
        </div>
      )}

      {/* Medical */}
      {tab === 'medical' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-gray-500">{medicalRecords.length} records</p>
            <button className="btn-primary">+ Add record</button>
          </div>
          {medicalRecords.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No medical records yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalRecords.map(r => (
                <div key={r.id} className="card">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    {r.cost != null && <span className="text-sm text-gray-500">${r.cost}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {r.type.replace('_', ' ')} · {new Date(r.date).toLocaleDateString()}
                  </p>
                  {r.notes && <p className="text-sm text-gray-600 mt-2">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medications */}
      {tab === 'medications' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-gray-500">{medications.filter(m => m.active).length} active</p>
            <button className="btn-primary">+ Add medication</button>
          </div>
          {medications.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No medications on record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map(m => (
                <div key={m.id} className="card">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <span className={m.active ? 'badge bg-teal-50 text-teal-800' : 'badge bg-gray-100 text-gray-500'}>
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{m.dosage && `${m.dosage} · `}{m.frequency}</p>
                  {m.instructions && <p className="text-sm text-gray-600 mt-2">{m.instructions}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 capitalize">
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  )
}

function ObservationCard({ obs }: { obs: DailyObservation }) {
  const hasFlag = obs.flag_for_vet
  const concerns = [
    obs.appetite !== 'good' && `Appetite: ${obs.appetite.replace('_', ' ')}`,
    obs.water_intake !== 'normal' && `Water: ${obs.water_intake.replace('_', ' ')}`,
    obs.stool !== 'normal' && `Stool: ${obs.stool.replace('_', ' ')}`,
    obs.vomiting && 'Vomiting',
    obs.coughing && 'Coughing',
    obs.sneezing && 'Sneezing',
    obs.behavior !== 'normal' && `Behavior: ${obs.behavior}`,
  ].filter(Boolean) as string[]

  return (
    <div className={`card ${hasFlag ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(obs.observed_at), 'MMM d, yyyy h:mm a')}
          </p>
          {(obs as DailyObservation & { profiles?: { full_name: string } }).profiles?.full_name && (
            <p className="text-xs text-gray-400">
              {(obs as DailyObservation & { profiles?: { full_name: string } }).profiles?.full_name}
            </p>
          )}
        </div>
        {hasFlag && (
          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
            <AlertTriangle size={12} /> Vet flag
          </div>
        )}
      </div>

      {concerns.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {concerns.map(c => (
            <span key={c} className="badge bg-amber-100 text-amber-700">{c}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        {obs.temp_f && <span>Temp: {obs.temp_f}°F</span>}
        {obs.weight_lbs && <span>Weight: {obs.weight_lbs} lbs</span>}
      </div>

      {obs.notes && (
        <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{obs.notes}</p>
      )}
    </div>
  )
}
