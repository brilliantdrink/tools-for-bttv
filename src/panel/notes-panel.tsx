import {Accessor, createResource, Show} from 'solid-js'
import cn from 'classnames'
import debounce from 'lodash.debounce'
import StatusCodes from 'http-status-codes'
import {EmoteProvider} from '../util/emote-context'
import {createChannelState} from '../util/channel'
import BttvPanel from '../panel/panel'
import LoginPrompt, {ForbiddenError, GenericError} from '../login-prompt'
import {authFetch} from '../util/auth-fetch'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'

interface NotesPanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  emoteId: string
}

interface ChannelDisplayNameAndId {
  channelDisplayName: Accessor<string>
  channelId: Accessor<string>
}

export function NotesPanel(props: NotesPanelProps | (NotesPanelProps & ChannelDisplayNameAndId)) {
  const channelState = createChannelState(props.provider)
  const channelDisplayName = 'channelDisplayName' in props ? props.channelDisplayName : channelState.channelDisplayName
  const channelId = 'channelId' in props ? props.channelId : channelState.channelId
  const [emoteNotes, {mutate: mutateEmoteNotes, refetch}] = createResource(channelId, async (channelId) => {
    return await authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.emoteId}/notes/${channelId}`)
      .then(async res => {
        if (res.ok) {
          return await res.json() as Promise<{ note: string, doNotRemove: boolean }>
        } else if (res.status === StatusCodes.UNAUTHORIZED || res.status === StatusCodes.FORBIDDEN) {
          return {error: res.status}
        } else {
          return {error: null}
        }
      })
      .catch(() => ({error: null}))
  })

  function toggleEmoteNotesDNR() {
    const currentEmoteNotes = emoteNotes()
    if (!currentEmoteNotes || 'error' in currentEmoteNotes) return
    mutateEmoteNotes({...currentEmoteNotes, doNotRemove: !currentEmoteNotes?.doNotRemove})
    authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.emoteId}/notes/${channelId()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({doNotRemove: !currentEmoteNotes?.doNotRemove})
    })
  }

  const setEmoteNotes = debounce((note: string) => {
    const currentEmoteNotes = emoteNotes()
    if (!currentEmoteNotes || 'error' in currentEmoteNotes) return
    mutateEmoteNotes({...currentEmoteNotes, note})
    authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.emoteId}/notes/${channelId()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({note})
    })
  }, 500, {leading: false, trailing: true})

  return (
    <BttvPanel panelClass={props.panelClass}
               sectionClass={cn(props.sectionClass, dashWidgetStyles.col)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Notes'}>
      <Show when={emoteNotes.state === 'ready' && !('error' in emoteNotes())}>
        <label class={dashWidgetStyles.checkbox}>
          <input type="checkbox" onChange={toggleEmoteNotesDNR}
                 checked={(emoteNotes() as { doNotRemove: boolean }).doNotRemove} />
          <span class={cn(dashWidgetStyles.control, (emoteNotes() as {
            doNotRemove: boolean
          }).doNotRemove && dashWidgetStyles.checked)}>
                  <Show when={(emoteNotes() as { doNotRemove: boolean }).doNotRemove}>
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                      <svg viewBox="0 0 12 10"
                           style="fill: none; stroke-width: 2px; stroke: currentcolor; stroke-dasharray: 16px;">
                        <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                      </svg>
                    </div>
                  </Show>
                </span>
          <span class={dashWidgetStyles.label}>Do not remove</span>
          <span class={dashWidgetStyles.hint}>Just a marker, does not get enforced</span>
        </label>
        <textarea class={dashWidgetStyles.textarea} rows="3" placeholder="Notes for this emote group"
                  onInput={(event) => setEmoteNotes(event.currentTarget.value)}>
                {(emoteNotes() as { note: string }).note}
              </textarea>
      </Show>
      <Show when={emoteNotes.state === 'ready' && 'error' in emoteNotes()}>
        <Show when={(emoteNotes() as { error: any }).error === StatusCodes.UNAUTHORIZED}>
          <LoginPrompt provider={props.provider} refetch={refetch} channelId={channelId} channelDisplayName={channelDisplayName} />
        </Show>
        <Show when={(emoteNotes() as { error: any }).error === StatusCodes.FORBIDDEN}>
          <ForbiddenError provider={props.provider} channelDisplayName={channelDisplayName} />
        </Show>
        <Show when={(emoteNotes() as { error: any }).error === null}>
          <GenericError />
        </Show>
      </Show>
    </BttvPanel>
  )
}
