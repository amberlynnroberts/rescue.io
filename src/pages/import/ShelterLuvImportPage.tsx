import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Key, ArrowRight, ExternalLink } from 'lucide-react'

type Step = 'connect' | 'importing' | 'done'

export function ShelterLuvImportPage() {
  const { org } = useAuth()
  const [step, setStep] = useState<Step>('connect')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported: number; total: number; errors: string[] } | null>(null)

  async function handleImport() {
    if (!apiKey.trim()) { setError('Paste your ShelterLuv API key first.'); return }
    setError(''); setLoading(true); setStep('importing')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('shelterluv-import', {
        body: { apiKey: apiKey.trim(), orgId: org!.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.error) throw new Error(res.error.message)
      setResult(res.data)
      setStep('done')
    } catch (err) {
      setError(String(err)); setStep('connect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="page-title">Import from ShelterLuv</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connect your ShelterLuv account and we'll pull all your animals and photos automatically.</p>
      </div>

      {step === 'connect' && (
        <div className="space-y-5">
          <div className="card bg-teal-50 border-teal-100 p-4 space-y-2">
            <p className="text-sm font-semibold text-teal-800">How to get your API key</p>
            <ol className="text-sm text-teal-700 space-y-1.5 list-decimal list-inside">
              <li>Log into ShelterLuv as an admin</li>
              <li>Click your username (top-right) → <strong>Configuration</strong> → <strong>Integrations</strong></li>
              <li>Click <strong>Generate</strong> next to API Key</li>
              <li>Copy the key and paste it below</li>
            </ol>
            <a href="https://new.shelterluv.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline mt-1">
              Open ShelterLuv <ExternalLink size={13} />
            </a>
          </div>
          <div className="card space-y-4">
            <div className="flex items-center gap-2"><Key size={18} className="text-gray-400" /><p className="font-semibold">Your ShelterLuv API key</p></div>
            <input type="password" className="input font-mono text-sm" placeholder="Paste your API key here…" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            {error && <div className="flex items-start gap-2 p-3 bg-coral-50 rounded-lg"><AlertCircle size={16} className="text-coral-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-coral-400">{error}</p></div>}
            <div>
              <button onClick={handleImport} disabled={loading || !apiKey.trim()} className="btn-primary w-full">
                Import all animals + photos <ArrowRight size={16} />
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">Your API key is never stored — only used for this import.</p>
            </div>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="card text-center py-16">
          <div className="w-12 h-12 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold">Pulling data from ShelterLuv…</p>
          <p className="text-sm text-gray-400 mt-1">Importing animals and photos. This may take a minute.</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="card text-center py-12">
            <CheckCircle size={40} className="mx-auto mb-3 text-teal-400" />
            <p className="text-2xl font-semibold">{result.imported} animals imported</p>
            {result.total !== result.imported && <p className="text-sm text-gray-400 mt-1">{result.total - result.imported} skipped</p>}
            <a href="/animals" className="btn-primary inline-flex mt-6">View your animals</a>
          </div>
          {result.errors.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><AlertCircle size={16} className="text-coral-400" /><p className="text-sm font-semibold text-coral-400">Some records had errors</p></div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <p key={i} className="text-xs text-gray-500 font-mono">{e}</p>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
