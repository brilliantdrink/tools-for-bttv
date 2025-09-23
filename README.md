<div align="center">
    <img width="120px" src="tfb-logo.png" alt="The logo for Tools for BTTV"/>
    <h1>Tools for BTTV</h1>
</div>

> [!WARNING]  
> This browser extension is still under development and may have bugs and performance issues.

Tools for BTTV is a browser extension that provides additional features for emote management with BetterTTV and
FrankerFaceZ (support for 7tv is planned).
Current features:

- Duplicate emotes detection for channel dashboard and on emote pages (available on BTTV and FFZ)
- Emote usage data visible on dashboard and emote page (available on BTTV and FFZ)
- Free-form notes and "do not remove" tags for emotes (available on BTTV and FFZ)

These features will also be implemented for the other platforms. Planned features include:

- Seasonal / themed emote collections / variants with automated (one-click) replacement for the whole collection
- Notification (on-site) about deleted emotes
- Emote fallbacks for deleted emotes
- Categorize emote usage to check which bots are using which emotes

## Install

- **Chrome** and **Chrome-like browsers**  
  incl. Brave, Opera, Opera GX, Edge  
  https://chromewebstore.google.com/detail/tools-for-bttv-beta/lpdmpiigjiidppfebmoidccikbmkielg

- **Firefox**  
  https://addons.mozilla.org/en-US/firefox/addon/tools-for-bttv-beta/

## Screenshots

<div align="center">
    <img width="45%" src="img/bttv-dash.jpg" alt="Screenshot of the tool's panel on the BTTV dashboard"/>
    <img width="45%" src="img/ffz-dash.jpg" alt="Screenshot of the tool's panel on the FFZ channel page"/>
</div>
<div align="center">
    <img width="35%" src="img/bttv-dash-widget.jpg" alt="Screenshot of the tool's panel on the BTTV dashboard"/>
    <img width="35%" src="img/ffz-dash-widget.jpg" alt="Screenshot of the tool's panel on the FFZ channel page"/>
</div>
<div align="center">
    <img width="45%" src="img/bttv-emote.jpg" alt="Screenshot of the tool's panel on a BTTV emote page"/>
    <img width="45%" src="img/ffz-emote.jpg" alt="Screenshot of the tool's panel on a FFZ emote page"/>
</div>
<div align="center">
    <img width="30%" src="img/ffz-dupes.jpg" alt="Screenshot of the tool's panel on a FFZ emote page"/>
</div>

## Build for Reviewing

### Prerequisites

- Nodejs with npm

### Build

First install the dependencies

```shell
npm i
```

Then build the files

```shell
npm run build
```

Package with

```shell
npm run pack-extension
```
