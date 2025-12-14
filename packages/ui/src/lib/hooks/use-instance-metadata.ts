import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js"
import type { Instance, RawMcpStatus } from "../../types/instance"
import { fetchLspStatus, updateInstance } from "../../stores/instances"
import { getLogger } from "../../lib/logger"

const log = getLogger("session")
const pendingMetadataRequests = new Set<string>()

export function useInstanceMetadata(instanceAccessor: Accessor<Instance | undefined>) {
  const [isLoading, setIsLoading] = createSignal(true)

  createEffect(() => {
    const instance = instanceAccessor()
    if (!instance) {
      setIsLoading(false)
      return
    }

    const instanceId = instance.id
    const client = instance.client
    const hasMetadata = Boolean(instance.metadata)

    if (!client) {
      setIsLoading(false)
      pendingMetadataRequests.delete(instanceId)
      return
    }

    if (hasMetadata) {
      setIsLoading(false)
      pendingMetadataRequests.delete(instanceId)
      return
    }

    if (pendingMetadataRequests.has(instanceId)) {
      setIsLoading(true)
      return
    }

    let cancelled = false
    pendingMetadataRequests.add(instanceId)
    setIsLoading(true)

    void (async () => {
      try {
        const [projectResult, mcpResult, lspResult] = await Promise.allSettled([
          client.project.current(),
          client.mcp.status(),
          fetchLspStatus(instanceId),
        ])

        if (cancelled) {
          return
        }

        const project = projectResult.status === "fulfilled" ? projectResult.value.data : undefined
        const mcpStatus = mcpResult.status === "fulfilled" ? (mcpResult.value.data as RawMcpStatus) : undefined
        const lspStatus = lspResult.status === "fulfilled" ? lspResult.value ?? [] : undefined

        const nextMetadata: Instance["metadata"] = {
          ...(instance.metadata ?? {}),
          ...(project ? { project } : {}),
          ...(mcpStatus ? { mcpStatus } : {}),
          ...(lspStatus ? { lspStatus } : {}),
        }

        if (!nextMetadata?.version && instance.binaryVersion) {
          nextMetadata.version = instance.binaryVersion
        }

        updateInstance(instanceId, { metadata: nextMetadata })
      } catch (error) {
        if (!cancelled) {
          log.error("Failed to load instance metadata", error)
        }
      } finally {
        pendingMetadataRequests.delete(instanceId)
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    onCleanup(() => {
      cancelled = true
    })
  })

  return {
    isLoading,
  }
}
