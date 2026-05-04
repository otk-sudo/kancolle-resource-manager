import type { ResourceHistoryRecord } from '../types/resource'

/**
 * 航海日誌の資材ログTSV文字列をパースしてResourceHistoryRecordの配列に変換する。
 * 同一日付の複数レコードは最後のものを採用する（日付ごとに最新値を保持）。
 *
 * @param tsv - TSV文字列（Shift-JIS読み取り後のUnicode文字列）
 * @returns パース済みレコードの配列（日付昇順）
 */
export function parseTsv(tsv: string): ResourceHistoryRecord[] {
  if (!tsv.trim()) return []

  const lines = tsv.trim().split('\n')

  // ヘッダー行をスキップ（1行目）
  const dataLines = lines.slice(1)
  if (dataLines.length === 0) return []

  // 日付ごとに最後のレコードを保持するMap
  const recordMap = new Map<string, ResourceHistoryRecord>()

  for (const line of dataLines) {
    const cols = line.split('\t')
    if (cols.length < 10) continue

    // 日付: "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DD"
    const date = cols[0].trim().slice(0, 10)

    const record: ResourceHistoryRecord = {
      date,
      fuel:            parseInt(cols[2], 10),
      ammo:            parseInt(cols[3], 10),
      steel:           parseInt(cols[4], 10),
      baux:            parseInt(cols[5], 10),
      instantRepair:   parseInt(cols[6], 10),
      instantBuild:    parseInt(cols[7], 10),
      devMaterial:     parseInt(cols[8], 10),
      improveMaterial: parseInt(cols[9], 10),
    }

    // 同一日付は後のレコードで上書き（最新値を採用）
    recordMap.set(date, record)
  }

  // 日付昇順で返す
  return Array.from(recordMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}
