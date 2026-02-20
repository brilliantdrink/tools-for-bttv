import {Accessor, createEffect, createMemo, createSignal, Setter, Show} from 'solid-js'
import cn from 'classnames'
import {authFetch} from '../../util/auth-fetch'
import Modal from '../../modal'
import {createSeasonalGroupsResource, EmoteGroup} from './seasonal-query'
import {EmoteProvider} from '../../util/emote-context'
import {Spinner} from '../../spinner'
import error, {ErrorType} from '../../util/error'

import seasonalPanelStyle from '../seasonal-panel.module.scss'

export enum GroupModalType {
  Create = 'Create',
  Edit = 'Edit',
}

export function createGroupModalSignals() {
  const [open, setOpen] = createSignal(false)
  const [type, setType] = createSignal(GroupModalType.Create)
  const [textInput, setTextInput] = createSignal<string>('')
  const [loading, setLoading] = createSignal(false)
  const buttonDisabled = createMemo(() => {
    return loading() || !textInput()
  })
  return {
    open, setOpen,
    type, setType,
    textInput, setTextInput,
    buttonDisabled, loading, setLoading,
  }
}

interface GroupModalProps {
  channelId: Accessor<string | null>
  signals: ReturnType<typeof createGroupModalSignals>
  currentGroup: Accessor<EmoteGroup | null>
  setCurrentGroup: Setter<EmoteGroup | null>
  seasonalGroups: ReturnType<typeof createSeasonalGroupsResource>
  provider: EmoteProvider
}

export function GroupModal(props: GroupModalProps) {
  createEffect(() => {
    if (!props.signals.open()) {
      props.setCurrentGroup(null)
      props.signals.setTextInput('')
      props.signals.setLoading(false)
    } else {
      if (props.signals.type() === GroupModalType.Edit) {
        props.signals.setTextInput(props.currentGroup()?.name ?? '')
      }
    }
  })

  function confirm() {
    props.signals.setLoading(true)
    if (props.signals.type() === GroupModalType.Create) {
      authFetch(`https://${API_HOST}/group/${props.channelId()}/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: props.signals.textInput()}),
      }).then(res => res.json())
        .then(newGroup => {
          props.seasonalGroups.mutateSeasonalGroups([...props.seasonalGroups.seasonalGroupsArray(), newGroup])
          props.signals.setOpen(false)
        })
    } else if (props.signals.type() === GroupModalType.Edit) {
      const currentGroupValue = props.currentGroup()
      if (!currentGroupValue) {
        error({
          type: ErrorType.Action,
          provider: props.provider,
          name: 'confirm (GroupModal)',
          message: 'Couldn\'t update group',
          detail: `currentGroupValue is falsy: ${currentGroupValue}`,
        })
        return
      }
      authFetch(`https://${API_HOST}/group/${props.channelId()}/${currentGroupValue.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: props.signals.textInput()}),
      }).then(() => {
        props.seasonalGroups.mutateSeasonalGroups(props.seasonalGroups.seasonalGroupsArray().map(group => {
          if (group.id !== currentGroupValue.id) return group
          return {...group, name: props.signals.textInput()}
        }))
        props.signals.setOpen(false)
      })
    }
  }

  return (
    <Modal class={seasonalPanelStyle.modal} open={props.signals.open} setOpen={props.signals.setOpen}
           closeOnOverlayClick={true} provider={props.provider}>
      <p class={seasonalPanelStyle.heading}>
        <Show when={props.signals.type() === GroupModalType.Create}>
          Create Seasonal Group
        </Show>
        <Show when={props.signals.type() === GroupModalType.Edit}>
          Edit Seasonal Group
        </Show>
      </p>
      <label class={seasonalPanelStyle.label}>
        <span>Name</span>
        <input class={cn(seasonalPanelStyle.input)} autofocus={true}
               value={props.signals.textInput()} onInput={e => props.signals.setTextInput(e.target.value)}
               onKeyDown={e => e.code === 'Enter' && confirm()} />
      </label>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.primary)}
              disabled={props.signals.buttonDisabled()}
              onClick={confirm}>
        <Show when={props.signals.loading()}>
          <Spinner />
        </Show>
        <Show when={props.signals.type() === GroupModalType.Create}>
          Create
        </Show>
        <Show when={props.signals.type() === GroupModalType.Edit}>
          Save
        </Show>
      </button>
    </Modal>
  )
}
