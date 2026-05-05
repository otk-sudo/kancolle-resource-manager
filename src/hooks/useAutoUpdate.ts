import { useEffect, useState } from 'react'

interface UpdateStatus {
  checking: boolean
  available: boolean
  version: string | null
  downloading: boolean
  error: string | null
}

/**
 * アプリ起動時に自動アップデートを確認するフック
 * Tauri環境でのみ動作し、ブラウザ(dev)環境ではスキップする
 */
export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    version: null,
    downloading: false,
    error: null,
  })

  useEffect(() => {
    // ブラウザ環境（開発時）ではスキップ
    if (!('__TAURI_INTERNALS__' in window)) return

    let cancelled = false

    async function checkUpdate() {
      setStatus(s => ({ ...s, checking: true }))
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()

        if (cancelled) return

        if (update) {
          setStatus({
            checking: false,
            available: true,
            version: update.version,
            downloading: false,
            error: null,
          })
        } else {
          setStatus(s => ({ ...s, checking: false }))
        }
      } catch (e) {
        if (!cancelled) {
          setStatus(s => ({
            ...s,
            checking: false,
            error: String(e),
          }))
        }
      }
    }

    checkUpdate()

    return () => { cancelled = true }
  }, [])

  const installUpdate = async () => {
    setStatus(s => ({ ...s, downloading: true }))
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const { relaunch } = await import('@tauri-apps/plugin-process')
      const update = await check()
      if (update) {
        await update.downloadAndInstall()
        await relaunch()
      }
    } catch (e) {
      setStatus(s => ({ ...s, downloading: false, error: String(e) }))
    }
  }

  return { status, installUpdate }
}
