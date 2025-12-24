import { tool } from "@opencode-ai/plugin"
import { spawn, ChildProcess, exec } from "child_process"
import { promisify } from "util"
import { promises as fs } from "fs"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { randomBytes } from "crypto"

const execAsync = promisify(exec)

// Global registry to track running processes
const runningProcesses = new Map<string, ChildProcess>()
const SHELLS_DIR = ".opencode/backgroundShells"
const INDEX_FILE = join(SHELLS_DIR, "index.json")

interface ShellMetadata {
  id: string
  command: string
  startTime: number
  status: "running" | "finished"
  exitCode?: number
  workingDir: string
}

// Cleanup function called on startup
async function cleanupStaleShells() {
  try {
    if (existsSync(SHELLS_DIR)) {
      const dirs = await fs.readdir(SHELLS_DIR)
      for (const dir of dirs) {
        if (dir !== "index.json") {
          await fs.rm(join(SHELLS_DIR, dir), { recursive: true, force: true })
        }
      }
      if (existsSync(INDEX_FILE)) {
        await fs.unlink(INDEX_FILE)
      }
    }
  } catch (error) {
    console.error("Failed to cleanup stale shells:", error)
  }
}

// Initialize cleanup on first import
cleanupStaleShells()

async function ensureShellsDir() {
  if (!existsSync(SHELLS_DIR)) {
    mkdirSync(SHELLS_DIR, { recursive: true })
  }
}

async function loadIndex(): Promise<ShellMetadata[]> {
  try {
    if (existsSync(INDEX_FILE)) {
      const content = await fs.readFile(INDEX_FILE, "utf-8")
      return JSON.parse(content)
    }
  } catch (error) {
    // Index file corrupted or missing, return empty array
  }
  return []
}

async function saveIndex(shells: ShellMetadata[]) {
  await ensureShellsDir()
  await fs.writeFile(INDEX_FILE, JSON.stringify(shells, null, 2))
}

function generateId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15)
  const random = randomBytes(3).toString("hex")
  return `task_${timestamp}_${random}`
}

