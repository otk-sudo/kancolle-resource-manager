// 艦これ API レスポンス型定義
// svdata= を除去した後の JSON 構造

export interface KcsApiResponse<T> {
  api_result: number        // 1 = 成功
  api_result_msg: string
  api_data: T
}

// ──────────────────────────────────────────────
// api_get_member/material — 資源
// ──────────────────────────────────────────────

export interface KcsMaterialItem {
  api_id:    number  // 1:燃料 2:弾薬 3:鋼材 4:ボーキ 5:高速修復 6:高速建造 7:開発資材 8:改修資材
  api_value: number
}

export type KcsMaterial = KcsMaterialItem[]

export const KC_MATERIAL_ID = {
  fuel:          1,
  ammo:          2,
  steel:         3,
  baux:          4,
  instantRepair: 5,
  instantBuild:  6,
  devMaterial:   7,
  improveMaterial: 8,
} as const

// ──────────────────────────────────────────────
// api_port/port — 入渠・資源（まとめて取得）
// ──────────────────────────────────────────────

export interface KcsPortData {
  api_material: KcsMaterialItem[]
  // 他フィールドは今後必要に応じて追加
}

// ──────────────────────────────────────────────
// api_get_member/questlist — 任務
// ──────────────────────────────────────────────

export type KcsQuestState = 1 | 2 | 3  // 1:未受諾 2:遂行中 3:達成
export type KcsQuestType  = 1 | 2 | 3 | 4 | 5  // 1:デイリー 2:ウィークリー 3:マンスリー 4:ワンタイム 5:その他

export interface KcsQuest {
  api_no:           number
  api_type:         KcsQuestType
  api_state:        KcsQuestState
  api_title:        string
  api_detail:       string
  api_get_material: number[]  // [燃料, 弾薬, 鋼材, ボーキ]
  api_bonus_flag:   number
}

export interface KcsQuestList {
  api_count:        number
  api_exec_count:   number
  api_quest_list:   KcsQuest[] | null
}
