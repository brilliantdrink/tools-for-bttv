import {createSignal, JSX, onMount, Show} from 'solid-js'
import cn from 'classnames'
import {EmoteData, EmoteProvider} from './util/emote-context'
import {bttvEmoteImage, bttvEmoteLink, ffzEmoteImage, ffzEmoteLink} from './variables'

import emoteCardStyles from './emote-card.module.scss'
import {Dynamic} from 'solid-js/web'
import {FaSolidCheck} from 'solid-icons/fa'
import {createVisibilityObserver} from '@solid-primitives/intersection-observer'

export function EmoteCard(props: {
  emote: EmoteData,
  showProvider?: boolean,
  onClick?: JSX.EventHandler<HTMLDivElement, MouseEvent>
  class?: string
  checked?: boolean
}) {
  let pageUrl: string = null!, imageUrl: string = null!, animatedImageUrl: string = null!
  if (props.emote.provider === EmoteProvider.BTTV) {
    pageUrl = bttvEmoteLink(props.emote.id)
    imageUrl = bttvEmoteImage(props.emote.id)
  } else if (props.emote.provider === EmoteProvider.FFZ) {
    pageUrl = ffzEmoteLink(props.emote.id, props.emote.code)
    animatedImageUrl = ffzEmoteImage(props.emote.id, true)
    imageUrl = ffzEmoteImage(props.emote.id, false)
  }

  let emoteName: HTMLSpanElement,
    emoteCard: HTMLAnchorElement | HTMLDivElement

  const useVisibilityObserver = createVisibilityObserver({threshold: 0, rootMargin: '20px'})
  const visible = useVisibilityObserver(() => emoteCard)
  const [lockedHeight, setLockedHeight] = createSignal<number | null>(null)

  onMount(() => {
    const width = emoteName.getBoundingClientRect().width
    const supposedWidth = emoteCard.getBoundingClientRect().width
    const maxHeight = supposedWidth - (2 * .4 * 16)
    if (width < maxHeight) return
    emoteName.style.fontSize = `calc(var(--card-font-size) * ${maxHeight / width})`
  })

  return (<>
    <Dynamic component={(childProps: any) => !props.onClick
      ? <a ref={el => emoteCard = el} href={pageUrl} {...childProps} />
      : <div ref={el => emoteCard = el} onClick={props.onClick} {...childProps} />}
             class={cn(
               props.class,
               emoteCardStyles.emoteWrapper,
               props.showProvider === false && emoteCardStyles.morePadding,
               !visible() && lockedHeight() !== null && emoteCardStyles.hideContents
             )} style={{height: lockedHeight() + 'px'}}>
      <Show when={props.checked}>
        <div class={emoteCardStyles.check}>
          <FaSolidCheck />
        </div>
      </Show>
      <img
        class={emoteCardStyles.emoteImage}
        onLoad={ev => {
          setLockedHeight((ev.currentTarget.parentElement as HTMLElement).getBoundingClientRect().height)
        }}
        onError={ev => {
          if (props.emote.provider === EmoteProvider.FFZ)
            ev.currentTarget.src = imageUrl
        }}
        src={props.emote.provider === EmoteProvider.FFZ ? animatedImageUrl : imageUrl}
      />
      <span class={emoteCardStyles.emoteName} ref={el => emoteName = el}>{props.emote.code}</span>
      <Show when={props.showProvider !== false}>
        <div class={emoteCardStyles.emoteProviderWrapper}>
          <div class={cn(
            emoteCardStyles.emoteProvider,
            emoteCardStyles[props.emote.provider.toLowerCase()]
          )} />
          <Show when={props.emote.global}>
            <span class={emoteCardStyles.globalTag}>(Global)</span>
          </Show>
        </div>
      </Show>
    </Dynamic>
  </>)
}
