import {Accessor, createEffect, createMemo, JSX, Show} from 'solid-js'
import {SetStoreFunction} from 'solid-js/store'
import {FiLink} from 'solid-icons/fi'
import {AiTwotoneQuestionCircle} from 'solid-icons/ai'
import cn from 'classnames'
import {FaSolidArrowRight, FaSolidPlus} from 'solid-icons/fa'
import {TbOutlineSlash} from 'solid-icons/tb'
import {EmoteCard, EmoteCardProps} from '../../emote-card'
import {Checkbox} from '../../checkbox'
import {Emote} from './seasonal-query'
import {EmoteProvider} from '../../util/emote-context'
import {ApplyModalType} from './apply-modal'

import styles from './apply-modal.module.scss'
import emoteCardStyles from '../../emote-card.module.scss'

export function EmoteReplacement(props: {
  applyEmotes: Record<string, boolean>
  setApplyEmotes: SetStoreFunction<Record<string, boolean>>
  pair: [Emote | string, Emote | string],
  mode: ApplyModalType.Apply | ApplyModalType.Unapply | 'Link'
  unapplicable?: string
  uncheckable?: Accessor<boolean>
  showProvider?: boolean
  onClick0?: JSX.EventHandler<HTMLDivElement, MouseEvent>;
  onClick1?: JSX.EventHandler<HTMLDivElement, MouseEvent>;
}) {
  const checked = createMemo(() => typeof props.pair[0] !== 'string' ? (props.applyEmotes[props.pair[0].providerId] ?? !props.unapplicable) : false)
  createEffect(() => {
    if (typeof props.pair[0] === 'string') return
    props.setApplyEmotes(props.pair[0].providerId, checked())
  })
  const emotesName = createMemo(() => {
    const code0 = typeof props.pair[0] !== 'string' ? props.pair[0].code : props.pair[0]
    if (props.mode === ApplyModalType.Apply || props.mode === ApplyModalType.Unapply) {
      return [code0, code0]
    } else return [code0, typeof props.pair[1] !== 'string' ? props.pair[1].code : props.pair[1]]
  })
  const existingEmote = createMemo(() => props.mode !== ApplyModalType.Unapply ? props.pair[0] : props.pair[1])
  const newEmote = createMemo(() => props.mode !== ApplyModalType.Unapply ? props.pair[1] : props.pair[0])

  return (
    <div class={cn(styles.applyItem)}>
      <Checkbox class={styles.check} checked={checked} setChecked={arg => {
        const newValue = typeof arg === 'function' ? arg(checked()) : arg
        if (props.uncheckable?.() && newValue) return
        if (typeof props.pair[0] === 'string') return
        props.setApplyEmotes(props.pair[0].providerId, newValue)
      }} />
      <Show when={typeof existingEmote() !== 'string'}
            fallback={<EmptyEmoteCard label={existingEmote() as string} class={styles.emote}
                                      onClick={props.onClick0 ?? (() => 0)} />}>
        <EmoteCard class={cn(styles.emote, !props.onClick0 && styles.noninteractive)} mark={props.unapplicable}
                   showProvider={props.showProvider ?? false}
                   onClick={props.onClick0 ?? (() => 0)}
                   emote={{
                     id: (existingEmote() as Emote).providerId,
                     code: emotesName()[0],
                     provider: (existingEmote() as Emote).provider.toUpperCase() as EmoteProvider
                   }} />
      </Show>
      <div class={styles.arrow}>
        <Show when={props.mode === ApplyModalType.Apply || props.mode === ApplyModalType.Unapply}>
          <FaSolidArrowRight />
          <Show when={!checked()}>
            <TbOutlineSlash class={styles.scale} />
          </Show>
          <Show when={checked() && props.unapplicable}>
            <FaSolidPlus class={cn(styles.sub, styles.asShadow)} />
            <FaSolidPlus class={styles.sub} />
          </Show>
          <Show when={checked() && props.unapplicable}>
            <FaSolidPlus class={cn(styles.sub, styles.asShadow)} />
            <FaSolidPlus class={styles.sub} />
          </Show>
        </Show>
        <Show when={props.mode === 'Link'}>
          <FiLink />
        </Show>
      </div>
      <Show when={typeof newEmote() !== 'string'}
            fallback={<EmptyEmoteCard label={newEmote() as string} class={styles.emote}
                                      onClick={props.onClick0 ?? (() => 0)} />}>
        <EmoteCard class={cn(styles.emote, !props.onClick1 && styles.noninteractive)}
                   showProvider={props.showProvider ?? false}
                   onClick={props.onClick1 ?? (() => 0)}
                   emote={{
                     id: (newEmote() as Emote).providerId,
                     code: emotesName()[1],
                     provider: (newEmote() as Emote).provider.toUpperCase() as EmoteProvider
                   }} />
      </Show>
    </div>
  )
}

function EmptyEmoteCard(props: Omit<EmoteCardProps, 'emote'> & { label: string }) {
  return (
    <div onClick={props.onClick} class={cn(
      props.class,
      emoteCardStyles.emoteWrapper,
      props.showProvider === false && emoteCardStyles.morePadding
    )}>
      <AiTwotoneQuestionCircle class={cn(emoteCardStyles.emoteImage, emoteCardStyles.questionIcon)} />
      <span class={cn(emoteCardStyles.emoteName, emoteCardStyles.cardLabel)}>{props.label}</span>
    </div>
  )
}
