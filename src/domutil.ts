import config from './config'

export function focusFirst(container: Element, options: FocusFirstOptions = {}) {
  const {
    selector = focusableSelectors(options).join(', '),
    select   = false,
    default: _default = true,
  } = options

  if (_default && container.contains(document.activeElement)) {
    return
  }

  const focusables = Array.from(container.querySelectorAll(selector)).filter(it => it instanceof HTMLElement) as HTMLElement[]
  if (focusables.length === 0) { return }

  focusables[0].focus()
  if (select && focusables[0] instanceof HTMLInputElement) {
    focusables[0].select()
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

export interface FocusFirstOptions extends FocusableSelectorOptions {
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
}

