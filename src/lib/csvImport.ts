import type { ResourceHistoryRecord } from '../types/resource'

export type CsvFormat = 'nanashiki' | 'kokainiikki' | 'unknown'

// ──────────────────────────────────────────────
// フォーマット検出
// ──────────────────────────────────────────────

export function detectFormat(text: string): CsvFormat {
  const header = text.split('\n')[0] ?? ''
  if (header.includes(',') && header.startsWith('日時')) return 'nanashiki'
  if (header.includes('\t') && header.startsWith('日付')) return 'kokainiikki'
  return 'unknown'
}

// ──────────────────────────────────────────────
// 日時文字列 → YYYY-MM-DD
// ──────────────────────────────────────────────

function toDate(datetime: string): string {
  // 七四式: "2024/06/16 20:47:12" → "2024-06-16"
  // 航海日誌: "2025-01-25 14:57:39" → "2025-01-25"
  return datetime.slice(0, 10).replace(/\//g, '-')
}

// ──────────────────────────────────────────────
// 七四式パーサー
// 列順: 日時,燃料,弾薬,鋼材,ボーキ,高速建造材,高速修復材,開発資材,改修資材,...
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// 航海日誌パーサー
// 列順: 日付,直前のイベント,燃料,弾薬,鋼材,ボーキ,高速修復材,高速建造材,開発資材,改修資材,...
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// メインパース関数
// ──────────────────────────────────────────────

/**
 * CSV/TSV テキストをパースして ResourceHistoryRecord[] を返す。
 *
 * @param text    - ファイル全体 or 差分テキスト
 * @param format  - 省略時は自動検出。差分読み込み時はフォーマットを明示する。
 * @returns       - 1日1レコード（同日は最後の行を採用）
 */
export function parseResourceCsv(
  text: string,
  format?: CsvFormat,
): ResourceHistoryRecord[] {
  const resolvedFormat = format ?? detectFormat(text)

  const isTabSeparated = resolvedFormat === 'kokainiikki'
  const sep = isTabSeparated ? '\t' : ','

  // 日付ごとの最後のレコードを保持するマップ
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

    if (record) {
      map.set(record.date, record)
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}
