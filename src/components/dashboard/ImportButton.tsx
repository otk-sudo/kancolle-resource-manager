import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { parseTsv } from '../../lib/parseTsv'
import { useResourceStore } from '../../stores/resourceStore'

/**
 * 航海日誌のTSVファイルを選択してインポートするボタン。
 * Shift-JIS ファイルの読み込みはTauriのreadTextFileに任せる。
 */
export function ImportButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { addHistoryRecord, setBasicResource, setSpecialResource } = useResourceStore()

  const handleImport = async () => {
    try {
      // ファイル選択ダイアログを開く
      const selected = await open({
        filters: [{ name: '資材ログ', extensions: ['csv', 'tsv', 'txt'] }],
        multiple: false,
      })

      if (!selected) return // キャンセル

      setStatus('loading')

      // ファイルを読み込む
      const text = await readTextFile(selected as string)
      const records = parseTsv(text)

      if (records.length === 0) {
        setStatus('error')
        setMessage('有効なデータが見つかりませんでした')
        return
      }

      // 全レコードをストアに追加
      records.forEach(record => addHistoryRecord(record))

      // 最新レコードで現在値を更新
      const latest = records[records.length - 1]
      setBasicResource('fuel',  latest.fuel)
      setBasicResource('ammo',  latest.ammo)
      setBasicResource('steel', latest.steel)
      setBasicResource('baux',  latest.baux)
      setSpecialResource('instantRepair',   latest.instantRepair)
      setSpecialResource('instantBuild',    latest.instantBuild)
      setSpecialResource('devMaterial',     latest.devMaterial)
      setSpecialResource('improveMaterial', latest.improveMaterial)

      setStatus('success')
      setMessage(`${records.length}日分のデータを取り込みました`)

      // 3秒後にメッセージをリセット
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)

    } catch (e) {
      setStatus('error')
      setMessage('ファイルの読み込みに失敗しました')
      console.error(e)
    }
  }

  const btnColor = {
    idle:    'var(--blue)',
    loading: 'var(--text-m)',
    success: 'var(--green)',
    error:   'var(--red)',
  }[status]

  const btnLabel = {
    idle:    '📂 CSVをインポート',
    loading: '読み込み中...',
    success: '✓ 取り込み完了',
    error:   '✗ エラー',
  }[status]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={handleImport}
        disabled={status === 'loading'}
        style={{
          padding: '7px 16px',
          background: btnColor,
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {btnLabel}
      </button>
      {message && (
        <span style={{
          fontSize: '12px',
          color: status === 'error' ? 'var(--red)' : 'var(--green)',
        }}>
          {message}
        </span>
      )}
    </div>
  )
}
