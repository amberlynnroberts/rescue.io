import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AdoptionApplication } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-400', reviewing: 'bg-blue-50 text-blue-700',
  approved: 'bg-teal-50 text-teal-800', denied: 'bg-coral-50 text-coral-400', withdrawn: 'bg-gray-100 text-gray-500',
}

export function AdoptionsPage() {
  const { org } = useAuth()
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['adoptions', org?.id],
    queryFn: async () => {
      const { data } = await supabase.from('adoption_applications').select('*, animals(name, species)').eq('org_id', org!.id).order('created_at', { ascending: false })
      return (data ?? []) as (AdoptionApplication & { animals: { name: string; species: string } })[]
    },
    enabled: !!org?.id,
  })
  const pending = apps.filter(a => a.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Adoptions</h1>{pending > 0 && <p className="text-sm text-amber-400 mt-0.5 font-medium">{pending} pending review</p>}</div>
      </div>
      {isLoading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /></div>
      : apps.length === 0 ? (
        <div className="card text-center py-20 text-gray-400"><Heart size={40} className="mx-auto mb-3 opacity-30" /><p className="font-medium text-gray-600">No applications yet</p></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Applicant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Animal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{app.applicant_name}</p><p className="text-xs text-gray-400">{app.applicant_email}</p></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Link to={`/animals/${app.animal_id}`} className="text-sm text-teal-600 hover:underline">{(app as unknown as { animals: {name:string} }).animals?.name ?? '—'}</Link></td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[app.status] ?? ''}`}>{app.status}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
