import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PawPrint } from 'lucide-react'

export function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !signInData.session) {
      setError('Signed up but could not log in. Please sign in manually.')
      setLoading(false)
      navigate('/login')
      return
    }

    // Wait for session to be fully persisted before navigating
    await new Promise<void>((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          resolve()
        }
      })
      // Timeout fallback after 3 seconds
      setTimeout(resolve, 3000)
    })

    navigate('/create-org')
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
          <h1 className="text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-5">Free to start. No credit card needed.</p>
          {error && <div className="mb-4 p-3 bg-coral-50 text-coral-400 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Your name</label><input type="text" className="input" placeholder="Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" placeholder="you@shelter.org" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="label">Password</label><input type="password" className="input" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /></div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">Have an account? <Link to="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}