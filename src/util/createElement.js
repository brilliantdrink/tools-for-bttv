export function element(tag, attributes, appendTo) {
  const isSvg = ['svg', 'path'].includes(tag)

  const el = isSvg
    ? document?.createElementNS('http://www.w3.org/2000/svg', tag)
    : document?.createElement(tag)

  for (const key in attributes) {
    if (!attributes.hasOwnProperty(key)) continue

    if (key === 'innerText')
      el.innerText = attributes[key]
    else if (key === 'innerHTML')
      el.innerHTML = attributes[key]
    else if (key === 'children') {
      if (Array.isArray(attributes[key])
        || attributes[key] instanceof NodeList
        || attributes[key] instanceof HTMLCollection) {
        attributes[key].forEach(child => el.appendChild(child))
      } else if (
        attributes[key] instanceof Node
        || attributes[key] instanceof Element
      ) {
        el.appendChild(attributes[key])
      }
    } else if (key === 'className') {
      el.classList.add(...attributes[key].split(' '))
    } else {
      if (isSvg) {
        el.setAttributeNS(null, key, attributes[key])
      } else {
        el.setAttribute(key, attributes[key])
      }
    }
  }

  if (appendTo)
    appendTo.appendChild(el)
  return el;
}
