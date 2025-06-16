import isEqual from 'fast-deep-equal'
import {authFetch} from './auth-fetch'

const fetchObjects = Array<[RequestInfo | URL, (RequestInit & { debounceTime?: number }) | null]>()
const keys = Array<string>()
const resolves: Record<string, (response: Response) => void> = {}
const promises: Record<string, Promise<Response>> = {}
const timeouts: Record<string, number> = {}

/***
 @description fetch() but it batches requests with the same parameters to reduce duplicated requests.
 */
export function batchedFetch(input: RequestInfo | URL, init?: RequestInit & { debounceTime?: number, useAuth?: true }) {
  if (!init) init = {}
  const debounceTime = init.debounceTime ?? 100
  const reqData = [input, init ?? null] as [RequestInfo | URL, (RequestInit & { debounceTime?: number }) | null]
  let existing = fetchObjects.findIndex(obj => isEqual(obj, reqData))
  if (existing === -1) {
    existing = fetchObjects.push(reqData) - 1
    keys[existing] = crypto.randomUUID()
    promises[keys[existing]] = new Promise<Response>(resolve => resolves[keys[existing]] = resolve)
  }
  const key = keys[existing]
  if (key in timeouts) clearTimeout(timeouts[key])
  timeouts[key] = setTimeout(() => {
    const index = keys.indexOf(key)
    const resolve = resolves[key]
    fetchObjects.splice(index, 1)
    keys.splice(index, 1)
    delete resolves[key]
    delete promises[key]
    delete timeouts[key]
    let json: any = null
    ;(init?.useAuth ? authFetch : fetch)(input, init).then(response => {
      const consumeJson = response.json.bind(response)
      response.json = () => {
        if (!json) json = consumeJson()
        return json
      }
      resolve(response)
    })
  }, debounceTime) as unknown as number
  return promises[key]
}
