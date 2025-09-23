import {createEffect, createSignal, on} from 'solid-js'
import {createGlobalSignal} from './global-signal'

export function createBatchedValues<T>(key: string, id: string, value: T, timeout = 500, maxBatchSize = 24) {
  const [timeoutId, setTimeoutId] = createGlobalSignal<number>(`batchedValues-${key}-timeout`, -1)
  const [batchedValues, setBatchedValues] = createGlobalSignal<Record<string, T>>(`batchedValues-${key}-values`, {})
  const [flushCb, setFlushCb] = createGlobalSignal<Record<string, (values: T[]) => void>>(`batchedValues-${key}-flush`, {})
  const [localValues, setLocalValues] = createSignal<T[] | null>(null)

  function flushToSignal() {
    Array.from(Object.values(flushCb() ?? {}))
      .forEach((flush) => flush(Object.values(batchedValues() ?? {})))
    setBatchedValues({})
    setFlushCb({})
  }

  createEffect(on(batchedValues, batchedValues => {
    if (localValues() !== null) return
    if (!batchedValues || id in batchedValues) return
    clearTimeout(timeoutId())
    const newBatchedValues = {...batchedValues}
    newBatchedValues[id] = value
    setBatchedValues(newBatchedValues)
    setFlushCb({...flushCb(), [id]: (values) => setLocalValues(values)})
    if (Object.values(newBatchedValues).length === maxBatchSize) flushToSignal()
    else setTimeoutId(setTimeout(() => flushToSignal(), timeout) as unknown as number)
  }))

  return localValues
}
