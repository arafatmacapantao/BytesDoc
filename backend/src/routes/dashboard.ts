import { Router } from 'express'
import { supabase } from '../config/supabase'
import { requireAuth, AuthedRequest } from '../middleware/auth'
import { Document, Role } from '../types'

const router = Router()

const FINANCE_CATEGORIES = new Set<Document['category']>(['Budgets', 'Financial Records'])
const FINANCE_VISIBLE = new Set<Document['category']>(['Budgets', 'Financial Records', 'Reports'])

function allowedCategories(role: Role): Document['category'][] {
  const all: Document['category'][] = ['Proposals', 'Permits', 'Budgets', 'Reports', 'Financial Records']
  if (role === 'chief_minister' || role === 'member') return all
  if (role === 'secretary') return all.filter(c => !FINANCE_CATEGORIES.has(c))
  if (role === 'finance_minister') return all.filter(c => FINANCE_VISIBLE.has(c))
  return []
}

// GET /api/dashboard/stats — role-aware dashboard statistics
router.get('/stats', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const role = req.user!.role
    const userId = req.user!.id
    const cats = allowedCategories(role)

    // Fetch all docs the user can see
    const { data: docs, error: docsErr } = await supabase
      .from('documents')
      .select('id, category, is_archived, upload_date, uploaded_by')
      .in('category', cats)

    if (docsErr) return res.status(500).json({ error: docsErr.message })

    const allDocs = docs ?? []
    const activeDocs = allDocs.filter(d => !d.is_archived)
    const archivedDocs = allDocs.filter(d => d.is_archived)

    // Recent uploads — last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentUploads = activeDocs.filter(d => d.upload_date >= sevenDaysAgo)

    // Docs per category
    const docsPerCategory = cats.map(cat => ({
      name: cat,
      value: allDocs.filter(d => d.category === cat).length,
    }))

    // Uploads over last 6 months (by month)
    const uploadsOverTime: { name: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = d.getMonth() // 0-indexed
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      const count = allDocs.filter(doc => {
        const u = new Date(doc.upload_date)
        return u.getFullYear() === year && u.getMonth() === month
      }).length
      uploadsOverTime.push({ name: label, value: count })
    }

    // My uploads (for non-admin roles)
    const myUploads = allDocs.filter(d => d.uploaded_by === userId).length

    // Fetch 5 most recent active docs with full info
    const { data: recentDocs, error: recentErr } = await supabase
      .from('documents')
      .select('id, title, category, upload_date, uploaded_by, users:users(name)')
      .in('category', cats)
      .eq('is_archived', false)
      .order('upload_date', { ascending: false })
      .limit(5)

    if (recentErr) return res.status(500).json({ error: recentErr.message })

    const recentDocsFormatted = (recentDocs ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      uploadDate: d.upload_date,
      uploaderName: d.users?.name ?? 'Unknown',
    }))

    // Activity log summary (for chief_minister only)
    let activitySummary = null
    if (role === 'chief_minister') {
      const { data: logs, error: logsErr } = await supabase
        .from('activity_logs')
        .select('action')
        .gte('timestamp', sevenDaysAgo)

      if (!logsErr && logs) {
        activitySummary = {
          uploads: logs.filter(l => l.action === 'upload').length,
          downloads: logs.filter(l => l.action === 'download').length,
          views: logs.filter(l => l.action === 'view').length,
          logins: logs.filter(l => l.action === 'login').length,
        }
      }
    }

    res.json({
      totalDocuments: allDocs.length,
      activeDocuments: activeDocs.length,
      archivedDocuments: archivedDocs.length,
      recentUploads: recentUploads.length,
      myUploads,
      docsPerCategory,
      uploadsOverTime,
      recentDocuments: recentDocsFormatted,
      activitySummary,
    })
  } catch (err) {
    next(err)
  }
})

export default router