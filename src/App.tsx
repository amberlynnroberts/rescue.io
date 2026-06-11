import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { CreateOrgPage } from '@/pages/auth/CreateOrgPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { AnimalsPage } from '@/pages/animals/AnimalsPage'
import { AnimalDetailPage } from '@/pages/animals/AnimalDetailPage'
import { NewAnimalPage } from '@/pages/animals/NewAnimalPage'
import { AdoptionsPage } from '@/pages/adoptions/AdoptionsPage'
import { ShelterLuvImportPage } from '@/pages/import/ShelterLuvImportPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, org, isLoading } = useAuth()
  if (isLoading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!org) return <Navigate to="/create-org" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, org, isLoading } = useAuth()
  if (isLoading) return <Spinner />
  if (session && org) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/create-org" element={<CreateOrgPage />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="animals" element={<AnimalsPage />} />
        <Route path="animals/new" element={<NewAnimalPage />} />
        <Route path="animals/:id" element={<AnimalDetailPage />} />
        <Route path="adoptions" element={<AdoptionsPage />} />
        <Route path="import/shelterluv" element={<ShelterLuvImportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}