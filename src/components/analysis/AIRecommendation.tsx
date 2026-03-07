import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface AIRecommendationProps {
  recommendation: string
}

export function AIRecommendation({ recommendation }: AIRecommendationProps) {
  return (
    <Card className="border-amber-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">AI Recommendation</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{recommendation}</p>
      </CardContent>
    </Card>
  )
}
