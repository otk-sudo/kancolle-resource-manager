import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { useMissionStore, getInitialMissionState } from './missionStore'
import type { Mission } from '../types/mission'

const MOCK_MISSIONS: Mission[] = [
  { id: 'B1', name: '「渡洋作戦」発令！', type: 'daily', reward: { fuel: 200, ammo: 200 } },
  { id: 'B2', name: '海上護衛作戦', type: 'daily', reward: { fuel: 300, ammo: 300 } },
  { id: 'C2', name: '「西方」海域調査', type: 'weekly', reward: { fuel: 300, ammo: 300, steel: 300 } },
]

beforeEach(() => {
  act(() => { useMissionStore.setState(getInitialMissionState()) })
})

afterEach(() => { vi.restoreAllMocks() })

describe('setMissions', () => {
  it('should store mission master data', () => {
    // Arrange & Act
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })

    // Assert
    expect(useMissionStore.getState().missions).toHaveLength(3)
  })
})

describe('toggleCompletion', () => {
  it('should mark mission as completed', () => {
    // Arrange
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })

    // Act
    act(() => { useMissionStore.getState().toggleCompletion('B1') })

    // Assert
    const comp = useMissionStore.getState().completions['B1']
    expect(comp.completed).toBe(true)
  })

  it('should toggle back to incomplete', () => {
    // Arrange
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })
    act(() => { useMissionStore.getState().toggleCompletion('B1') })

    // Act
    act(() => { useMissionStore.getState().toggleCompletion('B1') })

    // Assert
    const comp = useMissionStore.getState().completions['B1']
    expect(comp.completed).toBe(false)
  })

  it('should record checkedAt timestamp', () => {
    // Arrange
    const before = Date.now()
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })

    // Act
    act(() => { useMissionStore.getState().toggleCompletion('B1') })

    // Assert
    const comp = useMissionStore.getState().completions['B1']
    expect(new Date(comp.checkedAt).getTime()).toBeGreaterThanOrEqual(before)
  })
})

describe('getMissionsForType', () => {
  it('should return missions filtered by type', () => {
    // Arrange
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })

    // Act
    const daily = useMissionStore.getState().getMissionsForType('daily')

    // Assert
    expect(daily).toHaveLength(2)
    expect(daily.every(m => m.type === 'daily')).toBe(true)
  })

  it('should sort incomplete missions before completed', () => {
    // Arrange
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })
    act(() => { useMissionStore.getState().toggleCompletion('B1') }) // B1を完了

    // Act
    const daily = useMissionStore.getState().getMissionsForType('daily')

    // Assert — 未完了のB2が先、完了B1が後
    expect(daily[0].id).toBe('B2')
    expect(daily[1].id).toBe('B1')
  })
})

describe('resetIfNeeded', () => {
  it('should clear completions for missions that have reset', () => {
    // Arrange — デイリー任務を完了済みにする
    act(() => { useMissionStore.getState().setMissions(MOCK_MISSIONS) })
    act(() => { useMissionStore.getState().toggleCompletion('B1') })
    expect(useMissionStore.getState().completions['B1'].completed).toBe(true)

    // 昨日にcheckedAtを書き換え（リセット発生させる）
    act(() => {
      const state = useMissionStore.getState()
      useMissionStore.setState({
        completions: {
          ...state.completions,
          B1: { missionId: 'B1', completed: true, checkedAt: '2026-05-04T01:00:00.000Z' },
        },
      })
    })

    // Act — 翌日06:00 JST（= UTC 翌日21:00）で実行
    act(() => { useMissionStore.getState().resetIfNeeded(new Date('2026-05-04T21:00:00Z')) })

    // Assert — デイリーがリセットされている
    expect(useMissionStore.getState().completions['B1']?.completed).toBeFalsy()
  })
})
