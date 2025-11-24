import {queryFutureElements} from './util/future-element'
import {clientSettings} from './client-settings'

export async function bttvDashPerfTweaks() {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      el.style.contentVisibility = entry.isIntersecting ? 'visible' : 'hidden'
      let paragraphsInElement = 0
      for (const child of el.children) {
        if (child.tagName === 'P') paragraphsInElement++
      }
      el.style.height = `${paragraphsInElement > 1 ? 134 / 16 : 120 / 16}rem`
    }
  }, {
    rootMargin: '12px',
    threshold: 0
  })

  const abortLazyRendering = new AbortController()

  async function attachLazyRendering() {
    for await (const element of queryFutureElements('[class*=emoteCard_]', {abort: abortLazyRendering.signal, timeout: Infinity}) as AsyncGenerator<HTMLAnchorElement>) {
      observer.observe(element)
    }
  }

  async function detachLazyRendering() {
    abortLazyRendering.abort()
    const elements = queryFutureElements('[class*=emoteCard_]', {timeout: 100})
    observer.disconnect()
    for await (const element of elements) {
      (element as HTMLElement).style.contentVisibility = ''
    }
  }

  if (clientSettings.getJSON('bttv-emote-lazy-rendering') !== false) attachLazyRendering()

  clientSettings.subscribeJSON('bttv-emote-lazy-rendering', value => {
    if (value) attachLazyRendering()
    else detachLazyRendering()
  })

  /* todo: add fill empty emote cards */
}
