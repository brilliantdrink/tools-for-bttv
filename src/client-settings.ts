import {createSignal, onMount, Setter, Signal} from 'solid-js'

export const clientSettings = {
  getKey(key: string): string {
    return 'tfb-client-' + key
  },
  set(key: string, content: string) {
    key = this.getKey(key)
    if (localStorage.getItem(key) === content) return false
    localStorage.setItem(key, content)
    if (key in this.listeners) for (const callback of this.listeners[key]) {
      callback(content)
    }
  },
  setJSON(key: string, content: any) {
    this.set(key, JSON.stringify(content))
  },
  get(key: string) {
    return localStorage.getItem(this.getKey(key))
  },
  getJSON(key: string) {
    const value = this.get(key)
    if (value) {
      try {
        return JSON.parse(value)
      } catch (e) {
        return value
      }
    } else return value
  },
  remove(key: string) {
    key = this.getKey(key)
    if (localStorage.getItem(key) === null) return false
    localStorage.removeItem(key)
    for (const callback of this.listeners[key]) {
      callback(null)
    }
  },
  listeners: {} as Record<string, ((value: string | null) => void)[]>,
  subscribe(key: string, callback: (value: string | null) => void) {
    this.listeners[this.getKey(key)] ??= []
    this.listeners[this.getKey(key)].push(callback)
  },
  subscribeJSON(key: string, callback: (value: string | null) => void) {
    this.subscribe(key, () => callback(this.getJSON(key)))
  }
}

export function createClientSetting<V>(key: string, initialValue: V): Signal<V> {
  const stored: V = clientSettings.getJSON(key)
  const [setting, setSetting] = createSignal<V>(stored === null ? initialValue : stored)

  onMount(() => {
    if (stored === null) clientSettings.setJSON(key, initialValue)
    clientSettings.subscribeJSON(key, setSetting)
  })

  const setter = (...args: Parameters<typeof setSetting>) => {
    const result = setSetting(...args)
    clientSettings.setJSON(key, result)
    return result
  }

  return [setting, setter as Setter<V>]
}
