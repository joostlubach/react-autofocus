import React from 'react'
import { useTimer } from 'react-timer'
import { isFunction } from 'lodash'
import { focusFirst, FocusInContainerOptions } from './domutil'
import FocusTrap from './FocusTrap'

interface AutofocusContext {
  enabled:       boolean
  containerRef?: React.RefObject<Element> | (() => Element | null | undefined)
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
   * component (see configuration). Any string value is interpreted as a selector.
   *
   * Note that you have to specify {@link containerRef} as well for this to work.
   */
  defaultFocus?: boolean | string | FocusInContainerOptions

  /**
   * Set to true to trap or exclude the focus in this container. This is useful for modal dialogs, where
   * you want to prevent the user from accidentally focusing something outside the dialog, o
   * alternatively for tab panels, where you want to prevent the user from focusing in invisible tabs
   * which for some reason is left in the DOM.
   *
   * Setting it to `true` will trap the focus inside the container. Setting it to `'exclude'` will
   * instead prevent focus from getting into the container if {@link enabled} is set to `false`.
   */
  trap?: boolean | 'exclude'

  /**
   * Specify a ref to the container element that contains the focusable components. If you don't
   * specify it, the container from the next `<AutofocusProvider/>` up is used.
   */
  containerRef?: RefLike<Element>

  /** Children. */
  children?: React.ReactNode
}

export type RefLike<E> = React.RefObject<E> | (() => E | null | undefined)

export const AutofocusProvider = (props: AutofocusProviderProps) => {

  const {
    enabled,
  } = props

  const renderContent = React.useCallback((parent: AutofocusContext) => {
    return (
      <AutofocusProviderContent
        {...props}
        enabled={isFunction(enabled) ? enabled(parent.enabled) : enabled && parent.enabled}
        containerRef={props.containerRef ?? parent.containerRef}
      />
    )
  }, [enabled, props])

  return (
    <AutofocusContext.Consumer>
      {renderContent}
    </AutofocusContext.Consumer>
  )

}

interface AutofocusProviderContentProps extends Omit<AutofocusProviderProps, 'enabled'> {
  enabled: boolean
}

const AutofocusProviderContent = (props: AutofocusProviderContentProps) => {

  const {
    enabled,
    defaultFocus,
    containerRef,
    trap,
    children,
  } = props

  const timer       = useTimer()
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
    if  (container == null) { return }

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