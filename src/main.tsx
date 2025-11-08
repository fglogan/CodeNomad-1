import { render } from "solid-js/web"
import App from "./App"
import { ThemeProvider } from "./lib/theme"
import "./index.css"
import "@git-diff-view/solid/styles/diff-view-pure.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element not found")
}

render(
  () => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ),
  root,
)
