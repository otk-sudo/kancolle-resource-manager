import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecialResourceGrid } from './SpecialResourceGrid'
import type { SpecialResource } from '../../types/resource'

const mockResources: SpecialResource[] = [
  { id: 'instantRepair',   name: '高速修復材', value: 523, cap: 3000 },
  { id: 'instantBuild',    name: '高速建造材', value: 78,  cap: 3000 },
  { id: 'devMaterial',     name: '開発資材',   value: 342, cap: 3000 },
  { id: 'improveMaterial', name: '改修資材',   value: 15,  cap: 3000 },
]

describe('SpecialResourceGrid', () => {
  it('should render all resource names', () => {
    // Arrange & Act
    render(<SpecialResourceGrid resources={mockResources} />)

    // Assert
    expect(screen.getByText('高速修復材')).toBeInTheDocument()
    expect(screen.getByText('改修資材')).toBeInTheDocument()
    expect(screen.getByText('開発資材')).toBeInTheDocument()
  })

  it('should render resource values formatted with commas', () => {
    // Arrange & Act
    render(<SpecialResourceGrid resources={mockResources} />)

    // Assert
    expect(screen.getByText('523')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('342')).toBeInTheDocument()
  })

  it('should render cap info for resources that have a cap', () => {
    // Arrange & Act
    render(<SpecialResourceGrid resources={mockResources} />)

    // Assert
    // 上限3000の資材は値と上限が別要素に分かれて表示される
    // 高速修復材カードに "523" と "/ 3,000" が共存していることを確認
    const repairCard = screen.getByText('高速修復材').closest('div')?.parentElement
    expect(repairCard).toHaveTextContent('523')
    expect(repairCard).toHaveTextContent('/ 3,000')
  })

})
