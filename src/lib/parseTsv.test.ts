import { describe, it, expect } from 'vitest'
import { parseTsv } from './parseTsv'

// テスト用のTSVサンプル（ヘッダー + 3日分）
const SAMPLE_TSV = `日付\t直前のイベント\t燃料\t弾薬\t鋼材\tボーキ\t高速修復材\t高速建造材\t開発資材\t改修資材\t司令部Lv\t提督Exp
2025-01-25 14:57:39\t定期更新\t31174\t10669\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-26 15:05:31\t定期更新\t31174\t10678\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-27 05:00:00\t定期更新\t32000\t11000\t42000\t43000\t250\t775\t115\t12\t120\t39800000`

// 重複日付テスト用サンプル（2025-01-25が2行）
const DUPLICATE_TSV = `日付\t直前のイベント\t燃料\t弾薬\t鋼材\tボーキ\t高速修復材\t高速建造材\t開発資材\t改修資材\t司令部Lv\t提督Exp
2025-01-25 14:57:39\t定期更新\t31174\t10669\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-25 15:05:31\t定期更新\t31174\t10678\t41926\t42667\t247\t771\t110\t11\t120\t39769403
2025-01-26 05:00:00\t定期更新\t32000\t11000\t42000\t43000\t250\t775\t115\t12\t120\t39800000`

describe('parseTsv', () => {
  it('should return correct number of records', () => {
    // Arrange & Act
    const result = parseTsv(SAMPLE_TSV)

    // Assert
    expect(result).toHaveLength(3)
  })

  it('should parse date as YYYY-MM-DD string', () => {
    // Arrange & Act
    const result = parseTsv(SAMPLE_TSV)

    // Assert
    expect(result[0].date).toBe('2025-01-25')
    expect(result[2].date).toBe('2025-01-27')
  })

  it('should parse fuel value as number', () => {
    // Arrange & Act
    const result = parseTsv(SAMPLE_TSV)

    // Assert
    expect(result[0].fuel).toBe(31174)
  })

  it('should parse all basic resources correctly', () => {
    // Arrange & Act
    const result = parseTsv(SAMPLE_TSV)

    // Assert
    expect(result[0].ammo).toBe(10669)
    expect(result[0].steel).toBe(41926)
    expect(result[0].baux).toBe(42667)
  })

  it('should parse all special resources correctly', () => {
    // Arrange & Act
    const result = parseTsv(SAMPLE_TSV)

    // Assert
    expect(result[0].instantRepair).toBe(247)
    expect(result[0].instantBuild).toBe(771)
    expect(result[0].devMaterial).toBe(110)
    expect(result[0].improveMaterial).toBe(11)
  })

  it('should deduplicate records keeping last entry per date', () => {
    // Arrange & Act
    // DUPLICATE_TSV: 2025-01-25 が2行あるので、後の行（10678）が残るべき
    const result = parseTsv(DUPLICATE_TSV)

    // Assert
    expect(result).toHaveLength(2)
    const jan25 = result.find(r => r.date === '2025-01-25')
    expect(jan25?.ammo).toBe(10678)
  })

  it('should return empty array for empty input', () => {
    // Arrange & Act
    const result = parseTsv('')

    // Assert
    expect(result).toHaveLength(0)
  })

  it('should return empty array for header-only input', () => {
    // Arrange & Act
    const result = parseTsv('日付\t直前のイベント\t燃料\t弾薬\t鋼材\tボーキ\t高速修復材\t高速建造材\t開発資材\t改修資材\t司令部Lv\t提督Exp')

    // Assert
    expect(result).toHaveLength(0)
  })
})
