import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ShieldAlert, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { QuarantineCase, Animal } from '@/types'

const REASON_LABELS: Record<string, string> = {
  new_intake: 'New intake', illness: 'Illness', bite_case: 'Bite case',
  exposure: 'Exposure', post_surgery: 'Post surgery', behavior: 'Behavior', other: 'Other',
}

export function QuarantinePage() {
  const { org } = useAuth()

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['quarantine', org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quarantine_cases')
        .select('*, animals(id, name, species, breed, location, animal_photos(url, is_primary))')
        .eq('org_id', org!.id)
        .order('start_date', { ascending: false })
      return (data ?? []) as (QuarantineCase & { animals: Animal & { animal_photos: {url:string;is_primary:boolean}[] } })[]
    },
    enabled: !!org?.id,
  })

  const active = cases.filter(c => c.status === 'active')
  const closed = cases.filter(c => c.status !== 'active')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Quarantine</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} active case{active.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary"><Plus size={16} />New case</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : cases.length === 0 ? (
        <div className="card text-center py-20 text-gray-400">
          <ShieldAlert size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No quarantine cases</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="section-title">Active ({active.length})</p>
              <div className="grid gap-3">
                {active.map(c => <QuarantineCard key={c.id} case_={c} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="section-title">Closed</p>
              <div className="grid gap-3 opacity-60">
                {closed.map(c => <QuarantineCard key={c.id} case_={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuarantineCard({ case_: c }: { case_: QuarantineCase & { animals: Animal & { animal_photos: {url:string;is_primary:boolean}[] } } }) {
  const daysIn = Math.floor((Date.now() - new Date(c.start_date).getTime()) / 86400000)
  const expectedEnd = c.expected_end ? new Date(c.expected_end) : null
  const daysRemaining = expectedEnd ? Math.ceil((expectedEnd.getTime() - Date.now()) / 86400000) : null
  const overdue = daysRemaining !== null && daysRemaining < 0
  const primaryPhoto = c.animals?.animal_photos?.find(p => p.is_primary)?.url ?? c.animals?.animal_photos?.[0]?.url

  return (
    <Link to={`/quarantine/${c.id}`} className={`card flex items-start gap-4 border-l-4 hover:shadow-sm transition-shadow ${c.status === 'active' ? 'border-l-orange-400' : 'border-l-gray-200'}`}>
      {/* Photo */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {primaryPhoto
          ? <img src={primaryPhoto} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ShieldAlert size={18} className="text-gray-300" /></div>
        }
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900">{c.animals?.name ?? 'Unnamed'}</p>
          <span className="text-xs text-gray-400 capitalize">{c.animals?.species}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>Reason: <span className="text-gray-700">{REASON_LABELS[c.reason] ?? c.reason}</span></span>
          <span>Started: <span className="text-gray-700">{new Date(c.start_date).toLocaleDateString()}</span></span>
          {c.kennel_location && <span>Location: <span className="text-gray-700">{c.kennel_location}</span></span>}
        </div>
        {c.notes && <p className="text-xs text-gray-500 mt-1 truncate">{c.notes}</p>}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-lg font-semibold text-gray-900">Day {daysIn}</p>
        {daysRemaining !== null && (
          <p className={`text-xs font-medium ${overdue ? 'text-coral-400' : 'text-gray-400'}`}>
            {overdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
          </p>
        )}
      </div>
    </Link>
  )
}
