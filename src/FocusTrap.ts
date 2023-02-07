import { clamp, findLastIndex } from 'lodash'
import { focusFirst, focusLast } from './domutil'

export default class FocusTrap {

  private constructor(
    public containers: Element[],
    private readonly options: FocusTrapOptions = {},
  ) {}

  //------
  // Stack

  private static stack: FocusTrap[] = []
  private static direction: -1 | 1 = 1

  public static push(containers: Element[]) {
    if (containers.length === 0) {
      return () => { /* noop */ }
    }

    const trap = new FocusTrap(containers)
    this.stack.push(trap)
    if (this.stack.length === 1) {
      document.addEventListener('focus', this.focusHandler, {capture: true})
      document.addEventListener('keydown', this.keyDownHandler, {capture: true})
    }

    return () => {
      const index = this.stack.indexOf(trap)
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
  }

  private static focusHandler = (event: FocusEvent) => {
    const trap = this.stack[this.stack.length - 1]
    if (trap == null) { return }

    return trap.focusHandler(event)
  }

  private static keyDownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      this.direction = event.shiftKey ? -1 : 1
    }
  }

  //------
  // Containers

  private currentContainerIndex: number | null = null

  private focusHandler = (event: FocusEvent) => {
    const {target} = event
    if (!(target instanceof HTMLElement)) { return }

    // Find the container that contains the target element. Go reverse to try to find the closest ancestor first.
    const index = findLastIndex(this.containers, it => it.contains(target))

    if (index >= 0) {
      // If the element is found in any of our containers, allow the focus. Remember where
      // we were
      this.currentContainerIndex = index
    } else {
      // If not, check where we were last, and focus on the first element of the next container.
      // If we were at the last, loop around to the beginning. If we were not in any container,
      // focus on the first element of the first container.

      const {extremes = 'cycle'} = this.options

      let nextIndex = this.currentContainerIndex ?? (FocusTrap.direction === 1 ? -1 : this.containers.length)
      nextIndex += FocusTrap.direction

      if (extremes === 'cycle') {
        while (nextIndex < 0) { nextIndex += this.containers.length }
        while (nextIndex >= this.containers.length) { nextIndex -= this.containers.length }
      } else {
        nextIndex = clamp(nextIndex, 0, this.containers.length - 1)
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      const focused = FocusTrap.direction > 0
        ? focusFirst(this.containers[nextIndex], {ignoreAutofocusAttribute: true})
        : focusLast(this.containers[nextIndex], {ignoreAutofocusAttribute: true})

      if (!focused && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }

}

export interface FocusTrapOptions {
  extremes?: 'clamp' | 'cycle'
}