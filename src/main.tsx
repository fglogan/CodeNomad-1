import { render } from "solid-js/web"
import App from "./App"
import { ThemeProvider } from "./lib/theme"
import "./index.css"

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
