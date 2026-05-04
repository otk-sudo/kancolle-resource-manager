import type { ImprovementMasterData, ImprovableEquipment, Weekday } from '../types/improvement'

/**
 * キャッシュ済みデータが更新を必要とするか判定する。
 * - キャッシュがない場合は true
 * - ゲームバージョンが変わっていた場合は true
 */
export function needsUpdate(
  cached: ImprovementMasterData | null,
  currentGameVersion: string,
): boolean {
  if (cached === null) return true
  return cached.gameVersion !== currentGameVersion
}

// ─── パーサー ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawData = Record<string, any>

/**
 * 外部から取得した生JSONをImprovementMasterDataに変換する。
 */
export function parseImprovementData(
  raw: RawData,
  gameVersion: string,
): ImprovementMasterData {
  const equipments: ImprovableEquipment[] = (raw.equipments as RawData[]).map(eq => {
    // 秘書艦データの変換
    const secretaryByDay: ImprovableEquipment['secretaryByDay'] = {}
    if (eq.secretaryByDay) {
      for (const [day, ships] of Object.entries(eq.secretaryByDay)) {
        const weekday = Number(day) as Weekday
        secretaryByDay[weekday] = (ships as RawData[]).map(s => ({
          shipId: s.shipId as number,
          shipName: s.shipName as string,
        }))
      }
    }

    // 改修更新先
    const upgradeTo = eq.upgradeTo
      ? {
          equipId: eq.upgradeTo.equipId as number,
          equipName: eq.upgradeTo.equipName as string,
          consumeCount: eq.upgradeTo.consumeCount as number,
        }
      : undefined

    return {
      equipId: eq.id as number,
      equipName: eq.name as string,
      equipType: eq.type as number,
      costs: eq.costs,
      secretaryByDay,
      upgradeTo,
    }
  })

  return {
    gameVersion,
    fetchedAt: new Date().toISOString(),
    equipments,
  }
}

// ─── 艦これゲームバージョン取得 ───────────────────────────────

/** 艦これのゲームバージョンを取得する（失敗時は空文字を返す） */
export async function fetchGameVersion(): Promise<string> {
  try {
    const res = await fetch('http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/')
    if (!res.ok) return ''
    const text = await res.text()
    // バージョン文字列をHTMLから抽出
    const match = text.match(/kcs2\/version\.json\?(\d+)/)
    return match ? match[1] : ''
  } catch {
    return ''
  }
}
