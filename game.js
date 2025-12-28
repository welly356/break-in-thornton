// --- 1. SETUP ENGINE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122); // Dark Thornton night sky
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. CREATE THE HOUSE ---
// Floor
const floor = new THREE.Mesh(
    new THREE.BoxGeometry(40, 1, 40),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
);
scene.add(floor);

// Walls (Simple Box for the "Safe House")
function createWall(x, z, w, d, color = 0x888888) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 10, d), new THREE.MeshPhongMaterial({ color }));
    wall.position.set(x, 5, z);
    scene.add(wall);
}
createWall(0, -20, 40, 1); // Back wall
createWall(-20, 0, 1, 40); // Left wall
createWall(20, 0, 1, 40);  // Right wall
createWall(0, 20, 40, 1, 0x552222); // Front wall with "Door" area

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1); 
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 50);
pointLight.position.set(0, 8, 0); // Ceiling light
scene.add(pointLight);

// --- 3. PLAYER MOVEMENT ---
let move = { forward: false, backward: false, left: false, right: false };
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') move.forward = true;
    if (e.code === 'KeyS') move.backward = true;
    if (e.code === 'KeyA') move.left = true;
    if (e.code === 'KeyD') move.right = true;
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') move.forward = false;
    if (e.code === 'KeyS') move.backward = false;
    if (e.code === 'KeyA') move.left = false;
    if (e.code === 'KeyD') move.right = false;
});

camera.position.set(0, 5, 10);

// --- 4. GAME LOOP ---
let timeLeft = 60;
setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
    } else {
        scene.background = new THREE.Color(0x000000); // Pitch black
        document.getElementById('timer').innerText = "THEY ARE HERE";
    }
}, 1000);

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.2;
    if (move.forward) camera.position.z -= speed;
    if (move.backward) camera.position.z += speed;
    if (move.left) camera.position.x -= speed;
    if (move.right) camera.position.x += speed;

    renderer.render(scene, camera);
}
animate();
