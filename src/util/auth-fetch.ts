/***
 @description fetch() but it injects stored authentication for the tfb server.
 */
export function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headerName = 'Authorization'
  const headerValue = `Bearer ${localStorage.getItem('tfb-twitch_code')}`
  init ??= {}
  if (typeof input === 'object' && 'headers' in input) {
    input.headers.set(headerName, headerValue)
  }
  if (!init.headers) {
    init.headers ??= {}
  }
  if (init.headers instanceof Headers) {
    init.headers.set(headerName, headerValue)
  } else if (Array.isArray(init.headers)) {
    init.headers.push([headerName, headerValue])
  } else {
    init.headers[headerName] = headerValue
  }
  return fetch(input, init)
}
