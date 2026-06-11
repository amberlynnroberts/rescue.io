import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import type { AppetiteLevel, WaterLevel, StoolType, UrinationType, BehaviorType } from '@/types'

interface ObservationFormProps {
  animalId: string
  quarantineCaseId?: string
  onSaved?: () => void
  onCancel?: () => void
}

type ToggleOption<T> = { value: T; label: string; color?: string }

function ToggleGroup<T extends string>({
  label, value, onChange, options
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: ToggleOption<T>[]
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              value === opt.value
                ? opt.color ?? 'bg-teal-400 text-white border-teal-400'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoolToggle({ label, value, onChange, flagColor = 'bg-coral-400 text-white border-coral-400' }: {
  label: string; value: boolean; onChange: (v: boolean) => void; flagColor?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => onChange(false)}
          className={clsx('px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
            !value ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300')}>
          No
        </button>
        <button type="button" onClick={() => onChange(true)}
          className={clsx('px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
            value ? flagColor : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300')}>
          Yes
        </button>
      </div>
    </div>
  )
}

export function ObservationForm({ animalId, quarantineCaseId, onSaved, onCancel }: ObservationFormProps) {
  const { org, user } = useAuth()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [appetite, setAppetite] = useState<AppetiteLevel>('good')
  const [water, setWater] = useState<WaterLevel>('normal')
  const [stool, setStool] = useState<StoolType>('normal')
  const [urination, setUrination] = useState<UrinationType>('normal')
  const [vomiting, setVomiting] = useState(false)
  const [coughing, setCoughing] = useState(false)
  const [sneezing, setSneezing] = useState(false)
  const [discharge, setDischarge] = useState(false)
  const [behavior, setBehavior] = useState<BehaviorType>('normal')
  const [behaviorNotes, setBehaviorNotes] = useState('')
  const [tempF, setTempF] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [notes, setNotes] = useState('')
  const [flagVet, setFlagVet] = useState(false)

  // Auto-flag vet if concerning values
  const hasConcrn = vomiting || coughing || appetite === 'not_eating' ||
    stool === 'blood' || stool === 'diarrhea' || behavior === 'lethargic' || behavior === 'aggressive'

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('daily_observations').insert({
      org_id: org!.id,
      animal_id: animalId,
      observed_by: user?.id,
      appetite,
      water_intake: water,
      stool,
      urination,
      vomiting,
      coughing,
      sneezing,
      discharge,
      behavior,
      behavior_notes: behaviorNotes || null,
      temp_f: tempF ? parseFloat(tempF) : null,
      weight_lbs: weightLbs ? parseFloat(weightLbs) : null,
      notes: notes || null,
      flag_for_vet: flagVet || hasConcrn,
      quarantine_case_id: quarantineCaseId ?? null,
    })

    setSaving(false)
    if (!error) {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['observations', animalId] })
      queryClient.invalidateQueries({ queryKey: ['observations-today', org?.id] })
      setTimeout(() => { setSaved(false); onSaved?.() }, 1200)
    }
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-teal-600">
        <CheckCircle size={20} />
        <span className="font-medium">Observation saved</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {hasConcrn && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">Concerning values detected — this will be flagged for vet review.</p>
        </div>
      )}

      {/* Intake */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Food & Water</h3>
        <ToggleGroup<AppetiteLevel>
          label="Appetite"
          value={appetite}
          onChange={setAppetite}
          options={[
            { value: 'good', label: 'Eating well', color: 'bg-teal-400 text-white border-teal-400' },
            { value: 'reduced', label: 'Reduced', color: 'bg-amber-400 text-white border-amber-400' },
            { value: 'not_eating', label: 'Not eating', color: 'bg-coral-400 text-white border-coral-400' },
          ]}
        />
        <ToggleGroup<WaterLevel>
          label="Water intake"
          value={water}
          onChange={setWater}
          options={[
            { value: 'normal', label: 'Normal', color: 'bg-teal-400 text-white border-teal-400' },
            { value: 'reduced', label: 'Reduced', color: 'bg-amber-400 text-white border-amber-400' },
            { value: 'not_drinking', label: 'Not drinking', color: 'bg-coral-400 text-white border-coral-400' },
          ]}
        />
      </div>

      {/* Output */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Output</h3>
        <ToggleGroup<StoolType>
          label="Stool"
          value={stool}
          onChange={setStool}
          options={[
            { value: 'normal', label: 'Normal', color: 'bg-teal-400 text-white border-teal-400' },
            { value: 'soft', label: 'Soft', color: 'bg-amber-100 text-amber-600 border-amber-200' },
            { value: 'diarrhea', label: 'Diarrhea', color: 'bg-coral-50 text-coral-400 border-coral-200' },
            { value: 'none_observed', label: 'None observed', color: 'bg-gray-100 text-gray-600 border-gray-200' },
            { value: 'blood', label: '⚠ Blood', color: 'bg-red-500 text-white border-red-500' },
          ]}
        />
        <ToggleGroup<UrinationType>
          label="Urination"
          value={urination}
          onChange={setUrination}
          options={[
            { value: 'normal', label: 'Normal', color: 'bg-teal-400 text-white border-teal-400' },
            { value: 'reduced', label: 'Reduced', color: 'bg-amber-100 text-amber-600 border-amber-200' },
            { value: 'none', label: 'None', color: 'bg-coral-50 text-coral-400 border-coral-200' },
            { value: 'abnormal', label: 'Abnormal', color: 'bg-red-100 text-red-600 border-red-200' },
          ]}
        />
      </div>

      {/* Symptoms */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Symptoms</h3>
        <BoolToggle label="Vomiting" value={vomiting} onChange={setVomiting} />
        <BoolToggle label="Coughing" value={coughing} onChange={setCoughing} />
        <BoolToggle label="Sneezing" value={sneezing} onChange={setSneezing} />
        <BoolToggle label="Discharge (eyes/nose)" value={discharge} onChange={setDischarge} />
      </div>

      {/* Behavior */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">Behavior</h3>
        <ToggleGroup<BehaviorType>
          label="Overall behavior"
          value={behavior}
          onChange={setBehavior}
          options={[
            { value: 'normal', label: 'Normal', color: 'bg-teal-400 text-white border-teal-400' },
            { value: 'lethargic', label: 'Lethargic', color: 'bg-amber-400 text-white border-amber-400' },
            { value: 'anxious', label: 'Anxious', color: 'bg-blue-400 text-white border-blue-400' },
            { value: 'aggressive', label: 'Aggressive', color: 'bg-coral-400 text-white border-coral-400' },
            { value: 'other', label: 'Other', color: 'bg-gray-400 text-white border-gray-400' },
          ]}
        />
        {(behavior !== 'normal') && (
          <div>
            <label className="label">Behavior notes</label>
            <input className="input" placeholder="Describe behavior…" value={behaviorNotes} onChange={e => setBehaviorNotes(e.target.value)} />
          </div>
        )}
      </div>

      {/* Vitals */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Vitals <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Temperature (°F)</label>
            <input className="input" type="number" step="0.1" min="95" max="108" placeholder="101.5" value={tempF} onChange={e => setTempF(e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (lbs)</label>
            <input className="input" type="number" step="0.1" min="0" placeholder="45.0" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">Notes</h3>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder="Any additional observations…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="flagVet" checked={flagVet || hasConcrn} onChange={e => setFlagVet(e.target.checked)}
            className="w-4 h-4 accent-coral-400" />
          <label htmlFor="flagVet" className="text-sm text-gray-700">Flag for vet review</label>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Saving…' : 'Complete observation'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
      </div>
    </div>
  )
}
