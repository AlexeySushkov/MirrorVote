import { Link } from 'react-router-dom'
import { LogOut, Shirt, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState } from 'react'
import { toast } from 'sonner'
import { showErrorToast } from '@/utils/errorToast'

export function AppHeader() {
  const { user, isAnonymous, signOut, linkAccount } = useAuth()
  const { t } = useLanguage()
  const [linkOpen, setLinkOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [linking, setLinking] = useState(false)

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinking(true)
    try {
      await linkAccount(email, password)
      toast.success(t('auth.signUp'))
      setLinkOpen(false)
    } catch (err) {
      showErrorToast(err, 'Error', 'AppHeader.handleLink')
    } finally {
      setLinking(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        {isAnonymous && (
          <div className="bg-accent/15 border-b border-accent/30 px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
            <span>{t('auth.anonymousBanner')}</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm font-semibold"
              onClick={() => setLinkOpen(true)}
            >
              {t('auth.linkAccount')}
            </Button>
          </div>
        )}
        <div className="container flex h-14 items-center justify-between px-4">
          <Link to="/sessions" className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Shirt className="h-5 w-5" />
            {t('app.title')}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {isAnonymous ? '?' : (user.email?.[0]?.toUpperCase() ?? 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAnonymous && (
                    <DropdownMenuItem onClick={() => setLinkOpen(true)}>
                      {t('auth.linkAccount')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.linkAccount')}</DialogTitle>
            <DialogDescription>{t('auth.anonymousWarning')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLink} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={linking}>
              {t('auth.linkAccount')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
