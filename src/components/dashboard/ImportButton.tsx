import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { detectFormat } from '../../lib/csvImport'
import { useCsvWatchStore } from '../../stores/csvWatchStore'

/** バイト列をUTF-8またはShift-JISとしてデコードする */
function decodeBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('shift-jis').decode(bytes)
  }
}

export function ImportButton() {
  const { targets, watching, lastImportAt, addTarget, removeTarget, startWatch, stopWatch } =
    useCsvWatchStore()
  const [error, setError] = useState<string | null>(null)

  const handleAddFile = async () => {
    setError(null)
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'CSV/TSV', extensions: ['csv', 'tsv', 'txt', 'log'] }],
      })
      if (!selected || typeof selected !== 'string') return

      const bytes  = await readFile(selected)
      const text   = decodeBytes(bytes)
      const format = detectFormat(text)
      if (format === 'unknown') {
        setError('対応していないフォーマットです。七四式または航海日誌のCSVを選択してください。')
        return
      }

      const label = selected.split(/[\\/]/).pop() ?? selected
      addTarget({ path: selected, format, label })
    } catch (e) {
      setError(String(e))
    }
  }

  const handleToggleWatch = async () => {
    setError(null)
    try {
      if (watching) {
        await stopWatch()
      } else {
        await startWatch()
      }
    } catch (e) {
      setError(String(e))
    }
  }

  const fmt = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return `${d.toLocaleDateString('ja-JP')} ${d.toLocaleTimeString('ja-JP')}`
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* 監視ON/OFF */}
        <button
          onClick={handleToggleWatch}
          disabled={targets.length === 0}
          style={{
            padding: '7px 16px', fontSize: '13px', fontWeight: 600,
            background: watching ? '#dc2626' : 'var(--blue)',
            border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer',
            opacity: targets.length === 0 ? 0.5 : 1,
          }}
        >
          {watching ? '監視停止' : '監視開始'}
        </button>

        {/* ファイル追加 */}
        <button
          onClick={handleAddFile}
          style={{
            padding: '7px 14px', fontSize: '13px', fontWeight: 600,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '6px', color: 'var(--text-m)', cursor: 'pointer',
          }}
        >
          + CSVファイルを追加
        </button>

        {/* 最終取込日時 */}
        {lastImportAt && (
          <span style={{ fontSize: '11px', color: 'var(--text-s)' }}>
            最終取込: {fmt(lastImportAt)}
          </span>
        )}

        {/* 監視中インジケータ */}
        {watching && (
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
            background: '#16a34a22', color: '#16a34a',
          }}>
            監視中
          </span>
        )}
      </div>

      {/* 登録済みファイル一覧 */}
      {targets.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {targets.map(t => (
            <div key={t.path} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', color: 'var(--text-s)',
            }}>
              <span style={{
                padding: '1px 6px', borderRadius: '4px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: '10px',
              }}>
                {t.format === 'nanashiki' ? '七四式' : '航海日誌'}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.label}
              </span>
              <button
                onClick={() => removeTarget(t.path)}
                disabled={watching}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-s)', fontSize: '12px', padding: '0 4px',
                  opacity: watching ? 0.4 : 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>{error}</p>
      )}
    </div>
  )
}
