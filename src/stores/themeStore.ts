import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  initFromStorage: () => void
}

/**
 * テーマ（ダーク/ライト）を管理する Zustand ストア。
 * persist middleware は使わず、localStorage を手動で操作する。
 */
export const useThemeStore = create<ThemeState>((set) => ({
  // デフォルトはダーク優先
  isDark: true,

  // isDark を反転させ、localStorage に保存
  toggleTheme: () =>
    set(state => {
      const newIsDark = !state.isDark
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      return { isDark: newIsDark }
    }),

  // localStorage からテーマを読み込み isDark を復元
  // 不正な値や未設定の場合は isDark: true にフォールバック
  initFromStorage: () => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'light' ? false : true
    set({ isDark })
  },
}))
