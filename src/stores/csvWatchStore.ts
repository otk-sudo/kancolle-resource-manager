import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import type { CsvFormat } from '../lib/csvImport'

export interface CsvTarget {
  path:   string
  format: CsvFormat
  label:  string  // 表示用ファイル名
}

interface CsvWatchStore {
  targets:      CsvTarget[]
  watching:     boolean
  lastImportAt: string | null  // ISO文字列

  addTarget:    (target: CsvTarget) => void
  removeTarget: (path: string) => void
  setWatching:  (v: boolean) => void
  setLastImportAt: (iso: string) => void

  startWatch:   () => Promise<void>
  stopWatch:    () => Promise<void>
}

export const useCsvWatchStore = create<CsvWatchStore>()(
  persist(
    (set, get) => ({
      targets:      [],
      watching:     false,
      lastImportAt: null,

      addTarget: (target) =>
        set(state => ({
          targets: state.targets.some(t => t.path === target.path)
            ? state.targets
            : [...state.targets, target],
        })),

      removeTarget: (path) =>
        set(state => ({ targets: state.targets.filter(t => t.path !== path) })),

      setWatching: (v) => set({ watching: v }),

      setLastImportAt: (iso) => set({ lastImportAt: iso }),

      startWatch: async () => {
        const { targets } = get()
        if (targets.length === 0) return
        await invoke('start_watch', {
          targets: targets.map(t => ({ path: t.path, format: t.format })),
        })
        set({ watching: true })
      },

      stopWatch: async () => {
        await invoke('stop_watch')
        set({ watching: false })
      },
    }),
    {
      name: 'csv-watch-config',
      partialize: (s) => ({ targets: s.targets }),
    }
  )
)
