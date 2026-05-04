import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Mission, MissionType, MissionCompletion } from '../types/mission'
import { shouldReset } from '../lib/missionReset'

interface MissionState {
  missions:    Mission[]
  completions: Record<string, MissionCompletion>

  // アクション
  setMissions:      (missions: Mission[]) => void
  toggleCompletion: (missionId: string) => void
  resetIfNeeded:    (now?: Date) => void

  // セレクタ
  getMissionsForType: (type: MissionType) => Mission[]
}

export function getInitialMissionState(): Pick<MissionState, 'missions' | 'completions'> {
  return { missions: [], completions: {} }
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      missions:    [],
      completions: {},

      setMissions: (missions) => set({ missions }),

      toggleCompletion: (missionId) => {
        const prev = get().completions[missionId]
        const completed = prev ? !prev.completed : true
        set(state => ({
          completions: {
            ...state.completions,
            [missionId]: { missionId, completed, checkedAt: new Date().toISOString() },
          },
        }))
      },

      resetIfNeeded: (now = new Date()) => {
        const { missions, completions } = get()
        const updated = { ...completions }
        let changed = false

        for (const mission of missions) {
          const comp = updated[mission.id]
          if (!comp?.completed) continue
          const checkedAt = new Date(comp.checkedAt)
          if (shouldReset(mission.type, checkedAt, now)) {
            updated[mission.id] = { ...comp, completed: false }
            changed = true
          }
        }
        if (changed) set({ completions: updated })
      },

      getMissionsForType: (type) => {
        const { missions, completions } = get()
        const filtered = missions.filter(m => m.type === type)
        return filtered.sort((a, b) => {
          const aCompleted = completions[a.id]?.completed ? 1 : 0
          const bCompleted = completions[b.id]?.completed ? 1 : 0
          return aCompleted - bCompleted
        })
      },
    }),
    { name: 'mission-store' },
  ),
)
