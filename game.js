let scene, camera, renderer, peer, conn;
let players = {}; 
let myID = "";
let move = { f: false, b: false, l: false, r: false };

// 1. INITIALIZE 3D
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    scene.add(light, new THREE.AmbientLight(0x404040));

    // Floor & Rooms
    createHouse();
    camera.position.set(0, 5, 20);

    // Multiplayer setup
    peer = new Peer();
    peer.on('open', id => {
        myID = id;
        document.getElementById('my-id-display').innerText = "Your House ID: " + id;
    });

    peer.on('connection', c => {
        conn = c;
        setupDataListener();
        spawnPlayer(c.peer);
    });
}

function createHouse() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Wall Creator (x, z, width, depth, label)
    addWall(0, -20, 40, 1);  // Back Wall
    addWall(-20, 0, 1, 40);  // Left Wall
    addWall(20, 0, 1, 40);   // Right Wall
    addWall(-10, 5, 1, 15);  // Room 1 Divider
    addWall(10, 5, 1, 15);   // Room 2 Divider
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 10, d), new THREE.MeshPhongMaterial({color: 0x442222}));
    wall.position.set(x, 5, z);
    scene.add(wall);
}

// 2. MULTIPLAYER LOGIC
function hostGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
}

function joinGame() {
    const id = document.getElementById('joinID').value;
    conn = peer.connect(id);
    setupDataListener();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
}

function setupDataListener() {
    conn.on('data', data => {
        if(data.type === 'move') {
            if(!players[data.id]) spawnPlayer(data.id);
            players[data.id].position.set(data.x, 2, data.z);
        }
    });
}

function spawnPlayer(id) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshPhongMaterial({color: 0x00ff00}));
    p.position.y = 2;
    scene.add(p);
    players[id] = p;
}

// 3. CONTROLS (PC & MOBILE)
window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
});
window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
});

// Mobile button listeners
const bindBtn = (id, prop) => {
    const el = document.getElementById(id);
    el.ontouchstart = () => move[prop] = true;
    el.ontouchend = () => move[prop] = false;
};
bindBtn('up', 'f'); bindBtn('down', 'b'); bindBtn('left', 'l'); bindBtn('right', 'r');

function animate() {
    requestAnimationFrame(animate);
    const speed = 0.2;
    if(move.f) camera.position.z -= speed;
    if(move.b) camera.position.z += speed;
    if(move.l) camera.position.x -= speed;
    if(move.r) camera.position.x += speed;

    // Detect Room
    if(camera.position.x < -10) document.getElementById('room-name').innerText = "Bedroom A";
    else if(camera.position.x > 10) document.getElementById('room-name').innerText = "Bedroom B";
    else document.getElementById('room-name').innerText = "Hallway";

    // Send position to others
    if(conn && conn.open) {
        conn.send({type: 'move', id: myID, x: camera.position.x, z: camera.position.z});
    }

    renderer.render(scene, camera);
}

init();
animate();
