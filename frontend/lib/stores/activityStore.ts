'use client'
import { create } from 'zustand'
import { ActivityLog } from '@/types'
import { mockActivityLogs } from '@/lib/mockData'
import {
  apiGetActivityLogs,
  apiExportActivityLogs,
  ActivityLogsQuery,
  ActivityLogEntry,
} from '@/lib/api'
import { useAuthStore } from './authStore'

interface ActivityState {
  logs: ActivityLog[]            // mock-compatible local logs (for non-admin views)
  remoteLogs: ActivityLogEntry[] // full logs from backend (admin only)
  total: number
  loading: boolean

  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void
  fetchLogs: (query?: ActivityLogsQuery) => Promise<void>
  exportLogs: (query?: ActivityLogsQuery) => Promise<void>
}

export const useActivityStore = create<ActivityState>((set) => ({
  logs: mockActivityLogs,
  remoteLogs: [],
  total: 0,
  loading: false,

  addLog: (log) =>
    set(state => ({
      logs: [
        ...state.logs,
        { ...log, id: `${Date.now()}`, timestamp: new Date().toISOString() },
      ],
    })),

  fetchLogs: async (query = {}) => {
    const { usingMock } = useAuthStore.getState()
    if (usingMock) {
      // Filter mock logs client-side
      let filtered = [...mockActivityLogs]
      if (query.userId) filtered = filtered.filter(l => l.userId === query.userId)
      if (query.action) filtered = filtered.filter(l => l.action === query.action)
      set({ logs: filtered, remoteLogs: [], total: filtered.length })
      return
    }

    set({ loading: true })
    try {
      const { logs, total } = await apiGetActivityLogs(query)
      set({ remoteLogs: logs, total, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  exportLogs: async (query = {}) => {
    const { usingMock } = useAuthStore.getState()
    if (usingMock) {
      // Build CSV from mock data client-side
      const header = 'id,user_id,action,document_id,timestamp\n'
      const rows = mockActivityLogs
        .map(l => `${l.id},${l.userId},${l.action},${l.documentId ?? ''},${l.timestamp}`)
        .join('\n')
      const blob = new Blob([header + rows], { type: 'text/csv' })
      triggerDownload(blob, 'activity-logs.csv')
      return
    }

    try {
      const blob = await apiExportActivityLogs(query)
      triggerDownload(blob, `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (e) {
      console.error('Export failed:', e)
    }
  },
}))

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}