import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export function useColorMode() {
  const theme = ref<Theme>('light') // ← force light by default

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

  const updateTheme = () => {
    const isDark = theme.value === 'dark' || (theme.value === 'system' && systemTheme.matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  systemTheme.addEventListener('change', () => {
    if (theme.value === 'system') {
      updateTheme()
    }
  })

  watch(theme, () => {
    updateTheme()
  })

  // Call it immediately on mount
  updateTheme()

  return {
    theme,
    toggleTheme: () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark'
    },
  }
}
