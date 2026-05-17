'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore, ToastVariant } from '@/lib/stores/toastStore'

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle, ring: 'ring-green-500/30', iconColor: 'text-green-500' },
  error: { icon: XCircle, ring: 'ring-red-500/30', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'ring-blue-500/30', iconColor: 'text-blue-500' },
}

export default function ToastViewport() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => {
        const { icon: Icon, ring, iconColor } = variantStyles[t.variant]
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-white dark:bg-gray-800 ring-1 ${ring} shadow-lg rounded-lg p-3 animate-in slide-in-from-right`}
          >
            <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
            <p className="flex-1 text-sm text-gray-900 dark:text-white">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
