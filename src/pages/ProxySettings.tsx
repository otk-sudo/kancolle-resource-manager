import { useState, useEffect } from 'react'
import { useProxyStore } from '../stores/proxyStore'

export function ProxySettings() {
  const { config, running, setConfig, startProxy, stopProxy, refreshStatus, installCaCert } = useProxyStore()
  const [error,   setError]   = useState<string | null>(null)
  const [certMsg, setCertMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { refreshStatus() }, [])

  const handleToggle = async () => {
    setError(null)
    setLoading(true)
    try {
      if (running) {
        await stopProxy()
      } else {
        await startProxy()
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleInstallCert = async () => {
    setCertMsg(null)
    setError(null)
    try {
      await installCaCert()
      setCertMsg('証明書をインストールしました。')
    } catch (e) {
      setError(String(e))
    }
  }

  const useUpstream = config.upstream_host !== null

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '24px' }}>
        プロキシ設定
      </h2>

      {/* ステータス */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>
              プロキシ
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: running ? '#16a34a22' : 'var(--border)',
                color: running ? '#16a34a' : 'var(--text-s)',
              }}>
                {running ? '稼働中' : '停止中'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-s)', marginTop: '4px' }}>
              localhost:{config.port}
            </div>
          </div>
          <button onClick={handleToggle} disabled={loading} style={running ? stopBtnStyle : startBtnStyle}>
            {loading ? '処理中...' : running ? '停止' : '起動'}
          </button>
        </div>
      </section>

      {/* ポート設定 */}
      <section style={cardStyle}>
        <label style={labelStyle}>待受ポート</label>
        <input
          type="number"
          value={config.port}
          min={1024}
          max={65535}
          disabled={running}
          onChange={e => setConfig({ port: Number(e.target.value) })}
          style={inputStyle}
        />
        {running && (
          <p style={{ fontSize: '11px', color: 'var(--text-s)', marginTop: '6px' }}>
            変更する場合はプロキシを停止してください。
          </p>
        )}
      </section>

      {/* 上流プロキシ設定 */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            id="use-upstream"
            checked={useUpstream}
            disabled={running}
            onChange={e => setConfig({
              upstream_host: e.target.checked ? 'localhost' : null,
              upstream_port: e.target.checked ? 8099 : null,
            })}
          />
          <label htmlFor="use-upstream" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', cursor: 'pointer' }}>
            上流プロキシを使用
          </label>
        </div>

        {useUpstream && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ホスト</label>
              <input
                type="text"
                value={config.upstream_host ?? ''}
                disabled={running}
                onChange={e => setConfig({ upstream_host: e.target.value })}
                style={inputStyle}
                placeholder="localhost"
              />
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>ポート</label>
              <input
                type="number"
                value={config.upstream_port ?? ''}
                min={1}
                max={65535}
                disabled={running}
                onChange={e => setConfig({ upstream_port: Number(e.target.value) })}
                style={inputStyle}
                placeholder="8099"
              />
            </div>
          </div>
        )}
      </section>

      {/* CA 証明書 */}
      <section style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '8px' }}>
          CA 証明書
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-s)', marginBottom: '12px', lineHeight: 1.6 }}>
          HTTPS通信を傍受するために、ローカルCA証明書をWindowsにインストールする必要があります。
          管理者権限のダイアログが表示されます。
        </p>
        <button onClick={handleInstallCert} style={certBtnStyle}>
          証明書をインストール
        </button>
        {certMsg && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#16a34a' }}>{certMsg}</p>
        )}
      </section>

      {/* ブラウザ設定ガイド */}
      <section style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '8px' }}>
          七四式EM の設定
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-s)', lineHeight: 1.7 }}>
          七四式EMの設定 → プロキシ → 上流プロキシ に以下を設定してください：<br />
          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>
            localhost:{config.port}
          </code>
        </p>
      </section>

      {/* エラー表示 */}
      {error && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: '#dc262622', border: '1px solid #dc2626',
          borderRadius: '8px', fontSize: '12px', color: '#dc2626',
        }}>
          {error}
        </div>
      )}
    </main>
  )
}

// ──────────────────────────────────────────────
// スタイル定数
// ──────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '16px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-s)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: '13px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-h)',
  boxSizing: 'border-box',
}

const startBtnStyle: React.CSSProperties = {
  padding: '7px 20px',
  fontSize: '13px',
  fontWeight: 600,
  background: 'var(--blue)',
  border: 'none',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
}

const stopBtnStyle: React.CSSProperties = {
  ...startBtnStyle,
  background: '#dc2626',
}

const certBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  fontSize: '13px',
  fontWeight: 600,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-m)',
  cursor: 'pointer',
}
