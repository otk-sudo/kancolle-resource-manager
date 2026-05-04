import type { Mission, MissionReward } from '../../types/mission'

const REWARD_LABELS: { key: keyof MissionReward; label: string; icon: string }[] = [
  { key: 'fuel',              label: '燃料',       icon: '🛢' },
  { key: 'ammo',              label: '弾薬',       icon: '💣' },
  { key: 'steel',             label: '鋼材',       icon: '⚙' },
  { key: 'baux',              label: 'ボーキ',      icon: '🪨' },
  { key: 'instantRepair',     label: '修復材',      icon: '🔧' },
  { key: 'instantBuild',      label: '建造材',      icon: '🏗' },
  { key: 'devMaterial',       label: '開発資材',    icon: '📦' },
  { key: 'improveMaterial',   label: '改修資材',    icon: '🔩' },
  { key: 'medal',             label: '勲章',        icon: '🏅' },
  { key: 'smallFurnitureBox', label: '家具箱(小)',  icon: '📫' },
  { key: 'mediumFurnitureBox',label: '家具箱(中)',  icon: '📪' },
  { key: 'largeFurnitureBox', label: '家具箱(大)',  icon: '📬' },
  { key: 'blueprintSupply',   label: '新型砲熕',    icon: '📐' },
  { key: 'actionReport',      label: '戦闘詳報',    icon: '📋' },
  { key: 'firstClassMedal',   label: '一等航海士',  icon: '🎖' },
]

interface Props {
  mission: Mission
  completed: boolean
  onToggle: (id: string) => void
}

export function MissionItem({ mission, completed, onToggle }: Props) {
  const rewards = REWARD_LABELS.filter(r => (mission.reward[r.key] ?? 0) > 0)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '12px 16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      opacity: completed ? '0.5' : '1',
      transition: 'opacity 0.2s',
    }}>
      {/* チェックボックス */}
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(mission.id)}
        style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
      />

      {/* 内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 任務名 */}
        <div style={{
          fontSize: '13px', fontWeight: 600,
          color: completed ? 'var(--text-s)' : 'var(--text-h)',
          textDecoration: completed ? 'line-through' : 'none',
          marginBottom: '6px',
        }}>
          {mission.name}
        </div>

        {/* 報酬 */}
        {rewards.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {rewards.map(r => (
              <span
                key={r.key}
                style={{
                  fontSize: '11px', color: 'var(--text-s)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '4px', padding: '1px 6px',
                }}
              >
                {r.icon} {mission.reward[r.key]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
