import React from 'react'
import { AutofocusContext } from './AutofocusContext'

export function useAutofocusContext() {
  return React.useContext(AutofocusContext)
}

export function useAutofocus(callback: () => any) {
  const {enabled} = useAutofocusContext()
  const prevEnabledRef = React.useRef<boolean>()

  React.useLayoutEffect(() => {
    const prevEnabled = prevEnabledRef.current
    prevEnabledRef.current = enabled

    if (!prevEnabled && enabled) {
      callback()
    }
  }, [callback, enabled])
}