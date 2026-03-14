import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function StarRating({ value, onChange, readonly = false, size = 'md', className }: StarRatingProps) {
  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className={cn('flex gap-0.5', className)} role="group" aria-label={`Оценка: ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={cn(
            'p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded',
            !readonly && 'cursor-pointer hover:scale-110',
            readonly && 'cursor-default'
          )}
          aria-label={`${star} ${star === 1 ? 'звезда' : 'звёзд'}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= value ? 'fill-amber-400 text-amber-500' : 'fill-transparent text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  )
}
