export default function getChannelNames() {
  return (Array.from(
    document.querySelectorAll('.nav:first-of-type .dropdown-menu a[href*="/channel/"]')
  ) as HTMLAnchorElement[]).map(el => el.innerText.trim())

  /*const channelsAddPanel = Array.from(ffzEmoteSidebar.querySelectorAll('.panel')).find(el =>
    (el.querySelector('.panel-heading') as HTMLElement | null)?.innerText.toLowerCase() === 'Add to Channel'.toLowerCase()
  ) as HTMLElement | null
  const channelsRemovePanel = Array.from(ffzEmoteSidebar.querySelectorAll('.panel')).find(el =>
    (el.querySelector('.panel-heading') as HTMLElement | null)?.innerText.toLowerCase() === 'Remove from Channel'.toLowerCase()
  ) as HTMLElement | null
  return Array.from((channelsAddPanel?.querySelectorAll('.list-group-item') ?? []))
    .concat(Array.from((channelsRemovePanel?.querySelectorAll('.list-group-item') ?? [])))
    .map(el => (el.childNodes.item(0) as Text).wholeText.trim())*/
}
