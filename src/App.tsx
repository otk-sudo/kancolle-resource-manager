import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Dashboard } from './pages/Dashboard'

function App() {
  // localStorage からテーマを復元、デフォルトはダーク
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  // html要素に .dark クラスを付与してテーマを切り替える
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <HashRouter>
      <Header isDark={isDark} onToggleTheme={() => setIsDark(prev => !prev)} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* 他画面は今後実装 */}
        <Route path="/planner"  element={<div style={{ padding: '24px', color: 'var(--text-s)' }}>改修計画（実装予定）</div>} />
        <Route path="/missions" element={<div style={{ padding: '24px', color: 'var(--text-s)' }}>任務管理（実装予定）</div>} />
        <Route path="/forecast" element={<div style={{ padding: '24px', color: 'var(--text-s)' }}>達成予測（実装予定）</div>} />
      </Routes>
    </HashRouter>
  )
}

export default App
