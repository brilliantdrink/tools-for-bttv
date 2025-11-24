import {Accessor, createContext, createEffect, createMemo, createSignal, JSX, Setter, useContext} from 'solid-js'
import {EmoteProvider} from './emote-context'
import {queryFutureElement} from './future-element'
import {createStore} from 'solid-js/store'

const globalFFZChannelName = () =>
  (document.querySelector('#channel')?.childNodes.item(0) as Text | undefined)?.wholeText.trim() ??
  (document.querySelector('img.navbar-avatar') as null | HTMLImageElement)?.title ?? null
const globalBTTVChannelNameListeners = new Set<(name: string) => void>()
let currentBTTVName: string = null!
const globalBTTVChannelName = (callback: (name: string) => void) => {
  callback(currentBTTVName)
  globalBTTVChannelNameListeners.add(callback)
  return () => globalBTTVChannelNameListeners.delete(callback)
}
queryFutureElement('[id*=menu-button]:has(img)').then(element => {
  const resetName = () => {
    const newName = (element as HTMLElement).innerText.trim()
    if (currentBTTVName === newName) return
    currentBTTVName = newName
    for (const listener of globalBTTVChannelNameListeners) {
      listener(currentBTTVName)
    }
  }
  const observer = new MutationObserver(resetName)
  observer.observe(element, { childList: true, subtree: true })
  resetName()
})

function createCurrentChannelTracker(provider: EmoteProvider) {
  const [name, setName] = createSignal<string | null>(null)
  if (provider === EmoteProvider.BTTV) {
    createEffect(() => globalBTTVChannelName(setName))
  } else if (provider === EmoteProvider.FFZ) {
    setName(globalFFZChannelName())
  }
  return name
}

export const CurrentChannelContext = createContext<{
  info: Accessor<{ id: string, name: null } | { id: null, name: string }>,
  setId: Setter<string | null>,
  setName: Setter<string | null>,
}>()

export function CurrentChannelProvider(props: { children?: JSX.Element | JSX.Element[], provider: EmoteProvider }) {
  const [_info, setInfo] = createStore<
    { id: string, name: null } |
    { id: null, name: string }
  >({id: null!, name: null})

  function setId(next: string | null | ((prev: string | null) => string)) {
    let value
    if (typeof next === 'function') {
      value = next(_info.id)
    } else {
      value = next
    }
    setInfo('name', null)
    setInfo('id', value)
  }

  function setName(next: string | null | ((prev: string | null) => string)) {
    let value
    if (typeof next === 'function') {
      value = next(_info.id)
    } else {
      value = next
    }
    setInfo('id', null)
    setInfo('name', value)
  }

  const trackedName = createCurrentChannelTracker(props.provider)
  const info = createMemo(() => {
    if (!_info.id && !_info.name) return {name: trackedName() as string, id: null}
    else return _info
  })

  return (
    <CurrentChannelContext.Provider value={{info, setId, setName}}>
      {props.children}
    </CurrentChannelContext.Provider>
  )
}

export function useCurrentChannelContext() {
  const context = useContext(CurrentChannelContext)
  const knownInfo = context ? createMemo(() => (
      typeof context.info().id === 'string' ? {id: context.info().id} : {name: context.info().name}
    )
  ) : undefined
  return {knownInfo, setId: context?.setId, setName: context?.setName}
}
