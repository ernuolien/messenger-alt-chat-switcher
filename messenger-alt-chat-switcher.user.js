// ==UserScript==
// @name         FB/Messenger Alt+N Chat Switcher
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Switch chats with Alt+1..9 on Facebook Messages and Messenger, IME-safe, and focus the composer afterwards
// @author       ernuolien
// @match        *://*.facebook.com/messages/*
// @match        *://*.messenger.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('--- Alt+N chat switcher loaded ---');

    function getChatItems() {
        // Chinese/English aria-labels below are Facebook's own UI strings, not translatable text
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
                return r.height > 20 && r.width > 30; // Drop hidden or zero-sized elements
            });
            if (items.length > 0) return items;
        }
        return [];
    }

    function getMessageInput() {
        // Chinese/English aria-labels below are Facebook's own UI strings, not translatable text
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
                continue; // Skip selectors the browser rejects (e.g. no case-insensitive attribute support)
            }

            const visible = boxes.filter(el => {
                const r = el.getBoundingClientRect();
                return r.height > 10 && r.width > 50; // Drop hidden or too-small elements
            });

            // The composer sits at the bottom of the page: pick the lowest match
            // so we never grab the search box above it
            if (visible.length > 0) {
                return visible.reduce((lowest, el) =>
                    el.getBoundingClientRect().bottom > lowest.getBoundingClientRect().bottom ? el : lowest
                );
            }
        }
        return null;
    }

    // Place the caret at the end of the composer content
    function moveCaretToEnd(el) {
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (err) {
            // Can fail while the composer is still initialising; safe to ignore
        }
    }

    // Switching chats rebuilds the composer, so poll until it shows up, then focus it
    function focusMessageInput(timeout = 3000, interval = 100) {
        const deadline = Date.now() + timeout;

        const timer = setInterval(() => {
            const input = getMessageInput();

            if (input) {
                input.focus();
                moveCaretToEnd(input);

                if (document.activeElement === input) {
                    clearInterval(timer);
                    console.log('[composer] focused the message box');

                    // A React re-render may steal focus; re-focus shortly after
                    setTimeout(() => {
                        const latest = getMessageInput();
                        if (latest && document.activeElement !== latest) {
                            latest.focus();
                            moveCaretToEnd(latest);
                            console.log('[composer] re-focused the message box');
                        }
                    }, 300);
                    return;
                }
            }

            if (Date.now() > deadline) {
                clearInterval(timer);
                console.warn('[composer] timed out: no message box found to focus');
            }
        }, interval);
    }

    // Intercept in capture phase, before the page handles the key
    window.addEventListener('keydown', function(e) {

        // Use e.code (physical key) so IMEs such as Zhuyin do not interfere
        let keyNum = null;
        if (e.code && e.code.startsWith('Digit')) {
            keyNum = parseInt(e.code.replace('Digit', ''));
        } else if (e.code && e.code.startsWith('Numpad')) {
            keyNum = parseInt(e.code.replace('Numpad', ''));
        }

        // Trigger on Alt plus a digit from 1 to 9
        if (e.altKey && keyNum >= 1 && keyNum <= 9 && !e.ctrlKey && !e.shiftKey) {

            // Block the browser/page default action
            e.preventDefault();
            e.stopImmediatePropagation();

            const index = keyNum - 1;
            const items = getChatItems();

            console.log(`[hotkey] Alt+${keyNum} pressed, ${items.length} chats found`);

            if (items[index]) {
                const target = items[index].querySelector('a, [role="link"]') || items[index];

                // Simulate a real mouse click
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(clickEvent);

                // Focus the composer once the chat has opened
                focusMessageInput();

            } else {
                console.warn(`[hotkey] chat #${keyNum} not found`);
            }
        }
    }, true);
})();
