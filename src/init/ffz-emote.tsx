import {render} from 'solid-js/web'
import {EmoteProvider} from '../util/emote-context'
import {DuplicatesPanel} from '../panel/duplicates-panel'
import {EmoteWidget} from '../emote-widget/emote-widget'
import {CurrentChannelProvider} from '../util/track-current-channel'
import getChannelNames from '../ffz-get-channel-names'
import error, {ErrorType} from '../util/error'
import {AttachmentPoints} from '../variables'

export default async function initFfzEmote() {
  const ffzEmoteSidebar = document.querySelector('#sidebar') as HTMLDivElement
  const firstSectionHeader = document.querySelector('h1 ~ h2.page-header') as HTMLHeadingElement
  const widgetContainer = document.createElement('div')
  firstSectionHeader.insertAdjacentElement('beforebegin', widgetContainer)
  const ffzPanelClass = 'panel panel-default'
  const ffzEmoteName = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[2]
  const ffzEmoteId = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[1]
  if (!ffzEmoteName || !ffzEmoteId) {
    error({
      type: ErrorType.Initialisation,
      provider: EmoteProvider.FFZ,
      attachment: AttachmentPoints.FfzEmote,
      message: <span>Something went wrong initializing <i>Tools for BTTV</i></span>,
      detail: `Either emote id or code not found: found id: "${ffzEmoteId}", found name: "${ffzEmoteName}"`,
    })
    return
    }
  const ffzSectionClass = ''
  const ffzSectionClassName = ''
  const ffzHeadingClass = 'panel-heading'
  const ffzEmotesChannelNames = getChannelNames()
  const ffzAppData = {
    emoteName: ffzEmoteName, emoteId: ffzEmoteId, panelClass: ffzPanelClass,
    channelNames: ffzEmotesChannelNames,
    sectionClass: ffzSectionClass, sectionClassName: ffzSectionClassName,
    headingClass: ffzHeadingClass,
  }
  const detachDuplicatesPanel = render(
    () => <DuplicatesPanel provider={EmoteProvider.FFZ} {...ffzAppData} />,
    ffzEmoteSidebar
  )
  const detachEmoteWidget = render(
    () => (
      <CurrentChannelProvider provider={EmoteProvider.FFZ}>
        <EmoteWidget provider={EmoteProvider.FFZ} data={ffzAppData} />
      </CurrentChannelProvider>
    ),
    widgetContainer
  )

  return () => {
    detachDuplicatesPanel()
    detachEmoteWidget()
  }
}
