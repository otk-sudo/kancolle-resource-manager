/** 曜日（0=日曜 〜 6=土曜） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 1回の改修に消費する資材 */
export interface ImprovementCost {
  fuel: number
  ammo: number
  steel: number
  baux: number
  devMaterial: number     // 開発資材
  improveMaterial: number // 改修資材
  /** 補助艦として消費する装備（消費数） */
  subEquip?: { equipId: number; equipName: string; count: number }
}

/** 秘書艦情報 */
export interface SecretaryShip {
  shipId: number
  shipName: string
}

/** 改修更新先 */
export interface UpgradeTo {
  equipId: number
  equipName: string
  /** 対象装備の消費数 */
  consumeCount: number
}

/** 改修可能な装備のマスタデータ */
export interface ImprovableEquipment {
  equipId: number
  equipName: string
  equipType: number
  /** ★0→1, ★1→2, ..., ★9→10 の順に10要素 */
  costs: ImprovementCost[]
  /** 曜日ごとに使える秘書艦（曜日0〜6、未定義の曜日は改修不可） */
  secretaryByDay: Partial<Record<Weekday, SecretaryShip[]>>
  /** 改修更新先（★maxで更新できる場合） */
  upgradeTo?: UpgradeTo
}

/** 改修マスタデータ全体 */
export interface ImprovementMasterData {
  /** 艦これゲームバージョン（キャッシュ無効化に使用） */
  gameVersion: string
  /** データ取得日時（ISO8601） */
  fetchedAt: string
  equipments: ImprovableEquipment[]
}

// ─── ユーザープラン ───────────────────────────────────────────

/** 優先度 */
export type Priority = 'high' | 'medium' | 'low'

/** チェーン内の1装備の進捗 */
export interface ChainStep {
  equipId: number
  equipName: string
  /** 目標★（1〜10） */
  targetStar: number
  /** 現在★（0〜10） */
  currentStar: number
}

/** 改修チェーンプラン（ユーザーが登録するもの） */
export interface ImprovementPlan {
  id: string
  /** チェーン内の各装備（順番に改修 → 更新する） */
  steps: ChainStep[]
  priority: Priority
  /** 期限（ISO8601, 任意） */
  deadline?: string
  /** アーカイブ済みか */
  archived: boolean
  /** 登録日時（ISO8601） */
  createdAt: string
  /** ドラッグ&ドロップ用の表示順 */
  order: number
}
