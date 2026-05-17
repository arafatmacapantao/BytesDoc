'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Document } from '@/types'
import { apiDownloadDocument } from '@/lib/api'
import { toast } from '@/lib/stores/toastStore'
import FileTypeIcon, { fileTypeMeta } from '@/components/ui/FileTypeIcon'
import {
  X,
  Search,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  Edit3,
  Trash2,
  Tag,
  CalendarDays,
  GraduationCap,
  User,
  CheckCircle2,
  ExternalLink,
  Lock,
  PencilLine,
} from 'lucide-react'

const PDFJS_VERSION = '4.7.76'
const PDFJS_WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`
const MATCH_CAP = 200
const SNIPPET_CONTEXT = 40

interface PageText {
  pageNum: number
  text: string
}

interface DocMatch {
  label: string
  before: string
  hit: string
  after: string
}

type DocText =
  | { kind: 'pdf'; pages: PageText[] }
  | { kind: 'docx'; text: string; html: string }
  | null

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  uploaderName?: string
  onEdit?: (doc: Document) => void
  onRename?: (doc: Document) => void
  onDelete?: (doc: Document) => void
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document: doc,
  uploaderName,
  onEdit,
  onRename,
  onDelete,
}: DocumentViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [findOpen, setFindOpen] = useState(true)
  const [findQuery, setFindQuery] = useState('')
  const [docText, setDocText] = useState<DocText>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!isOpen || !doc) {
      setUrl(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    apiDownloadDocument(doc.id)
      .then((res) => { if (!cancelled) setUrl(res.url) })
      .catch((e: any) => { if (!cancelled) setError(e?.message ?? 'Failed to load preview') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isOpen, doc?.id])

  useEffect(() => {
    setZoom(1)
    setFindQuery('')
    setDocText(null)
    setExtractError(null)
  }, [doc?.id])

  // Read the document for inline preview + in-document search.
  // PDF → pdfjs text extraction. DOCX → mammoth HTML conversion.
  useEffect(() => {
    if (!url || !doc) return
    let cancelled = false
    setExtracting(true)
    setExtractError(null)
    ;(async () => {
      try {
        if (doc.fileType === 'pdf') {
          const pdfjs: any = await import('pdfjs-dist')
          if (pdfjs.GlobalWorkerOptions.workerSrc !== PDFJS_WORKER_URL) {
            pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
          }
          const pdf = await pdfjs.getDocument({ url }).promise
          const pages: PageText[] = []
          for (let i = 1; i <= pdf.numPages; i++) {
            if (cancelled) return
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            const text = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ')
            pages.push({ pageNum: i, text })
          }
          if (!cancelled) setDocText({ kind: 'pdf', pages })
        } else if (doc.fileType === 'docx') {
          const mammoth: any = await import('mammoth/mammoth.browser')
          const buf = await fetch(url).then((r) => r.arrayBuffer())
          if (cancelled) return
          const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf })
          if (cancelled) return
          const tmp = window.document.createElement('div')
          tmp.innerHTML = html
          const text = tmp.textContent ?? ''
          setDocText({ kind: 'docx', text, html })
        }
      } catch (e: any) {
        if (!cancelled) setExtractError(e?.message ?? 'Failed to read document')
      } finally {
        if (!cancelled) setExtracting(false)
      }
    })()
    return () => { cancelled = true }
  }, [url, doc?.id, doc?.fileType])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const matches = useMemo<DocMatch[]>(() => {
    const q = findQuery.trim()
    if (!q || !docText) return []
    const needle = q.toLowerCase()
    const out: DocMatch[] = []

    const scan = (text: string, label: (matchIdx: number) => string) => {
      const lower = text.toLowerCase()
      let from = 0
      while (out.length < MATCH_CAP) {
        const idx = lower.indexOf(needle, from)
        if (idx === -1) break
        const start = Math.max(0, idx - SNIPPET_CONTEXT)
        const end = Math.min(text.length, idx + needle.length + SNIPPET_CONTEXT)
        out.push({
          label: label(out.length),
          before: (start > 0 ? '…' : '') + text.slice(start, idx),
          hit: text.slice(idx, idx + needle.length),
          after: text.slice(idx + needle.length, end) + (end < text.length ? '…' : ''),
        })
        from = idx + needle.length
      }
    }

    if (docText.kind === 'pdf') {
      for (const p of docText.pages) {
        scan(p.text, () => `Page ${p.pageNum}`)
        if (out.length >= MATCH_CAP) break
      }
    } else {
      scan(docText.text, (n) => `Match ${n + 1}`)
    }
    return out
  }, [findQuery, docText])

  if (!isOpen || !doc) return null

  const renameHandler = onRename ?? onEdit
  const fileLabel = fileTypeMeta(doc.fileType).label
  const canPrint = doc.fileType === 'pdf'

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.print()
    } catch {
      toast.info('Use Ctrl+P inside the preview to print.')
    }
  }

  const handleDownload = () => {
    if (!url) {
      toast.info('Preview is still loading, please wait a moment.')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#e6f1fb' }}>
              <FileTypeIcon fileType={doc.fileType} size={18} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">View document</h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge isArchived={doc.is_archived} />
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left side: find sidebar + preview */}
          <div className="flex-1 flex min-w-0">
            {findOpen && (
              <aside className="w-[180px] shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col min-h-0">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Find in document
                  </label>
                  <div className="relative">
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={findQuery}
                      onChange={(e) => setFindQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ outlineColor: '#185fa5' }}
                    />
                  </div>
                  {extracting && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                      Reading document text…
                    </p>
                  )}
                  {!extracting && findQuery.trim() && !extractError && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                      {matches.length}
                      {matches.length === MATCH_CAP ? '+' : ''}{' '}
                      {matches.length === 1 ? 'match' : 'matches'} found
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {extractError && (
                    <p className="text-[11px] text-red-500 px-2 pt-2">
                      Couldn&apos;t read document text: {extractError}
                    </p>
                  )}
                  {!extracting && !extractError && findQuery.trim() && matches.length === 0 && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 px-2 pt-2">
                      No matches in this document.
                    </p>
                  )}
                  {matches.map((m, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                    >
                      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                        {m.label}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 break-words leading-snug">
                        {m.before}
                        <mark className="rounded px-0.5" style={{ background: '#fef08a', color: 'inherit' }}>
                          {m.hit}
                        </mark>
                        {m.after}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            )}

            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar */}
              <div
                className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700"
                style={{ background: '#f8fafc' }}
              >
                <ToolButton onClick={() => setFindOpen((v) => !v)} title="Toggle find sidebar">
                  <Search size={15} />
                </ToolButton>
                <Sep />
                <ToolButton onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} title="Zoom out">
                  <ZoomOut size={15} />
                </ToolButton>
                <span className="text-xs text-gray-600 dark:text-gray-300 px-1 min-w-[40px] text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <ToolButton onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} title="Zoom in">
                  <ZoomIn size={15} />
                </ToolButton>
                <Sep />
                <ToolButton
                  onClick={handlePrint}
                  title={canPrint ? 'Print' : 'Print is available only for PDF previews'}
                  disabled={!canPrint}
                >
                  <Printer size={15} />
                  <span className="text-xs">Print</span>
                </ToolButton>
                <ToolButton onClick={handleDownload} title="Download">
                  <Download size={15} />
                  <span className="text-xs">Download</span>
                </ToolButton>
                <div className="flex-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Page 1 of 1</span>
              </div>

              {/* Preview */}
              <div
                className="flex-1 overflow-auto p-6 flex items-start justify-center"
                style={{ background: '#f1f5f9' }}
              >
                {loading && (
                  <div className="text-gray-500 dark:text-gray-400 text-sm py-20">Loading preview...</div>
                )}
                {error && !loading && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 max-w-md">
                    Failed to load preview: {error}
                  </div>
                )}
                {url && !loading && doc.fileType === 'pdf' && (
                  <div
                    className="w-full max-w-[820px] transition-transform"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                  >
                    <iframe
                      ref={iframeRef}
                      src={url}
                      title={doc.title}
                      className="w-full h-[820px] bg-white rounded-md shadow-sm border border-gray-200"
                    />
                  </div>
                )}
                {url && !loading && doc.fileType === 'docx' && (
                  <div
                    className="w-full max-w-[820px] transition-transform"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                  >
                    {extracting && !docText && (
                      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-10 text-center text-sm text-gray-500">
                        Rendering Word document…
                      </div>
                    )}
                    {docText?.kind === 'docx' && (
                      <div
                        className="docx-preview bg-white rounded-md shadow-sm border border-gray-200 p-10 text-gray-900 leading-relaxed"
                        style={{ fontFamily: 'Calibri, Helvetica, Arial, sans-serif' }}
                        dangerouslySetInnerHTML={{ __html: docText.html }}
                      />
                    )}
                    {!extracting && extractError && (
                      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-8 text-center">
                        <p className="text-gray-700 text-sm mb-4">
                          Couldn&apos;t render this Word document inline.
                        </p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm rounded-md transition"
                          style={{ background: '#185fa5' }}
                        >
                          <ExternalLink size={14} />
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <aside className="w-[280px] shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#185fa5' }}
                >
                  <FileTypeIcon fileType={doc.fileType} size={18} color="#ffffff" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {fileLabel} · .{doc.fileType}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ActionTile
                  icon={<Download size={15} />}
                  label="Download"
                  onClick={handleDownload}
                />
                <ActionTile
                  icon={<PencilLine size={15} />}
                  label="Rename"
                  onClick={renameHandler ? () => renameHandler(doc) : undefined}
                />
                <ActionTile
                  icon={<Trash2 size={15} />}
                  label="Delete"
                  onClick={onDelete ? () => onDelete(doc) : undefined}
                  danger
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="space-y-3">
                <MetaRow icon={<Tag size={14} />} label="Category" value={doc.category} />
                <MetaRow icon={<CalendarDays size={14} />} label="Event" value={doc.event} />
                <MetaRow icon={<GraduationCap size={14} />} label="Administration year" value={doc.administration} />
                <MetaRow icon={<User size={14} />} label="Uploaded by" value={uploaderName ?? doc.uploadedBy} />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="space-y-2 text-xs">
                <TechRow label="Upload date" value={new Date(doc.uploadDate).toLocaleDateString()} />
                <TechRow
                  label="Time"
                  value={new Date(doc.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <TechRow label="Visibility" value="Internal" />
                <TechRow label="File source" value="Upload" />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <StatusBadge isArchived={doc.is_archived} />
                </div>
              </div>

              <button
                onClick={onEdit ? () => onEdit(doc) : undefined}
                disabled={!onEdit}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                style={onEdit ? { background: '#185fa5' } : undefined}
                onMouseEnter={(e) => { if (onEdit) (e.currentTarget as HTMLButtonElement).style.background = '#0e4d8a' }}
                onMouseLeave={(e) => { if (onEdit) (e.currentTarget as HTMLButtonElement).style.background = '#185fa5' }}
              >
                <Edit3 size={15} />
                Open editor mode
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ isArchived }: { isArchived: boolean }) {
  if (isArchived) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-medium">
        <Lock size={10} /> Archived
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: '#eaf3de', color: '#3b6d11' }}
    >
      <CheckCircle2 size={10} /> Active
    </span>
  )
}

function ToolButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
}

function ActionTile({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
}) {
  const disabled = !onClick
  const baseClass =
    'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-lg border text-[11px] font-medium transition'
  const stateClass = disabled
    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
    : danger
    ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-300'
    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-[#185fa5] hover:border-[#185fa5]'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${stateClass}`}
      onMouseEnter={(e) => {
        if (!disabled && !danger) (e.currentTarget as HTMLButtonElement).style.background = '#e6f1fb'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = ''
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xs text-gray-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  )
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white text-right truncate">{value}</span>
    </div>
  )
}

