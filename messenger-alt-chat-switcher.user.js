// ==UserScript==
// @name         FB/Messenger Alt+N 快速切換聊天室 (Thorium 穩健版)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  支援 Facebook Messages 與 Messenger，修正輸入法衝突，切換後自動 focus 訊息輸入框
// @author       Gemini
// @match        *://*.facebook.com/messages/*
// @match        *://*.messenger.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('--- 聊天室切換腳本已載入 (Thorium 版) ---');

    function getChatItems() {
        const possibleSelectors = [
            'div[role="navigation"] div[role="row"]',
            'div[role="grid"] div[role="row"]',
            'div[aria-label="聊天室"] div[role="row"]',
            'div[aria-label="Chats"] div[role="row"]',
            'a[href*="/messages/t/"]'
        ];

        for (let selector of possibleSelectors) {
            const items = Array.from(document.querySelectorAll(selector)).filter(el => {
                const r = el.getBoundingClientRect();
                return r.height > 20 && r.width > 30; // 排除無效的隱藏元素
            });
            if (items.length > 0) return items;
        }
        return [];
    }

    function getMessageInput() {
        const inputSelectors = [
            'div[contenteditable="true"][aria-label*="訊息"]',
            'div[contenteditable="true"][aria-label*="Message"i]',
            'div[role="textbox"][contenteditable="true"]',
            'div[contenteditable="true"]'
        ];

        for (let selector of inputSelectors) {
            let boxes;
            try {
                boxes = Array.from(document.querySelectorAll(selector));
            } catch (err) {
                continue; // 舊瀏覽器不支援大小寫不敏感選擇器時跳過
            }

            const visible = boxes.filter(el => {
                const r = el.getBoundingClientRect();
                return r.height > 10 && r.width > 50; // 排除隱藏或過小的元素
            });

            // 訊息輸入框位於畫面底部，取最下方那一個，避免抓到上方的搜尋框
            if (visible.length > 0) {
                return visible.reduce((lowest, el) =>
                    el.getBoundingClientRect().bottom > lowest.getBoundingClientRect().bottom ? el : lowest
                );
            }
        }
        return null;
    }

    // 把游標移到輸入框內容的最後面
    function moveCaretToEnd(el) {
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (err) {
            // 輸入框尚未初始化時可能失敗，忽略即可
        }
    }

    // 切換聊天室後輸入框會被重建，這裡輪詢等它出現再 focus
    function focusMessageInput(timeout = 3000, interval = 100) {
        const deadline = Date.now() + timeout;

        const timer = setInterval(() => {
            const input = getMessageInput();

            if (input) {
                input.focus();
                moveCaretToEnd(input);

                if (document.activeElement === input) {
                    clearInterval(timer);
                    console.log('[輸入框] 已 focus 訊息輸入框');

                    // React 重新渲染可能搶走 focus，稍後再補一次
                    setTimeout(() => {
                        const latest = getMessageInput();
                        if (latest && document.activeElement !== latest) {
                            latest.focus();
                            moveCaretToEnd(latest);
                            console.log('[輸入框] 已重新 focus 訊息輸入框');
                        }
                    }, 300);
                    return;
                }
            }

            if (Date.now() > deadline) {
                clearInterval(timer);
                console.warn('[輸入框] 等待逾時，找不到可 focus 的訊息輸入框');
            }
        }, interval);
    }

    // Capture 模式攔截
    window.addEventListener('keydown', function(e) {

        // 使用 e.code 判斷實體按鍵，不受注音輸入法影響
        let keyNum = null;
        if (e.code && e.code.startsWith('Digit')) {
            keyNum = parseInt(e.code.replace('Digit', ''));
        } else if (e.code && e.code.startsWith('Numpad')) {
            keyNum = parseInt(e.code.replace('Numpad', ''));
        }

        // 判斷：按下 Alt，且按鍵是數字 1~9
        if (e.altKey && keyNum >= 1 && keyNum <= 9 && !e.ctrlKey && !e.shiftKey) {

            // 攔截預設行為
            e.preventDefault();
            e.stopImmediatePropagation();

            const index = keyNum - 1;
            const items = getChatItems();

            console.log(`[成功觸發] 按下 Alt+${keyNum}，目前抓到 ${items.length} 個聊天室`);

            if (items[index]) {
                const target = items[index].querySelector('a, [role="link"]') || items[index];

                // 模擬真實滑鼠點擊
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(clickEvent);

                // 進入聊天室後自動 focus 訊息輸入框
                focusMessageInput();

            } else {
                console.warn(`找不到第 ${keyNum} 個聊天室`);
            }
        }
    }, true);
})();
