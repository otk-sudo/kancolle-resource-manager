import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { useThemeStore } from './themeStore'

// localStorage はブラウザAPIのため、テスト環境（jsdom）でモックして動作を制御する
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('useThemeStore', () => {
  beforeEach(() => {
    // 各テスト前に localStorage モックと Zustand ストアをリセットする
    localStorageMock.clear()
    ;(localStorageMock.getItem as Mock).mockClear()
    ;(localStorageMock.setItem as Mock).mockClear()

    // ストアを初期状態にリセットする
    useThemeStore.setState({ isDark: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('正常系', () => {
    it('should initialize with dark theme by default', () => {
      // Arrange: localStorage に何も保存されていない状態
      localStorageMock.clear()

      // Act: ストアの初期状態を取得する
      const { isDark } = useThemeStore.getState()

      // Assert: デフォルトは isDark が true であること
      expect(isDark).toBe(true)
    })

    it('should load theme from localStorage if available', () => {
      // Arrange: localStorage に 'light' テーマが保存されている状態を用意する
      ;(localStorageMock.getItem as Mock).mockReturnValueOnce('light')

      // Act: ストアを localStorage の値で初期化する
      useThemeStore.getState().initFromStorage()
      const { isDark } = useThemeStore.getState()

      // Assert: localStorage の 'light' を読み込んで isDark が false になること
      expect(isDark).toBe(false)
    })

    it('should toggle theme', () => {
      // Arrange: 初期状態は isDark === true
      const { isDark: initialIsDark } = useThemeStore.getState()
      expect(initialIsDark).toBe(true)

      // Act: toggleTheme を呼び出す
      useThemeStore.getState().toggleTheme()

      // Assert: isDark が反転して false になること
      const { isDark } = useThemeStore.getState()
      expect(isDark).toBe(false)

      // さらにもう1回 toggle して true に戻ることも確認
      useThemeStore.getState().toggleTheme()
      expect(useThemeStore.getState().isDark).toBe(true)
    })

    it('should persist theme to localStorage on toggle', () => {
      // Arrange: 初期状態は isDark === true（dark テーマ）
      const { toggleTheme } = useThemeStore.getState()

      // Act: toggleTheme を呼び出す（dark → light）
      toggleTheme()

      // Assert: localStorage に 'light' が保存されること
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')

      // Act: さらに toggleTheme を呼び出す（light → dark）
      toggleTheme()

      // Assert: localStorage に 'dark' が保存されること
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })
  })

  describe('エッジケース', () => {
    it('should treat unknown localStorage value as dark theme', () => {
      // Arrange: localStorage に不正な値が保存されている
      ;(localStorageMock.getItem as Mock).mockReturnValueOnce('invalid-value')

      // Act: ストアを localStorage の値で初期化する
      useThemeStore.getState().initFromStorage()
      const { isDark } = useThemeStore.getState()

      // Assert: 不正な値の場合はデフォルト（isDark === true）にフォールバックすること
      expect(isDark).toBe(true)
    })

    it('should treat null localStorage value as dark theme', () => {
      // Arrange: localStorage に 'theme' キーが存在しない（null が返る）
      ;(localStorageMock.getItem as Mock).mockReturnValueOnce(null)

      // Act: ストアを localStorage の値で初期化する
      useThemeStore.getState().initFromStorage()
      const { isDark } = useThemeStore.getState()

      // Assert: null の場合はデフォルト（isDark === true）のままであること
      expect(isDark).toBe(true)
    })
  })
})
