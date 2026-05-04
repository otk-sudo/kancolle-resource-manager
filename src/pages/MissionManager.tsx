import { useState, useEffect } from 'react'
import { useMissionStore } from '../stores/missionStore'
import { MissionItem } from '../components/mission/MissionItem'
import type { MissionType, MissionMasterData } from '../types/mission'

const TABS: { value: MissionType; label: string }[] = [
  { value: 'daily',     label: 'デイリー' },
  { value: 'weekly',    label: 'ウィークリー' },
  { value: 'monthly',   label: 'マンスリー' },
  { value: 'quarterly', label: 'クォータリー' },
  { value: 'yearly',    label: 'イヤーリー' },
]

export function MissionManager() {
  const { missions, getMissionsForType, toggleCompletion, setMissions, resetIfNeeded } = useMissionStore()
  const [activeTab, setActiveTab] = useState<MissionType>('daily')
  const [dataStatus, setDataStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  // 起動時にリセット判定
  useEffect(() => {
    resetIfNeeded()
  }, [])

  const handleFetchData = async () => {
    setDataStatus('loading')
    try {
      // 外部データ取得（将来的にTauriのHTTPプラグイン経由に差し替え）
      const dummy: MissionMasterData = {
        fetchedAt: new Date().toISOString(),
        missions: [],
      }
      setMissions(dummy.missions)
      localStorage.setItem('mission-master', JSON.stringify(dummy))
      setDataStatus('idle')
    } catch {
      setDataStatus('error')
    }
  }

  const tabMissions = getMissionsForType(activeTab)
  const completedCount = tabMissions.filter(m => useMissionStore.getState().completions[m.id]?.completed).length

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

      {/* ヘッダーアクション */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={handleFetchData}
          disabled={dataStatus === 'loading'}
          style={{
            padding: '7px 14px', fontSize: '13px', fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '6px', color: 'var(--text-m)', cursor: 'pointer',
          }}
        >
          {dataStatus === 'loading' ? '取得中...' : '任務データ更新'}
        </button>
      </div>

      {/* タブ */}
      <div style={{
        display: 'flex', gap: '4px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.value ? 'var(--blue)' : 'var(--text-s)',
              borderBottom: activeTab === tab.value ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 達成状況サマリー */}
      {missions.length > 0 && (
        <div style={{
          fontSize: '12px', color: 'var(--text-s)',
          marginBottom: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            flex: 1, height: '4px',
            background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
          }}>
            <div style={{
              width: tabMissions.length > 0 ? `${Math.round(completedCount / tabMissions.length * 100)}%` : '0%',
              height: '100%', background: 'var(--blue)', borderRadius: '2px', transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ whiteSpace: 'nowrap' }}>
            {completedCount} / {tabMissions.length} 完了
          </span>
        </div>
      )}

      {/* 任務リストなし */}
      {missions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-s)', fontSize: '13px',
          border: '1px dashed var(--border)', borderRadius: '10px',
        }}>
          「任務データ更新」ボタンから任務データを取得してください。
        </div>
      )}

      {/* 任務一覧 */}
      {tabMissions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabMissions.map(mission => (
            <MissionItem
              key={mission.id}
              mission={mission}
              completed={useMissionStore.getState().completions[mission.id]?.completed ?? false}
              onToggle={toggleCompletion}
            />
          ))}
        </div>
      )}

      {missions.length > 0 && tabMissions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px',
          color: 'var(--text-s)', fontSize: '13px',
        }}>
          {TABS.find(t => t.value === activeTab)?.label}任務はありません。
        </div>
      )}
    </main>
  )
}
