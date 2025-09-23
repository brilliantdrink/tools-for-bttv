import {Accessor, createEffect, from} from 'solid-js'

export default class Dispatcher {
  listeners: Record<string, ((value: any) => void)[]>
  lastValues: Record<string, any>
  changeTimeouts: Record<string, number>

  constructor() {
    this.listeners = {}
    this.lastValues = {}
    this.changeTimeouts = {}
  }

  change(id: string, newValue: any) {
    this.lastValues[id] = newValue
    this.listeners[id]?.forEach(callback => callback(newValue))
  }

  defaultValue(id: string, value: any) {
    if (id in this.lastValues) return
    this.lastValues[id] = value
  }

  onChange(id: string, callback: (value: any) => void): () => boolean {
    this.listeners[id] ??= []
    this.listeners[id].push(callback)
    if (id in this.lastValues) callback(this.lastValues[id])
    return () => {
      const listeners = this.listeners[id]
      if (!listeners) return false
      const index = listeners?.indexOf(callback)
      if (index == -1) return false
      delete listeners[index]
      return true
    }
  }
}

const dispatcher = new Dispatcher()

export function createGlobalSignal<T>(id: string, defaultValue: T): [Accessor<T | undefined>, (value: T) => void] {
  const value = from<T>(set => {
    return dispatcher.onChange(id, set)
  })

  createEffect(() => {
    dispatcher.defaultValue(id, defaultValue)
  })

  return [value, (value: T) => dispatcher.change(id, value)]
}
