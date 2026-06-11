import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useMode } from '@/context/ModeContext'
import { PawPrint, Heart, ShieldAlert, AlertTriangle, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Animal } from '@/types'

function StatCard({ label, value, icon: Icon, color = 'teal' }: { label: string; value: number | string; icon: React.ElementType; color?: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600', coral: 'bg-coral-50 text-coral-400',
    amber: 'bg-amber-100 text-amber-400', gray: 'bg-gray-100 text-gray-600', orange: 'bg-orange-50 text-orange-400',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color] ?? colors.gray}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { org, profile } = useAuth()
  const { quarantineMode } = useMode()

  const { data: animals = [] } = useQuery({
    queryKey: ['animals', org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, status, name, species, intake_date, location')
        .eq('org_id', org!.id)
        .not('status', 'in', '("adopted","transferred","deceased")')
        .order('intake_date', { ascending: false })
      return (data ?? []) as Animal[]
    },
    enabled: !!org?.id,
  })

  const { data: pendingAdoptions = 0 } = useQuery({
    queryKey: ['pending-adoptions', org?.id],
    queryFn: async () => {
      const { count } = await supabase.from('adoption_applications').select('*', { count: 'exact', head: true }).eq('org_id', org!.id).eq('status', 'pending')
      return count ?? 0
    },
    enabled: !!org?.id,
  })

  const { data: activeQuarantine = 0 } = useQuery({
    queryKey: ['active-quarantine', org?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org!.id)
        .eq('status', 'quarantine')
      return count ?? 0
    },
    enabled: !!org?.id,
  })

  const { data: todayObsCount = 0 } = useQuery({
    queryKey: ['obs-today', org?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('daily_observations').select('*', { count: 'exact', head: true })
        .eq('org_id', org!.id).gte('observed_at', today)
      return count ?? 0
    },
    enabled: !!org?.id,
  })

  const available = animals.filter(a => a.status === 'available').length
  const flagged = animals.filter(a => a.status === 'medical').length
  const quarantineAnimals = animals.filter(a => a.status === 'quarantine')
  const recentIntakes = animals.slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  if (quarantineMode) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={20} className="text-orange-400" />
            <h1 className="text-xl font-semibold text-gray-900">Quarantine Overview</h1>
          </div>
          <p className="text-sm text-gray-500">{org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Active cases" value={activeQuarantine} icon={ShieldAlert} color="orange" />
          <StatCard label="Observations today" value={todayObsCount} icon={ClipboardList} color="teal" />
          <StatCard label="Flagged for vet" value={flagged} icon={AlertTriangle} color="coral" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Animals in quarantine</h2>
            <Link to="/quarantine" className="text-sm text-orange-500 hover:underline">View all cases</Link>
          </div>
          {quarantineAnimals.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No animals currently in quarantine.</p>
          ) : (
            <div className="space-y-2">
              {quarantineAnimals.map(a => (
                <Link key={a.id} to={`/animals/${a.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
                    <ShieldAlert size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name ?? 'Unnamed'}</p>
                    <p className="text-xs text-gray-400">{a.location ?? 'No location'}</p>
                  </div>
                  <span className="status-quarantine">quarantine</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Animals in care" value={animals.length} icon={PawPrint} color="teal" />
        <StatCard label="Available" value={available} icon={Heart} color="gray" />
        {/* <StatCard label="Pending adoptions" value={pendingAdoptions} icon={Heart} color="amber" /> */}
        <StatCard label="In quarantine" value={activeQuarantine} icon={ShieldAlert} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent intakes</h2>
            <Link to="/animals" className="text-sm text-teal-600 hover:underline">View all</Link>
          </div>
          {recentIntakes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <PawPrint size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm"><Link to="/animals/new" className="text-teal-600 hover:underline">Add your first animal</Link></p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentIntakes.map(a => (
                <Link key={a.id} to={`/animals/${a.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 flex-shrink-0">
                    <PawPrint size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name ?? 'Unnamed'}</p>
                    <p className="text-xs text-gray-400 capitalize">{a.species}</p>
                  </div>
                  <span className={`status-${a.status}`}>{a.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Daily rounds</h2>
            <Link to="/observations" className="text-sm text-teal-600 hover:underline">Go to rounds</Link>
          </div>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={28} className="text-teal-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{todayObsCount}</p>
            <p className="text-sm text-gray-500">observations recorded today</p>
            {todayObsCount < animals.length && (
              <Link to="/observations" className="btn-primary mt-3 inline-flex text-sm">
                Start rounds
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
