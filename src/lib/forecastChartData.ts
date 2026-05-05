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
  /** 実績値キー: `{resourceId}` / 予測値キー: `{resourceId}_f` */
  [key: string]: number | string | null
}

interface BuildChartDataInput {
  history: ResourceHistoryRecord[]
  resources: ChartResource[]
  days: number
  today: Date
}

/**
 * 履歴データと予測データをRecharts用の配列に変換する。
 * 各資材の値は目標比 % (0〜100) で正規化する。
 *
 * 予測データ点の間引きルール（描画負荷を抑えるため）:
 * - 30日以内: 毎日
 * - 31〜90日: 30日超の部分を3日刻み
 * - 91日以上: 30日超の部分を7日刻み
 */
export function buildChartData({ history, resources, days, today }: BuildChartDataInput): ChartDataPoint[] {
  // historyはstoreでソート済みのためそのまま末尾N件を使用
  const slice = history.slice(-days)

  // 履歴ポイント: 各日の資材値を目標比%に変換
  const histPoints: ChartDataPoint[] = slice.map(record => {
    const point: ChartDataPoint = { date: record.date, type: 'history' }
    for (const res of resources) {
      const raw = record[res.id] as number
      point[res.id] = Math.min(100, Math.round((raw / res.target) * 100))
    }
    return point
  })

  // 全資材の予測計算を1パスで実行し、最大到達日数も同時に算出
  let maxDays = 0
  let anyReachable = false

  const forecasts = resources.map(res => {
    const dailyAvg = calcDailyAvg(history, res.id, days)
    const current  = slice.length > 0 ? (slice[slice.length - 1][res.id] as number) : 0
    const result   = calcForecast({ current, target: res.target, dailyAvg, fromDate: today })

    if (result.reachable && (result.daysLeft ?? 0) > 0) {
      anyReachable = true
      if (result.daysLeft !== null && result.daysLeft > maxDays) {
        maxDays = result.daysLeft
      }
    }

    return { res, dailyAvg, current, result }
  })

  if (!anyReachable) return histPoints

  // 境界点（今日）: 実績線と予測線をつなぐため両方に値をセット
  const lastHistPoint = histPoints[histPoints.length - 1]
  if (lastHistPoint) {
    for (const res of resources) {
      lastHistPoint[`${res.id}_f`] = lastHistPoint[res.id] ?? null
    }
  }

  // 予測ポイントを生成（間引きルールに従う）
  const forecastPoints: ChartDataPoint[] = []

  for (let d = 1; d <= maxDays; d++) {
    // 間引き判定（最終日は必ず含める）
    if (d !== maxDays) {
      if (maxDays > 90 && d > 30 && d % 7 !== 0) continue
      if (maxDays > 30 && maxDays <= 90 && d > 30 && d % 3 !== 0) continue
    }

    const date = new Date(today)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)

    const point: ChartDataPoint = { date: dateStr, type: 'forecast' }
    for (const { res, dailyAvg, current, result } of forecasts) {
      point[res.id] = null  // 実績キーはnull（実線と破線を分離）
      if (!result.reachable) {
        // 到達不可の場合は現在値を水平に表示
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
