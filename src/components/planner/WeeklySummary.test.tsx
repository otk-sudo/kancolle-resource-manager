import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklySummary } from './WeeklySummary'
import type { ImprovementCost } from '../../types/improvement'

describe('WeeklySummary', () => {
  it('should display improveMaterial total', () => {
    // Arrange
    const cost: ImprovementCost = {
      fuel: 0, ammo: 0, steel: 0, baux: 0,
      devMaterial: 3, improveMaterial: 12,
    }

    // Act
    render(<WeeklySummary totalCost={cost} planCount={2} />)

    // Assert
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('should display devMaterial total', () => {
    // Arrange
    const cost: ImprovementCost = {
      fuel: 0, ammo: 0, steel: 0, baux: 0,
      devMaterial: 7, improveMaterial: 0,
    }

    // Act
    render(<WeeklySummary totalCost={cost} planCount={1} />)

    // Assert
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('should display plan count', () => {
    // Arrange
    const cost: ImprovementCost = {
      fuel: 0, ammo: 0, steel: 0, baux: 0,
      devMaterial: 0, improveMaterial: 0,
    }

    // Act
    render(<WeeklySummary totalCost={cost} planCount={5} />)

    // Assert
    expect(screen.getByText(/5/)).toBeInTheDocument()
  })
})
