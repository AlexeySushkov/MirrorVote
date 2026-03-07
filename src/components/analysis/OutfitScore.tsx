import { cn } from '@/lib/utils'

interface OutfitScoreProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function OutfitScore({ score, label, size = 'md' }: OutfitScoreProps) {
  const percent = (score / 10) * 100
  const color =
    score <= 4 ? 'stroke-destructive' : score <= 7 ? 'stroke-amber-500' : 'stroke-green-500'

  const sizeMap = { sm: 32, md: 48, lg: 64 }
  const r = (sizeMap[size] - 8) / 2
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={sizeMap[size]} height={sizeMap[size]} className="-rotate-90">
          <circle
            cx={sizeMap[size] / 2}
            cy={sizeMap[size] / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-muted"
          />
          <circle
            cx={sizeMap[size] / 2}
            cy={sizeMap[size] / 2}
            r={r}
            fill="none"
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn('transition-all duration-500', color)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {score.toFixed(1)}
        </span>
      </div>
      {label && <span className="mt-1 text-xs text-muted-foreground">{label}</span>}
    </div>
  )
}
