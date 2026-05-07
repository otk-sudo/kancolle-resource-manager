import { memo } from 'react'
import { fmt } from '../../lib/format'

interface Props {
  /** 前日比（正: 増加、負: 減少、ゼロ: 変化なし） */
  diff: number
  /** 「/ 前日比」ラベルを表示するか（デフォルト: true） */
  showLabel?: boolean
}

/** バリアント判定 */
type Variant = 'positive' | 'negative' | 'neutral'

function getVariant(diff: number): Variant {
  if (diff > 0) return 'positive'
  if (diff < 0) return 'negative'
  return 'neutral'
}

/** バリアントに対応するCSS変数カラーを返す */
function getColor(variant: Variant): string {
  if (variant === 'positive') return 'var(--green)'
  if (variant === 'negative') return 'var(--red)'
  return 'var(--text-m)'
}

/** aria-label テキストを返す */
function getAriaLabel(diff: number): string {
  if (diff > 0) return `前日比: +${fmt(diff)} 増加`
  if (diff < 0) return `前日比: ${fmt(diff)} 減少`
  return '前日比: 変化なし'
}

/** 前日比表示インジケーター（正/負/ゼロで色・記号を切り替える） */
export const DiffIndicator = memo(function DiffIndicator({ diff, showLabel = true }: Props) {
  const variant = getVariant(diff)
  const color = getColor(variant)
  const ariaLabel = getAriaLabel(diff)

  /** 記号テキスト */
  const symbol = variant === 'positive' ? '▲' : variant === 'negative' ? '▼' : null

  /** 数値テキスト（記号なし） */
  const valueText = (() => {
    if (variant === 'positive') return `+${fmt(diff)}`
    if (variant === 'negative') return fmt(diff)
    return '± 0'
  })()

  return (
    <span
      role="status"
      data-variant={variant}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color,
        fontSize: 'inherit',
      }}
    >
      {/* 記号（正・負のみ）と数値を別要素にすることでテストの getByText() に対応 */}
      {symbol !== null && <span>{symbol}</span>}
      <span>{valueText}</span>
      {showLabel && <span>/ 前日比</span>}
    </span>
  )
})
