import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { PawPrint, Heart, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Animal } from '@/types'

function StatCard({ label, value, icon: Icon, color = 'teal' }: { label: string; value: number | string; icon: React.ElementType; color?: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600', coral: 'bg-coral-50 text-coral-400',
    amber: 'bg-amber-100 text-amber-400', gray: 'bg-gray-100 text-gray-600',
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

type AnimalWithPhoto = Animal & { primary_photo?: string | null }

export function DashboardPage() {
  const { org, profile } = useAuth()

  const { data: animals = [] } = useQuery({
    queryKey: ['animals', org?.id],
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('shelteriq_animals')
        .select(`
          id, status, name, species, intake_date, location,
          animal_photos (
            url,
            is_primary
          )
        `)
        .eq('org_id', org!.id)
        .not('status', 'in', '("adopted","transferred","deceased")')
        .order('intake_date', { ascending: false })
        return (data ?? []).map((a: any) => ({
          ...a,
          primary_photo: a.animal_photos?.find((p: any) => p.is_primary)?.url
            ?? a.animal_photos?.[0]?.url
            ?? null,
        })) as AnimalWithPhoto[]
    },
    enabled: !!org?.id,
  })

  const { data: pendingAdoptions = 0 } = useQuery({
    queryKey: ['pending-adoptions', org?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('adoption_applications')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org!.id)
        .eq('status', 'pending')
      return count ?? 0
    },
    enabled: !!org?.id,
  })

  const available = animals.filter(a => a.status === 'available').length
  const flagged = animals.filter(a => a.status === 'medical').length
  const recentIntakes = animals.slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Animals in care" value={animals.length} icon={PawPrint} color="teal" />
        <StatCard label="Available" value={available} icon={Heart} color="gray" />
        <StatCard label="Medical" value={flagged} icon={AlertTriangle} color="coral" />
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
              <p className="text-sm">
                <Link to="/animals/new" className="text-teal-600 hover:underline">Add your first animal</Link>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentIntakes.map(a => (
                <Link key={a.id} to={`/animals/${a.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-teal-50">
                    {a.primary_photo
                      ? <img src={a.primary_photo} alt={a.name ?? ''} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><PawPrint size={14} className="text-teal-400" /></div>
                    }
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
            <h2 className="font-semibold text-gray-900">Adoptions</h2>
            <Link to="/adoptions" className="text-sm text-teal-600 hover:underline">View all</Link>
          </div>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart size={28} className="text-teal-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{pendingAdoptions}</p>
            <p className="text-sm text-gray-500">pending applications</p>
            {pendingAdoptions > 0 && (
              <Link to="/adoptions" className="btn-primary mt-3 inline-flex text-sm">
                Review applications
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
