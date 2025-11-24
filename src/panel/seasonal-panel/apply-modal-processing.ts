import {Accessor, Setter} from 'solid-js'
import {Emote} from './seasonal-query'
import {ApplyModalType} from './apply-modal'
import {createChannelInfo} from '../../util/channel'
import {EmoteProvider} from '../../util/emote-context'

export async function runApplyModalProcessing(
  {
    provider, direction, info, setPage,
    filteredEmotes, applyEmotes, setOperations,
    shouldStop, setCurrentStep, setErrors, setOperationsDone, setIsDone
  }: {
    provider: EmoteProvider,
    direction: ApplyModalType
    info: ReturnType<typeof createChannelInfo>
    setPage: Setter<'select' | 'process'>,
    filteredEmotes: Accessor<{
      applicableEmotes: [Emote, Emote][]
      unapplicableEmotes: [Emote, Emote][]
      differentProviderEmotes: [Emote, Emote][]
    }>,
    applyEmotes: Record<string, boolean>
    shouldStop: Accessor<boolean>
    setOperations: Setter<number>
    setCurrentStep: Setter<string>
    setErrors: Setter<string[]>
    setOperationsDone: Setter<number>
    setIsDone: Setter<boolean>
  }) {
  setPage('process')
  // "code" is the actual code in the dashboard, when it was overwritten the original code is sent as "codeOriginal"
  const deleteOperations: Emote[] = []
  const addOperations: Emote[] = []
  const renameOperations: [Emote, string][] = []
  for (const pair of filteredEmotes().applicableEmotes) {
    if (!(applyEmotes[pair[0].providerId] ?? true)) continue
    deleteOperations.push(direction === ApplyModalType.Apply ? pair[0] : pair[1])
    addOperations.push(direction === ApplyModalType.Apply ? pair[1] : pair[0])
    if (pair[0].code !== pair[1].code)
      renameOperations.push([direction === ApplyModalType.Apply ? pair[1] : pair[0], pair[0].code])
  }
  for (const pair of filteredEmotes().unapplicableEmotes) {
    if (!(applyEmotes[pair[0].providerId] ?? false)) continue
    addOperations.push(direction === ApplyModalType.Apply ? pair[1] : pair[0])
    if (pair[0].code !== pair[1].code)
      renameOperations.push([direction === ApplyModalType.Apply ? pair[1] : pair[0], pair[0].code])
  }

  if (provider === EmoteProvider.BTTV) {
    setOperations(deleteOperations.length + addOperations.length + renameOperations.length)
    const channelProviderId = 'bttvId' in info ? info.bttvId() : null
    const url = (emoteId: string, setId?: string) => {
      return `https://api.betterttv.net/3/emotes/${emoteId}/shared/${channelProviderId}/${setId ?? channelProviderId}`
    }
    const authHeader = {headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}}
    for (const emote of deleteOperations) {
      if (shouldStop()) return
      setCurrentStep(`Removing "${emote.code}" from channel`)
      await fetch(url(emote.providerId), Object.assign({method: 'DELETE'}, authHeader))
        .catch(() => setErrors(v => [...v, `Failed to remove "${emote.code}" from channel`]))
      setOperationsDone(v => v + 1)
    }
    for (const emote of addOperations) {
      if (shouldStop()) return
      const willRenameLater = renameOperations.some(([renameEmote]) => renameEmote.providerId === emote.providerId)
      setCurrentStep(`Adding "${emote.code}" to channel${willRenameLater ? ' (will be renamed later)' : ''}`)
      await fetch(url(emote.providerId), Object.assign({method: 'PUT'}, authHeader))
        .catch(() => setErrors(v => [...v, `Failed to add "${emote.code}"`]))
      setOperationsDone(v => v + 1)
    }
    for (const [emote, newCode] of renameOperations) {
      if (shouldStop()) return
      setCurrentStep(`Renaming "${emote.code}" to "${newCode}"`)
      await fetch(url(emote.providerId) + '/code', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', ...authHeader.headers},
        body: JSON.stringify({code: newCode}),
      }).catch(() => setErrors(v => [...v, `Failed to rename "${emote.code}" to "${newCode}"`]))
      setOperationsDone(v => v + 1)
    }
    setIsDone(true)
  } else if (provider === EmoteProvider.FFZ) {
    let operations = 0
    if (deleteOperations.length > 0) operations++
    if (addOperations.length > 0) operations++
    setOperations(operations)
    const allLinks = document.querySelectorAll<HTMLAnchorElement>('.panel a')
    const removeLink = Array.from(allLinks).find(a => info.displayName() && a.textContent?.startsWith(info.displayName() as string))
    const channelProviderId = removeLink?.dataset.uri?.match(/\?channels=(\d+)/)?.[1]
    if (!channelProviderId) {
      setErrors(v => [...v, 'Can\'t find channel id (this is a bug with Tools for BTTV)'])
    } else {
      const url = (emoteIds: string[], operation: 'add' | 'remove') =>
        `https://www.frankerfacez.com/emoticons/channel/${operation === 'add' ? 'True' : (operation === 'remove' ? 'False' : '')}?channels=${channelProviderId}&ids=${emoteIds.join(',')}`
      if (deleteOperations.length > 0) {
        setCurrentStep(`Removing selected emotes from channel`)
        await fetch(url(deleteOperations.map(emote => emote.providerId), 'remove'))
          .catch(() => setErrors(v => [...v, `Failed to remove emotes from channel`]))
        setOperationsDone(v => v + 1)
      }
      if (addOperations.length > 0) {
        setCurrentStep(`Adding selected emotes to channel`)
        await fetch(url(addOperations.map(emote => emote.providerId), 'add'))
          .catch(() => setErrors(v => [...v, `Failed to add emotes`]))
        setOperationsDone(v => v + 1)
      }
    }
    setIsDone(true)
  }
}
