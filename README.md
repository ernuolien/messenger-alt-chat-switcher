# FB/Messenger Alt+N 快速切換聊天室

一個 Tampermonkey 使用者腳本，在 Facebook Messages 與 Messenger 網頁版用 `Alt + 1` ~ `Alt + 9` 快速切換左側聊天室清單的第 1~9 個對話。

## 特色

- 同時支援 `facebook.com/messages/*` 與 `messenger.com/*`
- 以 `event.code`（實體按鍵）判斷數字鍵，不受注音等輸入法影響
- 使用 capture 模式攔截按鍵，避免與網站本身的快捷鍵衝突
- 多組選擇器後備機制，介面改版時仍有機會抓到聊天室清單
- 支援主鍵盤數字鍵與數字鍵盤（Numpad）

## 安裝

1. 在瀏覽器安裝 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Thorium / Firefox 皆可）。
2. 開啟 Tampermonkey 的「新增腳本」。
3. 將 [`messenger-alt-chat-switcher.user.js`](messenger-alt-chat-switcher.user.js) 的內容全部貼上並儲存。
4. 重新整理 Messenger 或 Facebook 訊息頁面。

## 使用方式

| 按鍵 | 動作 |
| --- | --- |
| `Alt + 1` | 切換到清單中第 1 個聊天室 |
| `Alt + 2` ~ `Alt + 9` | 依序切換到第 2 ~ 9 個聊天室 |

按下後可開啟瀏覽器主控台（F12）查看紀錄，例如 `[成功觸發] 按下 Alt+3，目前抓到 12 個聊天室`。

## 疑難排解

- **完全沒反應**：確認 Tampermonkey 已啟用該腳本，且目前網址符合 `@match` 規則。
- **主控台顯示抓到 0 個聊天室**：Facebook 介面可能改版，請調整 `getChatItems()` 內的 `possibleSelectors`。
- **切換到錯誤的對話**：清單順序會隨新訊息變動，順序以畫面當下的清單為準。

## 授權

見 [LICENSE](LICENSE)。
