import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, ShieldAlert, ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react'
import { ObservationForm } from '@/components/animals/ObservationForm'
import type { QuarantineCase, DailyObservation, Animal } from '@/types'
import { format } from 'date-fns'

const REASON_LABELS: Record<string, string> = {
  new_intake: 'New intake', illness: 'Illness', bite_case: 'Bite case',
  exposure: 'Exposure', post_surgery: 'Post surgery', behavior: 'Behavior', other: 'Other',
}

export function QuarantineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { org } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showObsForm, setShowObsForm] = useState(false)

  const { data: case_, isLoading } = useQuery({
    queryKey: ['quarantine-case', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quarantine_cases')
        .select('*, animals(*, animal_photos(url, is_primary))')
        .eq('id', id!)
        .eq('org_id', org!.id)
        .single()
      return data as QuarantineCase & { animals: Animal & { animal_photos: {url:string;is_primary:boolean}[] } }
    },
    enabled: !!id && !!org?.id,
  })

  // Observations for this quarantine case (shared with main app)
  const { data: observations = [] } = useQuery({
    queryKey: ['quarantine-obs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_observations')
        .select('*, profiles(full_name)')
        .eq('animal_id', case_!.animal_id)
        .order('observed_at', { ascending: false })
        .limit(50)
      return (data ?? []) as (DailyObservation & { profiles?: { full_name: string } })[]
    },
    enabled: !!case_?.animal_id,
  })

  async function closeCase() {
    await supabase.from('quarantine_cases').update({ status: 'cleared', actual_end: new Date().toISOString().split('T')[0] }).eq('id', id!)
    await supabase.from('animals').update({ status: 'available' }).eq('id', case_!.animal_id)
    queryClient.invalidateQueries({ queryKey: ['quarantine-case', id] })
    queryClient.invalidateQueries({ queryKey: ['quarantine', org?.id] })
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!case_) return <div className="text-center py-20"><p className="text-gray-500">Case not found.</p><Link to="/quarantine" className="text-teal-600 hover:underline text-sm mt-2 block">Back</Link></div>

  const daysIn = Math.floor((Date.now() - new Date(case_.start_date).getTime()) / 86400000)
  const primaryPhoto = case_.animals?.animal_photos?.find(p => p.is_primary)?.url ?? case_.animals?.animal_photos?.[0]?.url
  const todayObs = observations.filter(o => new Date(o.observed_at).toDateString() === new Date().toDateString())

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost px-2"><ChevronLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-orange-400" />
            <h1 className="page-title">{case_.animals?.name ?? 'Unnamed'} — Quarantine</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Day {daysIn} · {REASON_LABELS[case_.reason]} · <span className="capitalize">{case_.status}</span>
          </p>
        </div>
        {case_.status === 'active' && (
          <button onClick={closeCase} className="btn-secondary text-teal-600 border-teal-200">
            <CheckCircle size={15} /> Clear case
          </button>
        )}
      </div>

      {/* Animal summary */}
      <div className="card mb-5 flex gap-4">
        {primaryPhoto && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <img src={primaryPhoto} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-400">Species</span><p className="font-medium capitalize">{case_.animals?.species}</p></div>
          <div><span className="text-gray-400">Location</span><p className="font-medium">{case_.kennel_location ?? '—'}</p></div>
          <div><span className="text-gray-400">Started</span><p className="font-medium">{new Date(case_.start_date).toLocaleDateString()}</p></div>
          <div><span className="text-gray-400">Expected end</span><p className="font-medium">{case_.expected_end ? new Date(case_.expected_end).toLocaleDateString() : '—'}</p></div>
        </div>
      </div>

      {/* Today's observation status */}
      <div className={`card mb-5 flex items-center gap-3 p-4 ${todayObs.length > 0 ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
        {todayObs.length > 0
          ? <><CheckCircle size={18} className="text-teal-500 flex-shrink-0" /><p className="text-sm font-medium text-teal-700">Observation completed today</p></>
          : <><AlertTriangle size={18} className="text-amber-500 flex-shrink-0" /><p className="text-sm font-medium text-amber-700">No observation today yet</p></>
        }
        {case_.status === 'active' && (
          <button onClick={() => setShowObsForm(!showObsForm)} className="btn-primary ml-auto text-sm py-1.5">
            {showObsForm ? 'Cancel' : 'Record now'}
          </button>
        )}
      </div>

      {/* Observation form */}
      {showObsForm && (
        <div className="mb-6">
          <ObservationForm
            animalId={case_.animal_id}
            quarantineCaseId={case_.id}
            onSaved={() => {
              setShowObsForm(false)
              queryClient.invalidateQueries({ queryKey: ['quarantine-obs', id] })
            }}
            onCancel={() => setShowObsForm(false)}
          />
        </div>
      )}

      {/* Observation history */}
      <div>
        <p className="section-title">Observation history ({observations.length})</p>
        {observations.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No observations recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {observations.map(obs => {
              const hasFlag = obs.flag_for_vet
              const concerns = [
                obs.appetite !== 'good' && `Appetite: ${obs.appetite?.replace('_', ' ')}`,
                obs.water_intake !== 'normal' && `Water: ${obs.water_intake?.replace('_', ' ')}`,
                obs.stool !== 'normal' && `Stool: ${obs.stool?.replace('_', ' ')}`,
                obs.vomiting && 'Vomiting',
                obs.coughing && 'Coughing',
                obs.behavior !== 'normal' && `Behavior: ${obs.behavior}`,
              ].filter(Boolean) as string[]

              return (
                <div key={obs.id} className={`card ${hasFlag ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{format(new Date(obs.observed_at), 'MMM d, yyyy h:mm a')}</p>
                      {obs.profiles?.full_name && <p className="text-xs text-gray-400">{obs.profiles.full_name}</p>}
                      {obs.quarantine_case_id && <span className="badge bg-orange-50 text-orange-600 mt-1">Quarantine round</span>}
                    </div>
                    {hasFlag && <div className="flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertTriangle size={12} /> Vet flagged</div>}
                  </div>
                  {concerns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {concerns.map(c => <span key={c} className="badge bg-amber-100 text-amber-700">{c}</span>)}
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {obs.temp_f && <span>Temp: {obs.temp_f}°F</span>}
                    {obs.weight_lbs && <span>Weight: {obs.weight_lbs} lbs</span>}
                  </div>
                  {obs.notes && <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{obs.notes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
