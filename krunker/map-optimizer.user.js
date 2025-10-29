// ==UserScript==
// @name        map-optimizer
// @match       *://krunker.io/*
// @exclude     *://krunker.io/social.html
// @exclude     *://krunker.io/editor.html
// @version     1.0.0
// @author      Zangi
// @description Bypasses checksum krunker does on fetched map files in order to fetch optimized versions from a seperate server. Also includes cross session toggle functionallity.
// @run-at      document-start
// ==/UserScript==

// NOTE
//
// This script requires: 
// 1. Access to krunker's game object which I assign to the global variable: window.gameObj using a seperate script. 
// 2. The current file name of the map currently being fetched which I assign to the global variable: window.mapFileName using a seperate script.
// 3. The ability to change krunkers map fetch logic within its game code to grap map files from a different source based on if map optimizations are toggled.

'use strict';

const baseMapArray = [{"name":"Burg","fileName":"burg_new","id":0},{"name":"Littletown","fileName":"littletown","id":1},{"name":"Sandstorm","fileName":"sandstorm_v3","id":2},{"name":"Subzero","fileName":"subzero_new","id":3},{"name":"Undergrowth","fileName":"undergrowth","id":4},{"name":"Shipment","fileName":"shipment","id":5},{"name":"Freight","fileName":"freight","id":6},{"name":"Lostworld","fileName":"lostworld_s6","id":7},{"name":"Citadel","fileName":"citadel","id":8},{"name":"Oasis","fileName":"oasis_v3","id":9},{"name":"Kanji","fileName":"kanji","id":10},{"name":"Industry","fileName":"industry","id":11},{"name":"Lumber","fileName":"lumber","id":12},{"name":"Evacuation","fileName":"evacuation","id":13},{"name":"Site","fileName":"site","id":14},{"name":"SkyTemple","fileName":"skytemple_v2","id":15},{"name":"Lagoon","fileName":"lagoon","id":16},{"name":"Bureau","fileName":"bureau","id":17},{"name":"Tortuga","fileName":"shipwrecked","id":18},{"name":"Tropicano","fileName":"tropicano","id":19},{"name":"Krunk_Plaza","fileName":"krunk_plaza_eterno","id":20},{"name":"Arena","fileName":"arena","id":21},{"name":"Habitat","fileName":"habitat_v2","id":22},{"name":"Atomic","fileName":"atomic","id":23},{"name":"Old_Burg","fileName":"burg_2018","id":24},{"name":"Throwback","fileName":"throwback_2018","id":25},{"name":"Stockade","fileName":"stockade_2018","id":26},{"name":"Facility","fileName":"facility","id":27},{"name":"Clockwork","fileName":"clockwork","id":28},{"name":"Laboratory","fileName":"laboratory","id":29},{"name":"Shipyard","fileName":"shipyard","id":30},{"name":"Soul Sanctum","fileName":"sanctum","id":31},{"name":"Bazaar","fileName":"bazaar","id":32},{"name":"Erupt","fileName":"erupt","id":33},{"name":"HQ","fileName":"hq","id":34},{"name":"Khepri","fileName":"khepri","id":35},{"name":"Lush","fileName":"lush","id":36},{"name":"Vivo","fileName":"vivo","id":37},{"name":"Slide Moonlight","fileName":"slide_moonlight","id":38},{"name":"Eterno Sim","fileName":"eterno_sim","id":39}];
const digestOrig = window.crypto.subtle.digest;

// Get original map hash to bypass checksum by krunker
const hashCache = {};
async function getOriginalMapHash(mapFileName) {
  // Keep hash cache to 5 entries to prevent problematic memory leaking issues after running krunker for a long time.
  if (Object.keys(hashCache).length >= 5) {
    const firstKey = Object.keys(hashCache)[0];
    delete hashCache[firstKey];
    console.log(`[map-optimizer] Removed oldest hash: ${firstKey}`);
  }

  const response = await fetch(`https://krunker.io/maps/${mapFileName}.json`);
  const buffer = await response.arrayBuffer();
  const hash = await digestOrig.call(window.crypto.subtle, 'SHA-256', buffer);
  return hash;
}

// Hook digest which krunker uses to do checksum
window.crypto.subtle.digest = async function (algo, data) {
  const u8 = new Uint8Array(data);
  if (algo === 'SHA-256' && u8.length > 1000) {
    const mapFileName = window.mapFileName
    if (!hashCache[mapFileName]) hashCache[mapFileName] = await getOriginalMapHash(mapFileName);

    return hashCache[mapFileName]
  }

  return digestOrig.call(this, algo, data);
}

// Get the index of the chat messages and return index + 1
function getChatIndex() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return 1000; // fallback base

  const chatItems = [...chatList.querySelectorAll('[id^="chatMsg_"]')];
  const indices = chatItems
    .map(el => parseInt(el.id.split('_')[1], 10))
    .filter(n => !isNaN(n));

  const maxIndex = indices.length ? Math.max(...indices) : 1000;
  return maxIndex + 1;
}

// Inject messages into krunker chat
function injectChatMessage(message) {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;

  const msgDiv = document.createElement('div');
  msgDiv.dataset.tab = '-1';
  const msgId = getChatIndex();
  msgDiv.id = `chatMsg_${msgId}`;

  const itemDiv = document.createElement('div');
  itemDiv.className = 'chatItem';
  itemDiv.style.backgroundColor = 'rgba(0, 0, 0, 0)';

  // Message
  const msgSpan = document.createElement('span');
  msgSpan.className = 'chatMsgText';
  msgSpan.style.color = '#4AF626';
  msgSpan.textContent = message;

  itemDiv.appendChild(msgSpan);
  msgDiv.appendChild(itemDiv);
  msgDiv.appendChild(document.createElement('br'));

  chatList.appendChild(msgDiv);
  chatList.scrollTop = chatList.scrollHeight;
}

// Clears map array so krunker re-fetches map file after toggle and new map load
function clearMapArray(currentMapName) {
  const mapList = window.gameObj.map.maps;

  for (let i = 0; i < mapList.length; i++) {
    const map = mapList[i];
    if (map.name === currentMapName) continue;

    const baseMap = baseMapArray.find(obj => obj.name === map.name);
    mapList[i] = baseMap;
  }
}

// Toggle functionallity
function setLocalStorage() {
  if (JSON.parse(localStorage.getItem('optimizeMaps')) === null ) {
    localStorage.setItem('optimizeMaps', JSON.stringify(true));
  }

  window.addEventListener('keydown', (event) => {
    if (document.activeElement != document.body) return;
    const key = event.key.toUpperCase();

    const currentToggle = JSON.parse(localStorage.getItem('optimizeMaps'));
    if (key === '1') {
      if (currentToggle) {
        localStorage.setItem('optimizeMaps', JSON.stringify(false));
      } else {
        localStorage.setItem('optimizeMaps', JSON.stringify(true));
      }

      injectChatMessage(`Map-Optimizer: ${JSON.parse(localStorage.getItem('optimizeMaps')) ? 'Enabled' : 'Disabled'}`);
      clearMapArray(window.gameObj.map.maps[window.gameObj.mapIndex].name); // Clears the map array so krunker re-fetches
    }
  });
}

setLocalStorage();