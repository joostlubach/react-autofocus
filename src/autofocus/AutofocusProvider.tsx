import { isFunction } from 'lodash'
import React, { ReactNode, useCallback } from 'react'
import { memo } from 'react-util'
import { FocusInContainerOptions } from '../domutil'
import { AutofocusContainer } from './AutofocusContainer'
import { AutofocusContext } from './AutofocusContext'
import { RefLike } from './types'

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
  enabled?: boolean | ((parentEnabled: boolean) => boolean)

  /**
   * For more control over timing, you can use a content key. The idea is that whenever this key changes,
   * the focus will be reset. This is useful for example when you have a tab panel, and you want to
   * automatically focus the first element in the new tab.
   */
  contentKey?: any

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
  children?: ReactNode
}

export const AutofocusProvider = memo('AutofocusProvider', (props: AutofocusProviderProps) => {

  const {
    enabled = true,
  } = props

  const renderContent = useCallback((parent: AutofocusContext) => {
    return (
      <AutofocusContainer
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

})