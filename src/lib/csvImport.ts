import type { ResourceHistoryRecord } from '../types/resource'

export type CsvFormat = 'nanashiki' | 'kokainiikki' | 'unknown'

/**
 * CSVの1行目（ヘッダー）からフォーマットを判定する。
 * - 七四式: カンマ区切り、「日時」始まり
 * - 航海日誌: タブ区切り、「日付」始まり
 */
export function detectFormat(text: string): CsvFormat {
  const header = text.split('\n')[0] ?? ''
  if (header.includes(',') && header.startsWith('日時')) return 'nanashiki'
  if (header.includes('\t') && header.startsWith('日付')) return 'kokainiikki'
  return 'unknown'
}

/** 日時文字列から YYYY-MM-DD 形式の日付を取得する */
function toDate(datetime: string): string {
  // 七四式: "2024/06/16 20:47:12" → "2024-06-16"
  // 航海日誌: "2025-01-25 14:57:39" → "2025-01-25"
  return datetime.slice(0, 10).replace(/\//g, '-')
}

/**
 * 七四式 CSV の1行をパースする。
 * 列順: 日時, 燃料, 弾薬, 鋼材, ボーキ, 高速建造材, 高速修復材, 開発資材, 改修資材, ...
 */
function parseNanashikiLine(cols: string[]): ResourceHistoryRecord | null {
  if (cols.length < 9) return null
  const date = toDate(cols[0])
  if (!date || date.length !== 10) return null
  return {
    date,
    fuel:            Number(cols[1]),
    ammo:            Number(cols[2]),
    steel:           Number(cols[3]),
    baux:            Number(cols[4]),
    instantBuild:    Number(cols[5]),
    instantRepair:   Number(cols[6]),
    devMaterial:     Number(cols[7]),
    improveMaterial: Number(cols[8]),
  }
}

/**
 * 航海日誌 TSV の1行をパースする。
 * 列順: 日付, 直前のイベント, 燃料, 弾薬, 鋼材, ボーキ, 高速修復材, 高速建造材, 開発資材, 改修資材, ...
 */
function parseKokainiikkiLine(cols: string[]): ResourceHistoryRecord | null {
  if (cols.length < 10) return null
  const date = toDate(cols[0])
  if (!date || date.length !== 10) return null
  return {
    date,
    fuel:            Number(cols[2]),
    ammo:            Number(cols[3]),
    steel:           Number(cols[4]),
    baux:            Number(cols[5]),
    instantRepair:   Number(cols[6]),
    instantBuild:    Number(cols[7]),
    devMaterial:     Number(cols[8]),
    improveMaterial: Number(cols[9]),
  }
}

/**
 * CSV/TSV テキストをパースして ResourceHistoryRecord[] を返す。
 *
 * @param text   - ファイル全体または差分テキスト
 * @param format - 省略時は自動検出。差分読み込み時はフォーマットを明示すること。
 * @returns      - 1日1レコード（同日は最後の行を採用）、日付昇順
 */
export function parseResourceCsv(
  text: string,
  format?: CsvFormat,
): ResourceHistoryRecord[] {
  const resolvedFormat = format ?? detectFormat(text)
  const sep = resolvedFormat === 'kokainiikki' ? '\t' : ','
  const map = new Map<string, ResourceHistoryRecord>()

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const cols = line.split(sep)

    // ヘッダー行をスキップ
    if (cols[0] === '日時' || cols[0] === '日付') continue

    let record: ResourceHistoryRecord | null = null
    if (resolvedFormat === 'nanashiki') {
      record = parseNanashikiLine(cols)
    } else if (resolvedFormat === 'kokainiikki') {
      record = parseKokainiikkiLine(cols)
    }

    if (record) map.set(record.date, record)
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}
