'use client'

import { useConfirmStore } from '@/lib/stores/confirmStore'
import Button from './Button'

export default function ConfirmDialog() {
  const pending = useConfirmStore(s => s.pending)
  const resolve = useConfirmStore(s => s.resolve)

  if (!pending) return null

  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
  } = pending

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={() => resolve(false)}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => resolve(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
