/** 基本4資材のID */
export type BasicResourceId = 'fuel' | 'ammo' | 'steel' | 'baux'

/** 主要消耗資材のID */
export type SpecialResourceId =
  | 'instantRepair'
  | 'instantBuild'
  | 'devMaterial'
  | 'improveMaterial'
  | 'newAviation'
  | 'newArmament'
  | 'newGunEquip'
  | 'overseasTech'
  | 'factoryMaterial'
  | 'skilledPilot'
  | 'nightSkilledPilot'
  | 'catapult'
  | 'report'
  | 'combatReport'
  | 'medal'

/** 全資材のID */
export type ResourceId = BasicResourceId | SpecialResourceId

/** 基本資材（上限・割合バーあり） */
export interface BasicResource {
  id: BasicResourceId
  name: string
  value: number
  /** 備蓄上限 */
  cap: number
}

/** 特殊資材（個数管理のみ） */
export interface SpecialResource {
  id: SpecialResourceId
  name: string
  value: number
  /** 上限あり資材（修復材・建造材・開発資材・改修資材）はcapを持つ */
  cap?: number
}

/** 資材の1日分の履歴レコード */
export interface ResourceHistoryRecord {
  date: string // YYYY-MM-DD
  fuel: number
  ammo: number
  steel: number
  baux: number
  instantRepair: number
  instantBuild: number
  devMaterial: number
  improveMaterial: number
}
