import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { parseResourceCsv, detectFormat } from '../lib/csvImport'
import { useResourceStore } from '../stores/resourceStore'
import { useCsvWatchStore } from '../stores/csvWatchStore'

interface CsvDiffPayload {
  path: string
  text: string
}

/**
 * Rustバックエンドからの csv-diff イベントを受信し、
 * 資材履歴と現在値を自動更新するフック。
 * App.tsx のルートコンポーネントで1回だけ呼び出す。
 */
export function useCsvListener() {
  useEffect(() => {
    const unlisten = listen<CsvDiffPayload>('csv-diff', ({ payload }) => {
      const { path, text } = payload
      if (!text.trim()) return

      // 登録済みターゲットからフォーマットを特定（なければ自動検出）
      const targets = useCsvWatchStore.getState().targets
      const target  = targets.find(t => t.path === path)
      const format  = target?.format ?? detectFormat(text)

      const records = parseResourceCsv(text, format)
      if (records.length === 0) return

      useResourceStore.getState().importHistory(records)
      useCsvWatchStore.getState().setLastImportAt(new Date().toISOString())

      // 最新レコードの値でダッシュボードの現在値を一括更新
      const latest = records[records.length - 1]
      useResourceStore.getState().updateFromLatest(latest)
    })

    return () => { unlisten.then(fn => fn()) }
  }, [])
}
