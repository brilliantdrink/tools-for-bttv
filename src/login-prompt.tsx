import {Accessor, createResource, createSignal, onMount, Show} from 'solid-js'
import cn from 'classnames'
import {createChannelInfo} from './util/channel'
import {EmoteProvider} from './util/emote-context'
import {useUser} from './util/user'
import {createFlowLogin} from './createFlowLogin'

import loginPromptStyles from './login-prompt.module.scss'
import tooltipStyles from './tooltip.module.scss'
import {Spinner} from './spinner'

interface LoginPromptProps {
  provider: EmoteProvider,
  refetch: () => void
  channelDisplayName: Accessor<string | null>,
  channelId: Accessor<string | null>
  compact?: boolean
}

export default function LoginPrompt(props: LoginPromptProps) {
  const {id: userId} = createChannelInfo(props.provider)

  const [loginButtonClicked, setLoginButtonClicked] = createSignal(false)
  const [isLoginAttempt, setIsLoginAttempt] = createSignal<boolean | null>(null)

  const [clientId] = createResource(() => {
    return fetch(`https://${API_HOST}/twitch/client-id`).then(res => res.json())
  })

  onMount(async () => {
    const url = new URL(location.pathname, location.origin)
    window.history.replaceState(null, '', url.toString())
    createFlowLogin(setIsLoginAttempt, () => props.refetch())
  })

  function handleLoginClick() {
    setLoginButtonClicked(true)
    const twitchAuthUrl = new URL('https://id.twitch.tv/oauth2/authorize')
    twitchAuthUrl.searchParams.set('response_type', 'code')
    twitchAuthUrl.searchParams.set('client_id', clientId())
    twitchAuthUrl.searchParams.set('redirect_uri', `https://${API_HOST}/twitch/flow`)
    twitchAuthUrl.searchParams.set('scope', ['user:read:chat'].join(' '))
    const state = crypto.randomUUID()
    twitchAuthUrl.searchParams.set('state', state + '_' + window.location.toString())
    localStorage.removeItem('tfb-twitch_code')
    localStorage.setItem('twitchLoginState', state)
    window.open(twitchAuthUrl.toString(), '_self')
  }

  return <>
    <div class={cn(loginPromptStyles.wrapper, props.compact && loginPromptStyles.compact)}>
      <Show when={isLoginAttempt() === false}>
        <Show when={props.compact !== true}>
          <div class={loginPromptStyles.notice}>
            This feature only works
            if {String(userId()) !== String(props.channelId()) ? `both ${props.channelDisplayName()} and ` : ' '}you are
            logged into <em>Tools for BTTV</em>.
            <div class={cn(loginPromptStyles.info, tooltipStyles.trigger)}>
              <InfoIcon class={loginPromptStyles.icon} />
              <div class={cn(loginPromptStyles.tooltip, tooltipStyles.tooltip)}>
                This feature saves editable data on <em>Tools for BTTV's</em> servers. To ensure that only broadcasters
                and emote editors can view and edit that data, you need to authenticate with that server using your
                Twitch
                account. If you are not the broadcaster, the broadcaster also has to log in to confirm you as an editor
                to <em>Tools for BTTV's</em> servers.
              </div>
            </div>
          </div>
        </Show>
        <button class={cn(loginPromptStyles.button, props.compact && loginPromptStyles.inline)}
                disabled={loginButtonClicked()} onClick={handleLoginClick}>
          Log in with Twitch
        </button>
      </Show>
      <Show when={isLoginAttempt() !== false}>
        <Spinner centered />
      </Show>
    </div>
  </>
}


function InfoIcon(props: { class: string }) {
  return (
    <svg viewBox="1 0 240 240" class={props.class}>
      <path fill-opacity=".3" fill="currentColor"
            d="M120.8.6c4.2 0 8.4.1 12.6.5a118.8 118.8 0 0 1 69.4 27 95 95 0 0 1 22.9 29 133.8 133.8 0 0 1 14.5 64v3.7c-.9 31.3-11.7 61-29.8 80.1a97.3 97.3 0 0 1-21.5 17 129.8 129.8 0 0 1-68 17.5 130 130 0 0 1-68.2-17.5 97.3 97.3 0 0 1-21.5-17c-18-19.2-28.9-48.8-29.7-80.1l-.1-3.8A147 147 0 0 1 16 57c6-11.4 13.4-21 22.8-29 17.6-15.2 41-24.5 69.5-26.9 4.1-.4 8.3-.5 12.5-.5Z" />
      <path fill-rule="evenodd" fill="currentColor"
            d="M122 54.3c-9.4 2.5-9.7 21.4-.3 24.4 4.4 1.4 7.5.7 10.5-2.3s4-7 3.1-12.7c-1.1-7.6-6.3-11.3-13.3-9.4ZM98.3 92.7c-9 2.2-12.2 11.6-5.8 17.6 2 1.8 4 2.4 10.5 2.9 12 .8 11.9.7 11.6 22.8-.3 16.7-.4 17.6-2.3 17.9a49 49 0 0 0-19.5 5.8c-2.5 2.1-3 3.3-3 6.8 0 9 5.8 12 17.9 9.2 9-2 24.1-2 35.3 0 8.5 1.7 9 1.7 12.3 0 4-2.2 6-6.3 5-11-1-6-3.3-7-23.3-11.2-2.2-.4-2.2-.5-2.2-20.2 0-18.6-.2-20-2.4-24.7a27 27 0 0 0-13.6-13.4c-4.5-2-16.7-3.4-20.5-2.5Z" />
    </svg>
  )
}

export function ForbiddenError(props: {
  provider: EmoteProvider,
  channelDisplayName: Accessor<string | null>,
  compact?: boolean
}) {
  const channelDisplayName = props.channelDisplayName

  return (
    <div class={cn(loginPromptStyles.wrapper, props.compact && loginPromptStyles.inline)}>
      <div class={loginPromptStyles.notice}>
        {channelDisplayName()} needs to log into <em>Tools for BTTV</em> to confirm you as an emote editor of this
        channel.
      </div>
    </div>
  )
}

export function GenericError() {
  return (
    <div class={loginPromptStyles.wrapper}>
      <div class={loginPromptStyles.notice}>
        Something went wrong here, please check back later.
      </div>
    </div>
  )
}
