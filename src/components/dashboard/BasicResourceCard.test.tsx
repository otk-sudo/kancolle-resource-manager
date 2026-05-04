import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BasicResourceCard } from './BasicResourceCard'
import type { BasicResource } from '../../types/resource'

const mockResource: BasicResource = {
  id: 'fuel',
  name: '燃料',
  value: 245380,
  cap: 350000,
}

describe('BasicResourceCard', () => {
  it('should render the resource name', () => {
    // Arrange & Act
    render(<BasicResourceCard resource={mockResource} diff={0} />)

    // Assert
    expect(screen.getByText('燃料')).toBeInTheDocument()
  })

  it('should render the resource value formatted with commas', () => {
    // Arrange & Act
    render(<BasicResourceCard resource={mockResource} diff={0} />)

    // Assert
    expect(screen.getByText('245,380')).toBeInTheDocument()
  })

  it('should render positive diff with up indicator', () => {
    // Arrange & Act
    render(<BasicResourceCard resource={mockResource} diff={1580} />)

    // Assert
    expect(screen.getByText(/\+1,580/)).toBeInTheDocument()
  })

  it('should render negative diff with down indicator', () => {
    // Arrange & Act
    render(<BasicResourceCard resource={mockResource} diff={-340} />)

    // Assert
    expect(screen.getByText(/-340/)).toBeInTheDocument()
  })

  it('should render the cap percentage', () => {
    // Arrange & Act
    render(<BasicResourceCard resource={mockResource} diff={0} />)

    // Assert
    // 245380 / 350000 = 70.1%
    expect(screen.getByText(/70\.1%/)).toBeInTheDocument()
  })
})
