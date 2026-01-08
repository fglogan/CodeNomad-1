import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, type Accessor } from "solid-js"
import useMediaQuery from "@suid/material/useMediaQuery"

// Constants
const DEFAULT_LEFT_DRAWER_WIDTH = 280
const MIN_LEFT_DRAWER_WIDTH = 220
const MAX_LEFT_DRAWER_WIDTH = 360
const DEFAULT_RIGHT_DRAWER_WIDTH = 260
const MIN_RIGHT_DRAWER_WIDTH = 200
const MAX_RIGHT_DRAWER_WIDTH = 380
const APP_BAR_HEIGHT = 56
const LEFT_DRAWER_STORAGE_KEY = "opencode-session-sidebar-width-v8"
const RIGHT_DRAWER_STORAGE_KEY = "opencode-session-right-drawer-width-v1"
const LEFT_PIN_STORAGE_KEY = "opencode-session-left-drawer-pinned-v1"
const RIGHT_PIN_STORAGE_KEY = "opencode-session-right-drawer-pinned-v1"

export type LayoutMode = "desktop" | "tablet" | "phone"
export type DrawerViewState = "pinned" | "floating-open" | "floating-closed"

const clampLeftWidth = (value: number) =>
  Math.min(MAX_LEFT_DRAWER_WIDTH, Math.max(MIN_LEFT_DRAWER_WIDTH, value))
const clampRightWidth = (value: number) =>
  Math.min(MAX_RIGHT_DRAWER_WIDTH, Math.max(MIN_RIGHT_DRAWER_WIDTH, value))

const getPinStorageKey = (side: "left" | "right") =>
  side === "left" ? LEFT_PIN_STORAGE_KEY : RIGHT_PIN_STORAGE_KEY

function readStoredPinState(side: "left" | "right", defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue
  const stored = window.localStorage.getItem(getPinStorageKey(side))
  if (stored === "true") return true
  if (stored === "false") return false
  return defaultValue
}

function persistPinState(side: "left" | "right", value: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(getPinStorageKey(side), value ? "true" : "false")
}

export interface UseDrawerStateOptions {
  tabBarOffset: Accessor<number>
}

export interface DrawerState {
  // Layout mode
  layoutMode: Accessor<LayoutMode>
  isPhoneLayout: Accessor<boolean>
  
  // Left drawer
  leftWidth: Accessor<number>
  leftPinned: Accessor<boolean>
  leftOpen: Accessor<boolean>
  leftDrawerState: Accessor<DrawerViewState>
  leftPinningSupported: Accessor<boolean>
  setLeftDrawerContentEl: (el: HTMLElement | null) => void
  setLeftToggleButtonEl: (el: HTMLElement | null) => void
  leftDrawerContentEl: Accessor<HTMLElement | null>
  leftToggleButtonEl: Accessor<HTMLElement | null>
  
  // Right drawer
  rightWidth: Accessor<number>
  rightPinned: Accessor<boolean>
  rightOpen: Accessor<boolean>
  rightDrawerState: Accessor<DrawerViewState>
  rightPinningSupported: Accessor<boolean>
  setRightDrawerContentEl: (el: HTMLElement | null) => void
  setRightToggleButtonEl: (el: HTMLElement | null) => void
  rightDrawerContentEl: Accessor<HTMLElement | null>
  rightToggleButtonEl: Accessor<HTMLElement | null>
  
  // Floating drawer positioning
  floatingTopPx: Accessor<string>
  floatingHeight: Accessor<string>
  setDrawerHost: (el: HTMLElement | null) => void
  drawerContainer: Accessor<HTMLElement | Element | undefined>
  measureDrawerHost: () => void
  
  // Actions
  handleLeftButtonClick: () => void
  handleRightButtonClick: () => void
  pinLeftDrawer: () => void
  unpinLeftDrawer: () => void
  pinRightDrawer: () => void
  unpinRightDrawer: () => void
  closeLeftDrawer: () => void
  closeRightDrawer: () => void
  closeFloatingDrawersIfAny: () => boolean
  openLeftDrawer: () => void
  
  // Resize handlers
  handleDrawerResizeMouseDown: (side: "left" | "right") => (event: MouseEvent) => void
  handleDrawerResizeTouchStart: (side: "left" | "right") => (event: TouchEvent) => void
}

