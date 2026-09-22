# FB/Messenger Alt+N Chat Switcher

[繁體中文說明](README.zh-TW.md)

A Tampermonkey userscript that lets you jump to the 1st–9th conversation in the sidebar of Facebook Messages and Messenger with `Alt + 1` … `Alt + 9`, then automatically focuses the message box so you can start typing right away.

## Features

- Works on both `facebook.com/messages/*` and `messenger.com/*`
- Focuses the composer after switching, with the caret placed at the end of any existing draft
- Detects digits via `event.code` (physical keys), so IMEs such as Zhuyin/Pinyin don't break the shortcut
- Intercepts the key in capture phase to avoid clashing with the site's own shortcuts
- Multiple fallback selectors, so the chat list is still found after UI changes
- Supports both the number row and the numeric keypad

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser (Chrome / Edge / Firefox, or any Chromium-based browser).
2. Open Tampermonkey and choose "Create a new script".
3. Paste the full contents of [`messenger-alt-chat-switcher.user.js`](messenger-alt-chat-switcher.user.js) and save.
4. Reload your Messenger or Facebook messages tab.

## Usage

| Shortcut | Action |
| --- | --- |
| `Alt + 1` | Open the 1st chat in the list |
| `Alt + 2` – `Alt + 9` | Open the 2nd – 9th chat in the list |

After switching, the script focuses the composer at the bottom of the page (waiting up to 3 seconds), so you can start typing immediately.

Open the browser console (F12) to see log lines such as `[hotkey] Alt+3 pressed, 12 chats found` and `[composer] focused the message box`.

## Troubleshooting

- **Nothing happens**: make sure the script is enabled in Tampermonkey and that the current URL matches the `@match` rules.
- **Console reports 0 chats found**: the Facebook UI probably changed — adjust `possibleSelectors` inside `getChatItems()`.
- **Wrong conversation opens**: the sidebar reorders itself as new messages arrive; the index always refers to the list as currently rendered.
- **The composer isn't focused**: if the console shows `[composer] timed out`, loading took longer than 3 seconds or the selectors are stale — raise the `timeout` passed to `focusMessageInput()`, or adjust `inputSelectors` inside `getMessageInput()`.
- **Focus is stolen right away**: the script already re-focuses 300 ms after the first success; if it still loses focus, increase that `setTimeout` delay.

## License

See [LICENSE](LICENSE).
