import type { MissionType } from '../types/mission'

/** JST オフセット（UTC+9） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
/** リセット時刻（JST 05:00） */
const RESET_HOUR = 5

/** UTC日時をJSTに変換してリセット基準エポック（JST 05:00）を返す */
function getResetEpoch(date: Date): Date {
  const jst = new Date(date.getTime() + JST_OFFSET_MS)
  // JST 当日の 05:00 を UTC で表現
  const resetJst = new Date(Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate(),
    RESET_HOUR, 0, 0, 0,
  ))
  // 現在がリセット時刻より前なら前日のリセットを基準にする
  const resetUtc = new Date(resetJst.getTime() - JST_OFFSET_MS)
  if (date < resetUtc) {
    resetUtc.setUTCDate(resetUtc.getUTCDate() - 1)
  }
  return resetUtc
}

/** JST の年・月・週の月曜日を取得するユーティリティ */
function toJstDate(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS)
}

function getQuarter(month: number): number {
  return Math.floor(month / 3)
}

/**
 * 前回チェック日時から見て、指定種別のリセットが発生しているか判定する。
 */
export function shouldReset(type: MissionType, checkedAt: Date, now: Date): boolean {
  const checkedReset = getResetEpoch(checkedAt)
  const nowReset     = getResetEpoch(now)

  switch (type) {
    case 'daily':
      // リセット基準日が違えばリセット済み
      return checkedReset.getTime() < nowReset.getTime()

    case 'weekly': {
      // 今週の月曜 JST 05:00 を基準にする
      const jstNow = toJstDate(nowReset)
      const dayOfWeek = jstNow.getUTCDay() // 0=Sun, 1=Mon
      const daysSinceMonday = (dayOfWeek + 6) % 7 // Mon=0, ..., Sun=6
      const thisMonday = new Date(nowReset)
      thisMonday.setUTCDate(nowReset.getUTCDate() - daysSinceMonday)
      // JST 月曜 05:00 = UTC 月曜 (05:00-09:00) = UTC 日曜 20:00
      return checkedAt < new Date(thisMonday.getTime() - JST_OFFSET_MS + RESET_HOUR * 3600000)
    }

    case 'monthly': {
      const jstChecked = toJstDate(checkedReset)
      const jstNow     = toJstDate(nowReset)
      // 年月が異なる or 今月1日のリセット後かチェック
      if (
        jstChecked.getUTCFullYear() !== jstNow.getUTCFullYear() ||
        jstChecked.getUTCMonth()    !== jstNow.getUTCMonth()
      ) return true
      return false
    }

    case 'quarterly': {
      const jstChecked = toJstDate(checkedReset)
      const jstNow     = toJstDate(nowReset)
      if (jstChecked.getUTCFullYear() !== jstNow.getUTCFullYear()) return true
      return getQuarter(jstChecked.getUTCMonth()) !== getQuarter(jstNow.getUTCMonth())
    }

    case 'yearly': {
      const jstChecked = toJstDate(checkedReset)
      const jstNow     = toJstDate(nowReset)
      return jstChecked.getUTCFullYear() !== jstNow.getUTCFullYear()
    }
  }
}
