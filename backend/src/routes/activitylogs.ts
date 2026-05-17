import { Router } from 'express'
import { supabase } from '../config/supabase'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/activity-logs — paginated + filtered activity logs (chief_minister only)
// Query params: userId, action, from (ISO), to (ISO), page (default 1), limit (default 50)
router.get('/', requireAuth, requireRole('chief_minister'), async (req, res, next) => {
  try {
    const { userId, action, from, to, page = '1', limit = '50' } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50))
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('activity_logs')
      .select(
        'id, user_id, action, document_id, timestamp, users:users(email, name), documents:documents(title)',
        { count: 'exact' }
      )
      .order('timestamp', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (typeof userId === 'string') query = query.eq('user_id', userId)
    if (typeof action === 'string') query = query.eq('action', action)
    if (typeof from === 'string') query = query.gte('timestamp', from)
    if (typeof to === 'string') query = query.lte('timestamp', to)

    const { data, error, count } = await query

    if (error) return res.status(500).json({ error: error.message })

    const logs = (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.users?.name ?? null,
      userEmail: row.users?.email ?? null,
      action: row.action,
      documentId: row.document_id ?? null,
      documentTitle: row.documents?.title ?? null,
      timestamp: row.timestamp,
    }))

    res.json({ logs, total: count ?? 0, page: pageNum, limit: limitNum })
  } catch (err) {
    next(err)
  }
})

// GET /api/activity-logs/export — CSV download (chief_minister only)
// Same filters as above but returns all matching rows as CSV
router.get('/export', requireAuth, requireRole('chief_minister'), async (req, res, next) => {
  try {
    const { userId, action, from, to } = req.query

    let query = supabase
      .from('activity_logs')
      .select(
        'id, user_id, action, document_id, timestamp, users:users(email, name), documents:documents(title)'
      )
      .order('timestamp', { ascending: false })

    if (typeof userId === 'string') query = query.eq('user_id', userId)
    if (typeof action === 'string') query = query.eq('action', action)
    if (typeof from === 'string') query = query.gte('timestamp', from)
    if (typeof to === 'string') query = query.lte('timestamp', to)

    const { data, error } = await query

    if (error) return res.status(500).json({ error: error.message })

    const rows = data ?? []
    const csvHeader = 'id,user_name,user_email,action,document_title,timestamp\n'
    const csvRows = rows.map((row: any) => {
      const escape = (v: string | null) =>
        v == null ? '' : `"${String(v).replace(/"/g, '""')}"`
      return [
        escape(row.id),
        escape(row.users?.name ?? null),
        escape(row.users?.email ?? null),
        escape(row.action),
        escape(row.documents?.title ?? null),
        escape(row.timestamp),
      ].join(',')
    })

    const csv = csvHeader + csvRows.join('\n')
    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
})

export default router