import { createContext, createSignal, useContext, onMount, type JSX } from "solid-js"

interface ThemeContextValue {
  isDark: () => boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>()

export function ThemeProvider(props: { children: JSX.Element }) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const savedTheme = localStorage.getItem("theme")
  const initialDark = savedTheme ? savedTheme === "dark" : prefersDark

  const [isDark, setIsDarkSignal] = createSignal(initialDark)

  onMount(() => {
    if (isDark()) {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
  })

  const setTheme = (dark: boolean) => {
    setIsDarkSignal(dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
  }

  const toggleTheme = () => {
    setTheme(!isDark())
  }

  return <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>{props.children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
