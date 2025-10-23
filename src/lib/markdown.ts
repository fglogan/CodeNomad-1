import { marked } from "marked"
import { getHighlighter, type Highlighter } from "shiki"

let highlighter: Highlighter | null = null
let currentTheme: "light" | "dark" = "light"

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

export async function initMarkdown(isDark: boolean) {
  const hl = await getOrCreateHighlighter()
  currentTheme = isDark ? "dark" : "light"

  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  const renderer = new marked.Renderer()

  renderer.code = (code: string, lang: string | undefined) => {
    const encodedCode = encodeURIComponent(code)
    const escapedLang = lang ? escapeHtml(lang) : ""

    if (!lang) {
      return `<div class="markdown-code-block" data-language="" data-code="${encodedCode}"><pre><code>${escapeHtml(code)}</code></pre></div>`
    }

    try {
      const html = hl.codeToHtml(code, {
        lang,
        theme: isDark ? "github-dark" : "github-light",
      })
      return `<div class="markdown-code-block" data-language="${escapedLang}" data-code="${encodedCode}">${html}</div>`
    } catch {
      return `<div class="markdown-code-block" data-language="${escapedLang}" data-code="${encodedCode}"><pre><code class="language-${escapedLang}">${escapeHtml(code)}</code></pre></div>`
    }
  }

  renderer.link = (href: string, title: string | null | undefined, text: string) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ""
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`
  }

  renderer.codespan = (code: string) => {
    return `<code class="inline-code">${escapeHtml(code)}</code>`
  }

  marked.use({ renderer })
}

export async function renderMarkdown(content: string): Promise<string> {
  if (!highlighter) {
    await initMarkdown(currentTheme === "dark")
  }
  return marked.parse(content) as Promise<string>
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
