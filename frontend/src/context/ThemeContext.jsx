import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

function readStoredDarkMode() {
  try {
    const saved = localStorage.getItem('darkMode')
    if (saved === null) return false
    const parsed = JSON.parse(saved)
    return typeof parsed === 'boolean' ? parsed : false
  } catch {
    return false
  }
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(readStoredDarkMode)

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
    } catch {
      // Ignore storage write issues (e.g. privacy mode restrictions).
    }

    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.setProperty('--toast-bg', '#1f2937')
      document.documentElement.style.setProperty('--toast-color', '#f9fafb')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.setProperty('--toast-bg', '#ffffff')
      document.documentElement.style.setProperty('--toast-color', '#1f2937')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
