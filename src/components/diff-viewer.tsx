import { createMemo, Show } from "solid-js"
import { DiffView, DiffModeEnum } from "@git-diff-view/solid"
import { getLanguageFromPath } from "../lib/markdown"
import { normalizeDiffText } from "../lib/diff-utils"
import type { DiffViewMode } from "../stores/preferences"

interface ToolCallDiffViewerProps {
  diffText: string
  filePath?: string
  theme: "light" | "dark"
  mode: DiffViewMode
}

type DiffData = {
  oldFile?: { fileName?: string | null; fileLang?: string | null; content?: string | null }
  newFile?: { fileName?: string | null; fileLang?: string | null; content?: string | null }
  hunks: string[]
}

export function ToolCallDiffViewer(props: ToolCallDiffViewerProps) {
  const diffData = createMemo<DiffData | null>(() => {
    const normalized = normalizeDiffText(props.diffText)
    if (!normalized) {
      return null
    }

    const language = getLanguageFromPath(props.filePath) || "text"
    const fileName = props.filePath || "diff"

    return {
      oldFile: {
        fileName,
        fileLang: language,
      },
      newFile: {
        fileName,
        fileLang: language,
      },
      hunks: [normalized],
    }
  })

  return (
    <div class="tool-call-diff-viewer">
      <Show
        when={diffData()}
        fallback={<pre class="tool-call-diff-fallback">{props.diffText}</pre>}
      >
        {(data) => (
          <DiffView
            data={data()}
            diffViewMode={props.mode === "split" ? DiffModeEnum.Split : DiffModeEnum.Unified}
            diffViewTheme={props.theme}
            diffViewHighlight
            diffViewWrap={false}
            diffViewFontSize={13}
          />
        )}
      </Show>
    </div>
  )
}
