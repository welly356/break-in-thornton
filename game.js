let scene, camera, renderer, peer, conn, localStream;
let players = {}, myID = "", micActive = false;
let move = { f: false, b: false, l: false, r: false };

// 1. INITIALIZE 3D WORLD
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 5);
    scene.add(light, new THREE.AmbientLight(0x303030));

    // Create House Layout
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    addWall(0, -25, 50, 2);   // Back
    addWall(-25, 0, 2, 50);   // Left
    addWall(25, 0, 2, 50);    // Right
    addWall(-12, 5, 2, 15);   // Bedroom 1
    addWall(12, 5, 2, 15);    // Bedroom 2

    camera.position.set(0, 5, 20);

    // Multiplayer Link
    peer = new Peer();
    peer.on('open', id => {
        myID = id;
        document.getElementById('my-id-display').innerText = "HOUSE ID: " + id;
    });
    peer.on('connection', c => { conn = c; setupComms(); spawnFriend(c.peer); });
    peer.on('call', call => { call.answer(localStream); handleStream(call); });
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 12, d), new THREE.MeshPhongMaterial({color: 0x332222}));
    wall.position.set(x, 6, z);
    scene.add(wall);
}

// 2. MULTIPLAYER & VC
function hostGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
}

function joinGame() {
    const id = document.getElementById('joinID').value;
    if(!id) return alert("Enter ID");
    conn = peer.connect(id);
    setupComms();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
}

async function toggleMic() {
    if (!micActive) {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micActive = true;
        document.getElementById('mic-btn').style.background = "#0a0";
        if (conn) peer.call(conn.peer, localStream);
    } else {
        localStream.getTracks().forEach(t => t.stop());
        micActive = false;
        document.getElementById('mic-btn').style.background = "#444";
    }
}

function handleStream(call) {
    call.on('stream', s => { document.getElementById('remote-audio').srcObject = s; });
}

function setupComms() {
    conn.on('data', data => {
        if(data.type === 'move') {
            if(!players[data.id]) spawnFriend(data.id);
            players[data.id].position.set(data.x, 2, data.z);
        }
        if(data.type === 'chat') addChat('Friend', data.msg);
    });
}

function spawnFriend(id) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshPhongMaterial({color: 0x00ff00}));
    scene.add(p);
    players[id] = p;
}

// 3. CHAT & MOVEMENT
function sendQuickChat(m) {
    addChat('You', m);
    if(conn) conn.send({type: 'chat', msg: m});
}

function addChat(s, m) {
    const log = document.getElementById('chat-log');
    log.innerHTML += `<div><b>${s}:</b> ${m}</div>`;
    log.scrollTop = log.scrollHeight;
}

window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.code === 'Enter') {
        const i = document.getElementById('chat-msg');
        if(document.activeElement === i) { sendQuickChat(i.value); i.value = ''; i.blur(); } else i.focus();
    }
});
window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
});

// Mobile Controls
const bind = (id, k) => {
    const b = document.getElementById(id);
    b.ontouchstart = () => move[k] = true;
    b.ontouchend = () => move[k] = false;
};
bind('btn-up', 'f'); bind('btn-down', 'b'); bind('btn-left', 'l'); bind('btn-right', 'r');

function animate() {
    requestAnimationFrame(animate);
    const s = 0.25;
    if(move.f) camera.position.z -= s;
    if(move.b) camera.position.z += s;
    if(move.l) camera.position.x -= s;
    if(move.r) camera.position.x += s;

    if(camera.position.x < -10) document.getElementById('room-name').innerText = "Room 1";
    else if(camera.position.x > 10) document.getElementById('room-name').innerText = "Room 2";
    else document.getElementById('room-name').innerText = "Hallway";

    if(conn && conn.open) conn.send({type: 'move', id: myID, x: camera.position.x, z: camera.position.z});
    renderer.render(scene, camera);
}
init(); animate();
