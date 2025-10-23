import { createSignal, onMount, Show } from "solid-js"
import { getHighlighter, type Highlighter } from "shiki"
import { useTheme } from "../lib/theme"

interface CodeBlockInlineProps {
  code: string
  language?: string
}

let highlighter: Highlighter | null = null

async function getOrCreateHighlighter() {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "typescript",
        "javascript",
        "python",
        "bash",
        "json",
        "html",
        "css",
        "markdown",
        "yaml",
        "sql",
        "rust",
        "go",
        "cpp",
        "c",
        "java",
        "csharp",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "diff",
        "shell",
      ],
    })
  }
  return highlighter
}

export function CodeBlockInline(props: CodeBlockInlineProps) {
  const { isDark } = useTheme()
  const [html, setHtml] = createSignal("")
  const [copied, setCopied] = createSignal(false)
  const [ready, setReady] = createSignal(false)

  onMount(async () => {
    const hl = await getOrCreateHighlighter()
    setReady(true)
    updateHighlight(hl)
  })

  const updateHighlight = async (hl: Highlighter) => {
    if (!props.language) {
      setHtml(`<pre><code>${escapeHtml(props.code)}</code></pre>`)
      return
    }

    try {
      const highlighted = hl.codeToHtml(props.code, {
        lang: props.language,
        theme: isDark() ? "github-dark" : "github-light",
      })
      setHtml(highlighted)
    } catch {
      setHtml(`<pre><code>${escapeHtml(props.code)}</code></pre>`)
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(props.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Show
      when={ready()}
      fallback={
        <pre class="tool-call-content">
          <code>{props.code}</code>
        </pre>
      }
    >
      <div class="code-block-inline">
        <div class="code-block-header">
          <Show when={props.language}>
            <span class="code-block-language">{props.language}</span>
          </Show>
          <button onClick={copyCode} class="code-block-copy">
            <svg
              class="copy-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="copy-text">
              <Show when={copied()} fallback="Copy">
                Copied!
              </Show>
            </span>
          </button>
        </div>
        <div innerHTML={html()} />
      </div>
    </Show>
  )
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
