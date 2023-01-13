import React from 'react'
import { useTimer } from 'react-timer'
import { isFunction } from 'lodash'
import { memo } from '~/ui/component'
import { focusFirst, FocusFirstOptions } from './domutil'

interface AutofocusContext {
  enabled: boolean
}

const AutofocusContext = React.createContext<AutofocusContext>({
  enabled: true,
})

export interface AutofocusProviderProps {
  /**
   * Specify whether autofocus is enabled for this container. This serves two purposes:
   *
   * 1. If `enabled={false}`, any component that wants to autofocus will not do so. This may be useful e.g.
   *    to prevent popups from appearing immediately when a modal dialog appears.
   * 2. If any container transitions from `enabled={false}` to `enabled={true}`, at that moment, the first
   *    autofocusable component will be focused. This allows for autofocus to happen when popups or dialogs
   *    appear, or when a form is split into multiple 'screens'.
   */
  enabled: boolean | ((parentEnabled: boolean) => boolean)

  /**
   * Optionally specify a default focus target. The value `true` is interpreted as: the first focusable
   * component (see configuration). Any string value is interpreted as a selector. Note that you have
   * to specify {@link containerRef} as well for this to work.
   */
  defaultFocus?: boolean | string | FocusFirstOptions

  /**
   * Specify a ref to the container element that contains the focusable components. This is required
   * for {@link defaultFocus} to work.
   */
  containerRef?: React.RefObject<Element> | (() => Element | null)

  /** Children. */
  children?: React.ReactNode
}

export const AutofocusProvider = memo('AutofocusProvider', (props: AutofocusProviderProps) => {

  const {
    enabled,
  } = props

  const renderContent = React.useCallback((parent: AutofocusContext) => {
    return (
      <AutofocusProviderContent
        {...props}
        enabled={isFunction(enabled) ? enabled(parent.enabled) : enabled && parent.enabled}
      />
    )
  }, [enabled, props])

  return (
    <AutofocusContext.Consumer>
      {renderContent}
    </AutofocusContext.Consumer>
  )

})

interface AutofocusProviderContentProps extends Omit<AutofocusProviderProps, 'enabled'> {
  enabled: boolean
}

const AutofocusProviderContent = memo('AutofocusProviderContent', (props: AutofocusProviderContentProps) => {

  const {
    enabled,
    defaultFocus,
    containerRef,
    children,
  } = props

  const timer = useTimer()

  React.useLayoutEffect(() => {
    if (defaultFocus === false) { return }

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

      focusFirst(container, options)
    }, 0)
  }, [containerRef, defaultFocus, timer])

  const context = React.useMemo((): AutofocusContext => ({enabled}), [enabled])

  return (
    <AutofocusContext.Provider value={context}>
      {children}
    </AutofocusContext.Provider>
  )

})

export interface AutofocusRootProps {
  children?: React.ReactNode
}

export function useAutofocusContext() {
  return React.useContext(AutofocusContext)
}

export function useAutofocus(callback: () => any) {
  const {enabled} = useAutofocusContext()
  const prevEnabledRef = React.useRef<boolean>()

  React.useLayoutEffect(() => {
    const prevEnabled = prevEnabledRef.current
    if (!prevEnabled && enabled) {
      callback()
    }
  }, [callback, enabled])
}