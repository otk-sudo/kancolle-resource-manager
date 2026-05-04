import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Dashboard } from './pages/Dashboard'
import { ImprovementPlanner } from './pages/ImprovementPlanner'
import { Forecast } from './pages/Forecast'
import { MissionManager } from './pages/MissionManager'

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
        <Route path="/planner"  element={<ImprovementPlanner />} />
        <Route path="/missions" element={<MissionManager />} />
        <Route path="/forecast" element={<Forecast />} />
      </Routes>
    </HashRouter>
  )
}

export default App
