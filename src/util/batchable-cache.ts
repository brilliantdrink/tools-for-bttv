import {CacheEntry} from '@solid-primitives/resource'

export function makeBatchableCache(cacheKeyToDataKey?: (key: string) => string) {
  cacheKeyToDataKey ??= v => v
  return new Proxy({}, {
    get(target: Record<string, CacheEntry<any, any>>, p: string, receiver: any): CacheEntry<any, any> {
      if (p.includes(',')) {
        const keys = p.split(',')
        const value: CacheEntry<any, any> = {data: {}, source: null, ts: 0}
        for (const key of keys) {
          value.data = {
            ...value.data,
            ...target[key]
          }
          value.source = target[key].source
          value.ts = Math.min(value.ts, target[key].ts)
        }
        return value
      } else {
        return target[p]
      }
    },
    set(target: Record<string, CacheEntry<any, any>>, p: string, newValue: CacheEntry<any, any>, receiver: any): boolean {
      if (p.includes(',') && 'data' in newValue && newValue.data.constructor === {}.constructor) {
        const keys = p.split(',')
        for (let i = 0; i < keys.length; i++) {
          target[keys[i]] = {...newValue, data: {[keys[i]]: newValue.data[cacheKeyToDataKey(keys[i])]}}
        }
        return true
      } else {
        target[p] = newValue
        return true
      }
    },
    has(target: Record<string, CacheEntry<any, any>>, p: string): boolean {
      if (p.includes(',')) {
        let ret = true
        for (const key of p.split(',')) {
          ret &&= key in target
        }
        return ret
      } else {
        return p in target
      }
    }
  })
}
