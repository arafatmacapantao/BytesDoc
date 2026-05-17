'use client'
import { create } from 'zustand'
import { Document } from '@/types'
import { mockDocuments } from '@/lib/mockData'
import {
  apiGetDocuments,
  apiUploadDocument,
  apiUpdateDocument,
  apiDeleteDocument,
  apiArchiveDocument,
  apiBulkArchive,
  apiLockDocument,
  apiUnlockDocument,
  apiBulkLock,
  apiDownloadDocument,
  DocumentsQuery,
} from '@/lib/api'
import { useAuthStore } from './authStore'

interface DocumentState {
  documents: Document[]
  loading: boolean
  error: string | null

  fetchDocuments: (query?: DocumentsQuery) => Promise<void>
  addDocument: (
    file: File | null,
    meta: { title: string; category: string; event: string; administration: string; fileType: string },
    localFallback?: Omit<Document, 'id'>
  ) => Promise<Document>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  archiveDocument: (id: string) => Promise<void>
  bulkArchiveByAdministration: (administration: string) => Promise<void>
  lockDocument: (id: string) => Promise<void>
  unlockDocument: (id: string) => Promise<void>
  bulkLockByAdministration: (administration: string) => Promise<void>
  getDownloadUrl: (id: string) => Promise<string>
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: mockDocuments,   // start with mock so UI isn't empty on first render
  loading: false,
  error: null,

  fetchDocuments: async (query = {}) => {
    const { usingMock } = useAuthStore.getState()
    if (usingMock) {
      // Client-side filter of mock data
      let docs = [...mockDocuments]
      if (query.archived !== undefined) docs = docs.filter(d => d.is_archived === query.archived)
      if (query.category) docs = docs.filter(d => d.category === query.category)
      if (query.administration) docs = docs.filter(d => d.administration === query.administration)
      if (query.q) docs = docs.filter(d => d.title.toLowerCase().includes(query.q!.toLowerCase()))
      set({ documents: docs })
      return
    }

    set({ loading: true, error: null })
    try {
      const docs = await apiGetDocuments(query)
      set({ documents: docs, loading: false })
    } catch (e: any) {
      set({ documents: [], loading: false, error: e.message })
    }
  },

  addDocument: async (file, meta, localFallback) => {
    const { usingMock } = useAuthStore.getState()
    if (usingMock || !file) {
      // Mock mode — add locally
      const newDoc: Document = {
        id: `${Date.now()}`,
        ...(localFallback as Omit<Document, 'id'>),
        category: meta.category as Document['category'],
      }
      set(state => ({ documents: [newDoc, ...state.documents] }))
      return newDoc
    }

    set({ loading: true })
    try {
      const doc = await apiUploadDocument(file, meta)
      set(state => ({ documents: [doc, ...state.documents], loading: false }))
      return doc
    } catch (e: any) {
      set({ loading: false, error: e.message })
      throw e
    }
  },

  updateDocument: async (id, updates) => {
    const { usingMock } = useAuthStore.getState()
    // Optimistic update
    set(state => ({
      documents: state.documents.map(d => d.id === id ? { ...d, ...updates } : d),
    }))
    if (usingMock) return

    try {
      const updated = await apiUpdateDocument(id, updates as any)
      set(state => ({
        documents: state.documents.map(d => d.id === id ? updated : d),
      }))
    } catch (e: any) {
      // Roll back optimistic update on failure
      await get().fetchDocuments()
      throw e
    }
  },

  deleteDocument: async (id) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({ documents: state.documents.filter(d => d.id !== id) }))
    if (usingMock) return

    try {
      await apiDeleteDocument(id)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  archiveDocument: async (id) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, is_archived: true, is_locked: true } : d
      ),
    }))
    if (usingMock) return

    try {
      await apiArchiveDocument(id)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  bulkArchiveByAdministration: async (administration) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({
      documents: state.documents.map(d =>
        d.administration === administration ? { ...d, is_archived: true, is_locked: true } : d
      ),
    }))
    if (usingMock) return

    try {
      await apiBulkArchive(administration)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  lockDocument: async (id) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, is_locked: true } : d
      ),
    }))
    if (usingMock) return

    try {
      await apiLockDocument(id)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  unlockDocument: async (id) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, is_locked: false } : d
      ),
    }))
    if (usingMock) return

    try {
      await apiUnlockDocument(id)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  bulkLockByAdministration: async (administration) => {
    const { usingMock } = useAuthStore.getState()
    set(state => ({
      documents: state.documents.map(d =>
        d.administration === administration && !d.is_archived
          ? { ...d, is_locked: true }
          : d
      ),
    }))
    if (usingMock) return

    try {
      await apiBulkLock(administration)
    } catch (e: any) {
      await get().fetchDocuments()
      throw e
    }
  },

  getDownloadUrl: async (id) => {
    const { usingMock } = useAuthStore.getState()
    if (usingMock) return '/mock/sample.pdf'
    const { url } = await apiDownloadDocument(id)
    return url
  },
}))