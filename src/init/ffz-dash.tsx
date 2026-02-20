import {render} from 'solid-js/web'
import {queryFutureElement} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import EmoteBadges from '../dash-widget/emote-badges'
import {DashWidget} from '../dash-widget/dash-widget'
import {CurrentChannelProvider} from '../util/track-current-channel'
import getChannelNames from '../ffz-get-channel-names'

export const emoteIdFromLinkRegex = /emoticon\/([^-]+)-[^/]+/

export default async function initFfzDash() {
  const ffzEmotesChannelNames = getChannelNames()
  document.querySelectorAll('#emote-form .emote-name').forEach(element => {
    render(() => {
      const emoteId = element.querySelector('a')?.href.match(emoteIdFromLinkRegex)?.[1] ?? ''
      return (
        <CurrentChannelProvider provider={EmoteProvider.FFZ}>
          <EmoteBadges emoteId={emoteId} provider={EmoteProvider.FFZ} />
        </CurrentChannelProvider>
      )
    }, element)
  })
  const ffzDashSidebar = await queryFutureElement('#sidebar') as HTMLDivElement
  return render(
    () => (
      <CurrentChannelProvider provider={EmoteProvider.FFZ}>
        <DashWidget provider={EmoteProvider.FFZ} channelNames={ffzEmotesChannelNames} />
      </CurrentChannelProvider>
    ),
    ffzDashSidebar
  )
}
