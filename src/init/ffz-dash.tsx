import {render} from 'solid-js/web'
import {queryFutureElement} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import EmoteBadges from '../dash-widget/emote-badges'
import {DashWidget} from '../dash-widget/dash-widget'

const emoteIdFromLinkRegex = /emoticon\/([^-]+)-[^/]+/

export default async function initFfzDash() {
  console.log(document.querySelectorAll('#emote-form .emote-name'))
  document.querySelectorAll('#emote-form .emote-name').forEach(element => {
    render(() => {
      const emoteId = element.querySelector('a')?.href.match(emoteIdFromLinkRegex)?.[1] ?? ''
      return <EmoteBadges emoteId={emoteId} provider={EmoteProvider.FFZ} />
    }, element)
  })
  const ffzDashSidebar = await queryFutureElement('#sidebar') as HTMLDivElement
  return render(
    () => <DashWidget provider={EmoteProvider.FFZ} />,
    ffzDashSidebar
  )
}
