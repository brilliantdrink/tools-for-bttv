import {Accessor, createEffect, createSignal, JSX, Setter, Show} from 'solid-js'
import {Portal} from 'solid-js/web'
import cn from 'classnames'
import {FaSolidXmark} from 'solid-icons/fa'
import {EmoteProvider} from './util/emote-context'

import styles from './modal.module.scss'

export interface ModalProps {
  class?: string
  open?: Accessor<boolean>
  setOpen?: Setter<boolean>
  children?: JSX.Element[] | JSX.Element,
  closeOnOverlayClick?: boolean,
  provider: EmoteProvider
}

export default function Modal(props: ModalProps) {
  const [open, setOpen] = props.open && props.setOpen ? [props.open, props.setOpen] : createSignal(false)
  const [show, _setShow] = createSignal(open())

  const [overlayTransitioned, setOverlayTransitioned] = createSignal(false)
  const [modalTransitioned, setModalTransitioned] = createSignal(false)

  function setShow(value: boolean) {
    _setShow(value)
    setOverlayTransitioned(false)
    setModalTransitioned(false)
  }

  createEffect(() => {
    document.body.style.overflow = open() ? 'hidden' : ''
  })

  createEffect(() => {
    // assignment ensures proper tracking (close animation breaks otherwise)
    const openValue = open(),
      overlayTransitionedValue = overlayTransitioned(),
      modalTransitionedValue = modalTransitioned()
    if (openValue || (overlayTransitionedValue && modalTransitionedValue)) {
      setShow(open())
    }
  })

  return <>
    <Portal>
      <Show when={show()}>
        <div class={cn(props.class, styles.overlay, open() ? styles.open : styles.closed)}
             onClick={() => {
               if (props.closeOnOverlayClick !== true) return
               setOpen(false)
             }}
             onAnimationEnd={() => {
               setOverlayTransitioned(true)
             }}>
          <div class={cn(styles.modal, open() ? styles.open : styles.closed, styles[props.provider.toLowerCase()])}
               onClick={ev => {
                 // ev.preventDefault()
                 ev.stopPropagation()
               }}
               onAnimationEnd={() => {
                 setModalTransitioned(true)
               }}>
            <div class={cn(styles.close)} onClick={() => setOpen(false) /* todo confirm modal */}>
              <FaSolidXmark />
            </div>
            {props.children}
          </div>
        </div>
      </Show>
    </Portal>
  </>
}