export function useDrawerState(options: UseDrawerStateOptions): DrawerState {
  // Width state
  const [leftWidth, setLeftWidth] = createSignal(DEFAULT_LEFT_DRAWER_WIDTH)
  const [rightWidth, setRightWidth] = createSignal(DEFAULT_RIGHT_DRAWER_WIDTH)
  
  // Pin state
  const [leftPinned, setLeftPinned] = createSignal(true)
  const [leftOpen, setLeftOpen] = createSignal(true)
  const [rightPinned, setRightPinned] = createSignal(true)
  const [rightOpen, setRightOpen] = createSignal(true)
  
  // Element refs
  const [drawerHost, setDrawerHost] = createSignal<HTMLElement | null>(null)
  const [floatingDrawerTop, setFloatingDrawerTop] = createSignal(0)
  const [floatingDrawerHeight, setFloatingDrawerHeight] = createSignal(0)
  const [leftDrawerContentEl, setLeftDrawerContentEl] = createSignal<HTMLElement | null>(null)
  const [rightDrawerContentEl, setRightDrawerContentEl] = createSignal<HTMLElement | null>(null)
  const [leftToggleButtonEl, setLeftToggleButtonEl] = createSignal<HTMLElement | null>(null)
  const [rightToggleButtonEl, setRightToggleButtonEl] = createSignal<HTMLElement | null>(null)
  
  // Resize state
  const [activeResizeSide, setActiveResizeSide] = createSignal<"left" | "right" | null>(null)
  const [resizeStartX, setResizeStartX] = createSignal(0)
  const [resizeStartWidth, setResizeStartWidth] = createSignal(0)
  
  // Layout mode detection
  const desktopQuery = useMediaQuery("(min-width: 1280px)")
  const tabletQuery = useMediaQuery("(min-width: 768px)")
  
  const layoutMode = createMemo<LayoutMode>(() => {
    if (desktopQuery()) return "desktop"
    if (tabletQuery()) return "tablet"
    return "phone"
  })
  
  const isPhoneLayout = createMemo(() => layoutMode() === "phone")
  const leftPinningSupported = createMemo(() => layoutMode() === "desktop")
  const rightPinningSupported = createMemo(() => layoutMode() !== "phone")
  
  // Drawer states
  const leftDrawerState = createMemo<DrawerViewState>(() => {
    if (leftPinned()) return "pinned"
    return leftOpen() ? "floating-open" : "floating-closed"
  })
  
  const rightDrawerState = createMemo<DrawerViewState>(() => {
    if (rightPinned()) return "pinned"
    return rightOpen() ? "floating-open" : "floating-closed"
  })
  
  // Pin persistence helper
  const persistPinIfSupported = (side: "left" | "right", value: boolean) => {
    if (side === "left" && !leftPinningSupported()) return
    if (side === "right" && !rightPinningSupported()) return
    persistPinState(side, value)
  }
  
  // Measure floating drawer position
  const measureDrawerHost = () => {
    if (typeof window === "undefined") return
    const host = drawerHost()
    if (!host) return
    const rect = host.getBoundingClientRect()
    const toolbar = host.querySelector<HTMLElement>(".session-toolbar")
    const toolbarHeight = toolbar?.offsetHeight ?? APP_BAR_HEIGHT
    setFloatingDrawerTop(rect.top + toolbarHeight)
    setFloatingDrawerHeight(Math.max(0, rect.height - toolbarHeight))
  }
  
  const scheduleDrawerMeasure = () => {
    if (typeof window === "undefined") {
      measureDrawerHost()
      return
    }
    requestAnimationFrame(() => measureDrawerHost())
  }
  
  // Initialize from localStorage
  onMount(() => {
    if (typeof window === "undefined") return
    
    const savedLeft = window.localStorage.getItem(LEFT_DRAWER_STORAGE_KEY)
    if (savedLeft) {
      const parsed = Number.parseInt(savedLeft, 10)
      if (Number.isFinite(parsed)) {
        setLeftWidth(clampLeftWidth(parsed))
      }
    }
    
    const savedRight = window.localStorage.getItem(RIGHT_DRAWER_STORAGE_KEY)
    if (savedRight) {
      const parsed = Number.parseInt(savedRight, 10)
      if (Number.isFinite(parsed)) {
        setRightWidth(clampRightWidth(parsed))
      }
    }
    
    const handleResize = () => {
      const width = clampLeftWidth(window.innerWidth * 0.3)
      setLeftWidth((current) => clampLeftWidth(current || width))
      measureDrawerHost()
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    onCleanup(() => window.removeEventListener("resize", handleResize))
  })
  
  // Persist width changes
  createEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(LEFT_DRAWER_STORAGE_KEY, leftWidth().toString())
  })
  
  createEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(RIGHT_DRAWER_STORAGE_KEY, rightWidth().toString())
  })
  
  // React to layout mode changes
  createEffect(() => {
    switch (layoutMode()) {
      case "desktop": {
        const leftSaved = readStoredPinState("left", true)
        const rightSaved = readStoredPinState("right", true)
        setLeftPinned(leftSaved)
        setLeftOpen(leftSaved)
        setRightPinned(rightSaved)
        setRightOpen(rightSaved)
        break
      }
      case "tablet": {
        const rightSaved = readStoredPinState("right", true)
        setLeftPinned(false)
        setLeftOpen(false)
        setRightPinned(rightSaved)
        setRightOpen(rightSaved)
        break
      }
      default:
        setLeftPinned(false)
        setLeftOpen(false)
        setRightPinned(false)
        setRightOpen(false)
        break
    }
  })
  
  // React to tabBarOffset changes
  createEffect(() => {
    options.tabBarOffset()
    requestAnimationFrame(() => measureDrawerHost())
  })
  
  // Floating drawer positioning
  const fallbackDrawerTop = () => APP_BAR_HEIGHT + options.tabBarOffset()
  const floatingTop = () => {
    const measured = floatingDrawerTop()
    if (measured > 0) return measured
    return fallbackDrawerTop()
  }
  const floatingTopPx = () => `${floatingTop()}px`
  const floatingHeight = () => {
    const measured = floatingDrawerHeight()
    if (measured > 0) return `${measured}px`
    return `calc(100% - ${floatingTop()}px)`
  }
  
  const drawerContainer = () => {
    const host = drawerHost()
    if (host) return host
    if (typeof document !== "undefined") {
      return document.body
    }
    return undefined
  }
  
  // Focus helpers
  const focusTarget = (element: HTMLElement | null) => {
    if (!element) return
    requestAnimationFrame(() => {
      element.focus()
    })
  }
  
  const blurIfInside = (element: HTMLElement | null) => {
    if (typeof document === "undefined" || !element) return
    const active = document.activeElement as HTMLElement | null
    if (active && element.contains(active)) {
      active.blur()
    }
  }
  
  // Pin actions
  const pinLeftDrawer = () => {
    blurIfInside(leftDrawerContentEl())
    batch(() => {
      setLeftPinned(true)
      setLeftOpen(true)
    })
    persistPinIfSupported("left", true)
    measureDrawerHost()
  }
  
  const unpinLeftDrawer = () => {
    blurIfInside(leftDrawerContentEl())
    batch(() => {
      setLeftPinned(false)
      setLeftOpen(true)
    })
    persistPinIfSupported("left", false)
    measureDrawerHost()
  }
  
  const pinRightDrawer = () => {
    blurIfInside(rightDrawerContentEl())
    batch(() => {
      setRightPinned(true)
      setRightOpen(true)
    })
    persistPinIfSupported("right", true)
    measureDrawerHost()
  }
  
  const unpinRightDrawer = () => {
    blurIfInside(rightDrawerContentEl())
    batch(() => {
      setRightPinned(false)
      setRightOpen(true)
    })
    persistPinIfSupported("right", false)
    measureDrawerHost()
  }
  
  // Close actions
  const closeLeftDrawer = () => {
    if (leftDrawerState() === "pinned") return
    blurIfInside(leftDrawerContentEl())
    setLeftOpen(false)
    focusTarget(leftToggleButtonEl())
  }
  
  const closeRightDrawer = () => {
    if (rightDrawerState() === "pinned") return
    blurIfInside(rightDrawerContentEl())
    setRightOpen(false)
    focusTarget(rightToggleButtonEl())
  }
  
  const closeFloatingDrawersIfAny = () => {
    let handled = false
    if (!leftPinned() && leftOpen()) {
      setLeftOpen(false)
      blurIfInside(leftDrawerContentEl())
      focusTarget(leftToggleButtonEl())
      handled = true
    }
    if (!rightPinned() && rightOpen()) {
      setRightOpen(false)
      blurIfInside(rightDrawerContentEl())
      focusTarget(rightToggleButtonEl())
      handled = true
    }
    return handled
  }
  
  const openLeftDrawer = () => {
    setLeftOpen(true)
    measureDrawerHost()
  }
  
  // Button click handlers
  const handleLeftButtonClick = () => {
    const state = leftDrawerState()
    if (state === "pinned") return
    if (state === "floating-closed") {
      setLeftOpen(true)
      measureDrawerHost()
      return
    }
    blurIfInside(leftDrawerContentEl())
    setLeftOpen(false)
    focusTarget(leftToggleButtonEl())
    measureDrawerHost()
  }
  
  const handleRightButtonClick = () => {
    const state = rightDrawerState()
    if (state === "pinned") return
    if (state === "floating-closed") {
      setRightOpen(true)
      measureDrawerHost()
      return
    }
    blurIfInside(rightDrawerContentEl())
    setRightOpen(false)
    focusTarget(rightToggleButtonEl())
    measureDrawerHost()
  }
  
  // Resize logic
  const applyDrawerWidth = (side: "left" | "right", width: number) => {
    if (side === "left") {
      setLeftWidth(width)
    } else {
      setRightWidth(width)
    }
    scheduleDrawerMeasure()
  }
  
  const handleDrawerPointerMove = (clientX: number) => {
    const side = activeResizeSide()
    if (!side) return
    const startWidth = resizeStartWidth()
    const clamp = side === "left" ? clampLeftWidth : clampRightWidth
    const delta = side === "left" ? clientX - resizeStartX() : resizeStartX() - clientX
    const nextWidth = clamp(startWidth + delta)
    applyDrawerWidth(side, nextWidth)
  }
  
  function stopDrawerResize() {
    setActiveResizeSide(null)
    document.removeEventListener("mousemove", drawerMouseMove)
    document.removeEventListener("mouseup", drawerMouseUp)
    document.removeEventListener("touchmove", drawerTouchMove)
    document.removeEventListener("touchend", drawerTouchEnd)
  }
  
  function drawerMouseMove(event: MouseEvent) {
    event.preventDefault()
    handleDrawerPointerMove(event.clientX)
  }
  
  function drawerMouseUp() {
    stopDrawerResize()
  }
  
  function drawerTouchMove(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    event.preventDefault()
    handleDrawerPointerMove(touch.clientX)
  }
  
  function drawerTouchEnd() {
    stopDrawerResize()
  }
  
  const startDrawerResize = (side: "left" | "right", clientX: number) => {
    setActiveResizeSide(side)
    setResizeStartX(clientX)
    setResizeStartWidth(side === "left" ? leftWidth() : rightWidth())
    document.addEventListener("mousemove", drawerMouseMove)
    document.addEventListener("mouseup", drawerMouseUp)
    document.addEventListener("touchmove", drawerTouchMove, { passive: false })
    document.addEventListener("touchend", drawerTouchEnd)
  }
  
  const handleDrawerResizeMouseDown = (side: "left" | "right") => (event: MouseEvent) => {
    event.preventDefault()
    startDrawerResize(side, event.clientX)
  }
  
  const handleDrawerResizeTouchStart = (side: "left" | "right") => (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    event.preventDefault()
    startDrawerResize(side, touch.clientX)
  }
  
  onCleanup(() => {
    stopDrawerResize()
  })
  
  // Escape key handler
  onMount(() => {
    if (typeof window === "undefined") return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (!closeFloatingDrawersIfAny()) return
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener("keydown", handleEscape, true)
    onCleanup(() => window.removeEventListener("keydown", handleEscape, true))
  })
  
  return {
    // Layout mode
    layoutMode,
    isPhoneLayout,
    
    // Left drawer
    leftWidth,
    leftPinned,
    leftOpen,
    leftDrawerState,
    leftPinningSupported,
    setLeftDrawerContentEl,
    setLeftToggleButtonEl,
    leftDrawerContentEl,
    leftToggleButtonEl,
    
    // Right drawer
    rightWidth,
    rightPinned,
    rightOpen,
    rightDrawerState,
    rightPinningSupported,
    setRightDrawerContentEl,
    setRightToggleButtonEl,
    rightDrawerContentEl,
    rightToggleButtonEl,
    
    // Floating drawer positioning
    floatingTopPx,
    floatingHeight,
    setDrawerHost,
    drawerContainer,
    measureDrawerHost,
    
    // Actions
    handleLeftButtonClick,
    handleRightButtonClick,
    pinLeftDrawer,
    unpinLeftDrawer,
    pinRightDrawer,
    unpinRightDrawer,
    closeLeftDrawer,
    closeRightDrawer,
    closeFloatingDrawersIfAny,
    openLeftDrawer,
    
    // Resize handlers
    handleDrawerResizeMouseDown,
    handleDrawerResizeTouchStart,
  }
}
