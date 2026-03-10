import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase config missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const dryRun = new URL(req.url).searchParams.get('dry_run') === 'true'

    // 1. Find orphaned DB sessions (user deleted from auth.users)
    const { data: orphanSessions, error: sessErr } = await supabase.rpc('get_orphan_sessions')
    if (sessErr) {
      // Fallback: raw query via postgrest not available, use direct approach
      console.log('RPC not available, using direct query approach')
    }

    // 2. Find all session IDs that exist in DB
    const { data: dbSessions } = await supabase
      .from('mirror_sessions')
      .select('id')
    const dbSessionIds = new Set((dbSessions ?? []).map((s: { id: string }) => s.id))

    // 3. Find all user IDs that exist in storage
    const { data: rootFolders, error: listErr } = await supabase.storage
      .from('mirror_photos')
      .list('', { limit: 1000 })

    if (listErr) throw new Error(`Failed to list storage root: ${listErr.message}`)

    const orphanFiles: string[] = []
    let scannedFolders = 0

    for (const userFolder of (rootFolders ?? [])) {
      if (!userFolder.name) continue

      const { data: sessionFolders } = await supabase.storage
        .from('mirror_photos')
        .list(userFolder.name, { limit: 1000 })

      for (const sessionFolder of (sessionFolders ?? [])) {
        if (!sessionFolder.name) continue
        scannedFolders++

        const sessionId = sessionFolder.name
        if (dbSessionIds.has(sessionId)) continue

        const folderPath = `${userFolder.name}/${sessionId}`
        const { data: files } = await supabase.storage
          .from('mirror_photos')
          .list(folderPath, { limit: 1000 })

        for (const file of (files ?? [])) {
          if (file.name) {
            orphanFiles.push(`${folderPath}/${file.name}`)
          }
        }
      }
    }

    // 4. Delete orphan files from storage
    let deletedCount = 0
    const errors: string[] = []

    if (!dryRun && orphanFiles.length > 0) {
      const batchSize = 100
      for (let i = 0; i < orphanFiles.length; i += batchSize) {
        const batch = orphanFiles.slice(i, i + batchSize)
        const { error: delErr } = await supabase.storage
          .from('mirror_photos')
          .remove(batch)
        if (delErr) {
          errors.push(`Batch ${i}: ${delErr.message}`)
        } else {
          deletedCount += batch.length
        }
      }
    }

    // 5. Delete orphan DB records (sessions whose user no longer exists)
    let deletedSessions = 0
    if (!dryRun) {
      const { data: allSessions } = await supabase
        .from('mirror_sessions')
        .select('id, user_id')

      const userIds = [...new Set((allSessions ?? []).map((s: { user_id: string }) => s.user_id))]

      for (const userId of userIds) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        if (!userData?.user) {
          const sessionsForUser = (allSessions ?? [])
            .filter((s: { user_id: string }) => s.user_id === userId)
            .map((s: { id: string }) => s.id)
          if (sessionsForUser.length > 0) {
            const { error: delSessErr } = await supabase
              .from('mirror_sessions')
              .delete()
              .in('id', sessionsForUser)
            if (!delSessErr) deletedSessions += sessionsForUser.length
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        dryRun,
        scannedFolders,
        orphanFilesFound: orphanFiles.length,
        orphanFiles: dryRun ? orphanFiles : undefined,
        deletedFiles: deletedCount,
        deletedSessions,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('cleanup-orphans error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
