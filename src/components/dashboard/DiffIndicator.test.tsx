/**
 * DiffIndicator コンポーネントのテスト
 * - 正常系: 正・負・ゼロの前日比表示
 * - ラベル表示制御
 * - 数値フォーマット（カンマ区切り）
 * - アクセシビリティ（aria-label）
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffIndicator } from './DiffIndicator'

describe('DiffIndicator', () => {
  describe('正常系', () => {
    it('should render positive diff with up indicator and green color', () => {
      // Arrange
      const diff = 1500

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: ▲ +1,500 / 前日比 が緑色で表示される
      expect(screen.getByText(/▲/)).toBeInTheDocument()
      expect(screen.getByText(/\+1,500/)).toBeInTheDocument()
      expect(screen.getByText(/前日比/)).toBeInTheDocument()
      // 色はaria-labelまたはdata属性で検証（styleの直接検証は実装詳細に依存するため避ける）
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('data-variant', 'positive')
    })

    it('should render negative diff with down indicator and red color', () => {
      // Arrange
      const diff = -200

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: ▼ -200 / 前日比 が赤色で表示される
      expect(screen.getByText(/▼/)).toBeInTheDocument()
      expect(screen.getByText(/-200/)).toBeInTheDocument()
      expect(screen.getByText(/前日比/)).toBeInTheDocument()
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('data-variant', 'negative')
    })

    it('should render zero diff with neutral color', () => {
      // Arrange
      const diff = 0

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: ± 0 / 前日比 がテキスト色で表示される
      expect(screen.getByText(/± 0/)).toBeInTheDocument()
      expect(screen.getByText(/前日比/)).toBeInTheDocument()
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('data-variant', 'neutral')
    })
  })

  describe('ラベル表示制御', () => {
    it('should hide label when showLabel is false', () => {
      // Arrange
      const diff = 100

      // Act
      render(<DiffIndicator diff={diff} showLabel={false} />)

      // Assert: ▲ +100 は表示されるが「/ 前日比」ラベルは非表示
      expect(screen.getByText(/\+100/)).toBeInTheDocument()
      expect(screen.queryByText(/前日比/)).not.toBeInTheDocument()
    })
  })

  describe('数値フォーマット', () => {
    it('should format large numbers with commas', () => {
      // Arrange: W-3対応 - 1万を超える資材数はカンマ区切りで表示
      const diff = 12500

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: +12,500 のようにカンマ区切りで表示される
      expect(screen.getByText(/\+12,500/)).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('should have accessible aria-label for positive diff', () => {
      // Arrange
      const diff = 100

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: スクリーンリーダー向けに「前日比: +100 増加」と読み上げられる
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-label', '前日比: +100 増加')
    })

    it('should have accessible aria-label for negative diff', () => {
      // Arrange
      const diff = -50

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: スクリーンリーダー向けに「前日比: -50 減少」と読み上げられる
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-label', '前日比: -50 減少')
    })

    it('should have accessible aria-label for zero diff', () => {
      // Arrange
      const diff = 0

      // Act
      render(<DiffIndicator diff={diff} />)

      // Assert: スクリーンリーダー向けに「前日比: 変化なし」と読み上げられる
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-label', '前日比: 変化なし')
    })
  })
})
