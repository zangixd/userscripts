// ==UserScript==
// @name        visualizer
// @match       *://krunker.io/*
// @exclude     *://krunker.io/social.html
// @exclude     *://krunker.io/editor.html
// @version     1.0.0
// @author      Zangi
// @description Visualize various invisible hitboxes.
// ==/UserScript==

// NOTE
// This script requires: 
// 1. Access to krunker's game object which I assign to the global variable: window.gameObj using a seperate script. 

'use strict';

const consoleLog = window.console.log;

let showBorders = false;
let showInvis = false;
let showDeathZones = false;
let showScoreZones = false;
let showTeleporters = false;
let sceneMeshes = [];

// Handle key presses to toggle visibility of objects
function handleKeyEvents(event, mapData) {
  if (document.activeElement != document.body) return;
  const key = event.key.toUpperCase();

  if (key === '6') {
    showBorders = !showBorders;
    injectChatMessage(`Border Visuals: ${showBorders ? 'Enabled' : 'Disabled'}`);
    renderMeshes(mapData);
  } else if (key === '7') {
    showInvis = !showInvis;
    injectChatMessage(`Invisible Object Visuals: ${showInvis ? 'Enabled' : 'Disabled'}`);
    renderMeshes(mapData);
  } else if (key === '8') {
    showDeathZones = !showDeathZones;
    injectChatMessage(`Deathzone Visuals: ${showDeathZones ? 'Enabled' : 'Disabled'}`);
    renderMeshes(mapData);
  } else if (key === '9') {
    showScoreZones = !showScoreZones;
    injectChatMessage(`Scorezone Visuals: ${showScoreZones ? 'Enabled' : 'Disabled'}`);
    renderMeshes(mapData);
  } else if (key === '0') {
    showTeleporters = !showTeleporters;
    injectChatMessage(`Teleporter Visuals: ${showTeleporters ? 'Enabled' : 'Disabled'}`);
    renderMeshes(mapData);
  }
}

// Wait for krunker to populate all required objects
function waitForObjects() {
  const captured =
    window.gameObj &&
    window.gameObj.sessionId &&
    window.gameObj.map &&
    typeof window.gameObj.mapIndex === 'number' &&
    window.gameObj.map.maps &&
    window.gameObj.map.getMapName &&
    window.gameObj.render &&
    window.gameObj.render.scene &&
    window.gameObj.THREE;

  if (captured) {
    main();
    consoleLog('[visualizer] Objects captured');
  } else {
    setTimeout(waitForObjects, 500);
    consoleLog('[visualizer] Objects not found');
  }
}

// Clear scene of old map meshes
function clearScene(scene) {
  for (const mesh of sceneMeshes) {
		scene.remove(mesh);
		mesh.geometry.dispose();
		mesh.material.dispose();
	}
	sceneMeshes = [];
  consoleLog('[visualizer] Meshes cleared');
}

// Render based on map data
function renderMeshes(mapData) {
  const THREE = window.gameObj.THREE;
  const scene = window.gameObj.render.scene;

  consoleLog('[visualizer] Clearing previous meshes');
  clearScene(scene);

  for (const obj of mapData.objects) {
    if (!obj.p || !obj.s) continue;

    const [x, y, z] = obj.p;
    const [w, h, l] = obj.s;

    // Borders
    const borderHeight = 500;
    if (obj.bo && !obj.l && showBorders) {
      const geometry = new THREE.BoxGeometry(w - 0.2, borderHeight, l - 0.2);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
				opacity: 0.75,
        polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1
      });

      const borderMesh = new THREE.Mesh(geometry, material);
      borderMesh.position.set(x, y + h + borderHeight / 2, z);
      scene.add(borderMesh);
      sceneMeshes.push(borderMesh);
    }

    // Invisible objects
    if (obj.v && showInvis) {
			const geometry = new THREE.BoxGeometry(w, h, l);
			const material = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.5,
				depthWrite: false,
				side: THREE.DoubleSide,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1
			});

			const invisMesh = new THREE.Mesh(geometry, material);
			invisMesh.position.set(x, y + h / 2, z);
			scene.add(invisMesh);
			sceneMeshes.push(invisMesh);
		}

    // Death Zones
    if (obj.i === 12 && showDeathZones) {
      const geometry = new THREE.BoxGeometry(w, h, l);
			const material = new THREE.MeshBasicMaterial({
				color: 0xff0000,
				transparent: true,
				opacity: 0.5,
				depthWrite: false,
				side: THREE.DoubleSide,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1
			});

			const deathZoneMesh = new THREE.Mesh(geometry, material);
			deathZoneMesh.position.set(x, y + h / 2, z);
			scene.add(deathZoneMesh);
			sceneMeshes.push(deathZoneMesh);
    }

    // Score Zones
    if (obj.i === 12 && showScoreZones) {
      const geometry = new THREE.BoxGeometry(w, h, l);
			const material = new THREE.MeshBasicMaterial({
				color: 0x00ff00,
				transparent: true,
				opacity: 0.5,
				depthWrite: false,
				side: THREE.DoubleSide,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1
			});

			const scoreZoneMesh = new THREE.Mesh(geometry, material);
			invisMesh.position.set(x, y + h / 2, z);
			scene.add(scoreZoneMesh);
			sceneMeshes.push(scoreZoneMesh);
    }

    // Teleporters
    if (obj.i === 12 && showTeleporters) {
      const geometry = new THREE.BoxGeometry(w, h, l);
			const material = new THREE.MeshBasicMaterial({
				color: 0x00ccff,
				transparent: true,
				opacity: 0.5,
				depthWrite: false,
				side: THREE.DoubleSide,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1
			});

			const teleporterMesh = new THREE.Mesh(geometry, material);
			teleporterMesh.position.set(x, y + h / 2, z);
			scene.add(teleporterMesh);
			sceneMeshes.push(teleporterMesh);
    }
  }
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

let mapCheckInterval = null;
function main() {
  if (mapCheckInterval) clearInterval(mapCheckInterval); // Clear old interval before creating new one

  let mapData = window.gameObj.map.maps[window.gameObj.mapIndex];
  let sessionId = window.gameObj.sessionId;
  consoleLog('[visualizer] Map Data found: ', mapData, ', Session: ', sessionId);

  consoleLog('[visualizer] Rendering started');
  renderMeshes(mapData);

  // Check for new map data
  mapCheckInterval = setInterval(() => {
    const mapIndex = window.gameObj.mapIndex;
    const mapList = window.gameObj.map.maps;

    if (mapData.name != mapList[mapIndex].name) {
      mapData = mapList[mapIndex];
      consoleLog('[visualizer] New map data found: ', mapData);

      consoleLog('[visualizer] Re-rendering');
      renderMeshes(mapData);
    } else if (sessionId !== window.gameObj.sessionId) {
      consoleLog('[visualizer] New session detected. Re-rendering');
      sessionId = window.gameObj.sessionId;
      renderMeshes(mapData);
    }
  }, 1000);

  window.removeEventListener('keydown', (event) => handleKeyEvents(event, mapData)); // Remove any prior event listeners
  window.addEventListener('keydown', (event) => handleKeyEvents(event, mapData));
}

waitForObjects();