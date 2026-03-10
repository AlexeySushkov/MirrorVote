import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Session, Photo } from '@/integrations/supabase/types'
import { resizeImage } from '@/utils/imageUtils'
import { MAX_FILE_SIZE, ACCEPTED_FORMATS } from '@/utils/constants'
import { showErrorToast } from '@/utils/errorToast'

export function useSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mirror_sessions')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
    enabled: !!userId,
  })
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mirror_sessions')
        .select('*')
        .eq('id', sessionId!)
        .single()
      if (error) throw error
      return data as Session
    },
    enabled: !!sessionId,
  })
}

export function usePhotos(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['photos', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mirror_photos')
        .select('*')
        .eq('session_id', sessionId!)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Photo[]
    },
    enabled: !!sessionId,
  })
}

export function useCreateSession(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title?: string) => {
      const { data, error } = await supabase
        .from('mirror_sessions')
        .insert({ user_id: userId!, title: title ?? 'Примерка' } as never)
        .select()
        .single()
      if (error) throw error
      return data as Session
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions', userId] }),
  })
}

export function useUploadPhoto(userId: string | undefined, sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: File | { file: File; overrideSessionId: string }) => {
      const file = input instanceof File ? input : input.file
      const sid = input instanceof File ? sessionId : input.overrideSessionId
      if (!userId || !sid) throw new Error('Not authenticated')
      if (!ACCEPTED_FORMATS.includes(file.type) && !file.type.includes('heic')) {
        throw new Error('Invalid format. Use JPG, PNG or HEIC')
      }
      if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 10MB)')

      const resized = await resizeImage(file)
      const blob = resized instanceof Blob ? resized : new Blob([resized])
      const ext = file.name.split('.').pop() ?? 'jpg'
      const photoId = crypto.randomUUID()
      const filePath = `${userId}/${sid}/${photoId}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mirror_photos')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }
      if (!uploadData?.path) {
        throw new Error('Storage upload returned no data')
      }

      const { data: urlData } = supabase.storage.from('mirror_photos').getPublicUrl(filePath)

      const { data: photo, error } = await supabase
        .from('mirror_photos')
        .insert({
          session_id: sid,
          user_id: userId,
          storage_path: filePath,
          photo_url: urlData.publicUrl,
          original_filename: file.name,
          sort_order: 0,
        } as never)
        .select()
        .single()

      if (error) {
        // DB insert failed — remove orphaned file from storage
        await supabase.storage.from('mirror_photos').remove([filePath])
        throw error
      }
      return photo as Photo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
    onError: (err) => showErrorToast(err, 'Upload failed', 'useUploadPhoto.onError'),
  })
}

export function useDeletePhoto(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.from('mirror_photos').delete().eq('id', photoId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })
}

export function useDeleteSessions(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const { error } = await supabase
        .from('mirror_sessions')
        .delete()
        .in('id', sessionIds)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
    },
  })
}

export function useUpdateSession(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Session>) => {
      const { error } = await supabase.from('mirror_sessions').update(updates as never).eq('id', sessionId!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdatePhoto(photoId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase.from('mirror_photos').update(updates as never).eq('id', photoId!)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  })
}

export { MAX_PHOTOS, MIN_PHOTOS } from '@/utils/constants'
