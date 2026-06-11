import { createContext, useContext, useState, ReactNode } from 'react'

interface ModeCtx {
  quarantineMode: boolean
  toggleQuarantineMode: () => void
}

const ModeContext = createContext<ModeCtx | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [quarantineMode, setQuarantineMode] = useState(() => {
    return localStorage.getItem('Rescue.IO_mode') === 'quarantine'
  })

  function toggleQuarantineMode() {
    setQuarantineMode(prev => {
      const next = !prev
      localStorage.setItem('Rescue.IO_mode', next ? 'quarantine' : 'shelter')
      return next
    })
  }

  return (
    <ModeContext.Provider value={{ quarantineMode, toggleQuarantineMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
