import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Dashboard } from './pages/Dashboard'
import { Forecast } from './pages/Forecast'
import { UpdateBanner } from './components/UpdateBanner'
import { useCsvListener } from './hooks/useCsvListener'
import { useAutoUpdate } from './hooks/useAutoUpdate'
import { useCsvWatchStore } from './stores/csvWatchStore'

function App() {
  // CSVイベントリスナー起動
  useCsvListener()

  // 自動アップデート確認
  const { status: updateStatus, installUpdate } = useAutoUpdate()

  // 起動時に前回の監視を自動再開
  useEffect(() => {
    const { targets, startWatch } = useCsvWatchStore.getState()
    if (targets.length > 0) {
      startWatch().catch(() => {/* ファイルが存在しない場合は無視 */})
    }
  }, [])

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
      {updateStatus.available && updateStatus.version && (
        <UpdateBanner
          version={updateStatus.version}
          downloading={updateStatus.downloading}
          onInstall={installUpdate}
        />
      )}
      <Header isDark={isDark} onToggleTheme={() => setIsDark(prev => !prev)} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* 他画面は今後実装 */}
        <Route path="/forecast" element={<Forecast />} />
      </Routes>
    </HashRouter>
  )
}

export default App
