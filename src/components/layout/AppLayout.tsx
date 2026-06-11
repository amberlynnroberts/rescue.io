import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMode } from '@/context/ModeContext'
import {
  LayoutDashboard, PawPrint, Heart, ShieldAlert,
  Settings, LogOut, Menu, Upload, ClipboardList,
  ShieldCheck, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

export function AppLayout() {
  const { org, profile, membership, signOut } = useAuth()
  const { quarantineMode, toggleQuarantineMode } = useMode()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const shelterNav = [
    { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/animals',    label: 'Animals',     icon: PawPrint },
    { to: '/adoptions',  label: 'Adoptions',   icon: Heart },
    { to: '/observations', label: 'Daily Rounds', icon: ClipboardList },
  ]

  const quarantineNav = [
    { to: '/quarantine', label: 'Active Cases',  icon: ShieldAlert },
    { to: '/animals',    label: 'All Animals',   icon: PawPrint },
    { to: '/observations', label: 'Daily Rounds', icon: ClipboardList },
  ]

  const navItems = quarantineMode ? quarantineNav : shelterNav

  const accentColor = quarantineMode ? 'text-orange-400' : 'text-teal-400'
  const accentBg = quarantineMode ? 'bg-orange-400' : 'bg-teal-400'
  const activeBg = quarantineMode ? 'bg-orange-400/10 text-orange-300' : 'bg-teal-400/10 text-teal-300'

  const sidebar = (
    <aside className={clsx(
      'flex flex-col w-64 h-full text-white transition-colors duration-300',
      quarantineMode ? 'bg-orange-950' : 'bg-gray-900'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center font-mono font-semibold text-sm', accentBg, 'text-gray-900')}>
          {quarantineMode ? 'Q' : 'S'}
        </div>
        <div>
          <span className="font-mono font-medium text-white text-sm">
            {quarantineMode ? 'QuarantineIQ' : 'Rescue.IO'}
          </span>
          {quarantineMode && (
            <div className="text-xs text-orange-300 font-medium">Quarantine Mode</div>
          )}
        </div>
      </div>

      {/* Org */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className={clsx('w-7 h-7 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0', quarantineMode ? 'bg-orange-900 text-orange-200' : 'bg-teal-800 text-teal-100')}>
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
        {quarantineMode && (
          <div className="section-title px-3 text-orange-400/60">Quarantine</div>
        )}
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to + label}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? activeBg : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {!quarantineMode && (
          <>
            <div className="pt-2 section-title px-3">Tools</div>
            <NavLink
              to="/import/shelterluv"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? activeBg : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Upload size={18} />
              Import from ShelterLuv
            </NavLink>
          </>
        )}
      </nav>

      {/* Quarantine mode toggle */}
      <div className="px-3 pb-3 border-t border-white/10 pt-3">
        <button
          onClick={toggleQuarantineMode}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            quarantineMode
              ? 'bg-orange-400/20 text-orange-300 hover:bg-orange-400/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          )}
        >
          {quarantineMode ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          <span className="flex-1 text-left">
            {quarantineMode ? 'Exit Quarantine Mode' : 'Quarantine Mode'}
          </span>
          <ChevronRight size={14} className={clsx('transition-transform', quarantineMode && 'rotate-180')} />
        </button>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive ? activeBg : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
            <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-gray-900 flex-shrink-0', accentBg)}>
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
    <div className={clsx('flex h-screen overflow-hidden', quarantineMode && 'quarantine-mode')}>
      <div className="hidden md:flex flex-shrink-0">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="flex-shrink-0 w-64">{sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={clsx(
          'md:hidden flex items-center justify-between px-4 py-3 border-b',
          quarantineMode ? 'bg-orange-950 border-orange-900' : 'bg-white border-gray-100'
        )}>
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={22} className={quarantineMode ? 'text-orange-300' : 'text-gray-600'} />
          </button>
          <span className={clsx('font-mono font-medium text-sm', quarantineMode ? 'text-orange-300' : 'text-gray-900')}>
            {quarantineMode ? 'QuarantineIQ' : 'Rescue.IO'}
          </span>
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
