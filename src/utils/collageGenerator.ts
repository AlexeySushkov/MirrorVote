import type { Photo } from '@/integrations/supabase/types'
import { saveAs } from 'file-saver'

export async function generateCollage(photos: Photo[], bestPhotoId?: string | null): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const cols = photos.length <= 2 ? photos.length : 2
  const rows = Math.ceil(photos.length / cols)
  const cellWidth = 800
  const cellHeight = 1000
  const padding = 20
  const badgeHeight = 40

  canvas.width = cols * cellWidth + (cols + 1) * padding
  canvas.height = rows * (cellHeight + badgeHeight) + (rows + 1) * padding

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (cellWidth + padding)
    const y = padding + row * (cellHeight + badgeHeight + padding)

    try {
      const img = await loadImage(photo.processed_photo_url ?? photo.photo_url)
      ctx.drawImage(img, x, y, cellWidth, cellHeight)

      const isBest = photo.id === bestPhotoId
      if (isBest) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.9)'
        ctx.fillRect(x, y + cellHeight, cellWidth, badgeHeight)
        ctx.fillStyle = '#000'
        ctx.font = 'bold 20px Inter'
        ctx.textAlign = 'center'
        ctx.fillText('★ AI Pick', x + cellWidth / 2, y + cellHeight + badgeHeight / 2 + 7)
      }

      const analysis = photo.analysis
      if (analysis?.overall_score) {
        ctx.fillStyle = '#333'
        ctx.font = '16px Inter'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${analysis.overall_score}/10`, x, y + cellHeight + badgeHeight - 5)
      }
    } catch {
      ctx.fillStyle = '#ccc'
      ctx.fillRect(x, y, cellWidth, cellHeight)
      ctx.fillStyle = '#666'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Failed to load', x + cellWidth / 2, y + cellHeight / 2)
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      0.9
    )
  })
}

export async function exportCollage(photos: Photo[], bestPhotoId?: string | null, filename?: string): Promise<void> {
  const blob = await generateCollage(photos, bestPhotoId)
  saveAs(blob, filename ?? `mirrorvote-collage-${Date.now()}.jpg`)
}
