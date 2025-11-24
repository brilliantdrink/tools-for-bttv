const cache: Record<string, Promise<string>> = new Proxy({}, {
  set(target: Record<string, any>, p: string, newValue: any): boolean {
    const timeoutP = '__timeout-' + p
    clearTimeout(target[timeoutP])
    target[p] = newValue
    target[timeoutP] = setTimeout(() => {
      delete target[p]
      delete target[timeoutP]
    }, 2000)
    return true
  }
})

class HookedXMLHttpRequest extends XMLHttpRequest {
  declare readyState: XMLHttpRequest["UNSENT"] | XMLHttpRequest["OPENED"] | XMLHttpRequest["HEADERS_RECEIVED"] | XMLHttpRequest["LOADING"] | XMLHttpRequest["DONE"]

  open(method: string, url: string | URL): void
  open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
    let resolveCachePromise: (value: (PromiseLike<string> | string)) => void
    if (method.toLowerCase() === 'get') {
      cache[url.toString()] = new Promise<string>(resolve => resolveCachePromise = resolve)
    }
    if (async === undefined) {
      super.open(method, url)
    } else {
      super.open(method, url, async, username, password)
    }
    if (method.toLowerCase() === 'get') this.addEventListener("load", () => {
      if (this.readyState !== XMLHttpRequest.DONE) return
      resolveCachePromise(this.responseText)
    })
  }
}

window.XMLHttpRequest = HookedXMLHttpRequest

const nativeFetch = fetch
window.fetch = async (input, init) => {
  let url, method = 'get'
  if (typeof input === "string") {
    url = input
    if (init?.method) method = init?.method.toLowerCase()
  } else if (input instanceof URL) {
    url = input.toString()
    if (init?.method) method = init?.method.toLowerCase()
  } else {
    url = input.url
    if (input.method) method = input.method.toLowerCase()
  }
  if (url in cache) {
    return new Response(await cache[url], {status: 200})
  }

  let resolveCachePromise: (value: (PromiseLike<string> | string)) => void
  if (method === 'get') {
    cache[url] = new Promise<string>(resolve => resolveCachePromise = resolve)
  }
  // const object: { stack?: string } = {}
  // Error.captureStackTrace(object)
  // console.log(object.stack)
  return nativeFetch(input, init).then(response => {
    if (method === 'get' && response.ok) {
      response.clone().text().then(text => {
        resolveCachePromise(text)
      })
    } else {
      delete cache[url]
    }
    return response
  })
}
