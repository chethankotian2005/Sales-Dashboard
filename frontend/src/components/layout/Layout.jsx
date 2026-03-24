import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function readSidebarCollapsed() {
  try {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === null) return false
    const parsed = JSON.parse(saved)
    return typeof parsed === 'boolean' ? parsed : false
  } catch {
    return false
  }
}

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const [isMobile, setIsMobile] = useState(false)
  const [dateRange, setDateRange] = useState(null)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
    } catch {
      // Ignore storage write failures.
    }
  }, [sidebarCollapsed])

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        <Topbar onDateRangeChange={setDateRange} />

        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  )
}
