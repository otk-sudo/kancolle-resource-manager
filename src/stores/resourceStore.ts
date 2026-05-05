import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BasicResource,
  BasicResourceId,
  SpecialResource,
  SpecialResourceId,
  ResourceHistoryRecord,
} from '../types/resource'

/** ストアの状態 */
interface ResourceState {
  basicResources: BasicResource[]
  specialResources: SpecialResource[]
  history: ResourceHistoryRecord[]

  // アクション
  setBasicResource: (id: BasicResourceId, value: number) => void
  setSpecialResource: (id: SpecialResourceId, value: number) => void
  addHistoryRecord: (record: ResourceHistoryRecord) => void
  /** CSVインポート: 既存履歴とマージ（同日はnewRecords側で上書き） */
  importHistory: (newRecords: ResourceHistoryRecord[]) => void
}

/** 基本資材の初期値 */
const initialBasicResources: BasicResource[] = [
  { id: 'fuel',  name: '燃料',        value: 0, cap: 350000 },
  { id: 'ammo',  name: '弾薬',        value: 0, cap: 350000 },
  { id: 'steel', name: '鋼材',        value: 0, cap: 350000 },
  { id: 'baux',  name: 'ボーキサイト', value: 0, cap: 350000 },
]

/** 特殊資材の初期値 */
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
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      ...initialState,

      /** 基本資材の値を更新する */
      setBasicResource: (id, value) =>
        set(state => ({
          basicResources: state.basicResources.map(r =>
            r.id === id ? { ...r, value } : r
          ),
        })),

      /** 特殊資材の値を更新する */
      setSpecialResource: (id, value) =>
        set(state => ({
          specialResources: state.specialResources.map(r =>
            r.id === id ? { ...r, value } : r
          ),
        })),

      /** 資材履歴レコードを追加する */
      addHistoryRecord: (record) =>
        set(state => ({
          history: [...state.history, record],
        })),

      /** CSVインポート: 既存履歴とマージ（同日はnewRecords側で上書き） */
      importHistory: (newRecords) =>
        set(state => {
          const merged = new Map<string, ResourceHistoryRecord>()
          for (const r of state.history) merged.set(r.date, r)
          for (const r of newRecords)    merged.set(r.date, r)
          return {
            history: Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date)),
          }
        }),
    }),
    {
      name: 'resource-store',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // v1→v2: 特殊資材を4種に絞り込む
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

// テスト用に初期状態を取得する関数
useResourceStore.getInitialState = () => ({
  ...initialState,
  setBasicResource:  useResourceStore.getState().setBasicResource,
  setSpecialResource: useResourceStore.getState().setSpecialResource,
  addHistoryRecord:  useResourceStore.getState().addHistoryRecord,
  importHistory:     useResourceStore.getState().importHistory,
})
