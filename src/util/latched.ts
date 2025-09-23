import {Accessor, createMemo} from 'solid-js'

export function createLatched<T>(signal: Accessor<T>, condition?: (value: T | undefined) => boolean) {
  condition ??= Boolean
  return createMemo<T | undefined>((prev): T | undefined => {
    if (condition(prev)) return prev
    else return signal()
  })
}
