export const UI_SETTINGS_STORAGE_KEY = 'uiSettings'

export const getStoredUISettings = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(UI_SETTINGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

export const storeUISettings = (uiSettings) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(uiSettings))
  } catch (error) {
    // ignore storage errors
  }
}

export const applyUISettingsToDocument = (uiSettings) => {
  if (typeof window === 'undefined') return
  if (!uiSettings) return

  const root = document.documentElement
  const fontSize = uiSettings.fontSize || 'medium'
  const layout = uiSettings.dashboardLayout || 'default'

  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
  root.classList.add(`font-size-${fontSize}`)

  root.classList.remove('layout-default', 'layout-compact', 'layout-spacious')
  root.classList.add(`layout-${layout}`)

  root.classList.toggle('high-contrast', Boolean(uiSettings.highContrast))
  root.classList.toggle('reduce-animations', Boolean(uiSettings.reduceAnimations))
}
