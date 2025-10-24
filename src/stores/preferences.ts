import { createSignal } from "solid-js"

const STORAGE_KEY = "opencode-preferences"

interface Preferences {
  showThinkingBlocks: boolean
}

const defaultPreferences: Preferences = {
  showThinkingBlocks: false,
}

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error("Failed to load preferences:", error)
  }
  return defaultPreferences
}

function savePreferences(prefs: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.error("Failed to save preferences:", error)
  }
}

const [preferences, setPreferences] = createSignal<Preferences>(loadPreferences())

function updatePreferences(updates: Partial<Preferences>): void {
  const updated = { ...preferences(), ...updates }
  setPreferences(updated)
  savePreferences(updated)
}

function toggleShowThinkingBlocks(): void {
  updatePreferences({ showThinkingBlocks: !preferences().showThinkingBlocks })
}

export { preferences, updatePreferences, toggleShowThinkingBlocks }
