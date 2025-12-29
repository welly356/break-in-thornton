let scene, camera, renderer, peer, conn, flashlight;
let players = {}, myID = "", gameTime = 60, hp = 100, energy = 100;
let move = { f: false, b: false, l: false, r: false, interact: false };
let isSprinting = false;
let interactables = [];

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

    flashlight = new THREE.SpotLight(0xffffff, 5, 45, Math.PI/6, 0.5);
    camera.add(flashlight);
    flashlight.target = camera;
    scene.add(camera);

    createMap();
    camera.position.set(0, 5, 25);

    // PeerJS Setup
    peer = new Peer(); 
    peer.on('open', id => { 
        myID = id; 
        document.getElementById('my-id-display').innerText = "YOUR ID: " + id; 
    });
    peer.on('connection', c => { 
        conn = c; 
        addChat('System', 'A player joined the house!'); 
    });
}

function createMap() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Exterior Walls
    addWall(0, -25, 50, 1); // Back
    addWall(-25, 0, 1, 50); // Left
    addWall(25, 0, 1, 50);  // Right

    // Garage (Left)
    addWall(-12, 10, 1, 30); 
    const gLight = new THREE.PointLight(0x00ffff, 1.5, 20);
    gLight.position.set(-18, 10, 5);
    scene.add(gLight);

    // Interior Room (Right)
    addWall(12, 5, 1, 20); 

    // Food
    spawnItem(18, 1, -15, 0xffaa00, 'food', 'Pizza');
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshStandardMaterial({color: 0x221a1a}));
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

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    init();
    const clock = setInterval(() => {
        gameTime--;
        document.getElementById('timer').innerText = gameTime + "s";
        if(gameTime === 30) triggerHouseAlive();
        if(gameTime <= 0) {
            clearInterval(clock);
            addChat('Narrator', 'THEY ARE HERE. HIDE!');
        }
    }, 1000);
}

function triggerHouseAlive() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    addChat('Narrator', 'The house is waking up...');
    scene.fog.color.set(0x330000);
}

function hostGame() { startGame(); }
function joinGame() {
    const id = document.getElementById('joinID').value;
    conn = peer.connect(id);
    startGame();
}

function triggerMobileInteract() { move.interact = true; }

function animate() {
    requestAnimationFrame(animate);
    let speed = isSprinting ? 0.45 : 0.22;
    
    // Sprint Energy Logic
    if(isSprinting && (move.f || move.b || move.l || move.r)) {
        energy = Math.max(0, energy - 0.25);
        if(energy === 0) speed = 0.22;
    } else {
        energy = Math.min(100, energy + 0.15);
    }
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

// Controls
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
    if(!e.shiftKey) isSprinting = false;
});

function addChat(s, m) {
    const log = document.getElementById('chat-log');
    log.innerHTML += `<div><b>${s}:</b> ${m}</div>`;
    log.scrollTop = log.scrollHeight;
}
animate();























































