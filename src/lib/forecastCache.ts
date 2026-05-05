import type { ChartDataPoint, ChartResource } from './forecastChartData'
import type { ForecastResult } from './forecastCalc'
import type { HistoryResourceId } from './forecastCalc'

/** ForecastCard用の計算結果 */
export interface CardDatum {
  id: HistoryResourceId
  label: string
  defaultTarget: number
  dailyAvg: number
  current: number
  target: number
  forecast: ForecastResult
}

/** チャート用の計算結果 */
interface ChartCache {
  resources: ChartResource[]
  data: ChartDataPoint[]
}

/** キャッシュのキー */
interface CacheKey {
  historyVersion: number
  days: number
  targets: string       // JSON.stringify済み
  selected: string      // JSON.stringify済み（ソート済み配列）
}

interface ForecastCacheEntry {
  key: CacheKey
  cardData: CardDatum[]
  chartData: ChartCache | null
}

let cached: ForecastCacheEntry | null = null

function keysMatch(a: CacheKey, b: CacheKey): boolean {
  return a.historyVersion === b.historyVersion
    && a.days === b.days
    && a.targets === b.targets
    && a.selected === b.selected
}

/** キャッシュから取得。ヒットしなければnullを返す */
export function getCachedForecast(key: CacheKey): ForecastCacheEntry | null {
  if (cached && keysMatch(cached.key, key)) return cached
  return null
}

/** キャッシュに保存 */
export function setCachedForecast(entry: ForecastCacheEntry): void {
  cached = entry
}

/** キャッシュキーを生成 */
export function makeCacheKey(
  historyVersion: number,
  days: number,
  targets: Record<string, number>,
  selectedIds: HistoryResourceId[],
): CacheKey {
  return {
    historyVersion,
    days,
    targets: JSON.stringify(targets),
    selected: JSON.stringify([...selectedIds].sort()),
  }
}
