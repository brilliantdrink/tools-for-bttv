"use strict";(()=>{var ce=Object.create;var B=Object.defineProperty;var le=Object.getOwnPropertyDescriptor;var me=Object.getOwnPropertyNames;var pe=Object.getPrototypeOf,ue=Object.prototype.hasOwnProperty;var fe=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var de=(t,e,n,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of me(e))!ue.call(t,r)&&r!==n&&B(t,r,{get:()=>e[r],enumerable:!(s=le(e,r))||s.enumerable});return t};var q=(t,e,n)=>(n=t!=null?ce(pe(t)):{},de(e||!t||!t.__esModule?B(n,"default",{value:t,enumerable:!0}):n,t));var S=fe(g=>{"use strict";Object.defineProperty(g,"__esModule",{value:!0});g.TokenData=void 0;g.parse=F;g.compile=ye;g.match=Te;g.pathToRegexp=X;g.stringify=be;var k="/",_=t=>t,J=/^[$_\p{ID_Start}]$/u,H=/^[$\u200c\u200d\p{ID_Continue}]$/u,$="https://git.new/pathToRegexpError",he={"{":"{","}":"}","(":"(",")":")","[":"[","]":"]","+":"+","?":"?","!":"!"};function Ee(t){return t.replace(/[{}()\[\]+?!:*]/g,"\\$&")}function h(t){return t.replace(/[.+*?^${}()[\]|/\\]/g,"\\$&")}function*ge(t){let e=[...t],n=0;function s(){let r="";if(J.test(e[++n]))for(r+=e[n];H.test(e[++n]);)r+=e[n];else if(e[n]==='"'){let o=n;for(;n<e.length;){if(e[++n]==='"'){n++,o=0;break}e[n]==="\\"?r+=e[++n]:r+=e[n]}if(o)throw new TypeError(`Unterminated quote at ${o}: ${$}`)}if(!r)throw new TypeError(`Missing parameter name at ${n}: ${$}`);return r}for(;n<e.length;){let r=e[n],o=he[r];if(o)yield{type:o,index:n++,value:r};else if(r==="\\")yield{type:"ESCAPED",index:n++,value:e[n++]};else if(r===":"){let c=s();yield{type:"PARAM",index:n,value:c}}else if(r==="*"){let c=s();yield{type:"WILDCARD",index:n,value:c}}else yield{type:"CHAR",index:n,value:e[n++]}}return{type:"END",index:n,value:""}}var P=class{constructor(e){this.tokens=e}peek(){if(!this._peek){let e=this.tokens.next();this._peek=e.value}return this._peek}tryConsume(e){let n=this.peek();if(n.type===e)return this._peek=void 0,n.value}consume(e){let n=this.tryConsume(e);if(n!==void 0)return n;let{type:s,index:r}=this.peek();throw new TypeError(`Unexpected ${s} at ${r}, expected ${e}: ${$}`)}text(){let e="",n;for(;n=this.tryConsume("CHAR")||this.tryConsume("ESCAPED");)e+=n;return e}},b=class{constructor(e){this.tokens=e}};g.TokenData=b;function F(t,e={}){let{encodePath:n=_}=e,s=new P(ge(t));function r(c){let a=[];for(;;){let m=s.text();m&&a.push({type:"text",value:n(m)});let l=s.tryConsume("PARAM");if(l){a.push({type:"param",name:l});continue}let d=s.tryConsume("WILDCARD");if(d){a.push({type:"wildcard",name:d});continue}if(s.tryConsume("{")){a.push({type:"group",tokens:r("}")});continue}return s.consume(c),a}}let o=r("END");return new b(o)}function ye(t,e={}){let{encode:n=encodeURIComponent,delimiter:s=k}=e,r=t instanceof b?t:F(t,e),o=Q(r.tokens,s,n);return function(a={}){let[m,...l]=o(a);if(l.length)throw new TypeError(`Missing parameters: ${l.join(", ")}`);return m}}function Q(t,e,n){let s=t.map(r=>ve(r,e,n));return r=>{let o=[""];for(let c of s){let[a,...m]=c(r);o[0]+=a,o.push(...m)}return o}}function ve(t,e,n){if(t.type==="text")return()=>[t.value];if(t.type==="group"){let r=Q(t.tokens,e,n);return o=>{let[c,...a]=r(o);return a.length?[""]:[c]}}let s=n||_;return t.type==="wildcard"&&n!==!1?r=>{let o=r[t.name];if(o==null)return["",t.name];if(!Array.isArray(o)||o.length===0)throw new TypeError(`Expected "${t.name}" to be a non-empty array`);return[o.map((c,a)=>{if(typeof c!="string")throw new TypeError(`Expected "${t.name}/${a}" to be a string`);return s(c)}).join(e)]}:r=>{let o=r[t.name];if(o==null)return["",t.name];if(typeof o!="string")throw new TypeError(`Expected "${t.name}" to be a string`);return[s(o)]}}function Te(t,e={}){let{decode:n=decodeURIComponent,delimiter:s=k}=e,{regexp:r,keys:o}=X(t,e),c=o.map(a=>n===!1?_:a.type==="param"?n:m=>m.split(s).map(n));return function(m){let l=r.exec(m);if(!l)return!1;let d=l[0],u=Object.create(null);for(let f=1;f<l.length;f++){if(l[f]===void 0)continue;let y=o[f-1],C=c[f-1];u[y.name]=C(l[f])}return{path:d,params:u}}}function X(t,e={}){let{delimiter:n=k,end:s=!0,sensitive:r=!1,trailing:o=!0}=e,c=[],a=[],m=r?"":"i",d=(Array.isArray(t)?t:[t]).map(y=>y instanceof b?y:F(y,e));for(let{tokens:y}of d)for(let C of M(y,0,[])){let ie=xe(C,n,c);a.push(ie)}let u=`^(?:${a.join("|")})`;return o&&(u+=`(?:${h(n)}$)?`),u+=s?"$":`(?=${h(n)}|$)`,{regexp:new RegExp(u,m),keys:c}}function*M(t,e,n){if(e===t.length)return yield n;let s=t[e];if(s.type==="group"){let r=n.slice();for(let o of M(s.tokens,0,r))yield*M(t,e+1,o)}else n.push(s);yield*M(t,e+1,n)}function xe(t,e,n){let s="",r="",o=!0;for(let c=0;c<t.length;c++){let a=t[c];if(a.type==="text"){s+=h(a.value),r+=a.value,o||(o=a.value.includes(e));continue}if(a.type==="param"||a.type==="wildcard"){if(!o&&!r)throw new TypeError(`Missing text after "${a.name}": ${$}`);a.type==="param"?s+=`(${we(e,o?"":r)}+)`:s+="([\\s\\S]+)",n.push(a),r="",o=!1;continue}}return s}function we(t,e){return e.length<2?t.length<2?`[^${h(t+e)}]`:`(?:(?!${h(t)})[^${h(e)}])`:t.length<2?`(?:(?!${h(e)})[^${h(t)}])`:`(?:(?!${h(e)}|${h(t)})[\\s\\S])`}function be(t){return t.tokens.map(function e(n,s,r){if(n.type==="text")return Ee(n.value);if(n.type==="group")return`{${n.tokens.map(e).join("")}}`;let c=Le(n.name)&&De(r[s+1])?n.name:JSON.stringify(n.name);if(n.type==="param")return`:${c}`;if(n.type==="wildcard")return`*${c}`;throw new TypeError(`Unexpected token: ${n}`)}).join("")}function Le(t){let[e,...n]=t;return J.test(e)?n.every(s=>H.test(s)):!1}function De(t){return t?.type!=="text"?!0:!H.test(t.value[0])}});var v="bttv-ffz-helper";var O="betterttv.com",V="www.frankerfacez.com",x="Tools for BTTV",U=t=>`https://cdn.betterttv.net/emote/${t}/3x.webp`,R=t=>`https://betterttv.com/emotes/${t}`,j=(t,e)=>`https://cdn.frankerfacez.com/emoticon/${t}/${e?"animated/":""}2`,K=(t,e)=>`https://www.frankerfacez.com/emoticon/${t}-${e}`,N=t=>{let e={id:t.id,code:t.code};return t.animated&&(e.animated=!0),e};function E(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let n=new MutationObserver(s=>{document.querySelector(t)&&(n.disconnect(),e(document.querySelector(t)))});n.observe(document.body,{childList:!0,subtree:!0})})}function i(t,e,n){let s=["svg","path"].includes(t),r=s?document?.createElementNS("http://www.w3.org/2000/svg",t):document?.createElement(t);for(let o in e)e.hasOwnProperty(o)&&(o==="innerText"?r.innerText=e[o]:o==="innerHTML"?r.innerHTML=e[o]:o==="children"?Array.isArray(e[o])||e[o]instanceof NodeList||e[o]instanceof HTMLCollection?e[o].forEach(c=>r.appendChild(c)):(e[o]instanceof Node||e[o]instanceof Element)&&r.appendChild(e[o]):o==="className"?r.classList.add(...e[o].split(" ")):s?r.setAttributeNS(null,o,e[o]):r.setAttribute(o,e[o]));return n&&n.appendChild(r),r}async function Z(t){let e=await fetch(`https://api.frankerfacez.com/v1/user/${t.toLowerCase()}`).then(s=>s.json());return(await fetch(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${e.user.twitch_id}`).then(s=>s.json())).map(N)}async function W(t){let e=await fetch(`https://api.frankerfacez.com/v1/user/${t.toLowerCase()}`).then(s=>s.json()),n=await fetch(`https://api.betterttv.net/3/cached/users/twitch/${e.user.twitch_id}`).then(s=>s.json());return n.channelEmotes.concat(n.sharedEmotes).map(N)}var L=class{_bttvEmotes;_ffzEmotes;overlapping;overlappingHTML;likelyDuplicates;likelyDuplicatesHTML;constructor(){this._bttvEmotes=[],this._ffzEmotes=[],this.overlapping=[],this.overlappingHTML=i("div",{className:"tfb-emotes-pair-container"}),this.likelyDuplicates=[],this.likelyDuplicatesHTML=i("div",{className:"tfb-emotes-pair-container"})}get allEmotes(){return this.bttvEmotes.concat(this.ffzEmotes)}get bttvEmotes(){return this._bttvEmotes}set bttvEmotes(e){this._bttvEmotes=e.map(n=>(n.provider="BTTV",n)),this.updateDuplicates()}get ffzEmotes(){return this._ffzEmotes}set ffzEmotes(e){this._ffzEmotes=e.map(n=>(n.provider="FFZ",n)),this.updateDuplicates()}updateEmotes(e){return Promise.allSettled([Z(e).then(n=>this.ffzEmotes=n),W(e).then(n=>this.bttvEmotes=n)])}updateDuplicates(){this.overlapping=[],this.likelyDuplicates=[];let e=this.allEmotes;for(let n=0;n<e.length;n++){let s=e[n];for(let r=n+1;r<e.length;r++){let o=e[r];s.code===o.code?this.overlapping.push([s,o]):s.code.toLowerCase()===o.code.toLowerCase()&&this.likelyDuplicates.push([s,o])}}this.overlappingHTML.innerHTML="-",this.overlappingHTML.innerHTML="";for(let n of this.overlapping)G(n,this.overlappingHTML);this.likelyDuplicatesHTML.innerHTML="-",this.likelyDuplicatesHTML.innerHTML="";for(let n of this.likelyDuplicates)G(n,this.likelyDuplicatesHTML)}findExact(e){return this.allEmotes.filter(n=>n.code===e)}findNotExact(e){return this.allEmotes.filter(n=>n.code!==e&&n.code.toLowerCase()===e.toLowerCase())}},p=new L;function G(t,e){return i("div",{className:"tfb-emotes-container",children:t.map(T)},e)}function T(t){let e,n;return t.provider==="BTTV"?(e=R(t.id),n=U(t.id)):t.provider==="FFZ"&&(e=K(t.id,t.code),n=j(t.id,t.animated)),i("a",{className:"tfb-emote-wrapper",href:e,children:[i("img",{className:"tfb-emote-image",src:n}),i("span",{className:"tfb-emote-name",innerText:t.code}),i("div",{className:["tfb-emote-provider",t.provider.toLowerCase()].join(" ")})]})}function w(t,e,n){let s=i("details",{className:"tfb-details"},n),r=i("span",{innerText:" (Loading)"},n),o=i("summary",{className:"tfb-heading",innerText:t,children:r},s);return s.appendChild(e),new MutationObserver(()=>r.innerText=` (${e.childElementCount})`).observe(e,{childList:!0}),s}var te=q(S(),1),Y="dashboard/emotes/channel",Ne=(0,te.match)("/emotes/:id"),Me=["popular","trending","shared","global"],ee=t=>{let e=Ne(t);return e?!Me.includes(e?.params?.id):!1};async function ne(){let t=null,e=await D();async function n(){let r=location.pathname,o=await D();r.includes(Y)?!t||!t.includes(Y)?(z(),$e()):e!==o&&p.updateEmotes(await D()):ee(r)?(!t||!ee(t))&&(z(),Ce()):z(),t=r,e=o}n(),new MutationObserver(n).observe(document.body,{childList:!0,subtree:!0})}async function D(){return(await E("[id*=menu-button]:has(img)")).innerText.trim().toLowerCase()}async function $e(){let t=await E('.chakra-tabs:has([role="tablist"])'),e=i("div",{className:"tfb-bttv",id:v},t);i("p",{className:"tfb-title",innerText:x},e),w("Overlapping emote names",p.overlappingHTML,e),w("Likely duplicates",p.likelyDuplicatesHTML,e),p.updateEmotes(await D())}async function Ce(){let t=await E("[class*=Emote_panel]"),e=i("div",{className:"tfb-Emote_row"});t.replaceWith(e),t.style.flexGrow="1",t.style.display="flex",t.style.flexDirection="column";let n=t.querySelector("[class*=Emote_section] > p")?.innerText.trim(),s=t.querySelector("[class*=Emote_section]")?.classList.toString(),r=Array.from(t.querySelector("[class*=Emote_section]")?.classList??[]).find(l=>l.includes("Emote_section")),o=i("div",{className:`tfb-emotes-list chakra-stack ${r}`}),c=i("div",{className:`tfb-bttv ${t.classList.toString()}`,children:[i("div",{className:s,children:i("p",{className:"chakra-text css-0",innerText:x})}),i("hr",{className:"chakra-divider"}),o]},e);e.append(t),await p.updateEmotes(await D());let a=p.findExact(n??"");a.length>0&&(i("p",{className:"tfb-heading",innerText:"Would overlap with"},o),a.forEach(l=>{o.append(T(l))}));let m=p.findNotExact(n??"");m.length>0&&(i("p",{className:"tfb-heading",innerText:"Likely duplicates"},o),m.forEach(l=>{o.append(T(l))})),a.length+m.length===0&&i("p",{innerText:`This emote doesn't overlap
with any in your library.`},o)}function z(){document.querySelector(`#${v}`)?.remove()}var se=q(S(),1),oe="/channel",Pe=(0,se.match)("/emoticon/:id"),re=t=>!!Pe(t);async function ae(){let t=null;async function e(){let s=location.pathname;s.includes(oe)?(!t||!t.includes(oe))&&(A(),_e()):re(s)?(!t||!re(t))&&(A(),He()):A(),t=s}e(),new MutationObserver(e).observe(document.body,{childList:!0,subtree:!0})}async function ke(){return(await E("#channel")).childNodes.item(0).wholeText.trim()}async function _e(){let t=await E("#sidebar"),e=i("div",{className:"panel panel-default tfb-ffz",id:v},t),n=i("div",{className:"panel-heading",innerText:x},e),s=i("div",{className:"tfb-ffz-container"},e);w("Overlapping emote names",p.overlappingHTML,s),w("Likely duplicates",p.likelyDuplicatesHTML,s),p.updateEmotes(await ke())}async function He(){let t=await E("#sidebar"),e=i("div",{className:"panel panel-default tfb-ffz",id:v},t),n=i("div",{className:"panel-heading",innerText:x},e),s=i("div",{className:"list-group"},e),r=Array.from(t.querySelectorAll(".panel")).find(a=>a.querySelector(".panel-heading")?.innerText.toLowerCase()==="Add to Channel".toLowerCase()),o=Array.from(r?.querySelectorAll(".list-group-item")??[]).map(a=>a.childNodes.item(0).wholeText.trim()),c=(await E("#emoticon")).childNodes.item(0).wholeText.trim();for(let a of o){let m=new L;await m.updateEmotes(a.toLowerCase());let l=i("div",{className:"list-group-item"},s);i("p",{className:"tfb-section-heading",innerText:a},l);let d=m.findExact(c??"");d.length>0&&(i("p",{className:"tfb-heading",innerText:"Would overlap with"},l),d.forEach(f=>{l.append(T(f))}));let u=m.findNotExact(c??"");u.length>0&&(i("p",{className:"tfb-heading",innerText:"Likely duplicates"},l),u.forEach(f=>{l.append(T(f))})),d.length+u.length===0&&i("p",{className:"tfb-info",innerText:`This emote doesn't overlap
with any in your library.`},l)}}function A(){document.querySelector(`#${v}`)?.remove()}var I=document.createElement("link");I.rel="stylesheet";I.href="https://cdn.jsdelivr.net/gh/brilliantdrink/tools-for-bttv/tools-for-bttv.css";document.head.appendChild(I);function Fe(){location.host===O?ne():location.host===V&&ae()}Fe();})();
