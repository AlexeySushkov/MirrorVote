import { ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OutfitScore } from './OutfitScore'
import type { PhotoAnalysis } from '@/integrations/supabase/types'

interface PhotoVerdictProps {
  filename: string
  photoUrl: string
  analysis: PhotoAnalysis
}

export function PhotoVerdict({ filename, photoUrl, analysis }: PhotoVerdictProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="font-semibold text-sm truncate">{filename}</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4 items-start">
          <img
            src={photoUrl}
            alt={filename}
            className="w-24 h-32 object-cover rounded-md flex-shrink-0"
          />
          <div className="flex-1 space-y-2">
            <OutfitScore score={analysis.overall_score} size="sm" />
            {analysis.verdict && (
              <p className="text-sm leading-relaxed">{analysis.verdict}</p>
            )}
            {analysis.description && !analysis.verdict && (
              <p className="text-sm leading-relaxed">{analysis.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {analysis.pros?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-medium text-green-600">
                <ThumbsUp className="h-3 w-3" />
                <span>Pros</span>
              </div>
              <ul className="space-y-0.5 text-muted-foreground">
                {analysis.pros.map((p, i) => (
                  <li key={i}>+ {p}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.cons?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-medium text-red-500">
                <ThumbsDown className="h-3 w-3" />
                <span>Cons</span>
              </div>
              <ul className="space-y-0.5 text-muted-foreground">
                {analysis.cons.map((c, i) => (
                  <li key={i}>- {c}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.style_tips?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-medium text-amber-500">
                <Lightbulb className="h-3 w-3" />
                <span>Tips</span>
              </div>
              <ul className="space-y-0.5 text-muted-foreground">
                {analysis.style_tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
