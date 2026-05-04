/** 任務の種別 */
export type MissionType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/** 任務の報酬 */
export interface MissionReward {
  fuel?: number
  ammo?: number
  steel?: number
  baux?: number
  improveMaterial?: number  // 改修資材
  devMaterial?: number      // 開発資材
  instantRepair?: number    // 高速修復材
  instantBuild?: number     // 高速建造材
  medal?: number            // 勲章
  smallFurnitureBox?: number  // 家具箱（小）
  mediumFurnitureBox?: number // 家具箱（中）
  largeFurnitureBox?: number  // 家具箱（大）
  blueprintSupply?: number    // 新型砲熕兵装資材
  actionReport?: number       // 戦闘詳報
  firstClassMedal?: number    // 一等航海士
}

/** 任務マスタデータ */
export interface Mission {
  id: string          // 任務ID（例: "B1"）
  name: string        // 任務名
  type: MissionType
  reward: MissionReward
}

/** 任務マスタデータ全体 */
export interface MissionMasterData {
  /** データ取得日時（ISO8601） */
  fetchedAt: string
  missions: Mission[]
}

/** 達成状況（ユーザーデータ） */
export interface MissionCompletion {
  missionId: string
  completed: boolean
  /** 最後にチェックした日時（ISO8601） */
  checkedAt: string
}

/** リセット基準時刻（JST 05:00） */
export const RESET_HOUR_JST = 5
