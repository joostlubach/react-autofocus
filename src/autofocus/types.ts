import React from 'react'

export type RefLike<E> = React.RefObject<E | null> | (() => E | null | undefined)