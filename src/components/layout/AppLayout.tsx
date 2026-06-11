import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, PawPrint, Heart,
  Settings, LogOut, Menu, Upload, ShieldAlert
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'


export function AppLayout() {
  const { org, profile, membership, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/animals',   label: 'Animals',   icon: PawPrint },
    { to: '/adoptions', label: 'Adoptions', icon: Heart },
  ]

  const sidebar = (
    <aside className="flex flex-col w-64 h-full text-white bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-semibold text-sm bg-teal-400 text-gray-900">
          S
        </div>
        <span className="font-mono font-medium text-white text-sm">Rescue-IO</span>
      </div>

      {/* Org */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-teal-800 text-teal-100">
            {org?.name?.[0]?.toUpperCase() ?? 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{org?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{org?.plan} plan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-teal-400/10 text-teal-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        </nav>

      <div className="pt-2 section-title px-3">Tools</div>
      <NavLink
        to="/import/shelterluv"
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) => clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive ? 'bg-teal-400/10 text-teal-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
        )}
      >
        <Upload size={18} />
        Import from ShelterLuv
      </NavLink>
      <button
        onClick={() => window.open('https://binx-q.vercel.app', '_blank')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 mt-1"
      >
        <ShieldAlert size={18} />
        Quarantine Mode ↗
      </button>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive ? 'bg-teal-400/10 text-teal-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          )}
        >
          <Settings size={18} />
          Settings
        </NavLink>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-gray-900 flex-shrink-0 bg-teal-400">
              {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-white truncate">{profile?.full_name ?? profile?.email}</p>
              <p className="text-xs text-gray-400 capitalize">{membership?.role}</p>
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-white/10 rounded-lg overflow-hidden shadow-xl">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="flex-shrink-0 w-64">{sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white border-gray-100">
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <span className="font-mono font-medium text-sm text-gray-900">Rescue-IO</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}