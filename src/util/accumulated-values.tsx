import {Accessor, createEffect, createMemo, on} from 'solid-js'
import {createGlobalSignal} from './global-signal'
import {createScheduled, debounce} from '@solid-primitives/scheduled'

type BatchedResourceData<T> = Record<string, T>

export function createAccumulatedValues<T, V extends boolean | undefined = false>(key: string, id: string, value: Accessor<T>, returnIds?: V) {
  returnIds ??= false as V
  const [accumulatedValues, setAccumulatedValues] = createGlobalSignal<BatchedResourceData<T>>(`accumulatedValues-${key}`, {})
  const scheduled = createScheduled(fn => debounce(fn, 100));

  createEffect(on([accumulatedValues, value], ([accumulatedValues, value]) => {
    if (!accumulatedValues || accumulatedValues[id] === value) return
    setAccumulatedValues({...accumulatedValues, [id]: value})
  }))

  return createMemo((prev) => {
    if (scheduled()) {
      if (returnIds) return accumulatedValues()
      else return Object.values(accumulatedValues() ?? {})
    } else return prev
  }) as V extends true ? Accessor<Record<string, T>> : Accessor<T[]>
}
