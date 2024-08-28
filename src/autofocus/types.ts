import React from 'react'

export type RefLike<E> = React.RefObject<E> | (() => E | null | undefined)