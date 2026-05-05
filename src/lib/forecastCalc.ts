import type { ResourceHistoryRecord } from '../types/resource'

/** ResourceHistoryRecord で追跡している資材IDのみ */
export type HistoryResourceId = Exclude<keyof ResourceHistoryRecord, 'date'>

/**
 * 直近N件のヒストリーから指定資材の1日あたり平均増減を計算する。
 * レコードが1件以下の場合は 0 を返す。
 */
export function calcDailyAvg(
  history: ResourceHistoryRecord[],
  resourceId: HistoryResourceId,
  days: number,
): number {
  // historyはstoreでソート済みのためそのまま使用
  const slice = history.slice(-days)
  if (slice.length < 2) return 0

  const first = slice[0]
  const last  = slice[slice.length - 1]
  const diff  = (last[resourceId] as number) - (first[resourceId] as number)

  // 日数差（文字列YYYY-MM-DDで計算）
  const daysDiff =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000

  if (daysDiff === 0) return 0
  return diff / daysDiff
}

// ─── calcForecast ─────────────────────────────────────────────

export interface ForecastInput {
  current:  number
  target:   number
  dailyAvg: number
  fromDate: Date
}

export interface ForecastResult {
  reachable:  boolean
  daysLeft:   number | null
  reachDate:  Date | null
}

/**
 * 現在値・目標値・1日平均増減から到達予測を計算する。
 */
export function calcForecast({ current, target, dailyAvg, fromDate }: ForecastInput): ForecastResult {
  const unreachable: ForecastResult = { reachable: false, daysLeft: null, reachDate: null }

  if (dailyAvg <= 0) return unreachable

  const remaining = target - current
  if (remaining <= 0) {
    return { reachable: true, daysLeft: 0, reachDate: new Date(fromDate) }
  }

  const daysLeft = Math.ceil(remaining / dailyAvg)
  const reachDate = new Date(fromDate)
  reachDate.setDate(reachDate.getDate() + daysLeft)

  return { reachable: true, daysLeft, reachDate }
}
