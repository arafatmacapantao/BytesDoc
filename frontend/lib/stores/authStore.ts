'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { apiLogin, apiLogout } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  usingMock: boolean
  hasHydrated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      usingMock: false,
      hasHydrated: false,

      login: async (email: string, password: string) => {
        try {
          const { user, token, refreshToken, expiresAt } = await apiLogin(email, password)
          set({
            user,
            token,
            refreshToken: refreshToken ?? null,
            expiresAt: expiresAt ?? null,
            isAuthenticated: true,
            usingMock: false,
          })
          return true
        } catch {
          return false
        }
      },

      logout: async () => {
        if (get().token) {
          try { await apiLogout() } catch {}
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          usingMock: false,
        })
      },

      setUser: (user: User) => set({ user }),
      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
        usingMock: state.usingMock,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)