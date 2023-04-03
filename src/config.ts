import { isFunction, merge } from 'lodash'

export interface Config {
  selectors: FocusableSelectors
}

export interface FocusableSelectors {
  focusable: string[]
  fields:    string[]
  buttons:   string[]
  exclude:   string[]
}

const config: Config = {
  selectors: {
    focusable: ['button', 'input', 'select', 'textarea', '[tabindex]', '[href]'],
    fields:    ['input:not([type="button"]):not([type="submit"])', 'select', 'textarea'],
    buttons:   ['input:[type="button"], input[type="submit"]', 'button'],
    exclude:   ['[disabled], [tabindex="-1"]'],
  },
}

export default config

export function configure(cfg: DeepPartial<Config> | ((config: Config) => any)) {
  if (isFunction(cfg)) {
    cfg(config)
  } else {
    merge(config, cfg)
  }
}

type DeepPartial<M> = {
  [k in keyof M]?: M[k] extends Record<string, any> ? DeepPartial<M[k]> : M[k]
}