import { describe, it, expect } from 'vitest'
import { detectFormat, parseResourceCsv } from './csvImport'

// ──────────────────────────────────────────────
// サンプルデータ
// ──────────────────────────────────────────────

const NANASHIKI_CSV = `日時,燃料,弾薬,鋼材,ボーキ,高速建造材,高速修復材,開発資材,改修資材,司令部Lv,提督Exp
2024/06/16 20:47:12,33003,32243,153921,40450,986,321,194,64,120,21781943
2024/06/17 08:21:44,33070,32473,153726,40473,986,321,194,64,120,21781983
2024/06/17 10:41:23,33517,32311,153994,40645,987,321,194,64,120,21782358
2024/06/17 22:32:01,33932,33863,156505,40671,989,323,205,64,120,21824526`

const KOKAINIIKKI_TSV = `日付\t直前のイベント\t燃料\t弾薬\t鋼材\tボーキ\t高速修復材\t高速建造材\t開発資材\t改修資材\t司令部Lv\t提督Exp
2025-01-25 14:57:39\t定期更新\t31174\t10669\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-25 15:05:31\t定期更新\t31174\t10678\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-25 15:52:27\t定期更新\t31700\t11097\t41960\t42822\t250\t771\t111\t11\t120\t39769903`

// ──────────────────────────────────────────────
// detectFormat
// ──────────────────────────────────────────────

describe('detectFormat', () => {
  it('should detect nanashiki format from comma-separated header', () => {
    expect(detectFormat(NANASHIKI_CSV)).toBe('nanashiki')
  })

  it('should detect kokainiikki format from tab-separated header', () => {
    expect(detectFormat(KOKAINIIKKI_TSV)).toBe('kokainiikki')
  })

  it('should return unknown for unrecognized format', () => {
    expect(detectFormat('foo,bar,baz\n1,2,3')).toBe('unknown')
  })
})

// ──────────────────────────────────────────────
// parseResourceCsv — 七四式
// ──────────────────────────────────────────────

describe('parseResourceCsv - nanashiki', () => {
  it('should parse all distinct dates', () => {
    // Arrange & Act
    const records = parseResourceCsv(NANASHIKI_CSV)

    // Assert — 2024/06/16 と 2024/06/17 の2日分
    expect(records).toHaveLength(2)
  })

  it('should use the last record of the day', () => {
    // Arrange & Act
    const records = parseResourceCsv(NANASHIKI_CSV)
    const jun17 = records.find(r => r.date === '2024-06-17')

    // Assert — 最後の行（22:32:01）の値を使う
    expect(jun17?.fuel).toBe(33932)
    expect(jun17?.ammo).toBe(33863)
  })

  it('should map columns correctly for nanashiki', () => {
    // Arrange & Act
    const records = parseResourceCsv(NANASHIKI_CSV)
    const jun16 = records.find(r => r.date === '2024-06-16')

    // Assert
    expect(jun16?.fuel).toBe(33003)
    expect(jun16?.ammo).toBe(32243)
    expect(jun16?.steel).toBe(153921)
    expect(jun16?.baux).toBe(40450)
    expect(jun16?.instantBuild).toBe(986)
    expect(jun16?.instantRepair).toBe(321)
    expect(jun16?.devMaterial).toBe(194)
    expect(jun16?.improveMaterial).toBe(64)
  })

  it('should return date in YYYY-MM-DD format', () => {
    const records = parseResourceCsv(NANASHIKI_CSV)
    records.forEach(r => {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

// ──────────────────────────────────────────────
// parseResourceCsv — 航海日誌
// ──────────────────────────────────────────────

describe('parseResourceCsv - kokainiikki', () => {
  it('should parse all distinct dates', () => {
    // Arrange & Act
    const records = parseResourceCsv(KOKAINIIKKI_TSV)

    // Assert — 2025-01-25 の1日分
    expect(records).toHaveLength(1)
  })

  it('should use the last record of the day', () => {
    // Arrange & Act
    const records = parseResourceCsv(KOKAINIIKKI_TSV)
    const jan25 = records.find(r => r.date === '2025-01-25')

    // Assert — 最後の行（15:52:27）の値を使う
    expect(jan25?.fuel).toBe(31700)
  })

  it('should map columns correctly for kokainiikki', () => {
    // Arrange & Act
    const records = parseResourceCsv(KOKAINIIKKI_TSV)
    const jan25 = records.find(r => r.date === '2025-01-25')

    // Assert — 高速修復材・高速建造材の列順が七四式と逆
    expect(jan25?.instantRepair).toBe(250)
    expect(jan25?.instantBuild).toBe(771)
    expect(jan25?.devMaterial).toBe(111)
    expect(jan25?.improveMaterial).toBe(11)
  })
})

// ──────────────────────────────────────────────
// 差分パース（ファイル末尾の新規行のみ）
// ──────────────────────────────────────────────

describe('parseResourceCsv - incremental', () => {
  it('should parse partial text without header', () => {
    // Arrange — ヘッダーなし・新規行のみ（差分読み込み時）
    const newLines = '2024/06/18 08:21:47,33652,34030,156306,40594,989,324,205,64,120,21827713\n'

    // Act
    const records = parseResourceCsv(newLines, 'nanashiki')

    // Assert
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2024-06-18')
    expect(records[0].fuel).toBe(33652)
  })
})
