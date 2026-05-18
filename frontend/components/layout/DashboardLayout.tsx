'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/stores/authStore'
import { Menu, X, LogOut, Moon, Sun, Search, Pencil } from 'lucide-react'
import { useTheme } from 'next-themes'
import CommandPalette from '@/components/ui/CommandPalette'
import ProfileModal from '@/components/ui/ProfileModal'

interface Tab {
  name: string
  href: string
}

interface DashboardLayoutProps {
  children: ReactNode
  tabs: Tab[]
  activeTab: string
}

export default function DashboardLayout({ children, tabs, activeTab }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout, updateProfile } = useAuthStore()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 transition-colors duration-300 lg:flex">
      {/* BACKDROP (visible only when drawer is open on < lg) */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — off-canvas drawer on < lg, always-visible on lg+ */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-auto
          h-screen w-[260px] lg:w-[220px] lg:shrink-0
          bg-[#1a1a1a] text-white border-r border-white/10
          flex flex-col
          transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/byteslogo1.png"
              alt="BYTES Logo"
              width={32}
              height={32}
              className="rounded-sm shrink-0"
            />
            <h1 className="text-base font-bold tracking-tighter uppercase truncate">BytesDoc</h1>
          </div>
          <button
            onClick={closeDrawer}
            className="lg:hidden p-1.5 rounded-md hover:bg-white/10 text-gray-300"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={closeDrawer}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.name
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 space-y-2">
          {user && (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              title="Edit your name"
              className="group w-full text-left px-3 py-2 min-w-0 rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs font-bold text-white leading-none truncate flex-1">{user.fullName}</p>
                <Pencil size={12} className="text-gray-500 group-hover:text-gray-200 transition-colors shrink-0" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                {user.role?.replace('_', ' ')}
              </p>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-lg transition-all border border-red-600/20"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold uppercase">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <nav className="bg-[#1a1a1a] text-white shadow-xl border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 lg:h-14">
              {/* Left side */}
              <div className="flex items-center min-w-0 gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden p-1.5 -ml-1 rounded-md hover:bg-white/10 transition"
                  aria-label="Open navigation"
                >
                  <Menu size={22} />
                </button>

                {/* Logo (< lg only — sidebar shows logo on lg+) */}
                <div className="flex items-center gap-3 lg:hidden">
                  <Image
                    src="/byteslogo1.png"
                    alt="BYTES Logo"
                    width={32}
                    height={32}
                    className="rounded-sm"
                  />
                  <h1 className="text-lg font-bold tracking-tighter uppercase">BytesDoc</h1>
                </div>

                {/* Page title (lg+ only) */}
                <h2 className="hidden lg:block text-sm font-semibold text-white truncate">
                  {activeTab}
                </h2>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.08] ring-1 ring-white/10 text-xs text-gray-400 hover:text-gray-200 transition"
                  aria-label="Open command palette"
                >
                  <Search size={14} />
                  <span>Search</span>
                  <kbd className="ml-1 inline-flex items-center text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded ring-1 ring-white/15">
                    Ctrl K
                  </kbd>
                </button>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* User info (< lg only — sidebar shows it on lg+) */}
                {user && (
                  <button
                    type="button"
                    onClick={() => setProfileOpen(true)}
                    title="Edit your name"
                    className="group hidden sm:flex lg:hidden flex-col items-end mr-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white leading-none">
                      {user.fullName}
                      <Pencil size={11} className="text-gray-500 group-hover:text-gray-200 transition-colors" />
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                      {user.role?.replace('_', ' ')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} tabs={tabs} />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentName={user?.fullName ?? ''}
        onSave={updateProfile}
      />
    </div>
  )
}
