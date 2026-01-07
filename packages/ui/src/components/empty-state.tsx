import { Component } from "solid-js"
import { Loader2 } from "lucide-solid"

// Genesis Console branding - styled text logo component
const GenesisLogo = () => (
  <div class="flex flex-col items-center justify-center" style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <span style="font-size: 3rem; font-weight: 700; letter-spacing: -0.02em; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Genesis</span>
    <span style="font-size: 1.25rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-secondary); margin-top: -0.25rem;">Console</span>
  </div>
)

interface EmptyStateProps {
  onSelectFolder: () => void
  isLoading?: boolean
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex h-full w-full items-center justify-center bg-surface-secondary">
      <div class="max-w-[500px] px-8 py-12 text-center">
        <div class="mb-8 flex justify-center">
          <GenesisLogo />
        </div>

        <p class="mb-8 text-base text-secondary">Select a folder to start coding with AI</p>


        <button
          onClick={props.onSelectFolder}
          disabled={props.isLoading}
          class="mb-4 button-primary"
        >
          {props.isLoading ? (
            <>
              <Loader2 class="h-4 w-4 animate-spin" />
              Selecting...
            </>
          ) : (
            "Select Folder"
          )}
        </button>

        <p class="text-sm text-muted">
          Keyboard shortcut: {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+N
        </p>

        <div class="mt-6 space-y-1 text-sm text-muted">
          <p>Examples: ~/projects/my-app</p>
          <p>You can have multiple instances of the same folder</p>
        </div>
      </div>
    </div>
  )
}

export default EmptyState
