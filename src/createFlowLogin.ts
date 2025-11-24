let loggingPromise: null | Promise<void> = null

export function createFlowLogin(onLoggingIn: (isLoggingIn: boolean) => void, onAfterLoggingIn: (isLoggedIn: boolean) => void) {
  if (loggingPromise) {
    onLoggingIn(true)
  } else {
    const savedState = localStorage.getItem('twitchLoginState')
    if (!savedState) return onLoggingIn(false)
    localStorage.removeItem('twitchLoginState')
    onLoggingIn(true)
    loggingPromise = new Promise(async (resolve, reject) => {
      const authenticationData =
        await fetch(`https://${API_HOST}/twitch/flow/${savedState}`/*, {credentials: 'include'}*/)
          .then(res => res.json() as Promise<{ code: string, scope: string }>)
          .catch(() => null)
      if (authenticationData?.code) {
        localStorage.setItem('tfb-twitch_code', authenticationData?.code)
        fetch(`https://${API_HOST}/twitch/login`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({code: authenticationData?.code})
        }).then(res => {
          if (res.ok) {
            resolve()
          } else {
            reject()
          }
        })
      }
    })
  }
  loggingPromise.then(() => onAfterLoggingIn(true)).catch(() => onAfterLoggingIn(false))
}
