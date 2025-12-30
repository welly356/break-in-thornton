// 1. Connection Config
const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app"; 
const socket = io(REPLIT_URL, { transports: ['websocket'] }); 

// 2. Global Variables
let scene, camera, renderer, peer, conn, flashlight;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false, yaw = 0, pitch = 0;
let interactables = [], otherPlayers = {};
const roomCode = Math.floor(1000 + Math.random() * 9000).toString();

// 3. Initialization
async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    // Lower fog density for better visibility (0.04)
    scene.fog = new THREE.FogExp2(0x000000, 0.04);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Click to enable 360 Mouse Movement
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    // Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25); 
    scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.15); 
    scene.add(ambient);

    flashlight = new THREE.SpotLight(0xffffff, 15, 60, Math.PI/4, 0.3);
    camera.add(flashlight);
    flashlight.target = new THREE.Object3D();
    camera.add(flashlight.target);
    flashlight.target.position.set(0, 0, -1);
    scene.add(camera);

    createMap();
    animate();
}

// 4. Map & Items
function createMap() {
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x333333}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Initial Walls
    addWall(0, -25, 50, 2); // Back Wall
    addWall(-25, 0, 2, 50); // Left Wall
    addWall(25, 0, 2, 50);  // Right Wall
    addWall(0, 25, 50, 2);  // Front Wall

    // Test Interaction Item
    spawnItem(5, 1, -5, 0xffaa00, 'food', 'Pizza');
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 12, d), new THREE.MeshStandardMaterial({color: 0x555555}));
    wall.position.set(x, 6, z);
    scene.add(wall);
}

function spawnItem(x, y, z, color, type, name) {
    const item = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), new THREE.MeshStandardMaterial({color: color}));
    item.position.set(x, y, z);
    item.userData = { type, name };
    scene.add(item);
    interactables.push(item);
}

// 5. Core Animation Loop
function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return;

    // FOV Sprint Effect
    let targetFOV = isSprinting ? 88 : 75;
    let speed = isSprinting ? 0.35 : 0.18;
    if (camera.fov !== targetFOV) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
        camera.updateProjectionMatrix();
    }

    // 360 Movement Logic
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; 
    direction.normalize();
    const side = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

    if(move.f) camera.position.addScaledVector(direction, speed);
    if(move.b) camera.position.addScaledVector(direction, -speed);
    if(move.l) camera.position.addScaledVector(side, speed);
    if(move.r) camera.position.addScaledVector(side, -speed);

    // Interaction Check
    let foundInteractable = false;
    interactables.forEach(obj => {
        const dist = camera.position.distanceTo(obj.position);
        if(dist < 5) {
            foundInteractable = true;
            if(move.interact) {
                addChat('System', `Picked up: ${obj.userData.name}`);
                scene.remove(obj);
                interactables = interactables.filter(i => i !== obj);
                move.interact = false;
            }
        }
    });
    document.getElementById('interact-label').style.display = foundInteractable ? 'block' : 'none';

    // Update Multiplayer Positions
    if(conn && conn.open) {
        conn.send({ type: 'move', x: camera.position.x, z: camera.position.z, ry: yaw });
    }

    renderer.render(scene, camera);
}

// 6. Event Listeners
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
    if(e.code === 'Enter') {
        const input = document.getElementById('chat-msg');
        if(input.value && conn) {
            conn.send({type:'chat', msg: input.value});
            addChat('You', input.value);
            input.value = '';
        }
    }
});

window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
    if(e.code === 'KeyE') move.interact = false;
    if(!e.shiftKey) isSprinting = false;
});

// 7. Lobby & Peer Management
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

peer = new Peer(roomCode);
peer.on('open', id => { document.getElementById('my-id-display').innerText = "YOUR ID: " + id; });
peer.on('connection', c => {
    conn = c;
    addChat('System', 'A player joined!');
    c.on('data', data => {
        if(data.type === 'chat') addChat('Player', data.msg);
    });
});

socket.on('updateServerList', (houses) => {
    const ul = document.getElementById('server-ul');
    if(!ul) return;
    ul.innerHTML = houses.length ? "" : "<li>Searching...</li>";
    houses.forEach(h => {
        if(h.id !== roomCode) ul.innerHTML += `<li>House ${h.id} <button onclick="window.quickJoin('${h.id}')">JOIN</button></li>`;
    });
});
window.quickJoin = (id) => { document.getElementById('joinID').value = id; window.joinGame(); };
