import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-serif text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Страница не найдена</p>
      <Button asChild>
        <Link to="/">На главную</Link>
      </Button>
    </div>
  )
}
