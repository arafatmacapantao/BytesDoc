'use client'

import { BsFiletypePdf, BsFiletypeDocx } from 'react-icons/bs'
import { FileText } from 'lucide-react'
import { Document } from '@/types'

// Icon components from lucide and react-icons have slightly different prop
// shapes, so this is intentionally loose — we only render with size/className/style.
interface IconConfig {
  Icon: React.ComponentType<any>
  color: string
  label: string
}

const MAP: Record<Document['fileType'], IconConfig> = {
  pdf: { Icon: BsFiletypePdf, color: '#dc2626', label: 'PDF document' },
  docx: { Icon: BsFiletypeDocx, color: '#2563eb', label: 'Word document' },
}

const FALLBACK: IconConfig = { Icon: FileText, color: '#6b7280', label: 'Document' }

export function fileTypeMeta(t: Document['fileType']): IconConfig {
  return MAP[t] ?? FALLBACK
}

export default function FileTypeIcon({
  fileType,
  size = 18,
  className,
  color,
}: {
  fileType: Document['fileType']
  size?: number
  className?: string
  color?: string
}) {
  const cfg = fileTypeMeta(fileType)
  return <cfg.Icon size={size} className={className} style={{ color: color ?? cfg.color }} />
}
