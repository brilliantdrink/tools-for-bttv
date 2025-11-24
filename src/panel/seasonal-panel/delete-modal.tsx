import {Accessor, createEffect, createSignal, For, Resource, Show} from 'solid-js'
import cn from 'classnames'
import Modal from '../../modal'
import {EmoteCard} from '../../emote-card'
import {createSeasonalGroupsResource, Emote, EmoteGroup} from './seasonal-query'
import {EmoteData, EmoteProvider} from '../../util/emote-context'
import {authFetch} from '../../util/auth-fetch'
import {Spinner} from '../../spinner'

import seasonalPanelStyle from '../seasonal-panel.module.scss'

export enum DeleteModalType {
  Group = 'Group',
  Emote = 'Emote',
}

export function createDeleteModalSignals() {
  const [open, setOpen] = createSignal(false)
  const [type, setType] = createSignal(DeleteModalType.Group)
  const [loading, setLoading] = createSignal(false)
  return {
    open, setOpen,
    type, setType,
    loading, setLoading,
  }
}

interface DeleteModalProps {
  provider: EmoteProvider
  channelId: Accessor<string | null>
  signals: ReturnType<typeof createDeleteModalSignals>
  currentGroup: Accessor<EmoteGroup | null>
  currentPair: Accessor<[Emote, Emote] | undefined>
  seasonalGroups: ReturnType<typeof createSeasonalGroupsResource>
  emotes: Accessor<EmoteData[]>
}

export function DeleteModal(props: DeleteModalProps) {
  createEffect(() => {
    if (!props.signals.open()) {
      props.signals.setLoading(false)
    }
  })

  function confirm() {
    props.signals.setLoading(true)
    const currentGroupValue = props.currentGroup()
    if (!currentGroupValue) {
      // todo show error
      return
    }
    if (props.signals.type() === DeleteModalType.Group) {
      authFetch(`https://${API_HOST}/group/${props.channelId()}/${currentGroupValue.id}`, {method: 'DELETE'})
        .then(() => {
          props.seasonalGroups.mutateSeasonalGroups(props.seasonalGroups.seasonalGroupsArray()
            .filter(group => group.id !== currentGroupValue.id))
          props.signals.setOpen(false)
        })
    } else if (props.signals.type() === DeleteModalType.Emote) {
      authFetch(`https://${API_HOST}/group/${props.channelId()}/${currentGroupValue.id}/${props.provider.toLowerCase()}/${props.currentPair()?.[0].providerId}`, {
        method: 'DELETE',
      }).then(() => {
        props.seasonalGroups.mutateSeasonalGroups(props.seasonalGroups.seasonalGroupsArray().map(group => {
          if (group.id !== currentGroupValue.id) return group
          return {
            ...group,
            emotes: group.emotes.filter(([target]) => target.providerId !== props.currentPair()?.[0].providerId)
          }
        }))
        props.signals.setOpen(false)
      })
    }
  }

  return (
    <Modal class={cn(seasonalPanelStyle.modal)} open={props.signals.open} setOpen={props.signals.setOpen}
           closeOnOverlayClick={true} provider={props.provider}>
      <p class={seasonalPanelStyle.heading}>
        <Show when={props.signals.type() === DeleteModalType.Group}>
          Delete Seasonal Group "{props.currentGroup()?.name}"
        </Show>
        <Show when={props.signals.type() === DeleteModalType.Emote}>
          Remove Emote "{props.currentPair()?.[0].code}"
        </Show>
      </p>
      <Show when={props.signals.type() === DeleteModalType.Group}>
        <p>This group has {props.currentGroup()?.emotes.length} seasonal
          emote{props.currentGroup()?.emotes.length === 1 ? '' : 's'}.</p>
      </Show>
      <Show when={props.signals.type() === DeleteModalType.Emote}>
        <p>from group "{props.currentGroup()?.name}"</p>
        <div class={seasonalPanelStyle.emoteDisplay}>
          <For each={props.currentPair() ?? []}>{emote =>
            <EmoteCard showProvider={false} emote={{
              ...emote,
              id: emote.providerId,
              provider: emote.provider.toUpperCase() as EmoteProvider
            }} />
          }</For>
        </div>
      </Show>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.destructive)}
              disabled={props.signals.loading()} onClick={confirm}>
        <Show when={props.signals.loading()}>
          <Spinner />
        </Show>
        <Show when={props.signals.type() === DeleteModalType.Group}>
          Delete
        </Show>
        <Show when={props.signals.type() === DeleteModalType.Emote}>
          Remove
        </Show>
      </button>
    </Modal>
  )

}
