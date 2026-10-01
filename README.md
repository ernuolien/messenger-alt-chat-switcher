# FB/Messenger Chat Switcher

[![Install with Tampermonkey](https://img.shields.io/badge/Install-Tampermonkey-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js)

[繁體中文說明](README.zh-TW.md)

A Tampermonkey userscript for Facebook Messages and Messenger: jump to the 1st–9th conversation in the sidebar with a digit, step through conversations with the arrow keys, and have the message box focused automatically so you can start typing right away.

## Features

- `Alt + 1` … `Alt + 9` opens the matching conversation in the sidebar
- `Alt + ↑` / `Alt + ↓` moves to the previous/next conversation and wraps around
- The composer is focused after switching, with the caret at the end of any existing draft
- A small toast confirms which conversation was opened
- One script covers Linux and Windows/macOS: see [Hotkeys per platform](#hotkeys-per-platform)
- Digits come from `event.code` (physical keys), so IMEs such as Zhuyin/Pinyin don't break the shortcut; the number row and the numeric keypad both work
- Keys are handled in capture phase, before the site's own shortcuts
- Multiple fallback selectors for the chat list, the active row and the composer, so things keep working after minor UI changes

## Hotkeys per platform

The modifier differs by platform, and `HOTKEY_MODE = 'auto'` (the default) picks the right one for you:

| Platform | Combination | Why |
| --- | --- | --- |
| Linux | `Alt + Shift + …` | Chrome on Linux handles `Alt + digit` itself to switch tabs, so the page never sees the key |
| Windows / macOS | `Alt + …` | On Windows `Alt + Shift` is the system shortcut for switching keyboard layout |

To override the detection, edit `HOTKEY_MODE` at the top of the script:

| Value | Behaviour |
| --- | --- |
| `'auto'` | Alt+Shift on Linux, plain Alt elsewhere (default) |
| `'alt'` | Always plain Alt |
| `'alt-shift'` | Always Alt+Shift |
| `'both'` | Accept either combination |

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser (Chrome / Edge / Firefox, or any Chromium-based browser).
2. Click the install button above, or open [the raw script](https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js) — Tampermonkey shows its install page. Confirm the install.
3. Reload your Messenger or Facebook messages tab.

Installing from that URL also enables automatic updates: the script declares
`@updateURL` / `@downloadURL`, so Tampermonkey periodically checks `main` and picks up
any version with a higher `@version`. (Set the script's update behaviour in Tampermonkey
if you would rather be asked first.)

Manual alternative: create a new script in Tampermonkey and paste the contents of
[`messenger-alt-chat-switcher.user.js`](messenger-alt-chat-switcher.user.js). A copy
installed this way is not linked to the repository and will not update itself.

## Usage

With the default `auto` mode, `<mod>` is `Alt + Shift` on Linux and `Alt` on Windows/macOS:

| Shortcut | Action |
| --- | --- |
| `<mod> + 1` … `<mod> + 9` | Open the 1st – 9th chat in the list |
| `<mod> + ↑` | Previous chat (wraps to the bottom) |
| `<mod> + ↓` | Next chat (wraps to the top) |

After switching, the script waits for the new composer (up to 4 seconds), focuses it and places the caret at the end of any draft.

## Configuration

All settings live in the `// ===== Settings =====` block at the top of the script:

| Setting | Default | Purpose |
| --- | --- | --- |
| `HOTKEY_MODE` | `'auto'` | Modifier combination, see the table above |
| `AUTO_FOCUS_INPUT` | `true` | Focus the message box after switching |
| `FOCUS_TIMEOUT` | `4000` | How long to wait for the new composer, in ms |
| `SHOW_TOAST` | `true` | Show the on-screen confirmation |
| `TEXTS` | English | Toast strings, collected in one object for easy translation |

## Troubleshooting

- **Nothing happens**: make sure the script is enabled in Tampermonkey and the URL matches the `@match` rules. On Linux, check that you are holding Shift as well — the startup line in the console (F12) reports which combination is active.
- **The browser switches tabs instead**: that is Chrome on Linux consuming `Alt + digit`; use `Alt + Shift` (the default there) or set `HOTKEY_MODE = 'alt-shift'`.
- **Your keyboard layout changes instead**: Windows is consuming `Alt + Shift`; set `HOTKEY_MODE = 'alt'`.
- **Toast says the chat list was not found**: the Facebook UI probably changed — adjust the strategies in `getChatItems()`.
- **Wrong conversation opens**: the sidebar reorders itself as new messages arrive; the index always refers to the list as currently rendered.
- **The composer isn't focused**: raise `FOCUS_TIMEOUT`, or adjust the selectors in `findMessageInput()`.
- **`Alt + ↑/↓` starts from the wrong place**: the active conversation could not be detected, so the script starts from the top of the list. `getCurrentChatIndex()` is where that detection lives.

## License

See [LICENSE](LICENSE).
