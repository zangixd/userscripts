// ==UserScript==
// @name        linux-scroll
// @match       *://krunker.io/*
// @exclude     *://krunker.io/social.html
// @exclude     *://krunker.io/editor.html
// @version     1.0.0
// @author      Zangi
// @description Activates scroll jump for linux users.
// @run-at      document-start
// ==/UserScript==

'use strict';

const pushOrig = Array.prototype.push;
let isJumping = false;
let jumpState = 0;
const uiBase = document.getElementById('uiBase');

function hookPush() {
  Array.prototype.push = function(...args) {
    if(Array.isArray(args[0]) && args[0].length === 15) {
      let inputArray = args[0];

      if (isJumping) {
        jumpState = 1 - jumpState;
        inputArray[7] = jumpState;
        isJumping = false;
      }
    }

    return pushOrig.apply(this, args);
  }
  
  window.addEventListener('wheel', () => {
    if (!document.getElementById('uiBase').classList.contains('onGame')) return;
    isJumping = true;
  });
}

hookPush();