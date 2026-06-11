import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Organization, OrgMembership } from '@/types'

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: Profile | null
  org: Organization | null
  membership: OrgMembership | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshOrg: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [membership, setMembership] = useState<OrgMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadUserData(userId: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(p)
    const { data: m } = await supabase
      .from('org_memberships')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (m) {
      setMembership(m)
      setOrg((m as OrgMembership & { organizations: Organization }).organizations)
    }
  }

  async function refreshOrg() {
    if (user) await loadUserData(user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null); setUser(null); setProfile(null); setOrg(null); setMembership(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) loadUserData(session.user.id).finally(() => setIsLoading(false))
      else setIsLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) await loadUserData(session.user.id)
      else { setProfile(null); setOrg(null); setMembership(null) }
      setIsLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, org, membership, isLoading, signOut, refreshOrg }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
