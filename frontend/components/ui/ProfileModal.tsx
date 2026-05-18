'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { toast } from '@/lib/stores/toastStore'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onSave: (name: string) => Promise<void>
  title?: string
  successMessage?: string
}

export default function ProfileModal({
  isOpen,
  onClose,
  currentName,
  onSave,
  title = 'Edit profile',
  successMessage = 'Profile updated',
}: ProfileModalProps) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setName(currentName)
  }, [isOpen, currentName])

  const trimmed = name.trim()
  const unchanged = trimmed === currentName.trim()
  const empty = trimmed.length === 0
  const tooLong = trimmed.length > 80

  const handleSave = async () => {
    if (empty || unchanged || tooLong) return
    setSaving(true)
    try {
      await onSave(trimmed)
      toast.success(successMessage)
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            autoFocus
            maxLength={80}
            placeholder="e.g. Juan dela Cruz"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {tooLong
              ? 'Too long — max 80 characters.'
              : `${trimmed.length}/80`}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={empty || unchanged || tooLong}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
