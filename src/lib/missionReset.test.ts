import { describe, it, expect } from 'vitest'
import { shouldReset } from './missionReset'

/**
 * JST = UTC+9 なので UTC時刻で表現する
 * JST 05:00 = UTC 20:00 (前日)
 */

describe('shouldReset - daily', () => {
  it('should return true when last check was before today JST 05:00', () => {
    // Arrange — 昨日の10:00 JSTにチェック、現在は今日の06:00 JST
    const checkedAt = new Date('2026-05-04T01:00:00Z') // JST 10:00
    const now       = new Date('2026-05-04T21:00:00Z') // JST 翌日06:00

    // Act
    const result = shouldReset('daily', checkedAt, now)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when last check was after today JST 05:00', () => {
    // Arrange — 今日の06:00 JSTにチェック、現在は同日12:00 JST
    const checkedAt = new Date('2026-05-04T21:00:00Z') // JST 06:00
    const now       = new Date('2026-05-05T03:00:00Z') // JST 12:00

    // Act
    const result = shouldReset('daily', checkedAt, now)

    // Assert
    expect(result).toBe(false)
  })
})

describe('shouldReset - weekly', () => {
  it('should return true when last check was before this Monday JST 05:00', () => {
    // Arrange — 先週金曜にチェック（2026-05-01）、今日は水曜（2026-05-06）
    const checkedAt = new Date('2026-05-01T10:00:00Z') // 先週金曜 JST 19:00
    const now       = new Date('2026-05-06T03:00:00Z') // 今週水曜 JST 12:00

    // Act
    const result = shouldReset('weekly', checkedAt, now)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when last check was after this Monday JST 05:00', () => {
    // Arrange — 月曜JST 08:00にチェック、今日は水曜
    const checkedAt = new Date('2026-05-03T23:00:00Z') // 月曜 JST 08:00 (UTC+9)
    const now       = new Date('2026-05-06T03:00:00Z') // 水曜 JST 12:00

    // Act
    const result = shouldReset('weekly', checkedAt, now)

    // Assert
    expect(result).toBe(false)
  })
})

describe('shouldReset - monthly', () => {
  it('should return true when last check was in previous month', () => {
    // Arrange — 先月末にチェック
    const checkedAt = new Date('2026-04-30T15:00:00Z') // 4/30 JST 24:00
    const now       = new Date('2026-05-05T03:00:00Z') // 5/5 JST 12:00

    // Act
    const result = shouldReset('monthly', checkedAt, now)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when last check was in current month after reset', () => {
    // Arrange — 今月1日リセット後にチェック
    const checkedAt = new Date('2026-05-01T00:00:00Z') // 5/1 JST 09:00
    const now       = new Date('2026-05-05T03:00:00Z') // 5/5 JST 12:00

    // Act
    const result = shouldReset('monthly', checkedAt, now)

    // Assert
    expect(result).toBe(false)
  })
})

describe('shouldReset - quarterly', () => {
  it('should return true when last check was in previous quarter', () => {
    // Arrange — Q1（1-3月）にチェック、現在はQ2（4-6月）
    const checkedAt = new Date('2026-03-31T15:00:00Z') // 3/31
    const now       = new Date('2026-04-05T03:00:00Z') // 4/5

    // Act
    const result = shouldReset('quarterly', checkedAt, now)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when both in same quarter', () => {
    // Arrange — 同じQ2内
    const checkedAt = new Date('2026-04-10T03:00:00Z')
    const now       = new Date('2026-05-05T03:00:00Z')

    // Act
    const result = shouldReset('quarterly', checkedAt, now)

    // Assert
    expect(result).toBe(false)
  })
})

describe('shouldReset - yearly', () => {
  it('should return true when last check was in previous year', () => {
    // Arrange
    const checkedAt = new Date('2025-12-31T15:00:00Z')
    const now       = new Date('2026-05-05T03:00:00Z')

    // Act
    const result = shouldReset('yearly', checkedAt, now)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when both in same year after reset', () => {
    // Arrange
    const checkedAt = new Date('2026-01-05T03:00:00Z')
    const now       = new Date('2026-05-05T03:00:00Z')

    // Act
    const result = shouldReset('yearly', checkedAt, now)

    // Assert
    expect(result).toBe(false)
  })
})
