import {element} from './util/createElement'

export function emoteListDetails(title: string, listHtml: HTMLElement, appendTo: HTMLElement, open?: boolean) {
  const details = element('details', {className: 'tfb-details'}, appendTo)
  if (open) details.setAttribute('open', true)
  const count = element('span', {innerText: ' (Loading)'}, appendTo)
  const heading = element('summary', {
    className: 'tfb-heading',
    innerText: title,
    children: count
  }, details)
  details.appendChild(listHtml)
  new MutationObserver(() => count.innerText = ` (${listHtml.childElementCount})`)
    .observe(listHtml, {childList: true})
  return details
}
