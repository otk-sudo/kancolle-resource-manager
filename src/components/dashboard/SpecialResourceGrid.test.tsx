import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecialResourceGrid } from './SpecialResourceGrid'
import type { SpecialResource } from '../../types/resource'

const mockResources: SpecialResource[] = [
  { id: 'instantRepair',   name: '高速修復材', value: 1523, cap: 3000 },
  { id: 'instantBuild',    name: '高速建造材', value: 78,   cap: 3000 },
  { id: 'devMaterial',     name: '開発資材',   value: 342,  cap: 3000 },
  { id: 'improveMaterial', name: '改修資材',   value: 15,   cap: 3000 },
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

    // Assert: 1000以上の値はカンマ区切りで表示される（W-3対応）
    expect(screen.getByText('1,523')).toBeInTheDocument()
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

  // --- 前日比（diff）表示機能のテスト ---

  it('should render positive diff with up indicator when diff is positive', () => {
    // Arrange: 高速修復材の前日比がプラス1500の場合（W-3対応: カンマ区切り表示）
    const diffs: Partial<Record<SpecialResource['id'], number>> = { instantRepair: 1500 }

    // Act
    render(<SpecialResourceGrid resources={mockResources} diffs={diffs} />)

    // Assert: 増加インジケーター（▲）とプラス表記（+1,500）がカンマ区切りで表示される
    expect(screen.getByText('▲')).toBeInTheDocument()
    expect(screen.getByText('+1,500')).toBeInTheDocument()
  })

  it('should render negative diff with down indicator when diff is negative', () => {
    // Arrange: 高速修復材の前日比がマイナス50の場合
    const diffs: Partial<Record<SpecialResource['id'], number>> = { instantRepair: -50 }

    // Act
    render(<SpecialResourceGrid resources={mockResources} diffs={diffs} />)

    // Assert: 減少インジケーター（▼）とマイナス表記（-50）が表示される
    expect(screen.getByText('▼')).toBeInTheDocument()
    expect(screen.getByText('-50')).toBeInTheDocument()
  })

  it('should render zero diff when diff is zero', () => {
    // Arrange: 高速修復材の前日比がゼロの場合
    const diffs: Partial<Record<SpecialResource['id'], number>> = { instantRepair: 0 }

    // Act
    render(<SpecialResourceGrid resources={mockResources} diffs={diffs} />)

    // Assert: 変化なしインジケーター（± 0）が表示される
    expect(screen.getByText('± 0')).toBeInTheDocument()
  })

  it('should render no diff indicator when diffs is not provided', () => {
    // Arrange: diffs プロパティを渡さない場合

    // Act
    render(<SpecialResourceGrid resources={mockResources} />)

    // Assert: いずれの前日比インジケーターも表示されない
    expect(screen.queryByText('▲')).not.toBeInTheDocument()
    expect(screen.queryByText('▼')).not.toBeInTheDocument()
    expect(screen.queryByText(/^[±]/)).not.toBeInTheDocument()
  })
})
