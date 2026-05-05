import { memo } from 'react'

interface Props {
  version: string
  downloading: boolean
  onInstall: () => void
}

export const UpdateBanner = memo(function UpdateBanner({ version, downloading, onInstall }: Props) {
  return (
    <div style={{
      background: 'var(--blue)',
      color: '#fff',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontSize: '13px',
      fontWeight: 600,
    }}>
      <span>新しいバージョン v{version} が利用可能です</span>
      <button
        onClick={onInstall}
        disabled={downloading}
        style={{
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 600,
          background: '#fff',
          color: 'var(--blue)',
          border: 'none',
          borderRadius: '4px',
          cursor: downloading ? 'wait' : 'pointer',
          opacity: downloading ? 0.7 : 1,
        }}
      >
        {downloading ? 'ダウンロード中...' : '今すぐ更新'}
      </button>
    </div>
  )
})
