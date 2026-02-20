import {render} from 'solid-js/web'
import toast, {Toaster, Message} from 'solid-toast'
import {authFetch} from './auth-fetch'
import {EmoteProvider} from './emote-context'
import {AttachmentPoints} from '../variables'

import styles from './toast.module.scss'
import {BsExclamationOctagonFill} from 'solid-icons/bs'

export enum ErrorType {
  Initialisation = 'Initialisation',
  Action = 'Action',
  Fetch = 'Fetch',
  Mutate = 'Mutate',
}

export type ErrorDataTypes = {
  [ErrorType.Initialisation]: {
    attachment: AttachmentPoints
  },
  [ErrorType.Action]: {
    name: string
  },
  [ErrorType.Fetch]: {
    url: string,
  },
  [ErrorType.Mutate]: {
    url: string,
    method: 'put' | 'post' | 'patch' | 'delete',
  },
}

interface GenericError {
  provider: EmoteProvider,
  message: Message,
  detail: string,
}

type ErrorData<T extends ErrorType> = GenericError & { type: ErrorType } & ErrorDataTypes[T]

const rootId = 'tfb-toast'

export default function error<T extends ErrorType>(err: ErrorData<T>) {
  if (!document.getElementById(rootId)) init()
  // authFetch()
  const currentLocation = location.pathname
  toast.error(err.message, {
    style: {
      padding: '',
      color: '',
      background: '',
      'border-radius': '',
      'box-shadow': '',
    },
    icon: <BsExclamationOctagonFill class={styles.icon} />,
    className: styles.toast,
    position: 'top-left',
  })
}

function init() {
  const toastRoot = document.createElement('div')
  toastRoot.id = rootId
  document.body.appendChild(toastRoot)
  render(() => <Toaster />, toastRoot)
}

