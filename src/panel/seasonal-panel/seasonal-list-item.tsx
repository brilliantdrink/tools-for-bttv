import {For, JSX, Setter} from 'solid-js'
import {Dynamic} from 'solid-js/web'
import cn from 'classnames'
import {IconProps, IconTemplate, IconTypes} from 'solid-icons'
import {FaSolidMagnifyingGlass, FaSolidPencil, FaSolidPlus, FaSolidTrash, FaSolidXmark} from 'solid-icons/fa'
import {createGroupModalSignals, GroupModalType} from './group-modal'
import {EmoteGroup} from './seasonal-query'
import {createEmoteModalSignals, EmoteModalType} from './emote-modal'
import {createDeleteModalSignals, DeleteModalType} from './delete-modal'
import {ApplyModalType, createApplyModalSignals} from './apply-modal'

import seasonalPanelStyle from '../seasonal-panel.module.scss'
import tooltipStyles from '../../tooltip.module.scss'

type ModalType = GroupModalType | EmoteModalType | DeleteModalType | ApplyModalType

type ModalSignals<E> =
  (E extends GroupModalType ? { groupModalSignals: ReturnType<typeof createGroupModalSignals> } : {}) &
  (E extends EmoteModalType ? { emoteModalSignals: ReturnType<typeof createEmoteModalSignals> } : {}) &
  (E extends DeleteModalType ? { deleteModalSignals: ReturnType<typeof createDeleteModalSignals> } : {}) &
  (E extends ApplyModalType ? { applyModalSignals: ReturnType<typeof createApplyModalSignals> } : {})

export interface SeasonalListItemProps<E extends ModalType> {
  buttons: (E | 'separator')[]
  group: EmoteGroup,
  setCurrentGroup: Setter<EmoteGroup | null>
}

const buttonTooltips = {
  [EmoteModalType.AsAlternative]: 'Add emote as seasonal',
  [EmoteModalType.AddAlternative]: 'Add seasonal for emote',
  [DeleteModalType.Emote]: 'Remove from group',
  [DeleteModalType.Group]: 'Delete group',
  [GroupModalType.Edit]: 'Edit group',
  [GroupModalType.Create]: 'Create seasonal group',
  [ApplyModalType.Apply]: 'Apply / Unapply group',
} as Record<ModalType, string>

const ButtonIcons = {
  [EmoteModalType.AsAlternative]: FaSolidPlus,
  [EmoteModalType.AddAlternative]: Search,
  [DeleteModalType.Emote]: FaSolidXmark,
  [DeleteModalType.Group]: Trash,
  [GroupModalType.Edit]: Pen,
  [GroupModalType.Create]: FaSolidPlus,
  [ApplyModalType.Apply]: props => <CogPlay {...props} class={cn(props.class, seasonalPanelStyle.upsize)} />,
} as Record<ModalType, IconTypes>

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

export default function SeasonalListItem<E extends ModalType>(props: SeasonalListItemProps<E> & ModalSignals<E>) {
  return (
    <li class={seasonalPanelStyle.groupItem}>
      <span class={seasonalPanelStyle.name}>
        {props.group.name}
        <small>{props.group.emotes.length} Emote{props.group.emotes.length !== 1 ? 's' : ''}</small>
      </span>
      <For each={props.buttons}>{type => {
        if (type === 'separator') return <div class={seasonalPanelStyle.separator} />
        let signals: Mutable<SmallButtonProps<any>>['signals'] | null = null
        if (type in GroupModalType) signals = 'groupModalSignals' in props ? props.groupModalSignals : null
        else if (type in EmoteModalType) signals = 'emoteModalSignals' in props ? props.emoteModalSignals : null
        else if (type in DeleteModalType) signals = 'deleteModalSignals' in props ? props.deleteModalSignals : null
        else if (type in ApplyModalType) signals = 'applyModalSignals' in props ? props.applyModalSignals : null
        if (signals === null) return null
        return (
          <OpenModalButton tooltip={buttonTooltips[type]} setCurrentGroup={props.setCurrentGroup} group={props.group}
                           signals={signals} modalType={type}>
            <Dynamic component={ButtonIcons[type as keyof typeof ButtonIcons]} />
          </OpenModalButton>
        )
      }}</For>
    </li>
  )
}

