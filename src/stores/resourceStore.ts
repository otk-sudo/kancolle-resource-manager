import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BasicResource,
  BasicResourceId,
  SpecialResource,
  SpecialResourceId,
  ResourceHistoryRecord,
} from '../types/resource'

interface ResourceState {
  basicResources: BasicResource[]
  specialResources: SpecialResource[]
  history: ResourceHistoryRecord[]
  /** 履歴が更新されるたびにインクリメントされるバージョン番号 */
  historyVersion: number

  setBasicResource: (id: BasicResourceId, value: number) => void
  setSpecialResource: (id: SpecialResourceId, value: number) => void
  /** CSVインポート: 既存履歴とマージ（同日はnewRecords側で上書き・日付順ソート済み） */
  importHistory: (newRecords: ResourceHistoryRecord[]) => void
}

const initialBasicResources: BasicResource[] = [
  { id: 'fuel',  name: '燃料',        value: 0, cap: 350000 },
  { id: 'ammo',  name: '弾薬',        value: 0, cap: 350000 },
  { id: 'steel', name: '鋼材',        value: 0, cap: 350000 },
  { id: 'baux',  name: 'ボーキサイト', value: 0, cap: 350000 },
]

const initialSpecialResources: SpecialResource[] = [
  { id: 'instantRepair',   name: '高速修復材', value: 0, cap: 3000 },
  { id: 'instantBuild',    name: '高速建造材', value: 0, cap: 3000 },
  { id: 'devMaterial',     name: '開発資材',   value: 0, cap: 3000 },
  { id: 'improveMaterial', name: '改修資材',   value: 0, cap: 3000 },
]

const initialState = {
  basicResources: initialBasicResources,
  specialResources: initialSpecialResources,
  history: [] as ResourceHistoryRecord[],
  historyVersion: 0,
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      ...initialState,

      setBasicResource: (id, value) =>
        set(state => ({
          basicResources: state.basicResources.map(r =>
            r.id === id ? { ...r, value } : r
          ),
        })),

      setSpecialResource: (id, value) =>
        set(state => ({
          specialResources: state.specialResources.map(r =>
            r.id === id ? { ...r, value } : r
          ),
        })),

      importHistory: (newRecords) =>
        set(state => {
          const merged = new Map<string, ResourceHistoryRecord>()
          for (const r of state.history) merged.set(r.date, r)
          for (const r of newRecords)    merged.set(r.date, r)
          return {
            history: Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date)),
            historyVersion: state.historyVersion + 1,
          }
        }),
    }),
    {
      name: 'resource-store',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // v1→v2: 特殊資材を現行の4種に絞り込む
          const validIds = ['instantRepair', 'instantBuild', 'devMaterial', 'improveMaterial']
          persisted.specialResources = (persisted.specialResources ?? [])
            .filter((r: any) => validIds.includes(r.id))
          if (persisted.specialResources.length === 0) {
            persisted.specialResources = initialSpecialResources
          }
        }
        return persisted
      },
    }
  )
)
