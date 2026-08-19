import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { JobsSearchPage } from '@/pages/jobs-search-page'
import { JobDetailsPage } from '@/pages/job-details-page'
import { FavoritesPage } from '@/pages/favorites-page'
import {
  BackofficeDashboardPage,
  BackofficeJobsPage,
  BackofficeLoginPage,
  BackofficeRunDetailsPage,
  BackofficeRunsPage,
  BackofficeTenantsPage,
} from '@/pages/backoffice-pages'
import { LoginPage } from '@/pages/login-page'
import { CareerPage } from '@/pages/career-page'
import { ApplicationsPage } from '@/pages/applications-page'
import { RequireAuth } from '@/components/auth/require-auth'
import { RegisterPage } from '@/pages/register-page'
import { ProfileOnboardingPage } from '@/pages/profile-onboarding-page'

function CandidateAuthRoutes() {
  return <RequireAuth><Outlet /></RequireAuth>
}

function AdminAuthRoutes() {
  return <RequireAuth role="ADMIN"><Outlet /></RequireAuth>
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/vagas" element={<JobsSearchPage />} />
        <Route element={<CandidateAuthRoutes />}>
          <Route path="/onboarding/perfil" element={<ProfileOnboardingPage />} />
        </Route>
        <Route element={<RequireAuth requireProfile />}>
          <Route path="/vagas/:id" element={<JobDetailsPage />} />
          <Route path="/minha-area" element={<FavoritesPage />} />
          <Route path="/minha-area/candidaturas" element={<ApplicationsPage />} />
          <Route path="/carreira" element={<CareerPage />} />
        </Route>
        <Route path="/favoritos" element={<Navigate to="/minha-area" replace />} />
        <Route path="/backoffice/login" element={<BackofficeLoginPage />} />
        <Route element={<AdminAuthRoutes />}>
          <Route path="/backoffice" element={<BackofficeDashboardPage />} />
          <Route path="/backoffice/tenants" element={<BackofficeTenantsPage />} />
          <Route path="/backoffice/jobs" element={<BackofficeJobsPage />} />
          <Route path="/backoffice/runs" element={<BackofficeRunsPage />} />
          <Route path="/backoffice/runs/:id" element={<BackofficeRunDetailsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/vagas" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
