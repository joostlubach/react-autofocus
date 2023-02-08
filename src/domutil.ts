import config from './config'

export function focusFirst(container: Element, options: FocusInContainerOptions = {}) {
  return focusFirstOrLast(container, true, options)
}

export function focusLast(container: Element, options: FocusInContainerOptions = {}) {
  return focusFirstOrLast(container, false, options)
}

export function findFocusablesIn(container: Element, options: FocusInContainerOptions = {}) {
  const {
    selector  = focusableSelectors(options).join(', '),
    autofocus = false,
  } = options

  let focusables = Array.from(container.querySelectorAll(selector))
    .filter(it => it instanceof HTMLElement) as HTMLElement[]

  if (autofocus) {
    focusables = focusables.filter(it => it.autofocus)
  }

  return focusables
}

function focusFirstOrLast(container: Element, first: boolean, options: FocusInContainerOptions = {}) {
  const {
    default: _default = true,
    select = false,
  } = options

  if (_default && container.contains(document.activeElement)) {
    return false
  }

  const focusables = findFocusablesIn(container, options)
  if (focusables.length === 0) { return false }

  const focusable = first ? focusables[0] : focusables[focusables.length - 1]

  focusable.focus()
  if (select && focusable instanceof HTMLInputElement) {
    focusable.select()
  }

  return true
}

export function focusableSelectors(options: FocusableSelectorOptions = {}) {
  const {
    fields  = true,
    buttons = true,
    exclude = config.selectors.exclude,
  } = options

  const excludeSuffix =  exclude.map(it => `:not(${it})`).join('')

  const selectors =
    fields && buttons ? config.selectors.focusable :
    fields ? config.selectors.fields :
    config.selectors.buttons

  return selectors.map(it => `${it}${excludeSuffix}`)
}

export interface FocusableSelectorOptions {
  fields?:   boolean
  buttons?:  boolean
  exclude?:  string[]
}

export interface FindFocusableOptions extends FocusableSelectorOptions {
  /**
   * Specify any specific CSS selector to find focusable elements.
   */
  selector?: string

  /**
   * Set to `true` to exclude all elements that don't have an `autofocus` attribute.
   */
  autofocus?: boolean
}

export interface FocusInContainerOptions extends FindFocusableOptions {
  /**
   * Select on focus (input elements only)?
   */
  select?:  boolean

  /**
   * Only perform the focus if no other element within the container is focused (default: true).
   */
  default?: boolean
}