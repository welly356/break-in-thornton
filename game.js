const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app"; 
const socket = io(REPLIT_URL, { transports: ['websocket'] }); 

let scene, camera, renderer, peer, conn, localStream;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false, gameTime = 60, energy = 100;
let interactables = [];
const roomCode = Math.floor(1000 + Math.random() * 9000).toString();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x000000, 0.08);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
    scene.add(ambient);
    const flashlight = new THREE.SpotLight(0xffffff, 5, 40, Math.PI/6, 0.5);
    camera.add(flashlight);
    flashlight.target = camera;
    scene.add(camera);

    createMap();
    camera.position.set(0, 5, 25);

    // --- VOICE CHAT & PEER ---
    peer = new Peer(roomCode);
    navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(stream => {
        localStream = stream;
        document.getElementById('vc-status').innerText = "VC: ACTIVE";
    });

    peer.on('call', call => {
        call.answer(localStream);
        call.on('stream', remoteStream => playStream(remoteStream));
    });

    peer.on('connection', c => {
        conn = c;
        setupConn();
    });

    socket.on('updateServerList', houses => {
        const ul = document.getElementById('server-ul');
        ul.innerHTML = houses.length ? "" : "<li>No Houses Open</li>";
        houses.forEach(h => {
            if(h.id !== roomCode) ul.innerHTML += `<li>ID: ${h.id} <button onclick="quickJoin('${h.id}')">JOIN</button></li>`;
        });
    });
}

function playStream(stream) {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
}

function createMap() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);
    addWall(0, -25, 50, 1); 
    addWall(-25, 0, 1, 50); 
    addWall(25, 0, 1, 50);  
    addWall(-12, 10, 1, 30); // Garage
    const gLight = new THREE.PointLight(0x00ffff, 1.5, 20);
    gLight.position.set(-18, 10, 5);
    scene.add(gLight);
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshStandardMaterial({color: 0x221a1a}));
    wall.position.set(x, 7.5, z);
    scene.add(wall);
}

function hostGame() { socket.emit('registerHouse', roomCode); startGame(); }
function quickJoin(id) { document.getElementById('joinID').value = id; joinGame(); }
function joinGame() { 
    const id = document.getElementById('joinID').value;
    conn = peer.connect(id);
    peer.call(id, localStream);
    startGame(); 
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    init();
}

function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return; 

    let speed = isSprinting ? 0.45 : 0.22;
    if(isSprinting && (move.f || move.b)) {
        energy = Math.max(0, energy - 0.3);
        if(energy === 0) speed = 0.22;
    } else { energy = Math.min(100, energy + 0.1); }
    
    document.getElementById('en-fill').style.width = energy + "%";
    if(move.f) camera.position.z -= speed;
    if(move.b) camera.position.z += speed;
    if(move.l) camera.position.x -= speed;
    if(move.r) camera.position.x += speed;

    renderer.render(scene, camera);
}

window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.code === 'KeyE') move.interact = true;
    if(e.shiftKey) isSprinting = true;
    if(e.code === 'Enter') handleChat();
});

window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
    if(!e.shiftKey) isSprinting = false;
});

function handleChat() {
    const input = document.getElementById('chat-msg');
    if (document.activeElement === input) {
        if (input.value) {
            if (conn) conn.send({type: 'chat', msg: input.value});
            addChat('You', input.value);
            input.value = "";
        }
        input.blur();
    } else {
        input.focus();
    }
}

function addChat(s, m) {
    const log = document.getElementById('chat-log');
    log.innerHTML += `<div><b>${s}:</b> ${m}</div>`;
    log.scrollTop = log.scrollHeight;
}

function setupConn() {
    conn.on('data', data => {
        if(data.type === 'chat') addChat('Friend', data.msg);
    });
}

animate();























