interface SmallButtonProps<E extends ModalType> {
  tooltip: string,
  children: JSX.Element | JSX.Element[],
  signals: {
    setType: Setter<E>,
    setOpen: Setter<boolean>
  }
  modalType: Exclude<E, Function>,
  setCurrentGroup: Setter<EmoteGroup | null>,
  group: EmoteGroup,
}

function OpenModalButton<E extends ModalType>(props: SmallButtonProps<E>) {
  return (
    <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.asAlt, tooltipStyles.trigger)} onClick={() => {
      props.signals.setType(props.modalType)
      props.signals.setOpen(true)
      props.setCurrentGroup(props.group)
    }}>
      {props.children}
      <span class={cn(seasonalPanelStyle.tooltip, tooltipStyles.tooltip)}>{props.tooltip}</span>
    </button>
  )
}

function CogPlay(props: IconProps) {
  return IconTemplate({
    a: {viewBox: '0 0 24 24'},
    c: '<path d="M23.86 17.28c.19.46.19.98 0 1.44-.63 1.52-6.38 5.37-7.96 5.28a2 2 0 0 1-1.4-.75c-.39-.5-.39-1.43-.39-3.29v-3.92c0-1.86 0-2.78.39-3.3a2 2 0 0 1 1.4-.74c1.58-.09 7.33 3.76 7.96 5.28"/><path fill-opacity=".6" d="M11.22 0c.72 0 1.09 0 1.35.2.27.2.37.55.57 1.24l.14.48c.13.44.2.66.33.82.12.16.37.29.85.54q.33.17.64.37c.46.3.7.44.9.47s.42-.02.86-.13l.5-.12c.7-.17 1.05-.26 1.35-.12.3.13.49.44.85 1.06l.8 1.37c.35.63.53.94.5 1.27-.05.34-.3.6-.8 1.12l-.34.36c-.32.33-.48.5-.55.69s-.06.46-.04 1l.01.38c0 .13-.14.2-.25.15a16 16 0 0 0-1.67-.72c-.33-.1-.76-.22-1.22-.23h-.2a3.7 3.7 0 0 0-2.6 1.3l-.14.16-.12.18c-.24.37-.62.66-1.06.66-.38 0-.72.2-.91.52L9.5 15.55c-.47.81-.04 1.86.9 1.86.96 0 1.9.7 1.9 1.66v1.72c0 .66-.42 1.21-1.09 1.21H9.64c-.72 0-1.08 0-1.35-.2s-.37-.55-.57-1.24l-.14-.49a2 2 0 0 0-.33-.82c-.12-.15-.37-.28-.85-.53l-.64-.37a3 3 0 0 0-.89-.47c-.2-.04-.43.02-.87.13l-.5.12c-.7.17-1.05.26-1.35.12-.3-.13-.49-.44-.85-1.06L.5 15.8c-.35-.62-.53-.93-.5-1.26.05-.33.3-.6.8-1.12l.35-.37c.31-.33.47-.5.54-.68.08-.2.06-.47.04-1.01v-.74c.02-.54.04-.82-.04-1-.07-.2-.23-.36-.55-.7L.8 8.57C.3 8.05.05 7.79.01 7.45c-.04-.33.14-.64.5-1.26L1.3 4.8c.36-.62.54-.93.85-1.06.3-.14.66-.05 1.36.12L4 4c.44.11.67.17.87.13.2-.03.43-.18.9-.47q.3-.2.63-.37c.48-.25.73-.38.85-.54.13-.15.2-.37.33-.82l.14-.48c.2-.7.3-1.04.57-1.24S8.92 0 9.64 0zM7 8.09c-.49-.85-1.66-1-2.13-.14a6.4 6.4 0 0 0-.01 6.3c.46.8 1.57.65 2.03-.15l1.36-2.35a1.5 1.5 0 0 0 0-1.5zm3.44-3.5c-.95 0-1.38 1.06-.9 1.89l1.3 2.27c.28.46.77.75 1.3.75h2.56c.98 0 1.7-.94 1.19-1.79a6.3 6.3 0 0 0-5.45-3.13"/>'
  }, props)
}

