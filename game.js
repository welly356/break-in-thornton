const https://replit.com/@acharyasarthak0/thornton-game = "https://thornton-break-in.acharyasarthak0.replit.app"; 
const socket = io(REPLIT_URL, { transports: ['websocket'] }); 

let scene, camera, renderer, peer, conn, flashlight;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false, gameTime = 60, energy = 100;
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
    scene.add(ambient);
    flashlight = new THREE.SpotLight(0xffffff, 5, 40, Math.PI/6, 0.5);
    camera.add(flashlight);
    flashlight.target = camera;
    scene.add(camera);

    await loadHouseData();

    peer = new Peer(roomCode); 
    peer.on('open', id => { document.getElementById('my-id-display').innerText = "YOUR ID: " + id; });
    
    peer.on('connection', c => {
        conn = c;
        setupDataListener(c);
        addChat('System', 'A player joined your house!');
        createAvatar(c.peer);
    });

    socket.on('updateServerList', (houses) => {
        const ul = document.getElementById('server-ul');
        if(!ul) return;
        ul.innerHTML = houses.length ? "" : "<li>No active houses</li>";
        houses.forEach(h => {
            if(h.id !== roomCode) ul.innerHTML += `<li>House ${h.id} <button class="btn-s" onclick="quickJoin('${h.id}')">JOIN</button></li>`;
        });
    });
}

function createAvatar(id) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1), new THREE.MeshStandardMaterial({color: 0x00ff00}));
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color: 0xffdbac}));
    head.position.y = 2;
    group.add(body, head);
    scene.add(group);
    otherPlayers[id] = group;
}

function setupDataListener(c) {
    c.on('data', data => {
        if(data.type === 'move') {
            if(!otherPlayers[c.peer]) createAvatar(c.peer);
            otherPlayers[c.peer].position.set(data.x, 1.5, data.z);
        }
        if(data.type === 'chat') addChat('Player', data.msg);
    });
}

async function loadHouseData() {
    const response = await fetch('data.json');
    const data = await response.json();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);
    data.mapData.walls.forEach(w => addWall(w.x, w.z, w.w, w.d, w.color));
    camera.position.set(data.mapData.spawnPoints[0].x, 5, data.mapData.spawnPoints[0].z);
    window.gameDialogue = data.dialogue;
}

function addWall(x, z, w, d, color) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshStandardMaterial({color: parseInt(color)}));
    wall.position.set(x, 7.5, z);
    scene.add(wall);
}

function hostGame() { socket.emit('registerHouse', roomCode); startGame(); }
function quickJoin(id) { document.getElementById('joinID').value = id; joinGame(); }
function joinGame() { 
    const id = document.getElementById('joinID').value;
    conn = peer.connect(id);
    conn.on('open', () => {
        setupDataListener(conn);
        createAvatar(id);
        startGame();
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    init();
    setInterval(() => {
        gameTime--;
        const timer = document.getElementById('timer');
        if(timer) timer.innerText = gameTime + "s";
        if(window.gameDialogue) {
            const line = window.gameDialogue.find(d => d.time === gameTime);
            if(line) addChat('Narrator', line.text);
        }
    }, 1000);
}

function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return;
    let speed = isSprinting ? 0.4 : 0.2;
    if(move.f) camera.position.z -= speed;
    if(move.b) camera.position.z += speed;
    if(move.l) camera.position.x -= speed;
    if(move.r) camera.position.x += speed;

    if(conn && conn.open) {
        conn.send({ type: 'move', x: camera.position.x, z: camera.position.z });
    }
    renderer.render(scene, camera);
}

window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.shiftKey) isSprinting = true;
    if(e.code === 'Enter') {
        const msg = document.getElementById('chat-msg').value;
        if(msg && conn) {
            conn.send({type:'chat', msg: msg});
            addChat('You', msg);
            document.getElementById('chat-msg').value = '';
        }
    }
});

window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
    if(!e.shiftKey) isSprinting = false;
});

function addChat(s, m) {
    const log = document.getElementById('chat-log');
    if(log) { log.innerHTML += `<div><b>${s}:</b> ${m}</div>`; log.scrollTop = log.scrollHeight; }
}
animate();























































