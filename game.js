// --- CONNECTION ---
const REPLIT_URL = "https://thornton-break-in.acharyasarthak0.replit.app";
const socket = io(REPLIT_URL);

// --- GLOBALS ---
let scene, camera, renderer;
let move = { f: false, b: false, l: false, r: false };
let yaw = 0, pitch = 0;

// --- INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0000); // Very dark red

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Click to lock mouse for 360 rotation
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    // --- THE THREE RED ROOMS ---
    const roomMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    for (let i = 0; i < 3; i++) {
        const room = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), roomMaterial);
        room.position.x = (i - 1) * 25; // Spaced out rooms
        scene.add(room);
    }

    // Light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    camera.add(light);
    scene.add(camera);

    camera.position.set(0, 5, 10);
    animate();
}

// --- CONTROLS & ROTATION ---
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

window.addEventListener('keydown', e => {
    if (e.code === 'KeyW') move.f = true;
    if (e.code === 'KeyS') move.b = true;
    if (e.code === 'KeyA') move.l = true;
    if (e.code === 'KeyD') move.r = true;
});

window.addEventListener('keyup', e => {
    if (e.code === 'KeyW') move.f = false;
    if (e.code === 'KeyS') move.b = false;
    if (e.code === 'KeyA') move.l = false;
    if (e.code === 'KeyD') move.r = false;
});

// --- CHAT SYSTEM ---
const chatInput = document.getElementById('chat-msg');
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value !== "") {
        socket.emit('send-chat', { msg: chatInput.value });
        chatInput.value = "";
    }
});

socket.on('receive-chat', (data) => {
    const log = document.getElementById('chat-log');
    if (log) {
        log.innerHTML += `<div><b>Player:</b> ${data.msg}</div>`;
        log.scrollTop = log.scrollHeight;
    }
});

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.15;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

    if (move.f) camera.position.addScaledVector(dir, speed);
    if (move.b) camera.position.addScaledVector(dir, -speed);
    if (move.l) camera.position.addScaledVector(side, speed);
    if (move.r) camera.position.addScaledVector(side, -speed);

    renderer.render(scene, camera);
}

// Host button to start
window.hostGame = () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    init();
};
