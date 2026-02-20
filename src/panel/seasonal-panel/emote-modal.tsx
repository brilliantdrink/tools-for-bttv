import {Accessor, createEffect, createMemo, createResource, createSignal, For, Resource, Show} from 'solid-js'
import {createScheduled, debounce} from '@solid-primitives/scheduled'
import cn from 'classnames'
import levenshtein from 'damerau-levenshtein'
import Modal from '../../modal'
import {EmoteCard} from '../../emote-card'
import {EmoteGroup} from './seasonal-query'
import {EmoteData, EmoteProvider, useEmotes} from '../../util/emote-context'
import {emoteIdFromLinkRegex} from '../../init/ffz-dash'
import Sp from '../../util/space'
import {Spinner} from '../../spinner'

import seasonalPanelStyle from '../seasonal-panel.module.scss'

export enum EmoteModalType {
  AddAlternative = 'AddAlternative',
  AsAlternative = 'AsAlternative',
}

// todo: unify this, move purely local states into component
export function createEmoteModalSignals() {
  const [open, setOpen] = createSignal(false)
  const [type, setType] = createSignal(EmoteModalType.AddAlternative)
  const [search, setSearch] = createSignal('')
  const [selected, setSelected] = createSignal<null | string>(null)
  const [loading, setLoading] = createSignal(false)
  const buttonDisabled = createMemo(() => {
    return loading() || selected() === null
  })
  return {
    open, setOpen,
    type, setType,
    search, setSearch,
    selected, setSelected,
    buttonDisabled, loading, setLoading,
  }
}

interface EmoteModalProps {
  provider: EmoteProvider
  channelId: Accessor<string | null>
  signals: ReturnType<typeof createEmoteModalSignals>
  currentEmote: Resource<EmoteData | null> | Accessor<EmoteData | null>
  currentGroup?: Accessor<EmoteGroup | null>
  onConfirm: () => void
  confirmLabel?: string
}

export function EmoteModal(props: EmoteModalProps) {
  createEffect(() => {
    if (!props.signals.open()) {
      props.signals.setSelected(null)
      props.signals.setSearch('')
      props.signals.setLoading(false)
    }
  })
  const {emotes} = useEmotes(props.channelId)
  const scheduled = createScheduled(fn => debounce(fn, 800))
  const debouncedQuery = createMemo<string>(prev => scheduled() ? props.signals.search() : prev ?? '')
  const [searchedEmotes] = createResource<{
    id: string,
    code: string
  }[], string, unknown>(debouncedQuery, (query) => {
    if (!query || query.length < 3 || !props.signals.open() || props.signals.type() !== EmoteModalType.AddAlternative) return []
    if (props.provider === EmoteProvider.BTTV) {
      return fetch(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(query)}&offset=0&limit=50`)
        .then(res => res.json())
    } else if (props.provider === EmoteProvider.FFZ) {
      return fetch(`https://www.frankerfacez.com/emoticons/?q=${encodeURIComponent(query)}&sort=count-desc&days=0`)
        .then(res => res.text())
        .then(htmlText => {
          htmlText = htmlText.replace(/<\/?(script|link)/g, '&gt;$1')
          const parsed = new DOMParser().parseFromString(htmlText, 'text/html')
          return Array.from(parsed.querySelectorAll<HTMLTableRowElement>('.emote-table tr:has(.emote-name)')).map(row => {
            const linkElement = row.querySelector<HTMLAnchorElement>('.emote-name a')
            const code = linkElement?.innerText
            const id = linkElement?.href.match(emoteIdFromLinkRegex)?.[1]
            if (!id) return
            return {id, code}
          }).filter(v => !!v)
        })
    } else return []
  })
  const selectedEmoteCode = createMemo<string | null>(prev =>
    searchedEmotes()?.find(emote => emote.id === props.signals.selected())?.code ?? prev ?? null
  )

  return (
    <Modal class={cn(seasonalPanelStyle.modal, seasonalPanelStyle.fixedHeight)} open={props.signals.open}
           setOpen={props.signals.setOpen} closeOnOverlayClick={true} provider={props.provider}>
      <p class={seasonalPanelStyle.heading}>
        <Show when={props.signals.type() === EmoteModalType.AsAlternative}>
          Select Non-Seasonal Emote
        </Show>
        <Show when={props.signals.type() === EmoteModalType.AddAlternative}>
          Select Seasonal Alternative
        </Show>
      </p>
      <Show when={props.currentGroup}>
        <p>for group "{props.currentGroup?.()?.name}"</p>
      </Show>
      <small>Currently, only emotes from the same provider ({props.provider}) can be selected</small>
      <label class={seasonalPanelStyle.label}>
        <span>Search</span>
        <input class={cn(seasonalPanelStyle.input)} autofocus={true}
               value={props.signals.search()} onInput={e => props.signals.setSearch(e.target.value)} />
      </label>
      <Show when={props.signals.type() === EmoteModalType.AddAlternative}>
        <small>Search and select from {props.provider}s library</small>
      </Show>
      <Show
        when={props.provider === EmoteProvider.FFZ && selectedEmoteCode() && selectedEmoteCode() !== props.currentEmote()?.code}>
        <small class={seasonalPanelStyle.warn}>
          Emotes cannot be renamed in FFZ, the selected emotes code differs from the
          <Show when={props.signals.type() === EmoteModalType.AddAlternative}>
            <span><Sp />non-seasonal</span>
          </Show>
          <Show when={props.signals.type() === EmoteModalType.AsAlternative}>
            <span><Sp />seasonal</span>
          </Show>
        </small>
      </Show>
      <div class={seasonalPanelStyle.emoteList}>
        <Show when={props.signals.type() === EmoteModalType.AsAlternative}>
          <For each={emotes()?.filter(emote => {
            return emote.provider === props.provider &&
              !emote.global &&
              emote.id !== props.currentEmote()?.id &&
              (!props.signals.search() || levenshtein(props.signals.search().toUpperCase(), emote.code.toUpperCase()).similarity > .1)
          }).sort((emoteA, emoteB) => {
            const search = !props.signals.search() ? (props.currentEmote()?.code ?? '') : props.signals.search()
            return levenshtein(search.toUpperCase(), emoteB.code.toUpperCase()).similarity -
              levenshtein(search.toUpperCase(), emoteA.code.toUpperCase()).similarity
          })}>{emote =>
            <EmoteCard emote={emote} showProvider={false}
                       onClick={() => props.signals.setSelected(emote.id)}
                       checked={props.signals.selected() === emote.id} />
          }</For>
        </Show>
        <Show when={props.signals.type() === EmoteModalType.AddAlternative}>
          <For each={searchedEmotes()}>{emote =>
            <EmoteCard emote={Object.assign(emote, {provider: props.provider})}
                       showProvider={false}
                       onClick={() => props.signals.setSelected(emote.id)}
                       checked={props.signals.selected() === emote.id} />
          }</For>
        </Show>
      </div>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.primary)}
              disabled={props.signals.buttonDisabled()}
              onClick={props.onConfirm}>
        <Show when={props.signals.loading()}>
          <Spinner />
        </Show>
        {props.confirmLabel ?? 'Create'}
      </button>
    </Modal>)
}
