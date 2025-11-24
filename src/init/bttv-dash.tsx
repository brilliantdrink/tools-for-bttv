import {render} from 'solid-js/web'
import debounce from 'lodash.debounce'
import {queryFutureElement, queryFutureElements} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import EmoteBadges from '../dash-widget/emote-badges'
import {DashWidget} from '../dash-widget/dash-widget'
import {CurrentChannelProvider} from '../util/track-current-channel'

const emoteIdFromLinkRegex = /emotes\/([^/]+)/

export default async function initBttvDash(attachDelay: number) {
  const detachWidget = render(
    () => (
      <CurrentChannelProvider provider={EmoteProvider.BTTV}>
        <DashWidget provider={EmoteProvider.BTTV} />
      </CurrentChannelProvider>
    ),
    await queryFutureElement('.chakra-tabs:has([role="tablist"])') as HTMLDivElement
  )
  let detachEmotes: (() => void)[] = []
  const abort = new AbortController()

  const detachBadges = debounce(() => {
    observer.disconnect()
    abort.abort()
    detachEmotes.forEach(cb => cb())
    detachEmotes = []
  }, attachDelay, {leading: true, trailing: false})
  const attachBadges = debounce(async () => {
    observer.observe(
      await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement,
      {childList: true, subtree: true}
    )
    for await (const element of queryFutureElements('[class*=emoteCard_]', {abort: abort.signal}) as AsyncGenerator<HTMLAnchorElement>) {
      detachEmotes.push(
        render(() => {
          const emoteId = element.href.match(emoteIdFromLinkRegex)?.[1] ?? ''
          return (
            <CurrentChannelProvider provider={EmoteProvider.BTTV}>
              <EmoteBadges emoteId={emoteId} provider={EmoteProvider.BTTV} />
            </CurrentChannelProvider>
          )
        }, element)
      )
    }
  }, attachDelay, {leading: false, trailing: true})

  const reattach = () => {
    detachBadges()
    attachBadges()
  }
  const observer = new MutationObserver(reattach)

  attachBadges()

  return () => {
    detachWidget()
    observer.disconnect()
    abort.abort()
    detachEmotes.forEach(cb => cb())
  }
}
