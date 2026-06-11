import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { PawPrint } from 'lucide-react'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

export function CreateOrgPage() {
  const { user, refreshOrg } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    // Get session directly from Supabase, not from context
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      // Last resort: try to get user directly
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not logged in. Please go back and sign in.')
        setLoading(false)
        return
      }
    }

    const uid = session?.user?.id
    const userEmail = session?.user?.email ?? ''
    const userName = session?.user?.user_metadata?.full_name ?? ''

    if (!uid) {
      setError('Not logged in. Please go back and sign in.')
      setLoading(false)
      return
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: uid, email: userEmail, full_name: userName }, { onConflict: 'id' })

    if (profileError) {
      setError('Profile error: ' + profileError.message)
      setLoading(false)
      return
    }

    const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name, slug, city, state, plan: 'free', modules: [] })
      .select()
      .single()

    if (orgErr || !org) {
      setError('Org error: ' + (orgErr?.message ?? 'unknown'))
      setLoading(false)
      return
    }

    const { error: memErr } = await supabase
      .from('org_memberships')
      .insert({ org_id: org.id, user_id: uid, role: 'owner', accepted_at: new Date().toISOString() })

    if (memErr) {
      setError('Membership error: ' + memErr.message)
      setLoading(false)
      return
    }

    await refreshOrg()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center">
            <PawPrint size={20} className="text-white" />
          </div>
          <span className="font-mono text-xl font-medium">Rescue.IO</span>
        </div>
        <div className="card">
          <h1 className="text-lg font-semibold mb-1">Set up your shelter</h1>
          <p className="text-sm text-gray-500 mb-5">Takes 30 seconds. Edit anytime.</p>
          {error && <div className="mb-4 p-3 bg-coral-50 text-coral-400 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Shelter / rescue name</label><input type="text" className="input" placeholder="Happy Tails Rescue" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">City</label><input type="text" className="input" placeholder="Charlotte" value={city} onChange={e => setCity(e.target.value)} /></div>
              <div><label className="label">State</label><input type="text" className="input" placeholder="NC" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} /></div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Setting up…' : 'Create shelter'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
