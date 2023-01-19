import config from './config'

export function focusFirst(container: Element, options: FocusInContainerOptions = {}) {
  focusFirstOrLast(container, true, options)
}

export function focusLast(container: Element, options: FocusInContainerOptions = {}) {
  focusFirstOrLast(container, false, options)
}

function focusFirstOrLast(container: Element, first: boolean, options: FocusInContainerOptions = {}) {
  const {
    selector = focusableSelectors(options).join(', '),
    select   = false,
    default: _default = true,
    ignoreAutofocusAttribute = false,
  } = options

  if (_default && container.contains(document.activeElement)) {
    return
  }

  let focusables = Array.from(container.querySelectorAll(selector))
    .filter(it => it instanceof HTMLElement) as HTMLElement[]

  if (!ignoreAutofocusAttribute) {
    focusables = focusables.filter(it => ignoreAutofocusAttribute || it.autofocus)
  }
  if (focusables.length === 0) { return }

  const focusable = first ? focusables[0] : focusables[focusables.length - 1]
  focusable.focus()
  if (select && focusable instanceof HTMLInputElement) {
    focusable.select()
  }
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

export interface FocusInContainerOptions extends FocusableSelectorOptions {
  /**
   * Specify any specific CSS selector to find focusable elements.
   */
  selector?: string

  /**
   * Select on focus (input elements only)?
   */
  select?:  boolean

  /**
   * Only perform the focus if no other element within the container is focused (default: true).
   */
  default?: boolean

  /**
   * Whether to ignore the autofocus attribute on inputs.
   */
  ignoreAutofocusAttribute?: boolean
}