function Search(props: IconProps) {
  return IconTemplate({
    a: {viewBox: '0 0 24 24'},
    c: '<path fill-opacity=".3" d="M1.5 10c0-5.5 3-8.5 8.5-8.5s8.5 3 8.5 8.5-3 8.5-8.5 8.5-8.5-3-8.5-8.5"/><path d="M17.25 10c0-2.53-.69-4.3-1.82-5.43S12.53 2.75 10 2.75s-4.3.69-5.43 1.82S2.75 7.47 2.75 10s.69 4.3 1.82 5.43 2.9 1.82 5.43 1.82 4.3-.69 5.43-1.82 1.82-2.9 1.82-5.43m2.5 0c0 2.97-.81 5.46-2.55 7.2s-4.23 2.55-7.2 2.55-5.46-.81-7.2-2.55S.25 12.97.25 10s.81-5.46 2.55-7.2S7.03.25 10 .25s5.46.81 7.2 2.55 2.55 4.23 2.55 7.2M16.07 16.07a1.35 1.35 0 0 1 1.88-.03l5.18 4.81a1.61 1.61 0 1 1-2.28 2.28l-4.81-5.18c-.5-.54-.48-1.36.03-1.88"/>'
  }, props)
}

function Trash(props: IconProps) {
  return IconTemplate({
    a: {viewBox: '0 0 24 24'},
    c: '<path fill-opacity=".7" fill-rule="evenodd" d="M12.71 7.71c2.35.03 4.71.17 6.88.42l1.01.09v1.8c0 2.22-.15 4.65-.38 6.66l-.03-.03-.13 1c-.36 2.52-.67 3.44-1.55 4.4l.03.02a5.3 5.3 0 0 1-2.8 1.57 18 18 0 0 1-3.16.31H11.4l-.48-.02c-1-.04-1.98-.14-2.68-.29a5.3 5.3 0 0 1-2.8-1.57l.03-.03c-.88-.95-1.19-1.87-1.55-4.39q-.08-.52-.13-1l-.03.03a61 61 0 0 1-.38-6.66v-1.8l1-.1c2.18-.24 4.54-.38 6.88-.4V7.7h1.47" clip-rule="evenodd"/><path fill-rule="evenodd" d="M12 .05q.66 0 1.31.1l.32.08.12.02a5 5 0 0 1 2.31 1.3q.72.72 1.08 1.79v.01q.12.37.21.78.1.51.15 1.02c0 .14.03.25.06.25.55 0 3.65.42 4.02.55l.01-.01h.01c.43.22.6.54.6 1.07 0 .28-.02.43-.13.6l-.09.14q-.13.17-.28.27a.6.6 0 0 1-.46.2q-.37.06-1.02-.02a69 69 0 0 0-16.43 0q-.64.08-1.02.02a.6.6 0 0 1-.46-.2 1.4 1.4 0 0 1-.37-.42c-.1-.16-.13-.31-.13-.59 0-.53.17-.85.6-1.07h.01l.01.01c.37-.13 3.47-.55 4.02-.55.03 0 .06-.11.06-.25a8 8 0 0 1 .37-1.8l-.01-.01A4.6 4.6 0 0 1 8.3 1.25q.82-.7 1.96-1l.12-.02.33-.08h-.01q.65-.1 1.3-.1m0 2.46q-.33 0-.68.09h.01c-.77.14-1.27.37-1.66.8q-.15.17-.28.39a5 5 0 0 0-.33 1.08L9 5.15c.07.03 1.4.05 3 .05h.01c1.6 0 2.92-.02 3-.05l-.06-.28-.13-.55-.2-.53q-.13-.22-.28-.39c-.4-.43-.88-.66-1.66-.8h.01a3 3 0 0 0-.68-.09" clip-rule="evenodd"/>'
  }, props)
}

function Pen(props: IconProps) {
  return IconTemplate({
    a: {viewBox: '0 0 24 24'},
    c: '<path fill-opacity=".7" d="M17.5 1.5c1.5-1 3-2 5 0s1 3.5 0 5c-.78 1.18-8.5 9.5-13 13a24 24 0 0 1-6 3.5c-.89.35-2.38 1.12-3 .5s.15-2.11.5-3c1-2.5 2.2-4.33 3.5-6C8 10 16.32 2.28 17.5 1.5m.38 2.18a.5.5 0 0 0-.7-.06A95 95 0 0 0 7.12 13.68a.5.5 0 0 0 .76.64 94 94 0 0 1 9.94-9.94.5.5 0 0 0 .06-.7"/><path d="M3.5 23c-.89.35-2.38 1.12-3 .5s.15-2.11.5-3c1-2.5 2-4 2.5-4.5s5 4 4.5 4.5S6 22 3.5 23"/>'
  }, props)
}
