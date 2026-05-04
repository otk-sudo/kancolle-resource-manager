import { calcDailyAvg, calcForecast, type HistoryResourceId } from './forecastCalc'
import type { ResourceHistoryRecord } from '../types/resource'

export interface ChartResource {
  id: HistoryResourceId
  label: string
  target: number
}

export interface ChartDataPoint {
  date: string
  type: 'history' | 'forecast'
  /** 実績値キー: `{resourceId}` */
  [key: string]: number | string | null
}

interface BuildChartDataInput {
  history: ResourceHistoryRecord[]
  resources: ChartResource[]
  days: number
  today: Date
}

/**
 * 履歴データと予測データをRecharts用のデータ配列に変換する。
 * 各資材の値は目標比 % (0〜100) で正規化する。
 */
export function buildChartData({ history, resources, days, today }: BuildChartDataInput): ChartDataPoint[] {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const slice  = sorted.slice(-days)

  // ── 履歴ポイント ──────────────────────────────────────────
  const histPoints: ChartDataPoint[] = slice.map(record => {
    const point: ChartDataPoint = { date: record.date, type: 'history' }
    for (const res of resources) {
      const raw = record[res.id] as number
      point[res.id] = Math.min(100, Math.round((raw / res.target) * 100))
    }
    return point
  })

  // ── 予測ポイント ─────────────────────────────────────────
  const forecastPoints: ChartDataPoint[] = []

  // 全資材が到達不可なら予測ポイントなし
  const forecasts = resources.map(res => {
    const dailyAvg = calcDailyAvg(history, res.id, days)
    const current  = slice.length > 0 ? (slice[slice.length - 1][res.id] as number) : 0
    const result   = calcForecast({ current, target: res.target, dailyAvg, fromDate: today })
    return { res, dailyAvg, current, result }
  })

  const anyReachable = forecasts.some(f => f.result.reachable && (f.result.daysLeft ?? 0) > 0)
  if (!anyReachable) return histPoints

  // 最大到達日数（グラフの終端）
  const maxDays = Math.max(
    ...forecasts
      .filter(f => f.result.reachable && f.result.daysLeft !== null)
      .map(f => f.result.daysLeft as number),
    0,
  )

  // 境界点（今日）: 実績・予測の両方に値をセットして線を繋ぐ
  const lastHistPoint = histPoints[histPoints.length - 1]
  if (lastHistPoint) {
    for (const res of resources) {
      // _f キーに今日の値をセット（予測線の始点）
      lastHistPoint[`${res.id}_f`] = lastHistPoint[res.id] ?? null
    }
  }

  // 今日〜最大到達日まで1日ごとのポイントを生成
  for (let d = 1; d <= maxDays; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)

    const point: ChartDataPoint = { date: dateStr, type: 'forecast' }
    for (const { res, dailyAvg, current, result } of forecasts) {
      // 実績キーは null（破線と実線を分離）
      point[res.id] = null
      if (!result.reachable) {
        point[`${res.id}_f`] = Math.min(100, Math.round((current / res.target) * 100))
      } else {
        const projected = current + dailyAvg * d
        point[`${res.id}_f`] = Math.min(100, Math.round((projected / res.target) * 100))
      }
    }
    forecastPoints.push(point)
  }

  return [...histPoints, ...forecastPoints]
}
