import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { Index } from '@/pages/Index'
import { Auth } from '@/pages/Auth'
import { Sessions } from '@/pages/Sessions'
import { NewSession } from '@/pages/NewSession'
import { Compare } from '@/pages/Compare'
import { VotePage } from '@/pages/VotePage'
import { NotFound } from '@/pages/NotFound'

const queryClient = new QueryClient()

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-600">Загрузка...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/v/:token" element={<VotePage />} />
                  <Route
                    path="/sessions"
                    element={
                      <AuthGuard>
                        <>
                          <AppHeader />
                          <Sessions />
                        </>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/sessions/new"
                    element={
                      <AuthGuard>
                        <>
                          <AppHeader />
                          <NewSession />
                        </>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/sessions/:id"
                    element={
                      <AuthGuard>
                        <>
                          <AppHeader />
                          <Compare />
                        </>
                      </AuthGuard>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster
                richColors
                closeButton
                duration={15000}
                toastOptions={{
                  className: 'text-left',
                }}
              />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
