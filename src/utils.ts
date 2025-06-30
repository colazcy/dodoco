import { RefObject } from 'react'

export type Clip = [number, number, number | null]

export const unwrapRef = <T>(ref: RefObject<T | null>): T => {
  const res = ref.current
  if (res === null) throw new Error('Ref is null.')
  return res
}

export const unwrap = <T>(x: T | null): T => {
  if (x === null) throw new Error('Value is null.')
  return x
}
