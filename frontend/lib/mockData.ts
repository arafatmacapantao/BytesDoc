import { User, Document, ActivityLog } from '@/types'

// Real data is loaded from the backend API.
// These are empty fallbacks used only if the backend is unreachable.

export const mockUsers: User[] = []
export const mockDocuments: Document[] = []
export const mockActivityLogs: ActivityLog[] = []
export const mockCategories = ['Proposals', 'Permits', 'Budgets', 'Reports', 'Financial Records']
export const mockEvents = ['Freshmen Orientation', 'Election 2025', 'Foundation Day', 'General']
export const mockAdministrations = ['2024-2025', '2025-2026']