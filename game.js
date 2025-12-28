let scene, camera, renderer, peer, conn;
let players = {}, myID = "", gameTime = 60, hp = 100, energy = 100;
let move = { f: false, b: false, l: false, r: false };
let interactables = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x13131a);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // --- PRO GRAPHICS: LIGHTING ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    createMap();
    camera.position.set(0, 5, 20);

    // Multiplayer setup
    peer = new Peer();
    peer.on('open', id => { myID = id; document.getElementById('my-id-display').innerText = "ID: " + id; });
    peer.on('connection', c => { conn = c; setupSync(); });
}

function createMap() {
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({color: 0x222222}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Walls
    addWall(0, -25, 50, 2); 
    addWall(-25, 0, 2, 50); 
    addWall(25, 0, 2, 50); 

    // --- FUNCTION: INTERACTABLES ---
    // Pizza on a table
    const pizza = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), new THREE.MeshPhongMaterial({color: 0xffaa00}));
    pizza.position.set(5, 1, -5);
    pizza.userData = { type: 'food', name: 'Pizza' };
    scene.add(pizza);
    interactables.push(pizza);

    // Window to board up
    const windowArea = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1), new THREE.MeshPhongMaterial({color: 0x00ffff, transparent: true, opacity: 0.5}));
    windowArea.position.set(0, 5, -24);
    windowArea.userData = { type: 'window', boarded: false };
    scene.add(windowArea);
    interactables.push(windowArea);
}

function addWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshPhongMaterial({color: 0x444455}));
    wall.position.set(x, 7.5, z);
    scene.add(wall);
}

// --- FUNCTION: INTERACTION ENGINE ---
function checkInteraction() {
    let near = false;
    interactables.forEach(obj => {
        let dist = camera.position.distanceTo(obj.position);
        if (dist < 5) {
            near = true;
            document.getElementById('interact-label').style.display = 'block';
            if (move.interact) handleInteract(obj);
        }
    });
    if (!near) document.getElementById('interact-label').style.display = 'none';
}

function handleInteract(obj) {
    if (obj.userData.type === 'food') {
        energy = Math.min(100, energy + 20);
        scene.remove(obj); // "Eat" the food
        updateHUD();
    }
    if (obj.userData.type === 'window') {
        obj.material.color.set(0x552200); // Change to wood color
        obj.userData.boarded = true;
        addChat('System', 'Window Boarded!');
    }
    move.interact = false;
}

function updateHUD() {
    document.getElementById('hp-fill').style.width = hp + "%";
    document.getElementById('en-fill').style.width = energy + "%";
}

// --- STORY & AI ---
function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    const clock = setInterval(() => {
        gameTime--;
        document.getElementById('timer').innerText = gameTime + "s";
        if (gameTime === 0) {
            scene.background = new THREE.Color(0x000000);
            addChat('Narrator', 'THEY ARE HERE.');
            clearInterval(clock);
        }
    }, 1000);
}

// Controls
window.addEventListener('keydown', e => {
    if(e.code === 'KeyW') move.f = true;
    if(e.code === 'KeyS') move.b = true;
    if(e.code === 'KeyA') move.l = true;
    if(e.code === 'KeyD') move.r = true;
    if(e.code === 'KeyE') move.interact = true;
    if(e.code === 'Enter') {
        const i = document.getElementById('chat-msg');
        if(document.activeElement === i) { 
            if(conn) conn.send({type:'chat', msg:i.value}); 
            addChat('You', i.value); i.value = ''; i.blur(); 
        } else i.focus();
    }
});

window.addEventListener('keyup', e => {
    if(e.code === 'KeyW') move.f = false;
    if(e.code === 'KeyS') move.b = false;
    if(e.code === 'KeyA') move.l = false;
    if(e.code === 'KeyD') move.r = false;
});

function animate() {
    requestAnimationFrame(animate);
    const s = 0.2;
    if(move.f) camera.position.z -= s;
    if(move.b) camera.position.z += s;
    if(move.l) camera.position.x -= s;
    if(move.r) camera.position.x += s;

    checkInteraction();
    renderer.render(scene, camera);
}

function hostGame() { startGame(); }
function joinGame() { 
    conn = peer.connect(document.getElementById('joinID').value);
    startGame();
}
function addChat(s, m) {
    const log = document.getElementById('chat-log');
    log.innerHTML += `<div><b>${s}:</b> ${m}</div>`;
    log.scrollTop = log.scrollHeight;
}

init(); animate();
