import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ImprovementPlan, Priority, ChainStep } from '../types/improvement'

interface AddPlanInput {
  steps: ChainStep[]
  priority: Priority
  deadline: string | undefined
}

interface ImprovementState {
  plans: ImprovementPlan[]

  // アクション
  addPlan: (input: AddPlanInput) => void
  updatePlan: (id: string, patch: Partial<Omit<ImprovementPlan, 'id' | 'createdAt'>>) => void
  archivePlan: (id: string) => void
  /** ids の順番通りに order を振り直す */
  reorderPlans: (ids: string[]) => void

  // セレクタ
  activePlans: () => ImprovementPlan[]
  archivedPlans: () => ImprovementPlan[]
}

export function getInitialImprovementState(): Pick<ImprovementState, 'plans'> {
  return { plans: [] }
}

export const useImprovementStore = create<ImprovementState>()(
  persist(
    (set, get) => ({
      plans: [],

      addPlan: (input) => {
        const now = new Date().toISOString()
        const newPlan: ImprovementPlan = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          steps: input.steps,
          priority: input.priority,
          deadline: input.deadline,
          archived: false,
          createdAt: now,
          order: get().plans.length,
        }
        set(state => ({ plans: [...state.plans, newPlan] }))
      },

      updatePlan: (id, patch) => {
        set(state => ({
          plans: state.plans.map(p => p.id === id ? { ...p, ...patch } : p),
        }))
      },

      archivePlan: (id) => {
        set(state => ({
          plans: state.plans.map(p => p.id === id ? { ...p, archived: true } : p),
        }))
      },

      reorderPlans: (ids) => {
        set(state => ({
          plans: state.plans.map(p => {
            const idx = ids.indexOf(p.id)
            return idx === -1 ? p : { ...p, order: idx }
          }),
        }))
      },

      activePlans: () => get().plans.filter(p => !p.archived).sort((a, b) => a.order - b.order),
      archivedPlans: () => get().plans.filter(p => p.archived),
    }),
    { name: 'improvement-store' },
  ),
)
