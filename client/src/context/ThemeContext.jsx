import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [themeColor, setThemeColor] = useState('#3b82f6') // Default Blue for Light mode

    useEffect(() => {
        const root = document.documentElement
        if (isDarkMode) {
            root.classList.add('dark-mode')
            root.classList.remove('light-mode')
        } else {
            root.classList.add('light-mode')
            root.classList.remove('dark-mode')
        }
        root.style.setProperty('--accent-1', themeColor)
    }, [isDarkMode, themeColor])

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode)

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, themeColor, setThemeColor }}>
            {children}
        </ThemeContext.Provider>
    )
}
