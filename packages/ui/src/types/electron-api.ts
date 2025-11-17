export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  createInstance: (
    id: string,
    folder: string,
    binaryPath?: string,
    environmentVariables?: Record<string, string>,
  ) => Promise<{ id: string; port: number; pid: number; binaryPath: string }>
  stopInstance: (pid: number) => Promise<void>
  onInstanceStarted: (callback: (data: { id: string; port: number; pid: number; binaryPath: string }) => void) => void
  onInstanceError: (callback: (data: { id: string; error: string }) => void) => void
  onInstanceStopped: (callback: (data: { id: string }) => void) => void
  onInstanceLog: (
    callback: (data: {
      id: string
      entry: { timestamp: number; level: "info" | "error" | "warn" | "debug"; message: string }
    }) => void,
  ) => void
  onNewInstance: (callback: () => void) => void
  scanDirectory: (workspaceFolder: string) => Promise<string[]>
  selectOpenCodeBinary: () => Promise<string | null>
  validateOpenCodeBinary: (path: string) => Promise<{ valid: boolean; version?: string; error?: string }>
  getConfigPath: () => Promise<string>
  getInstancesDir: () => Promise<string>
  readConfigFile: () => Promise<string>
  writeConfigFile: (content: string) => Promise<void>
  readInstanceFile: (instanceId: string) => Promise<string>
  writeInstanceFile: (instanceId: string, content: string) => Promise<void>
  deleteInstanceFile: (instanceId: string) => Promise<void>
  onConfigChanged: (callback: () => void) => () => void
}
