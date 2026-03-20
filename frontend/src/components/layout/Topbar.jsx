import { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Calendar,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useUnreadCount, useNotifications, useMarkAllRead } from '../../api/hooks'
import { playNotificationSound } from '../../utils/sounds'
import toast from 'react-hot-toast'

const DEMO_NOTIFICATIONS = [
  { type: 'success', title: 'Payment Received',       message: 'Invoice #INV-000047 paid — $1,840.00' },
  { type: 'success', title: 'New Order Placed',        message: 'Order #ORD-000051 received from Sarah Mitchell' },
  { type: 'success', title: 'Shipment Dispatched',     message: 'Order #ORD-000038 has been shipped via FedEx' },
  { type: 'warning', title: 'Low Stock Alert',         message: '"Wireless Headphones" — only 4 units remaining' },
  { type: 'warning', title: 'Invoice Overdue',         message: 'Invoice #INV-000012 is 7 days overdue ($620.00)' },
  { type: 'warning', title: 'High Return Rate',        message: 'Category "Apparel" showing 18% returns this week' },
  { type: 'info',    title: 'Monthly Report Ready',    message: 'February sales report is available for download' },
  { type: 'info',    title: 'New Customer Registered', message: 'James O\'Brien joined from referral channel' },
  { type: 'info',    title: 'Flash Sale Starting',     message: 'Electronics 20% discount campaign goes live in 1 hr' },
  { type: 'success', title: 'Target Reached',          message: 'Weekly revenue goal of $50,000 achieved!' },
  { type: 'warning', title: 'Cart Abandonment Spike',  message: 'Abandonment rate up 12% in the last 2 hours' },
  { type: 'info',    title: 'Scheduled Maintenance',   message: 'System backup tonight at 2:00 AM (5 min downtime)' },
]

export default function Topbar({ onDateRangeChange }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [searchQuery, setSearchQuery] = useState('')

  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const prevUnreadRef = useRef(null)
  const demoTimerRef = useRef(null)
  const demoIndexRef = useRef(0)
  const [liveCount, setLiveCount] = useState(0)

  const { data: unreadCount } = useUnreadCount()
  const { data: notifications } = useNotifications()
  const markAllRead = useMarkAllRead()

  // Random demo notification loop
  const scheduleNextDemo = useCallback(() => {
    const delay = 8000 + Math.random() * 12000 // 8–20 seconds
    demoTimerRef.current = setTimeout(() => {
      const pool = DEMO_NOTIFICATIONS
      const item = pool[demoIndexRef.current % pool.length]
      demoIndexRef.current += 1

      playNotificationSound(item.type)

      const iconMap = {
        success: <CheckCircle className="w-4 h-4 text-green-500" />,
        warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
        info:    <Info className="w-4 h-4 text-blue-500" />,
      }
      toast(
        <div>
          <p className="font-semibold text-sm">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
        </div>,
        { icon: iconMap[item.type] || iconMap.info, duration: 5000 }
      )

      setLiveCount((c) => c + 1)
      scheduleNextDemo()
    }, delay)
  }, [])

  useEffect(() => {
    scheduleNextDemo()
    return () => clearTimeout(demoTimerRef.current)
  }, [scheduleNextDemo])

  // Play sound + show toast when new notifications arrive
  useEffect(() => {
    const current = unreadCount?.count ?? 0
    if (prevUnreadRef.current !== null && current > prevUnreadRef.current) {
      const unread = notifications?.results?.filter((n) => !n.is_read) || []
      const newest = unread[0]
      if (newest) {
        playNotificationSound(newest.notification_type)
        const icons = {
          success: <CheckCircle className="w-4 h-4 text-green-500" />,
          warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          error:   <CheckCircle className="w-4 h-4 text-red-500" />,
          info:    <Info className="w-4 h-4 text-blue-500" />,
        }
        toast(newest.title, {
          icon: icons[newest.notification_type] || icons.info,
          duration: 4000,
        })
      }
    }
    prevUnreadRef.current = current
  }, [unreadCount?.count])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateChange = (field, value) => {
    const newRange = { ...dateRange, [field]: value }
    setDateRange(newRange)
    if (newRange.start && newRange.end && onDateRangeChange) {
      onDateRangeChange(newRange)
    }
  }

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' })
    if (onDateRangeChange) {
      onDateRangeChange(null)
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>

        {/* Date Range Picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {dateRange.start && dateRange.end
                ? `${dateRange.start} - ${dateRange.end}`
                : 'Select Date Range'}
            </span>
            {dateRange.start && (
              <X
                className="w-4 h-4 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  clearDateRange()
                }}
              />
            )}
          </button>

          {showDatePicker && (
            <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-full btn btn-primary text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {(unreadCount?.count || 0) + liveCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {Math.min((unreadCount?.count || 0) + liveCount, 99)}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <button
                  onClick={() => { markAllRead.mutate(); setLiveCount(0) }}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications?.results?.length > 0 ? (
                  notifications.results.map((notification) => {
                    const typeStyles = {
                      success: { icon: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />, dot: 'bg-green-500' },
                      warning: { icon: <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />, dot: 'bg-yellow-500' },
                      error:   { icon: <Info className="w-4 h-4 text-red-500 flex-shrink-0" />, dot: 'bg-red-500' },
                      info:    { icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />, dot: 'bg-blue-500' },
                    }
                    const style = typeStyles[notification.notification_type] || typeStyles.info
                    return (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-start gap-3',
                          !notification.is_read && 'bg-primary-50 dark:bg-primary-900/10'
                        )}
                      >
                        {style.icon}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0 mt-1`} />
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white hidden sm:block">
              {user?.first_name || user?.username || 'User'}
            </span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