function formatRuntime(startTime: number): string {
  const elapsed = Date.now() - startTime
  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

async function getShellsList(): Promise<string> {
  const shells = await loadIndex()
  if (shells.length === 0) {
    return "Currently running Background Shells:\nNo background shells running."
  }
  
  let output = "Currently running Background Shells:\n"
  for (const shell of shells) {
    const runtime = shell.status === "running" ? formatRuntime(shell.startTime) : "finished"
    const outputPath = join(SHELLS_DIR, shell.id, "output.txt")
    let outputSize = 0
    try {
      const stats = await fs.stat(outputPath)
      outputSize = stats.size
    } catch {
      // File doesn't exist yet
    }
    
    output += `- ShellId: ${shell.id}\n`
    output += `  Command: ${shell.command}\n`
    output += `  Status: ${shell.status === "running" ? "Running" : "Finished"}\n`
    output += `  ${shell.status === "running" ? "RunningFor" : "CompletedAfter"}: ${runtime}\n`
    output += `  Current output size: ${outputSize} bytes\n`
    if (shell.status === "finished" && shell.exitCode !== undefined) {
      output += `  Exit code: ${shell.exitCode}\n`
    }
    output += "\n"
  }
  return output.trim()
}

export const start = tool({
  description: `Start a background shell command. Only use it to run supporting processes like dev servers etc. ${await getShellsList()}`,
  args: {
    command: tool.schema.string().describe("Bash command to execute in background"),
  },
  async execute(args) {
    await ensureShellsDir()
    
    const id = generateId()
    const shellDir = join(SHELLS_DIR, id)
    const outputFile = join(shellDir, "output.txt")
    
    // Create directory for this shell
    mkdirSync(shellDir, { recursive: true })
    
    // Create metadata
    const metadata: ShellMetadata = {
      id,
      command: args.command,
      startTime: Date.now(),
      status: "running",
      workingDir: process.cwd()
    }
    
    // Start the process
    const childProcess = spawn("bash", ["-c", args.command], {
      detached: false, // Keep it in opencode process space
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd()
    })
    
    // Store process reference
    runningProcesses.set(id, childProcess)
    
    // Create output stream
    const outputStream = await fs.open(outputFile, "w")
    
    // Pipe stdout and stderr to output file
    childProcess.stdout?.on("data", async (data) => {
      await outputStream.write(data)
    })
    
    childProcess.stderr?.on("data", async (data) => {
      await outputStream.write(data)
    })
    
    // Handle process completion
    childProcess.on("close", async (code) => {
      await outputStream.close()
      runningProcesses.delete(id)
      
      // Update metadata
      metadata.status = "finished"
      metadata.exitCode = code || 0
      
      // Update index
      const shells = await loadIndex()
      const index = shells.findIndex(s => s.id === id)
      if (index >= 0) {
        shells[index] = metadata
      }
      await saveIndex(shells)
    })
    
    // Add to index
    const shells = await loadIndex()
    shells.push(metadata)
    await saveIndex(shells)
    
    return `Started background shell with ID: ${id}\nCommand: ${args.command}\n\n${await getShellsList()}`
  },
})

export const list = tool({
  description: "List all background shell processes with their status",
  args: {},
  async execute(args) {
    return await getShellsList()
  },
})

export const read = tool({
  description: `Read output from a background shell process. ${await getShellsList()}`,
  args: {
    id: tool.schema.string().describe("Background shell ID"),
    method: tool.schema.enum(["full", "grep", "head", "tail"]).default("full").describe("Method to read output"),
    pattern: tool.schema.string().optional().describe("Pattern for grep method"),
    lines: tool.schema.number().optional().describe("Number of lines for head/tail methods"),
  },
  async execute(args) {
    const shells = await loadIndex()
    const shell = shells.find(s => s.id === args.id)
    
    if (!shell) {
      return `Background shell with ID ${args.id} not found.\n\n${await getShellsList()}`
    }
    
    const outputFile = join(SHELLS_DIR, args.id, "output.txt")
    
    if (!existsSync(outputFile)) {
      return `Output file for ${args.id} not found or not created yet.`
    }
    
    try {
      // Check file size first
      const stats = await fs.stat(outputFile)
      const fileSizeBytes = stats.size
      const fileSizeKB = (fileSizeBytes / 1024).toFixed(2)
      
      let content: string
      let command: string
      
      switch (args.method) {
        case "full":
          // For full read, check size and warn if too large
          if (fileSizeBytes > 102400) { // 100KB
            return `Output file is too large (${fileSizeKB}KB). Please use grep, head, or tail methods to filter the content.`
          }
          content = await fs.readFile(outputFile, "utf-8")
          break
          
        case "grep":
          if (!args.pattern) {
            return "Pattern is required for grep method"
          }
          // Use actual grep command - escape the pattern for shell safety
          const escapedPattern = args.pattern.replace(/"/g, '\\"')
          command = `grep "${escapedPattern}" "${outputFile}"`
          
          try {
            const { stdout } = await execAsync(command)
            content = stdout
          } catch (error: any) {
            // grep returns exit code 1 when no matches found
            if (error.code === 1) {
              content = ""
            } else {
              throw error
            }
          }
          break
          
        case "head":
          const headLines = args.lines || 10
          // Use actual head command
          command = `head -n ${headLines} "${outputFile}"`
          
          const headResult = await execAsync(command)
          content = headResult.stdout
          break
          
        case "tail":
          const tailLines = args.lines || 10
          // Use actual tail command
          command = `tail -n ${tailLines} "${outputFile}"`
          
          const tailResult = await execAsync(command)
          content = tailResult.stdout
          break
          
        default:
          if (fileSizeBytes > 102400) { // 100KB
            return `Output file is too large (${fileSizeKB}KB). Please use grep, head, or tail methods to filter the content.`
          }
          content = await fs.readFile(outputFile, "utf-8")
      }
      
      // Check the final content size after grep/head/tail processing
      if (content.length > 102400) { // 100KB in characters (roughly)
        return `Filtered output is still too large (${(content.length / 1024).toFixed(2)}KB). Try using more specific grep patterns or fewer lines for head/tail.`
      }
      
      const methodDesc = args.method === "grep" ? `grep pattern: "${args.pattern}"` :
                        args.method === "head" ? `head ${args.lines || 10} lines` :
                        args.method === "tail" ? `tail ${args.lines || 10} lines` :
                        "full output"
      
      return `Output for ${args.id} (${methodDesc}) - File size: ${fileSizeKB}KB:\n\n${content}`
      
    } catch (error) {
      return `Error reading output for ${args.id}: ${error}`
    }
  },
})

export const kill = tool({
  description: `Kill a background shell process and clean up its files. ${await getShellsList()}`,
  args: {
    id: tool.schema.string().describe("Background shell ID to kill"),
  },
  async execute(args) {
    const shells = await loadIndex()
    const shell = shells.find(s => s.id === args.id)
    
    if (!shell) {
      return `Background shell with ID ${args.id} not found.\n\n${await getShellsList()}`
    }
    
    // Kill the process if it's still running
    const process = runningProcesses.get(args.id)
    if (process) {
      process.kill("SIGTERM")
      runningProcesses.delete(args.id)
    }
    
    // Remove from index
    const updatedShells = shells.filter(s => s.id !== args.id)
    await saveIndex(updatedShells)
    
    // Remove directory
    const shellDir = join(SHELLS_DIR, args.id)
    try {
      await fs.rm(shellDir, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist, continue
    }
    
    return `Killed and cleaned up background shell ${args.id}\n\n${await getShellsList()}`
  },
})