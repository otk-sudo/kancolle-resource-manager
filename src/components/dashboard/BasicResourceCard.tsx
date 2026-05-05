import { memo } from 'react'
import type { BasicResource } from '../../types/resource'

/** 資材カードの色設定 */
const colorMap: Record<string, string> = {
  fuel:  'var(--fuel)',
  ammo:  'var(--ammo)',
  steel: 'var(--steel)',
  baux:  'var(--baux)',
}

interface Props {
  resource: BasicResource
  /** 前日比（正: 増加、負: 減少） */
  diff: number
}

/** 数値をカンマ区切りにフォーマットする */
const fmt = (n: number) => n.toLocaleString('ja-JP')

export const BasicResourceCard = memo(function BasicResourceCard({ resource, diff }: Props) {
  const pct = (resource.value / resource.cap * 100).toFixed(1)
  const color = colorMap[resource.id] ?? 'var(--blue)'
  const isUp = diff > 0
  const isDown = diff < 0

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 上部カラーバー */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '3px',
        background: color,
      }} />

      {/* 資材名 */}
      <div style={{
        fontSize: '11px',
        color: 'var(--text-s)',
        fontWeight: 600,
        letterSpacing: '0.05em',
        marginBottom: '8px',
      }}>
        {resource.name}
      </div>

      {/* 現在値 */}
      <div style={{
        fontSize: '30px',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: '4px',
        lineHeight: 1.1,
      }}>
        {fmt(resource.value)}
      </div>

      {/* 上限・割合 */}
      <div style={{
        fontSize: '11px',
        color: 'var(--text-m)',
        marginBottom: '10px',
      }}>
        上限 {fmt(resource.cap)}（{pct}%）
      </div>

      {/* 割合バー */}
      <div style={{
        height: '4px',
        background: 'var(--border)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '10px',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '2px',
        }} />
      </div>

      {/* 前日比 */}
      <div style={{
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: isUp ? 'var(--green)' : isDown ? 'var(--red)' : 'var(--text-m)',
      }}>
        {isUp && `▲ +${fmt(diff)} / 前日比`}
        {isDown && `▼ ${fmt(diff)} / 前日比`}
        {!isUp && !isDown && `± 0 / 前日比`}
      </div>
    </div>
  )
})
