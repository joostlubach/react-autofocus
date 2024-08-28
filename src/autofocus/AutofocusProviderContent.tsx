import { isFunction } from 'lodash'
import React from 'react'
import { useTimer } from 'react-timer'
import FocusTrap from '../FocusTrap'
import { focusFirst } from '../domutil'
import { AutofocusContext } from './AutofocusContext'
import { AutofocusProviderProps } from './AutofocusProvider'

export interface AutofocusProviderContentProps extends Omit<AutofocusProviderProps, 'enabled'> {
  enabled: boolean
}

export const AutofocusProviderContent = (props: AutofocusProviderContentProps) => {

  const {
    enabled,
    defaultFocus,
    containerRef,
    trap,
    children,
  } = props

  const timer = useTimer()
  const prevEnabled = React.useRef(enabled)

  React.useLayoutEffect(() => {
    if (defaultFocus === false) { return }

    if (enabled === prevEnabled.current) { return }
    prevEnabled.current = enabled

    if (!enabled) { return }

    // Use a timer, because we allow specific components with `autoFocus` functionality to go first. Only if
    // none of them have set their focus, the `focusFirst` function will actually set the focus (through its
    // `default` option which is `true` by default. Sorry for the confusing naming here.)

    timer.setTimeout(() => {
      const container = isFunction(containerRef) ? containerRef() : containerRef?.current
      if (container == null) { return }

      const options =
        defaultFocus === true ? {} :
          typeof defaultFocus === 'string' ? {selector: defaultFocus} :
            defaultFocus

      // First try to focus on an explicit autofocus control. If not found, simply focus
      // on the first element.
      if (!focusFirst(container, {...options, autofocus: true})) {
        focusFirst(container, options)
      }
    }, 0)
  }, [containerRef, defaultFocus, enabled, prevEnabled, timer])

  React.useLayoutEffect(() => {
    if (!trap) { return }

    const container = isFunction(containerRef) ? containerRef() : containerRef?.current
    if (container == null) { return }

    if (trap === 'exclude' && !enabled) {
      return FocusTrap.exclude(container)
    }

    if (trap === true && enabled) {
      return FocusTrap.trap(container)
    }
  }, [trap, containerRef, enabled])

  const context = React.useMemo((): AutofocusContext => ({
    enabled,
    containerRef,
  }), [containerRef, enabled])

  return (
    <AutofocusContext.Provider value={context}>
      {children}
    </AutofocusContext.Provider>
  )

}

export interface AutofocusRootProps {
  children?: React.ReactNode
}
