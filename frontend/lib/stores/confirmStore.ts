'use client'
import { create } from 'zustand'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

interface ConfirmState {
  pending: PendingConfirm | null
  ask: (opts: ConfirmOptions) => Promise<boolean>
  resolve: (value: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  ask: opts =>
    new Promise<boolean>(resolve => {
      set({ pending: { ...opts, resolve } })
    }),
  resolve: value => {
    const p = get().pending
    if (p) {
      p.resolve(value)
      set({ pending: null })
    }
  },
}))

export const confirmDialog = (opts: ConfirmOptions) => useConfirmStore.getState().ask(opts)
