const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app"; 
const socket = io(REPLIT_URL, { transports: ['websocket'] }); 

let scene, camera, renderer, peer, conn, flashlight;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false, gameTime = 60, energy = 100;
let interactables = [];
const roomCode = Math.floor(1000 + Math.random() * 9000).toString();

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x000000, 0.08);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
    scene.add(ambient);
    flashlight = new THREE.SpotLight(0xffffff, 5, 40, Math.PI/6, 0.5);
    camera.add(flashlight);
    flashlight.target = camera;
    scene.add(camera);

    // --- NEW: Load from data.json ---
    await loadHouseData();

    peer = new Peer(roomCode); 
    peer.on('open', id => { document.getElementById('my-id-display').innerText = "YOUR ID: " + id; });
    peer.on('connection', c => { conn = c; addChat('System', 'A player joined!'); });

    socket.on('updateServerList', (houses) => {
        const ul = document.getElementById('server-ul');
        if(!ul) return;
        ul.innerHTML = houses.length ? "" : "<li>No active houses</li>";
        houses.forEach(h => {
            if(h.id !== roomCode) ul.innerHTML += `<li>House ${h.id} <button onclick="quickJoin('${h.id}')">JOIN</button></li>`;
        });
    });
}

// Loads Walls and Narrator lines from your JSON file
async function loadHouseData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        // 1. Build Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
        floor.rotation.x = -Math.PI/2;
        scene.add(floor);

        // 2. Build Walls from JSON
        data.mapData.walls.forEach(w => {
            addWall(w.x, w.z, w.w, w.d, w.color);
        });

        // 3. Set Spawn
        const spawn = data.mapData.spawnPoints[0];
        camera.position.set(spawn.x, spawn.y, spawn.z);

        // 4. Setup Dialogue trigger
        window.gameDialogue = data.dialogue;

        addChat('System', `Loaded ${data.houseName} - Chapter ${data.chapter}`);
    } catch (e) {
        console.error("Failed to load data.json. Make sure it is in the public folder!", e);
    }
}

function addWall(x, z, w, d, color = "0x221a1a") {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshStandardMaterial({color: parseInt(color)}));
    wall.position.set(x, 7.5, z);
    scene.add(wall);
}

function spawnItem(x, y, z, color, type, name) {
    const item = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshStandardMaterial({color: color}));
    item.position.set(x, y, z);
    item.userData = { type, name };
    scene.add(item);
    interactables.push(item);
}

function hostGame() { socket.emit('registerHouse', roomCode); startGame(); }
function quickJoin(id) { document.getElementById('joinID').value = id; joinGame(); }
function joinGame() { conn = peer.connect(document.getElementById('joinID').value); startGame(); }

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    init();
    const clock = setInterval(() => {
        gameTime--;
        document.getElementById('timer').innerText = gameTime + "s";
        
        // Check Narrator lines from JSON
        if(window.gameDialogue) {
            const line = window.gameDialogue.find(d => d.time === gameTime);
            if(line) addChat('Narrator', line.text);
        }

        if(gameTime === 30) scene.fog.color.set(0x330000);
        if(gameTime <= 0) { clearInterval(clock); addChat('Narrator', 'HIDE IN THE GARAGE!'); }
    }, 1000);
}

function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return; 

    let speed = isSprinting ? 0.45 : 0.22;
    if(isSprinting && (move.f || move.b)) {
        energy = Math.max(0, energy - 0.25);
        if(energy === 0) speed = 0.22;
    } else { energy = Math.min(100, energy + 0.1); }
    
    document.getElementById('en-fill').style.width = energy + "%";
    if(move.f) camera.position.z -= speed;
    if(move.b) camera.position.z += speed;
    if(move.l) camera.position.x -= speed;
    if(move.r) camera.position.x += speed;

    interactables.forEach(obj => {
        if(camera.position.distanceTo(obj.position) < 5) {
            document.getElementById('interact-label').style.display = 'block';
            if(move.interact && obj.userData.type === 'food') {
                energy = Math.min(100, energy + 40);
                scene.remove(obj);
                move.interact = false;
            }
        }
    });
    renderer.render(scene, camera);
}

window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true; if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true; if(e.code === 'KeyD') move.r = true;
    if(e.code === 'KeyE') move.interact = true; if(e.shiftKey) isSprinting = true;
});
window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false; if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false; if(e.code === 'KeyD') move.r = false;
    if(!e.shiftKey) isSprinting = false;
});

function addChat(s, m) {
    const log = document.getElementById('chat-log');
    if(!log) return;
    log.innerHTML += `<div><b>${s}:</b> ${m}</div>`;
    log.scrollTop = log.scrollHeight;
}

animate();























































