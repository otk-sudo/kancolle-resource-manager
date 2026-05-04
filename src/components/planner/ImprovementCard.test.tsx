import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImprovementCard } from './ImprovementCard'
import type { ImprovementPlan, ImprovableEquipment } from '../../types/improvement'

const MOCK_PLAN: ImprovementPlan = {
  id: 'plan-1',
  steps: [
    { equipId: 1, equipName: '12.7cm連装砲', targetStar: 6, currentStar: 2 },
    { equipId: 2, equipName: '12.7cm連装砲B型改二', targetStar: 10, currentStar: 0 },
  ],
  priority: 'high',
  deadline: undefined,
  archived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  order: 0,
}

const MOCK_EQUIPMENT: ImprovableEquipment[] = [
  {
    equipId: 1,
    equipName: '12.7cm連装砲',
    equipType: 1,
    costs: Array(10).fill({ fuel: 0, ammo: 1, steel: 1, baux: 0, devMaterial: 1, improveMaterial: 2 }),
    secretaryByDay: { 1: [{ shipId: 101, shipName: '吹雪' }] },
  },
]

describe('ImprovementCard', () => {
  it('should display the chain title (first → last equipment)', () => {
    // Arrange & Act
    render(
      <ImprovementCard
        plan={MOCK_PLAN}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1}
        onArchive={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByText(/12\.7cm連装砲/)).toBeInTheDocument()
    expect(screen.getByText(/12\.7cm連装砲B型改二/)).toBeInTheDocument()
  })

  it('should display priority badge', () => {
    // Arrange & Act
    render(
      <ImprovementCard
        plan={MOCK_PLAN}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1}
        onArchive={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('should expand detail on click', () => {
    // Arrange
    render(
      <ImprovementCard
        plan={MOCK_PLAN}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1}
        onArchive={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    // Act
    fireEvent.click(screen.getByRole('button', { name: /展開|詳細|▼|▶/ }))

    // Assert — 各ステップの詳細が表示される
    expect(screen.getByText(/★2.*→.*★6|現在.*2/)).toBeInTheDocument()
  })

  it('should call onArchive when archive button is clicked', () => {
    // Arrange
    const onArchive = vi.fn()
    render(
      <ImprovementCard
        plan={MOCK_PLAN}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1}
        onArchive={onArchive}
        onUpdate={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /展開|詳細|▼|▶/ }))

    // Act
    fireEvent.click(screen.getByRole('button', { name: /アーカイブ/ }))

    // Assert
    expect(onArchive).toHaveBeenCalledWith('plan-1')
  })

  it('should highlight card when today secretary is available', () => {
    // Arrange & Act
    const { container } = render(
      <ImprovementCard
        plan={MOCK_PLAN}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1} // 月曜日 = 改修可能
        onArchive={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    // Assert — 今日可能バッジが表示される
    expect(screen.getByText(/今日可能/)).toBeInTheDocument()
  })

  it('should display deadline when set', () => {
    // Arrange
    const planWithDeadline = { ...MOCK_PLAN, deadline: '2026-06-01T00:00:00.000Z' }

    // Act
    render(
      <ImprovementCard
        plan={planWithDeadline}
        equipments={MOCK_EQUIPMENT}
        todayWeekday={1}
        onArchive={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByText(/2026-06-01|06\/01/)).toBeInTheDocument()
  })
})
