import {Accessor, JSX} from 'solid-js'
import cn from 'classnames'
import emoteListStyles from './emote-list.module.scss'

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
        {props.title}
        &nbsp;
        <span>({props.loading() ? 'Loading' : props.amount})</span>
      </summary>
      {props.children}
    </details>
  </>)
}
