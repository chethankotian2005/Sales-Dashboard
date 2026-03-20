import { useState, useEffect } from 'react'
import { User, Bell, Shield, Camera, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------
function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Tabs Configuration
// ---------------------------------------------------------------------------
const tabs = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
]

// ---------------------------------------------------------------------------
// Default state helpers
// ---------------------------------------------------------------------------
const defaultProfile = {
  firstName: '',
  lastName: '',
  email: '',
  bio: '',
}

const defaultNotifications = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  orderUpdates: true,
  marketingEmails: false,
  securityAlerts: true,
}

const notificationOptions = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive email notifications for important account activity.',
  },
  {
    key: 'smsNotifications',
    label: 'SMS Notifications',
    description: 'Get text message alerts sent to your mobile phone.',
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Receive push notifications on your desktop or mobile device.',
  },
  {
    key: 'orderUpdates',
    label: 'Order Updates',
    description: 'Stay informed about order status changes and shipping updates.',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing Emails',
    description: 'Receive promotional offers, newsletters, and product updates.',
  },
  {
    key: 'securityAlerts',
    label: 'Security Alerts',
    description: 'Get notified about suspicious login attempts and security events.',
  },
]

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------
function ProfileTab({ profile, setProfile }) {
  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = () => {
    localStorage.setItem('settings_profile', JSON.stringify(profile))
    toast.success('Profile saved successfully!')
  }

  const handleUploadPhoto = () => {
    toast.success('Photo uploaded successfully!')
  }

  const initials =
    (profile.firstName?.[0] || '').toUpperCase() +
    (profile.lastName?.[0] || '').toUpperCase() || 'U'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Avatar Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Profile Photo
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold select-none">
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <button
              type="button"
              onClick={handleUploadPhoto}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Upload Photo
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Personal Information
        </h3>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter first name"
                value={profile.firstName}
                onChange={handleChange('firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter last name"
                value={profile.lastName}
                onChange={handleChange('lastName')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="Enter email address"
              value={profile.email}
              onChange={handleChange('email')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Tell us about yourself..."
              rows={4}
              value={profile.bio}
              onChange={handleChange('bio')}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------
function NotificationsTab({ notifications, setNotifications }) {
  const handleToggle = (key) => (value) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value }
      localStorage.setItem('settings_notifications', JSON.stringify(updated))
      toast.success(
        `${notificationOptions.find((o) => o.key === key)?.label} ${
          value ? 'enabled' : 'disabled'
        }`
      )
      return updated
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Notification Preferences
        </h3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {notificationOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {option.description}
                </p>
              </div>
              <ToggleSwitch
                enabled={notifications[option.key]}
                onChange={handleToggle(option.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Security Tab
// ---------------------------------------------------------------------------
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [twoFactor, setTwoFactor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('settings_2fa')) || false
    } catch {
      return false
    }
  })

  const handleUpdatePassword = () => {
    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }
    if (!newPassword) {
      toast.error('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    toast.success('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleTwoFactorToggle = (value) => {
    setTwoFactor(value)
    localStorage.setItem('settings_2fa', JSON.stringify(value))
    toast.success(
      `Two-Factor Authentication ${value ? 'enabled' : 'disabled'}`
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Change Password */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Change Password
        </h3>
        <div className="space-y-5 max-w-lg">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrent ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNew ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUpdatePassword}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Enable Two-Factor Authentication
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Add an extra layer of security to your account by requiring a
              verification code in addition to your password.
            </p>
          </div>
          <ToggleSwitch enabled={twoFactor} onChange={handleTwoFactorToggle} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings Page (Main Export)
// ---------------------------------------------------------------------------
export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  // Profile state
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('settings_profile')
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : { ...defaultProfile }
    } catch {
      return { ...defaultProfile }
    }
  })

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('settings_notifications')
      return saved
        ? { ...defaultNotifications, ...JSON.parse(saved) }
        : { ...defaultNotifications }
    } catch {
      return { ...defaultNotifications }
    }
  })

  // Persist profile on first load (ensures localStorage key exists)
  useEffect(() => {
    if (!localStorage.getItem('settings_profile')) {
      localStorage.setItem('settings_profile', JSON.stringify(profile))
    }
    if (!localStorage.getItem('settings_notifications')) {
      localStorage.setItem('settings_notifications', JSON.stringify(notifications))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 -mb-px" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab profile={profile} setProfile={setProfile} />
      )}
      {activeTab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          setNotifications={setNotifications}
        />
      )}
      {activeTab === 'security' && <SecurityTab />}
    </div>
  )
}
