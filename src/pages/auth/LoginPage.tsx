// LoginPage
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PawPrint } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
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
          <h1 className="text-lg font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-5">Welcome back.</p>
          {error && <div className="mb-4 p-3 bg-coral-50 text-coral-400 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" className="input" placeholder="you@shelter.org" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="label">Password</label><input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">No account? <Link to="/signup" className="text-teal-600 font-medium hover:underline">Create one</Link></p>
        </div>
      </div>
    </div>
  )
}
