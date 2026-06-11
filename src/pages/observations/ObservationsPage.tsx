import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, AlertTriangle, PawPrint, ChevronRight, X } from 'lucide-react'
import { ObservationForm } from '@/components/animals/ObservationForm'
import type { Animal, DailyObservation } from '@/types'
import { format } from 'date-fns'

export function ObservationsPage() {
  const { org } = useAuth()
  const queryClient = useQueryClient()
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const { data: animals = [] } = useQuery({
    queryKey: ['animals', org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shelteriq_animals')
        .select('*, animal_photos(url, is_primary)')
        .eq('org_id', org!.id)
        .not('status', 'in', '("adopted","transferred","deceased")')
        .order('name')
      return (data ?? []).map((a: Animal & { animal_photos: { url: string; is_primary: boolean }[] }) => ({
        ...a,
        primary_photo: a.animal_photos?.find(p => p.is_primary)?.url ?? a.animal_photos?.[0]?.url ?? null,
      })) as (Animal & { primary_photo: string | null })[]
    },
    enabled: !!org?.id,
  })

  const { data: todayObs = [] } = useQuery({
    queryKey: ['observations-today', org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_observations')
        .select('animal_id, flag_for_vet, appetite, behavior, vomiting, coughing, observed_at')
        .eq('org_id', org!.id)
        .gte('observed_at', today)
      return (data ?? []) as (Partial<DailyObservation> & { animal_id: string })[]
    },
    enabled: !!org?.id,
  })

  const obsMap = new Map(todayObs.map(o => [o.animal_id, o]))
  const done = animals.filter(a => obsMap.has(a.id))
  const pending = animals.filter(a => !obsMap.has(a.id))
  const flagged = todayObs.filter(o => o.flag_for_vet)
  const pct = animals.length > 0 ? Math.round((done.length / animals.length) * 100) : 0

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">Daily Rounds</h1>
        <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">{done.length} / {animals.length} completed</p>
            <p className="text-sm text-gray-400">{pending.length} animals still need a check</p>
          </div>
          <div className="text-2xl font-semibold text-teal-500">{pct}%</div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {flagged.length > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 font-medium">{flagged.length} animal{flagged.length !== 1 ? 's' : ''} flagged for vet review today</p>
          </div>
        )}
      </div>

      {selectedAnimal && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {(selectedAnimal as Animal & { primary_photo?: string | null }).primary_photo && (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={(selectedAnimal as Animal & { primary_photo?: string | null }).primary_photo!} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{selectedAnimal.name ?? 'Unnamed'}</p>
                <p className="text-xs text-gray-400 capitalize">{selectedAnimal.species}{selectedAnimal.location ? ` · ${selectedAnimal.location}` : ''}</p>
              </div>
            </div>
            <button onClick={() => setSelectedAnimal(null)} className="btn-ghost px-2"><X size={16} /></button>
          </div>
          <ObservationForm
            animalId={selectedAnimal.id}
            onSaved={() => {
              setSelectedAnimal(null)
              queryClient.invalidateQueries({ queryKey: ['observations-today', org?.id] })
            }}
            onCancel={() => setSelectedAnimal(null)}
          />
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <p className="section-title">Needs observation ({pending.length})</p>
          <div className="space-y-2">
            {pending.map(animal => (
              <AnimalRow
                key={animal.id}
                animal={animal}
                done={false}
                obs={null}
                onSelect={() => setSelectedAnimal(animal)}
                isSelected={selectedAnimal?.id === animal.id}
              />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p className="section-title">Completed ({done.length})</p>
          <div className="space-y-2">
            {done.map(animal => (
              <AnimalRow
                key={animal.id}
                animal={animal}
                done={true}
                obs={obsMap.get(animal.id) ?? null}
                onSelect={() => setSelectedAnimal(animal)}
                isSelected={selectedAnimal?.id === animal.id}
              />
            ))}
          </div>
        </div>
      )}

      {animals.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No animals in care</p>
          <p className="text-sm mt-1"><Link to="/animals/new" className="text-teal-600 hover:underline">Add animals</Link> to start daily rounds.</p>
        </div>
      )}
    </div>
  )
}

function AnimalRow({ animal, done, obs, onSelect, isSelected }: {
  animal: Animal & { primary_photo?: string | null }
  done: boolean
  obs: Partial<DailyObservation> | null
  onSelect: () => void
  isSelected: boolean
}) {
  const hasFlag = obs?.flag_for_vet
  const hasConcern = obs && (obs.appetite !== 'good' || obs.vomiting || obs.coughing || obs.behavior !== 'normal')

  return (
    <div
      className={`card p-3 flex items-center gap-3 cursor-pointer transition-colors ${
        isSelected ? 'border-teal-400 bg-teal-50/30' : hasConcern ? 'border-amber-200' : 'hover:border-gray-200'
      }`}
      onClick={onSelect}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {animal.primary_photo
          ? <img src={animal.primary_photo} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><PawPrint size={16} className="text-gray-300" /></div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{animal.name ?? 'Unnamed'}</p>
        <p className="text-xs text-gray-400 capitalize">{animal.species}{animal.location ? ` · ${animal.location}` : ''}</p>
        {done && obs && (
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {hasConcern && <span className="badge bg-amber-100 text-amber-700 text-xs">Concerns noted</span>}
            {hasFlag && <span className="badge bg-red-50 text-red-400 text-xs flex items-center gap-0.5"><AlertTriangle size={9} />Vet flagged</span>}
            {!hasConcern && !hasFlag && <span className="badge bg-teal-50 text-teal-700 text-xs">All clear</span>}
          </div>
        )}
      </div>

      {done
        ? <CheckCircle size={20} className="text-teal-400 flex-shrink-0" />
        : <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
      }
    </div>
  )
}
