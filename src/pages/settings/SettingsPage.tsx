import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Building2, User, CreditCard } from 'lucide-react'

export function SettingsPage() {
  const { org, profile, membership, refreshOrg } = useAuth()
  const [section, setSection] = useState<'org' | 'profile' | 'plan'>('org')
  const [orgName, setOrgName] = useState(org?.name ?? '')
  const [orgEmail, setOrgEmail] = useState(org?.email ?? '')
  const [orgPhone, setOrgPhone] = useState(org?.phone ?? '')
  const [orgCity, setOrgCity] = useState(org?.city ?? '')
  const [orgState, setOrgState] = useState(org?.state ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

  async function saveOrg() {
    setSaving(true)
    await supabase.from('organizations').update({ name: orgName, email: orgEmail, phone: orgPhone, city: orgCity, state: orgState }).eq('id', org!.id)
    await refreshOrg()
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { id: 'org', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'Your profile', icon: User },
    { id: 'plan', label: 'Plan & billing', icon: CreditCard },
  ]

  return (
    <div>
      <h1 className="page-title mb-6">Settings</h1>
      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id as 'org' | 'profile' | 'plan')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${section === s.id ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <s.icon size={16} />{s.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 max-w-xl">
          {section === 'org' && (
            <div className="card space-y-5">
              <div><h2 className="font-semibold">Organization</h2><p className="text-sm text-gray-500 mt-0.5">Manage your shelter's details.</p></div>
              <div><label className="label">Shelter name</label><input className="input" value={orgName} onChange={e => setOrgName(e.target.value)} disabled={!isAdmin} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Email</label><input className="input" type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} disabled={!isAdmin} /></div>
                <div><label className="label">Phone</label><input className="input" value={orgPhone} onChange={e => setOrgPhone(e.target.value)} disabled={!isAdmin} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">City</label><input className="input" value={orgCity} onChange={e => setOrgCity(e.target.value)} disabled={!isAdmin} /></div>
                <div><label className="label">State</label><input className="input" maxLength={2} value={orgState} onChange={e => setOrgState(e.target.value.toUpperCase())} disabled={!isAdmin} /></div>
              </div>
              {isAdmin && <button onClick={saveOrg} className="btn-primary" disabled={saving}>{saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}</button>}
            </div>
          )}
          {section === 'profile' && (
            <div className="card space-y-5">
              <div><h2 className="font-semibold">Your profile</h2><p className="text-sm text-gray-500">{profile?.email}</p></div>
              <div><label className="label">Full name</label><input className="input" defaultValue={profile?.full_name ?? ''} /></div>
              <div><label className="label">Role</label><input className="input capitalize" value={membership?.role ?? ''} disabled /></div>
              <button className="btn-primary">Save profile</button>
            </div>
          )}
          {section === 'plan' && (
            <div className="card space-y-5">
              <div><h2 className="font-semibold">Plan & billing</h2><p className="text-sm text-gray-500">You're on the <span className="font-semibold capitalize text-teal-600">{org?.plan}</span> plan.</p></div>
              <div className="space-y-3">
                {[
                  { plan: 'free', price: '$0/mo', features: ['Up to 2 staff', 'Unlimited animals', 'Core features', 'Daily observations'] },
                  { plan: 'pro', price: '$29/mo', features: ['Unlimited staff', 'Foster management', 'Quarantine module', 'Advanced reports'] },
                  { plan: 'growth', price: '$79/mo', features: ['Everything in Pro', 'Petfinder sync', 'Donor tools', 'Data import'] },
                ].map(tier => (
                  <div key={tier.plan} className={`p-4 rounded-xl border transition-colors ${org?.plan === tier.plan ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold capitalize">{tier.plan}</span>
                      <span className="font-mono text-sm text-gray-600">{tier.price}</span>
                    </div>
                    <ul className="text-sm text-gray-500 space-y-0.5">{tier.features.map(f => <li key={f}>· {f}</li>)}</ul>
                    {org?.plan !== tier.plan && tier.plan !== 'free' && <button className="btn-primary mt-3 text-sm py-1.5">Upgrade to {tier.plan}</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
