import { ref, watch } from 'vue'

// Global theme state - shared across all components
const isDark = ref(true)

// Initialize theme from localStorage on first load
const initializeTheme = () => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('darchive-theme')
        if (savedTheme) {
            isDark.value = savedTheme === 'dark'
        }
    }
}

// Watch for theme changes and persist to localStorage
if (typeof window !== 'undefined') {
    watch(isDark, (newValue) => {
        localStorage.setItem('darchive-theme', newValue ? 'dark' : 'light')
    })
}

export const useTheme = () => {
    const toggleTheme = () => {
        isDark.value = !isDark.value
    }

    return {
        isDark,
        toggleTheme,
        initializeTheme
    }
}
