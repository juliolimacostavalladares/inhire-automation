import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { JobsSearchPage } from '@/pages/jobs-search-page'
import { JobDetailsPage } from '@/pages/job-details-page'
import { CompaniesSearchPage } from '@/pages/companies-search-page'
import { CompanyDetailsPage } from '@/pages/company-details-page'
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
import { ApplicationsPage } from '@/pages/applications-page'
import { RequireAuth } from '@/components/auth/require-auth'
import { RegisterPage } from '@/pages/register-page'
import { ProfileOnboardingPage } from '@/pages/profile-onboarding-page'
import { useAuthStore } from '@/features/auth/auth.store'

function CandidateAuthRoutes() {
  return <RequireAuth><Outlet /></RequireAuth>
}

function AdminAuthRoutes() {
  return <RequireAuth role="ADMIN"><Outlet /></RequireAuth>
}

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/vagas" element={<JobsSearchPage />} />
        <Route path="/vagas/:id" element={<JobDetailsPage />} />
        <Route path="/empresas" element={<CompaniesSearchPage />} />
        <Route path="/empresas/:slug" element={<CompanyDetailsPage />} />
        <Route element={<CandidateAuthRoutes />}>
          <Route path="/onboarding/perfil" element={<ProfileOnboardingPage />} />
        </Route>
        <Route element={<RequireAuth requireProfile />}>
          <Route path="/minha-area" element={<FavoritesPage />} />
          <Route path="/minha-area/candidaturas" element={<ApplicationsPage />} />
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
