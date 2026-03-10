import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { isSupabaseConfigured, supabaseConfigError } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { showErrorToast } from '@/utils/errorToast'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const signUpSchema = signInSchema.extend({
  password: z.string().min(6),
})

type SignInForm = z.infer<typeof signInSchema>
type SignUpForm = z.infer<typeof signUpSchema>

export function Auth() {
  const { t } = useLanguage()
  const { user, loading, signIn, signUp, signInWithGoogle, signInAnonymously, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'forgot'>('signIn')

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })

  const forgotForm = useForm<{ email: string }>({
    defaultValues: { email: '' },
  })

  const ensureSupabaseConfigured = () => {
    if (isSupabaseConfigured) return true
    showErrorToast(supabaseConfigError, 'Ошибка конфигурации Supabase', 'Auth.ensureSupabaseConfigured')
    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/sessions" replace />
  }

  const onSignIn = async (data: SignInForm) => {
    if (!ensureSupabaseConfigured()) return
    try {
      await signIn(data.email, data.password)
    } catch (e) {
      showErrorToast(e, 'Ошибка входа', 'Auth.onSignIn')
    }
  }

  const onSignUp = async (data: SignUpForm) => {
    if (!ensureSupabaseConfigured()) return
    try {
      await signUp(data.email, data.password)
      toast.success('Проверьте email для подтверждения')
    } catch (e) {
      showErrorToast(e, 'Ошибка регистрации', 'Auth.onSignUp')
    }
  }

  const onForgot = async (data: { email: string }) => {
    if (!ensureSupabaseConfigured()) return
    try {
      await resetPassword(data.email)
      toast.success('Письмо отправлено на email')
      setMode('signIn')
    } catch (e) {
      showErrorToast(e, 'Ошибка', 'Auth.onForgot')
    }
  }

  const onGoogle = async () => {
    if (!ensureSupabaseConfigured()) return
    try {
      await signInWithGoogle()
    } catch (e) {
      showErrorToast(e, 'Ошибка', 'Auth.onGoogle')
    }
  }

  const onAnonymous = async () => {
    if (!ensureSupabaseConfigured()) return
    try {
      await signInAnonymously()
    } catch (e) {
      showErrorToast(e, 'Ошибка', 'Auth.onAnonymous')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif">{t('app.title')}</CardTitle>
          <CardDescription>{t('app.tagline')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupabaseConfigured && (
            <p className="text-sm text-destructive">{supabaseConfigError}</p>
          )}

          {mode === 'signIn' && (
            <>
              <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input {...signInForm.register('email')} type="email" />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.password')}</Label>
                  <Input {...signInForm.register('password')} type="password" />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  {t('auth.signIn')}
                </Button>
              </form>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:underline"
                onClick={() => setMode('forgot')}
              >
                {t('auth.forgotPassword')}
              </button>
              <p className="text-sm text-center">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMode('signUp')}
                >
                  {t('auth.signUp')}
                </button>
              </p>
            </>
          )}

          {mode === 'signUp' && (
            <>
              <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input {...signUpForm.register('email')} type="email" />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.password')}</Label>
                  <Input {...signUpForm.register('password')} type="password" />
                </div>
                <Button type="submit" className="w-full">
                  {t('auth.signUp')}
                </Button>
              </form>
              <p className="text-sm text-center">
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMode('signIn')}
                >
                  {t('auth.signIn')}
                </button>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input {...forgotForm.register('email')} type="email" />
                </div>
                <Button type="submit" className="w-full">
                  {t('auth.resetPassword')}
                </Button>
              </form>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setMode('signIn')}
              >
                ← Назад
              </button>
            </>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">или</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onGoogle}>
            {t('auth.signInWithGoogle')}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onAnonymous}>
            {t('auth.signInAnonymously')}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t('auth.anonymousWarning')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
