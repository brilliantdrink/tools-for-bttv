import {onMount, Show} from 'solid-js'
import cn from 'classnames'
import {EmoteData, EmoteProvider} from './util/emote-context'
import {bttvEmoteImage, bttvEmoteLink, ffzEmoteImage, ffzEmoteLink} from './variables'

import emoteCardStyles from './emote-card.module.scss'

export function EmoteCard(props: { emote: EmoteData, provider: EmoteProvider }) {
  let pageUrl, imageUrl
  if (props.emote.provider === EmoteProvider.BTTV) {
    pageUrl = bttvEmoteLink(props.emote.id)
    imageUrl = bttvEmoteImage(props.emote.id)
  } else if (props.emote.provider === EmoteProvider.FFZ) {
    pageUrl = ffzEmoteLink(props.emote.id, props.emote.code)
    imageUrl = ffzEmoteImage(props.emote.id, props.emote.animated)
  }

  let emoteNameMount: HTMLSpanElement

  onMount(() => {
    const width = emoteNameMount.getBoundingClientRect().width
    let supposedWidth = 125
    if (props.provider === EmoteProvider.FFZ) supposedWidth = 110
    const maxHeight = supposedWidth - (2 * .4 * 16)
    if (width < maxHeight) return
    emoteNameMount.style.fontSize = `calc(var(--card-font-size) * ${maxHeight / width})`
  })

  return (<>
    <a href={pageUrl} class={emoteCardStyles.emoteWrapper}>
      <img class={emoteCardStyles.emoteImage} src={imageUrl} />
      <span class={emoteCardStyles.emoteName} ref={el => emoteNameMount = el}>{props.emote.code}</span>
      <div class={emoteCardStyles.emoteProviderWrapper}>
        <div class={cn(
          emoteCardStyles.emoteProvider,
          emoteCardStyles[props.emote.provider.toLowerCase()]
        )} />
        <Show when={props.emote.global}><span class={emoteCardStyles.globalTag}>(Global)</span></Show>
      </div>
    </a>
  </>)
}
