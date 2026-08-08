import { useEffect, useRef, useState } from 'react'

export type ProxyReadinessStatus = 'idle' | 'checking' | 'ready' | 'unreachable'

const POLL_INTERVAL_MS = 60_000
const URL_CHANGE_DEBOUNCE_MS = 600

export function useProxyReadiness(proxyBaseUrl: string, isLegalUrl: boolean): ProxyReadinessStatus {
  const [status, setStatus] = useState<ProxyReadinessStatus>('idle')
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (!isLegalUrl) {
      setStatus('idle')
      isFirstRun.current = true
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval>
    const debounceId: ReturnType<typeof setTimeout> = setTimeout(
      () => {
        function check() {
          if (cancelled) return
          setStatus('checking')
          fetch(`${proxyBaseUrl.replace(/\/$/, '')}/ready`)
            .then((r) => {
              if (!cancelled) setStatus(r.ok ? 'ready' : 'unreachable')
            })
            .catch(() => {
              if (!cancelled) setStatus('unreachable')
            })
        }

        check()
        intervalId = setInterval(check, POLL_INTERVAL_MS)
      },
      isFirstRun.current ? 0 : URL_CHANGE_DEBOUNCE_MS,
    )

    isFirstRun.current = false

    return () => {
      cancelled = true
      clearTimeout(debounceId)
      clearInterval(intervalId)
    }
  }, [proxyBaseUrl, isLegalUrl])

  return status
}
