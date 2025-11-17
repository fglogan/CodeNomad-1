import { contextBridge, ipcRenderer } from "electron"
import type { ElectronAPI } from "../../../ui/src/types/electron-api"

const electronAPI: ElectronAPI = {
  selectFolder: () => ipcRenderer.invoke("dialog:selectFolder"),
  createInstance: (id: string, folder: string, binaryPath?: string, environmentVariables?: Record<string, string>) =>
    ipcRenderer.invoke("instance:create", id, folder, binaryPath, environmentVariables),
  stopInstance: (pid: number) => ipcRenderer.invoke("instance:stop", pid),
  onInstanceStarted: (callback) => {
    ipcRenderer.on("instance:started", (_, data) => callback(data))
  },
  onInstanceError: (callback) => {
    ipcRenderer.on("instance:error", (_, data) => callback(data))
  },
  onInstanceStopped: (callback) => {
    ipcRenderer.on("instance:stopped", (_, data) => callback(data))
  },
  onInstanceLog: (callback) => {
    ipcRenderer.on("instance:log", (_, data) => callback(data))
  },
  onNewInstance: (callback) => {
    ipcRenderer.on("menu:newInstance", () => callback())
  },
  scanDirectory: (workspaceFolder: string) => ipcRenderer.invoke("fs:scanDirectory", workspaceFolder),
  // OpenCode binary operations
  selectOpenCodeBinary: () => ipcRenderer.invoke("dialog:selectOpenCodeBinary"),
  validateOpenCodeBinary: (path: string) => ipcRenderer.invoke("opencode:validateBinary", path),
  // Storage operations
  getConfigPath: () => ipcRenderer.invoke("storage:getConfigPath"),
  getInstancesDir: () => ipcRenderer.invoke("storage:getInstancesDir"),
  readConfigFile: () => ipcRenderer.invoke("storage:readConfigFile"),
  writeConfigFile: (content: string) => ipcRenderer.invoke("storage:writeConfigFile", content),
  readInstanceFile: (filename: string) => ipcRenderer.invoke("storage:readInstanceFile", filename),
  writeInstanceFile: (filename: string, content: string) =>
    ipcRenderer.invoke("storage:writeInstanceFile", filename, content),
  deleteInstanceFile: (filename: string) => ipcRenderer.invoke("storage:deleteInstanceFile", filename),
  onConfigChanged: (callback: () => void) => {
    ipcRenderer.on("storage:configChanged", () => callback())
    return () => ipcRenderer.removeAllListeners("storage:configChanged")
  },
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
