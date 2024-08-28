import React from 'react'

export interface AutofocusContext {
  enabled:       boolean
  containerRef?: React.RefObject<Element> | (() => Element | null | undefined)
}

export const AutofocusContext = React.createContext<AutofocusContext>({
  enabled: true,
})