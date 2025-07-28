import { useCallback, useEffect, useRef } from 'react'

export const useDebouncedCallback = <T extends (...args: Array<any>) => void>(
  cb: T,
  delay: number,
) => {
  const cbRef = useRef(cb)
  useEffect(() => {
    cbRef.current = cb
  }, [cb])
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        cbRef.current(...args)
      }, delay)
    },
    [delay],
  )
}
