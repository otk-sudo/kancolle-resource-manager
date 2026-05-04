import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MissionItem } from './MissionItem'
import type { Mission } from '../../types/mission'

const MOCK_MISSION: Mission = {
  id: 'B1',
  name: '「渡洋作戦」発令！',
  type: 'daily',
  reward: { fuel: 200, ammo: 200, steel: 0, improveMaterial: 1 },
}

describe('MissionItem', () => {
  it('should display mission name', () => {
    // Arrange & Act
    render(<MissionItem mission={MOCK_MISSION} completed={false} onToggle={vi.fn()} />)

    // Assert
    expect(screen.getByText('「渡洋作戦」発令！')).toBeInTheDocument()
  })

  it('should display non-zero rewards', () => {
    // Arrange & Act
    render(<MissionItem mission={MOCK_MISSION} completed={false} onToggle={vi.fn()} />)

    // Assert — 燃料200・弾薬200・改修資材1が表示される
    expect(screen.getAllByText(/200/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/1/)).toBeInTheDocument()
  })

  it('should call onToggle when checkbox is clicked', () => {
    // Arrange
    const onToggle = vi.fn()
    render(<MissionItem mission={MOCK_MISSION} completed={false} onToggle={onToggle} />)

    // Act
    fireEvent.click(screen.getByRole('checkbox'))

    // Assert
    expect(onToggle).toHaveBeenCalledWith('B1')
  })

  it('should show completed state when completed=true', () => {
    // Arrange & Act
    render(<MissionItem mission={MOCK_MISSION} completed={true} onToggle={vi.fn()} />)

    // Assert
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should apply visual distinction when completed', () => {
    // Arrange & Act
    const { container } = render(
      <MissionItem mission={MOCK_MISSION} completed={true} onToggle={vi.fn()} />
    )

    // Assert — 完了時に opacity が下がるなど視覚的な変化があること
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).toBeTruthy()
  })
})
