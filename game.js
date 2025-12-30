const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app"; 
// This setup retries every 2 seconds if the connection fails
const socket = io(REPLIT_URL, { 
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 2000 
}); 

let scene, camera, renderer, peer, conn, flashlight;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false, yaw = 0, pitch = 0;
let interactables = [];
const roomCode = Math.floor(1000 + Math.random() * 9000).toString();

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x000000, 0.04);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    document.body.addEventListener('click', () => { document.body.requestPointerLock(); });

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.3));
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    flashlight = new THREE.SpotLight(0xffffff, 15, 60, Math.PI/4, 0.3);
    camera.add(flashlight);
    flashlight.target = new THREE.Object3D();
    camera.add(flashlight.target);
    flashlight.target.position.set(0, 0, -1);
    scene.add(camera);

    createMap();
    animate();
}

function createMap() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x333333}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);
    spawnItem(5, 1, -5, 0xffaa00, 'food', 'Pizza');
}

function spawnItem(x, y, z, color, type, name) {
    const item = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), new THREE.MeshStandardMaterial({color: color}));
    item.position.set(x, y, z);
    item.userData = { type, name };
    scene.add(item);
    interactables.push(item);
}

function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return;

    let targetFOV = isSprinting ? 88 : 75;
    let speed = isSprinting ? 0.35 : 0.18;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
    camera.updateProjectionMatrix();

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

    if(move.f) camera.position.addScaledVector(dir, speed);
    if(move.b) camera.position.addScaledVector(dir, -speed);
    if(move.l) camera.position.addScaledVector(side, speed);
    if(move.r) camera.position.addScaledVector(side, -speed);

    // Interaction Check
    interactables.forEach(obj => {
        if(camera.position.distanceTo(obj.position) < 5 && move.interact) {
            addChat('System', `Picked up: ${obj.userData.name}`);
            scene.remove(obj);
            interactables = interactables.filter(i => i !== obj);
            move.interact = false;
        }
    });

    renderer.render(scene, camera);
}

// Controls
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.code === 'KeyE') move.interact = true;
    if(e.shiftKey) isSprinting = true;
});

window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
    if(e.code === 'KeyE') move.interact = false;
    if(!e.shiftKey) isSprinting = false;
});

// Social UI Fix
window.hostGame = () => { socket.emit('registerHouse', roomCode); startGame(); };
function startGame() { 
    document.getElementById('menu').style.display = 'none'; 
    document.getElementById('ui').style.display = 'block'; 
    init(); 
}
function addChat(s, m) {
    const log = document.getElementById('chat-log');
    if(log) { log.innerHTML += `<div><b>${s}:</b> ${m}</div>`; log.scrollTop = log.scrollHeight; }
}

socket.on('updateServerList', (houses) => {
    const ul = document.getElementById('server-ul');
    if(!ul) return;
    ul.innerHTML = houses.length ? "" : "<li>No active houses</li>";
    houses.forEach(h => {
        if(h.id !== roomCode) ul.innerHTML += `<li>House ${h.id} <button onclick="window.quickJoin('${h.id}')">JOIN</button></li>`;
    });
});
