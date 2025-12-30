const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app"; 
const socket = io(REPLIT_URL, { transports: ['websocket'] }); 

let scene, camera, renderer, peer, conn, flashlight;
let move = { f: false, b: false, l: false, r: false, interact: false };
let yaw = 0, pitch = 0; // For 360 Rotation
let interactables = [], otherPlayers = {};
const roomCode = Math.floor(1000 + Math.random() * 9000).toString();

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x000000, 0.08);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Click to enable 360 Mouse Movement
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
    scene.add(ambient);
    flashlight = new THREE.SpotLight(0xffffff, 5, 40, Math.PI/6, 0.5);
    camera.add(flashlight);
    flashlight.target = new THREE.Object3D();
    camera.add(flashlight.target);
    flashlight.target.position.set(0, 0, -1);
    scene.add(camera);

    createMap();
    animate();
}

// 360 Mouse Movement Logic
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

function createMap() {
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Spawn a test Pizza (Interactable)
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

    // 360 Directional Movement
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Stay on ground
    direction.normalize();

    const side = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

    if(move.f) camera.position.addScaledVector(direction, -0.2);
    if(move.b) camera.position.addScaledVector(direction, 0.2);
    if(move.l) camera.position.addScaledVector(side, -0.2);
    if(move.r) camera.position.addScaledVector(side, 0.2);

    // INTERACTION SYSTEM
    let canInteract = false;
    interactables.forEach(obj => {
        const dist = camera.position.distanceTo(obj.position);
        if(dist < 5) {
            canInteract = true;
            if(move.interact) {
                addChat('System', `You picked up: ${obj.userData.name}`);
                scene.remove(obj);
                interactables = interactables.filter(i => i !== obj);
                move.interact = false;
            }
        }
    });
    document.getElementById('interact-label').style.display = canInteract ? 'block' : 'none';

    // Multiplayer Position Sync
    if(conn && conn.open) {
        conn.send({ type: 'move', x: camera.position.x, z: camera.position.z, ry: yaw });
    }

    renderer.render(scene, camera);
}

// Input Fix
window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.code === 'KeyE') move.interact = true;
});
window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
    if(e.code === 'KeyE') move.interact = false;
});

// Lobby/UI Functions
window.hostGame = () => { socket.emit('registerHouse', roomCode); startGame(); };
window.joinGame = () => { 
    const id = document.getElementById('joinID').value;
    conn = peer.connect(id);
    conn.on('open', () => { startGame(); });
};
function startGame() { 
    document.getElementById('menu').style.display = 'none'; 
    document.getElementById('ui').style.display = 'block'; 
    init(); 
}
function addChat(s, m) {
    const log = document.getElementById('chat-log');
    if(log) { log.innerHTML += `<div><b>${s}:</b> ${m}</div>`; log.scrollTop = log.scrollHeight; }
}

// PeerJS Setup
peer = new Peer(roomCode);
peer.on('open', id => { document.getElementById('my-id-display').innerText = "YOUR ID: " + id; });























































