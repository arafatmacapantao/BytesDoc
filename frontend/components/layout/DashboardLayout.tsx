'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/stores/authStore'
import { Menu, X, LogOut, Moon, Sun, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import CommandPalette from '@/components/ui/CommandPalette'

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 transition-colors duration-300 lg:flex">
      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 lg:h-screen lg:sticky lg:top-0 bg-[#1a1a1a] text-white border-r border-white/10">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
          <Image
            src="/byteslogo1.png"
            alt="BYTES Logo"
            width={32}
            height={32}
            className="rounded-sm"
          />
          <h1 className="text-base font-bold tracking-tighter uppercase">BytesDoc</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
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
            <div className="px-3 py-2 min-w-0">
              <p className="text-xs font-bold text-white leading-none truncate">{user.fullName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
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
              <div className="flex items-center min-w-0">
                {/* Hamburger (< md only) */}
                <button
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className="md:hidden mr-4"
                  aria-label="Toggle navigation"
                >
                  {mobileNavOpen ? <X /> : <Menu />}
                </button>

                {/* Logo (< lg only — sidebar has it on lg+) */}
                <div className="flex items-center space-x-3 lg:hidden">
                  <Image
                    src="/byteslogo1.png"
                    alt="BYTES Logo"
                    width={35}
                    height={35}
                    className="rounded-sm"
                  />
                  <h1 className="text-xl font-bold tracking-tighter uppercase">BytesDoc</h1>
                </div>

                {/* Page title (lg+ only) */}
                <h2 className="hidden lg:block text-sm font-semibold text-white truncate">
                  {activeTab}
                </h2>
              </div>

              {/* Horizontal tabs (md to lg-1 only — sidebar has them on lg+) */}
              <div className="hidden md:flex lg:hidden space-x-2">
                {tabs.map((tab) => (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.name
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
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

                {/* User info (< lg only — sidebar has it on lg+) */}
                <div className="hidden sm:flex lg:hidden flex-col items-end mr-2">
                  <span className="text-xs font-bold text-white leading-none">{user?.fullName}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>

                {/* Logout (< lg only — sidebar has it on lg+) */}
                <button
                  onClick={handleLogout}
                  className="lg:hidden flex items-center space-x-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-lg transition-all border border-red-600/20"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline text-xs font-bold uppercase">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile hamburger drawer (< md only) */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#1a1a1a] border-b border-white/10 text-white">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`block px-3 py-2 rounded-md ${
                    activeTab === tab.name
                      ? 'bg-white text-black font-bold'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} tabs={tabs} />
    </div>
  )
}
