import {Accessor, createMemo, createResource, Show, Suspense} from 'solid-js'
import cn from 'classnames'
import debounce from 'lodash.debounce'
import StatusCodes from 'http-status-codes'
import {EmoteProvider} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import BttvPanel from '../panel/panel'
import LoginPrompt, {ForbiddenError, GenericError} from '../login-prompt'
import {authFetch} from '../util/auth-fetch'
import {Checkbox} from '../checkbox'
import {useCurrentChannelContext} from '../util/track-current-channel'
import {Spinner} from '../spinner'

import styles from './notes-panel.module.scss'

interface NotesPanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  emoteId: string
}

export function NotesPanel(props: NotesPanelProps) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId, displayName: channelDisplayName} =
    createChannelInfo(props.provider, currentChannelContext.knownInfo)
  const [emoteNotes, {mutate: mutateEmoteNotes, refetch}] = createResource(channelId, async (channelId) => {
    if (channelId === null) return {note: '', doNotRemove: false}
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

  const dnr = createMemo(() => {
    const notes = emoteNotes()
    return !!notes && 'doNotRemove' in notes && notes.doNotRemove
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
               sectionClass={cn(props.sectionClass, styles.col)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Notes'}>
      <Suspense fallback={<Spinner centered />}>
        <Show when={(emoteNotes() as any)?.['error'] === undefined}>
          <Checkbox checked={dnr} setChecked={toggleEmoteNotesDNR}
                    label={'Do not remove'} hint={'Just a marker, not enforced'} />
          <textarea class={styles.textarea} rows="3" placeholder="Notes for this emote"
                    onInput={(event) => setEmoteNotes(event.currentTarget.value)}>
          {(emoteNotes() as { note: string })?.note}
        </textarea>
        </Show>
        <Show when={(emoteNotes() as any)?.['error'] !== undefined}>
          <Show when={(emoteNotes() as { error: any }).error === StatusCodes.UNAUTHORIZED}>
            <LoginPrompt provider={props.provider} refetch={refetch} channelId={channelId}
                         channelDisplayName={channelDisplayName} />
          </Show>
          <Show when={(emoteNotes() as { error: any }).error === StatusCodes.FORBIDDEN}>
            <ForbiddenError provider={props.provider} channelDisplayName={channelDisplayName} />
          </Show>
          <Show when={(emoteNotes() as { error: any }).error === null}>
            <GenericError />
          </Show>
        </Show>
      </Suspense>
    </BttvPanel>
  )
}
