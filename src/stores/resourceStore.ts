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
  { id: 'instantRepair',    name: '高速修復材',      value: 0, cap: 3000 },
  { id: 'instantBuild',     name: '高速建造材',      value: 0, cap: 3000 },
  { id: 'devMaterial',      name: '開発資材',        value: 0, cap: 3000 },
  { id: 'improveMaterial',  name: '改修資材',        value: 0, cap: 3000 },
  { id: 'newAviation',      name: '新型航空兵装資材', value: 0 },
  { id: 'newArmament',      name: '新型兵装資材',    value: 0 },
  { id: 'newGunEquip',      name: '新型砲熕兵装資材', value: 0 },
  { id: 'overseasTech',     name: '海外最新技術',    value: 0 },
  { id: 'factoryMaterial',  name: '工廠資材',        value: 0 },
  { id: 'skilledPilot',     name: '熟練搭乗員',      value: 0 },
  { id: 'nightSkilledPilot', name: '夜間熟練搭乗員',  value: 0 },
  { id: 'catapult',         name: 'カタパルト',      value: 0 },
  { id: 'report',           name: '詳報',            value: 0 },
  { id: 'combatReport',     name: '戦闘詳報',        value: 0 },
  { id: 'medal',            name: '勲章',            value: 0 },
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
    }),
    {
      name: 'resource-store',
    }
  )
)

// テスト用に初期状態を取得する関数
useResourceStore.getInitialState = () => ({
  ...initialState,
  setBasicResource: useResourceStore.getState().setBasicResource,
  setSpecialResource: useResourceStore.getState().setSpecialResource,
  addHistoryRecord: useResourceStore.getState().addHistoryRecord,
})
