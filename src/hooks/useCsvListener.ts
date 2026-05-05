import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { parseResourceCsv, detectFormat } from '../lib/csvImport'
import { useResourceStore } from '../stores/resourceStore'
import { useCsvWatchStore } from '../stores/csvWatchStore'

interface CsvDiffPayload {
  path: string
  text: string
}

export function useCsvListener() {
  useEffect(() => {
    const unlisten = listen<CsvDiffPayload>('csv-diff', ({ payload }) => {
      const { path, text } = payload
      if (!text.trim()) return

      // ファイルパスからフォーマットを特定
      const targets = useCsvWatchStore.getState().targets
      const target  = targets.find(t => t.path === path)
      const format  = target?.format ?? detectFormat(text)

      const records = parseResourceCsv(text, format)
      if (records.length === 0) return

      useResourceStore.getState().importHistory(records)
      useCsvWatchStore.getState().setLastImportAt(new Date().toISOString())

      // 最新レコードで現在値も更新
      const latest = records[records.length - 1]
      const { setBasicResource, setSpecialResource } = useResourceStore.getState()
      setBasicResource('fuel',  latest.fuel)
      setBasicResource('ammo',  latest.ammo)
      setBasicResource('steel', latest.steel)
      setBasicResource('baux',  latest.baux)
      setSpecialResource('instantRepair',   latest.instantRepair)
      setSpecialResource('instantBuild',    latest.instantBuild)
      setSpecialResource('devMaterial',     latest.devMaterial)
      setSpecialResource('improveMaterial', latest.improveMaterial)
    })

    return () => { unlisten.then(fn => fn()) }
  }, [])
}
