import { Component, createSignal, createEffect, For, Show, onCleanup } from "solid-js"
import * as fs from "fs"
import * as path from "path"

interface FileItem {
  path: string
  added?: number
  removed?: number
  isGitFile: boolean
}

interface FilePickerProps {
  open: boolean
  onSelect: (path: string) => void
  onNavigate: (direction: "up" | "down") => void
  onClose: () => void
  instanceClient: any
  searchQuery: string
  textareaRef?: HTMLTextAreaElement
  workspaceFolder: string
}

const FilePicker: Component<FilePickerProps> = (props) => {
  const [files, setFiles] = createSignal<FileItem[]>([])
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [loading, setLoading] = createSignal(false)
  const [allFiles, setAllFiles] = createSignal<FileItem[]>([])
  const [isInitialized, setIsInitialized] = createSignal(false)
  const [gitignorePatterns, setGitignorePatterns] = createSignal<Set<string>>(new Set())

  let containerRef: HTMLDivElement | undefined

  async function loadGitignore() {
    try {
      const gitignorePath = path.join(props.workspaceFolder, ".gitignore")
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, "utf-8")
        const patterns = new Set(
          content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#")),
        )
        setGitignorePatterns(patterns)
        console.log(`[FilePicker] Loaded ${patterns.size} gitignore patterns`)
      }
    } catch (error) {
      console.warn("[FilePicker] Could not load .gitignore:", error)
    }
  }

  function isIgnored(relativePath: string): boolean {
    const patterns = gitignorePatterns()
    for (const pattern of patterns) {
      if (pattern.endsWith("/") && relativePath.startsWith(pattern)) {
        return true
      }
      if (relativePath === pattern || relativePath.startsWith(pattern + "/")) {
        return true
      }
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
        if (regex.test(relativePath)) {
          return true
        }
      }
    }
    return false
  }

  async function scanDirectory(dirPath: string, baseDir: string): Promise<FileItem[]> {
    const results: FileItem[] = []

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.relative(baseDir, fullPath)

        if (entry.name === ".git" || entry.name === "node_modules") {
          continue
        }

        if (isIgnored(relativePath)) {
          continue
        }

        if (entry.isDirectory()) {
          results.push({
            path: relativePath + "/",
            isGitFile: false,
          })
          const subFiles = await scanDirectory(fullPath, baseDir)
          results.push(...subFiles)
        } else {
          results.push({
            path: relativePath,
            isGitFile: false,
          })
        }
      }
    } catch (error) {
      console.warn(`[FilePicker] Error scanning ${dirPath}:`, error)
    }

    return results
  }

  async function fetchFiles(searchQuery: string) {
    console.log(`[FilePicker] Fetching files for query: "${searchQuery}"`)
    setLoading(true)

    try {
      if (allFiles().length === 0) {
        await loadGitignore()
        console.log(`[FilePicker] Scanning workspace: ${props.workspaceFolder}`)
        const scannedFiles = await scanDirectory(props.workspaceFolder, props.workspaceFolder)
        setAllFiles(scannedFiles)
        console.log(`[FilePicker] Found ${scannedFiles.length} files`)
      }

      const filteredFiles = searchQuery.trim()
        ? allFiles().filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
        : allFiles()

      console.log(`[FilePicker] Showing ${filteredFiles.length} files`)
      setFiles(filteredFiles)
      setSelectedIndex(0)
    } catch (error) {
      console.error(`[FilePicker] Failed to fetch files:`, error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  let lastQuery = ""

  createEffect(() => {
    console.log(
      `[FilePicker] Effect triggered - open: ${props.open}, query: "${props.searchQuery}", isInitialized: ${isInitialized()}`,
    )

    if (props.open && !isInitialized()) {
      setIsInitialized(true)
      console.log("[FilePicker] First open - fetching files")
      fetchFiles(props.searchQuery)
      lastQuery = props.searchQuery
      return
    }

    if (props.open && props.searchQuery !== lastQuery) {
      console.log(`[FilePicker] Query changed from "${lastQuery}" to "${props.searchQuery}"`)
      lastQuery = props.searchQuery
      fetchFiles(props.searchQuery)
    }
  })

  function scrollToSelected() {
    setTimeout(() => {
      const selectedElement = containerRef?.querySelector('[data-file-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }, 0)
  }

  function handleSelect(path: string) {
    props.onSelect(path)
  }

  function handleNavigateUp() {
    setSelectedIndex((prev) => {
      const next = Math.max(prev - 1, 0)
      scrollToSelected()
      return next
    })
  }

  function handleNavigateDown() {
    setSelectedIndex((prev) => {
      const next = Math.min(prev + 1, files().length - 1)
      scrollToSelected()
      return next
    })
  }

  createEffect(() => {
    if (!props.open) return
    const listener = (e: KeyboardEvent) => {
      if (!props.open) return
      const fileList = files()

      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        props.onClose()
        return
      }

      if (fileList.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        handleNavigateDown()
        props.onNavigate("down")
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        handleNavigateUp()
        props.onNavigate("up")
      } else if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        if (fileList[selectedIndex()]) {
          handleSelect(fileList[selectedIndex()].path)
        }
      }
    }

    document.addEventListener("keydown", listener, true)
    onCleanup(() => document.removeEventListener("keydown", listener, true))
  })

  return (
    <Show when={props.open}>
      <div
        ref={containerRef}
        class="absolute bottom-full left-0 mb-2 w-full max-w-2xl rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
        style={{ "z-index": 100 }}
      >
        <div class="max-h-96 overflow-y-auto">
          <Show
            when={!loading() && isInitialized()}
            fallback={
              <div class="p-4 text-center text-sm text-gray-500">
                <div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                <span class="ml-2">Loading files...</span>
              </div>
            }
          >
            <Show
              when={files().length > 0}
              fallback={<div class="p-4 text-center text-sm text-gray-500">No matching files</div>}
            >
              <For each={files()}>
                {(file, index) => (
                  <div
                    data-file-selected={index() === selectedIndex()}
                    class={`cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                      index() === selectedIndex() ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => handleSelect(file.path)}
                    onMouseEnter={() => setSelectedIndex(index())}
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-sm text-gray-900 dark:text-gray-100">{file.path}</span>
                      <Show when={file.isGitFile && (file.added || file.removed)}>
                        <div class="flex gap-2 text-xs">
                          <Show when={file.added}>
                            <span class="text-green-600 dark:text-green-400">+{file.added}</span>
                          </Show>
                          <Show when={file.removed}>
                            <span class="text-red-600 dark:text-red-400">-{file.removed}</span>
                          </Show>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </Show>
        </div>

        <div class="border-t border-gray-200 p-2 text-xs text-gray-500 dark:border-gray-700">
          <div class="flex items-center justify-between px-2">
            <span>↑↓ Navigate • Enter Select • Esc Close</span>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default FilePicker
