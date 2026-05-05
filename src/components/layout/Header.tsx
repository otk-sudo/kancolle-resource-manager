import { memo } from 'react'
import { NavLink } from 'react-router-dom'

interface Props {
  isDark: boolean
  onToggleTheme: () => void
}

export const Header = memo(function Header({ isDark, onToggleTheme }: Props) {
  const navStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    padding: '6px 14px',
    color: isActive ? '#fff' : 'var(--text-s)',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    background: isActive ? 'var(--blue)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      height: '58px',
      background: 'var(--bg-dark)',
      borderBottom: '1px solid var(--border)',
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>
        <div style={{
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--cyan)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
        }}>
          ⚓ 提督資材管理
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          <NavLink to="/" end style={navStyle}>ダッシュボード</NavLink>
          <NavLink to="/forecast" style={navStyle}>達成予測</NavLink>
        </nav>

        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-s)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
})
