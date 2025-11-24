import {Accessor, JSX, Show} from 'solid-js'
import cn from 'classnames'
import emoteListStyles from './emote-list.module.scss'
import {HiOutlineChevronRight} from 'solid-icons/hi'
import {Spinner} from '../spinner'

export function EmoteListDetails(props: {
  title: string,
  loading: Accessor<boolean>,
  amount?: number,
  children: JSX.Element[] | JSX.Element,
  open?: boolean
  detailsClass?: string
}) {
  return (<>
    <details class={cn(emoteListStyles.details, props.detailsClass)} open={props.open ?? false}>
      <summary class={emoteListStyles.heading}>
        <HiOutlineChevronRight class={emoteListStyles.marker} />
        {props.title}
        &nbsp;
        <Show when={props.loading()}>
          <Spinner/>
        </Show>
        <Show when={!props.loading()}>
          ({props.amount})
        </Show>
      </summary>
      {props.children}
    </details>
  </>)
}
