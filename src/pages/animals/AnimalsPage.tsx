import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Plus, Search, PawPrint } from 'lucide-react'
import type { Animal, AnimalStatus } from '@/types'

const STATUS_FILTERS: { label: string; value: AnimalStatus | 'all' }[] = [
  { label: 'All active', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Medical', value: 'medical' },
  { label: 'Hold', value: 'hold' },
  { label: 'Quarantine', value: 'quarantine' },
  { label: 'Fostered', value: 'fostered' },
]

export function AnimalsPage() {
  const { org } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AnimalStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['animals', org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('animals')
        .select(`
          *,
          animal_photos (
            url,
            is_primary
          )
        `)
        .eq('org_id', org!.id)
        .not('status', 'in', '("adopted","transferred","deceased")')
        .order('intake_date', { ascending: false })
        .limit(100)

      return (data ?? []).map((a: Animal & { animal_photos: { url: string; is_primary: boolean }[] }) => ({
        ...a,
        primary_photo: a.animal_photos?.find(p => p.is_primary)?.url
          ?? a.animal_photos?.[0]?.url
          ?? null,
      })) as Animal[]
    },
    enabled: !!org?.id,
  })

  const filtered = animals.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || a.name?.toLowerCase().includes(q) || a.breed?.toLowerCase().includes(q) || a.shelter_id?.toLowerCase().includes(q) || a.microchip_id?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Animals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{animals.length} in care</p>
        </div>
        <Link to="/animals/new" className="btn-primary"><Plus size={16} />Add animal</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Search by name, breed, ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === f.value ? 'bg-teal-400 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <PawPrint size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No animals found</p>
          <p className="text-sm mt-1">{animals.length === 0 ? <Link to="/animals/new" className="text-teal-600 hover:underline">Add your first animal</Link> : 'Try adjusting your search'}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Animal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Species</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Intake</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(animal => (
                <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/animals/${animal.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {animal.primary_photo
                          ? <img src={animal.primary_photo} alt={animal.name ?? ''} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-teal-50"><PawPrint size={16} className="text-teal-400" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{animal.name ?? <span className="text-gray-400">Unnamed</span>}</p>
                        <p className="text-xs text-gray-400">{animal.breed ?? animal.species}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-gray-600 capitalize">{animal.species}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-gray-600">{animal.location ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className={`status-${animal.status}`}>{animal.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-gray-500">{new Date(animal.intake_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
