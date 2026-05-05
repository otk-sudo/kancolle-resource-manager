import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useResourceStore } from '../stores/resourceStore'
import { useMissionStore } from '../stores/missionStore'
import type {
  KcsApiResponse,
  KcsMaterial,
  KcsPortData,
  KcsQuestList,
  KcsQuestType,
} from '../types/kcsapi'
import { KC_MATERIAL_ID } from '../types/kcsapi'
import type { Mission, MissionType } from '../types/mission'

// KC_MATERIAL_ID の逆引きマップ
const MATERIAL_ID_TO_STORE: Record<number, { kind: 'basic' | 'special'; id: string }> = {
  [KC_MATERIAL_ID.fuel]:           { kind: 'basic',   id: 'fuel' },
  [KC_MATERIAL_ID.ammo]:           { kind: 'basic',   id: 'ammo' },
  [KC_MATERIAL_ID.steel]:          { kind: 'basic',   id: 'steel' },
  [KC_MATERIAL_ID.baux]:           { kind: 'basic',   id: 'baux' },
  [KC_MATERIAL_ID.instantRepair]:  { kind: 'special', id: 'instantRepair' },
  [KC_MATERIAL_ID.instantBuild]:   { kind: 'special', id: 'instantBuild' },
  [KC_MATERIAL_ID.devMaterial]:    { kind: 'special', id: 'devMaterial' },
  [KC_MATERIAL_ID.improveMaterial]:{ kind: 'special', id: 'improveMaterial' },
}

// KcsQuestType → MissionType 変換（4=ワンタイム・5=その他 は daily 扱い）
const QUEST_TYPE_MAP: Record<KcsQuestType, MissionType> = {
  1: 'daily',
  2: 'weekly',
  3: 'monthly',
  4: 'daily',
  5: 'daily',
}

function applyMaterial(items: KcsMaterial) {
  const { setBasicResource, setSpecialResource } = useResourceStore.getState()
  for (const item of items) {
    const mapping = MATERIAL_ID_TO_STORE[item.api_id]
    if (!mapping) continue
    if (mapping.kind === 'basic') {
      setBasicResource(mapping.id as any, item.api_value)
    } else {
      setSpecialResource(mapping.id as any, item.api_value)
    }
  }
}

export function useKcsapiListener() {
  useEffect(() => {
    const unlisteners: (() => void)[] = []

    // 資源データ
    listen<KcsApiResponse<KcsMaterial>>('kcsapi-material', ({ payload }) => {
      if (payload.api_result !== 1 || !payload.api_data) return
      applyMaterial(payload.api_data)
    }).then(fn => unlisteners.push(fn))

    // 入渠画面（資源も含む）
    listen<KcsApiResponse<KcsPortData>>('kcsapi-port', ({ payload }) => {
      if (payload.api_result !== 1 || !payload.api_data?.api_material) return
      applyMaterial(payload.api_data.api_material)
    }).then(fn => unlisteners.push(fn))

    // 任務リスト
    listen<KcsApiResponse<KcsQuestList>>('kcsapi-questlist', ({ payload }) => {
      if (payload.api_result !== 1 || !payload.api_data?.api_quest_list) return

      const quests = payload.api_data.api_quest_list
      if (!quests) return

      const missions: Mission[] = quests.map(q => ({
        id:   String(q.api_no),
        name: q.api_title,
        type: QUEST_TYPE_MAP[q.api_type as KcsQuestType] ?? 'daily',
        reward: {
          fuel:  q.api_get_material[0] ?? 0,
          ammo:  q.api_get_material[1] ?? 0,
          steel: q.api_get_material[2] ?? 0,
          baux:  q.api_get_material[3] ?? 0,
        },
      }))

      const { setMissions } = useMissionStore.getState()
      setMissions(missions)

      // state=3 (達成済み) をチェック済みにマーク
      for (const q of quests) {
        if (q.api_state === 3) {
          const { completions } = useMissionStore.getState()
          if (!completions[String(q.api_no)]?.completed) {
            useMissionStore.getState().toggleCompletion(String(q.api_no))
          }
        }
      }
    }).then(fn => unlisteners.push(fn))

    return () => unlisteners.forEach(fn => fn())
  }, [])
}
