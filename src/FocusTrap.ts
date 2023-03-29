import { findLastIndex } from 'lodash'
import { findFocusablesIn } from './domutil'

export default class FocusTrap {

  private constructor(
    public container: Element,
    public mode: FocusTrapMode,
  ) {}

  //------
  // Stack

  private static stack: FocusTrap[] = []
  private static direction: -1 | 1 = 1

  public static trap(container: Element) {
    return this.append(container, FocusTrapMode.trap)
  }

  public static exclude(container: Element) {
    return this.append(container, FocusTrapMode.exclude)
  }

  private static append(container: Element, mode: FocusTrapMode) {
    const trap = new FocusTrap(container, mode)

    // Find the index where to append the trap. We need to ensure that the list is always sorted
    // from outer element to inner element, e.g. that a trap later in the list does not correspond
    // to a container that is an ancestor of a container in an earlier trap.

    const index = this.stack.findIndex(it => !it.container.contains(container))
    if (index < 0) {
      this.stack.push(trap)
    } else {
      this.stack.splice(index, 0, trap)
    }

    if (this.stack.length === 1) {
      document.addEventListener('focus', this.focusHandler, {capture: true})
      document.addEventListener('keydown', this.keyDownHandler, {capture: true})
    }

    return this.remove.bind(this, container)
  }

  public static remove(container: Element) {
    const index = this.stack.findIndex(it => it.container === container)
    if (index < 0) {
      console.warn("Focus trap stack is out of sync. This is likely a bug in the application code.")
      return
    }

    this.stack.splice(index, 1)
    if (this.stack.length === 0) {
      document.removeEventListener('focus', this.focusHandler, {capture: true})
      document.removeEventListener('keydown', this.keyDownHandler, {capture: true})
    }
  }

  //------
  // Trap logic

  private static keyDownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      this.direction = event.shiftKey ? -1 : 1
    }
  }

  private static focusHandler = (event: FocusEvent) => {
    const {target} = event
    if (!(target instanceof HTMLElement)) { return }

    // Find the closest container that is a trap. As we've already sorted the stack from
    // outer to inner, we can just find the last index.
    const index = findLastIndex(this.stack, it => it.container.contains(target))
    const trap  = index < 0 ? null : this.stack[index]

    let allowed: boolean
    if (trap == null) {
      // The focus is outside of all traps. If there is ANY trap that has `trap.exclude === false`,
      // this is disallowed.
      allowed = this.stack.every(it => it.mode === FocusTrapMode.exclude)
    } else {
      // The focus is inside a trap. It's only allowed if the trap is in `trap` mode.
      allowed = trap.mode === FocusTrapMode.trap
    }

    if (!allowed) {
      // If not allowed, prevent the focus.
      event.preventDefault()
      event.stopImmediatePropagation()

      // Also, focus on the next allowed element.
      this.focusNextAllowed(target)
    }
  }

  private static focusNextAllowed(element: HTMLElement) {
    // Find the closest container of the element that allows focus.

    let container: Element | null = element
    while (container != null) {
      // eslint-disable-next-line no-loop-func
      const trap = this.stack.find(it => it.container === container)
      if (trap?.mode === FocusTrapMode.trap) {
        break
      } else {
        container = container.parentElement
      }
    }

    // If not found, we use the body as the fallback.
    container ??= document.body

    // Find all focusables in that container and put them in a flat list.
    const focusables = findFocusablesIn(container)
    const startIndex = focusables.indexOf(element)

    const next = (index: number) => {
      const nextIndex = index + this.direction
      if (nextIndex < 0) {
        return focusables.length - 1
      } else if (nextIndex >= focusables.length) {
        return 0
      } else {
        return nextIndex
      }
    }

    const isAllowed = (element: HTMLElement) => {
      return !this.stack.some(it => it.mode === FocusTrapMode.exclude && it.container.contains(element))
    }

    for (let index = next(startIndex); index != null; index = next(index)) {
      if (isAllowed(focusables[index])) {
        // We've found an allowed element to focus on.
        focusables[index].focus()
        break
      } else if (index === startIndex) {
        // We've cycled around and found no element to focus on. Blur the current one.
        element.blur()
        break
      }
    }
  }

}

export enum FocusTrapMode {
  trap,
  exclude,
}

export interface FocusTrapOptions {
  extremes?: 'clamp' | 'cycle'
}