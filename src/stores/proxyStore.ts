import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'

export interface ProxyConfig {
  port:          number
  upstream_host: string | null
  upstream_port: number | null
}

interface ProxyStatus {
  running:       boolean
  port:          number
  upstream_host: string | null
  upstream_port: number | null
}

interface ProxyStore {
  config:  ProxyConfig
  running: boolean

  setConfig: (config: Partial<ProxyConfig>) => void
  startProxy: () => Promise<void>
  stopProxy:  () => Promise<void>
  refreshStatus: () => Promise<void>
  installCaCert: () => Promise<void>
}

export const useProxyStore = create<ProxyStore>()(
  persist(
    (set, get) => ({
      config: {
        port:          8087,
        upstream_host: null,
        upstream_port: null,
      },
      running: false,

      setConfig: (partial) =>
        set(state => ({ config: { ...state.config, ...partial } })),

      startProxy: async () => {
        await invoke('start_proxy', { config: get().config })
        set({ running: true })
      },

      stopProxy: async () => {
        await invoke('stop_proxy')
        set({ running: false })
      },

      refreshStatus: async () => {
        const status = await invoke<ProxyStatus>('get_proxy_status')
        set({ running: status.running })
      },

      installCaCert: async () => {
        await invoke('install_ca_cert')
      },
    }),
    {
      name: 'proxy-config',
      partialize: (state) => ({ config: state.config }),
    }
  )
)
