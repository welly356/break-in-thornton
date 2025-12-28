let scene, camera, renderer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let gameStarted = false;

function init() {
    // 1. SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // Dark blue night sky

    // 2. CAMERA SETUP (Positioned higher to see everything)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20); 

    // 3. RENDERER SETUP (Full Screen)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 4. LIGHTING (Make it bright so we can see if it's working)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 10, 7.5);
    scene.add(sunLight);

    // 5. THE FLOOR (Big green/grey area)
    const floorGeo = new THREE.BoxGeometry(100, 1, 100);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5; // Sit just below zero
    scene.add(floor);

    // 6. THE HOUSE (Large walls so they are hard to miss)
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x880000 }); // Red walls
    
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 2), wallMat);
    backWall.position.set(0, 7.5, -20);
    scene.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 40), wallMat);
    leftWall.position.set(-20, 7.5, 0);
    scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 40), wallMat);
    rightWall.position.set(20, 7.5, 0);
    scene.add(rightWall);

    console.log("Thornton Scene Initialized");
}

function startGame() {
    const menu = document.getElementById('menu');
    const ui = document.getElementById('ui');
    if (menu) menu.style.display = 'none';
    if (ui) ui.style.display = 'block';
    
    gameStarted = true;
    console.log("Game Started");

    // Timer Logic
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.innerText = timeLeft + "s";
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            scene.background = new THREE.Color(0x000000);
            const msgEl = document.getElementById('message');
            if (msgEl) msgEl.innerText = "THEY ARE BREAKING IN!";
        }
    }, 1000);
}

// Controls
document.addEventListener('keydown', (e) => {
    const key = e.code;
    if(key === 'KeyW' || key === 'ArrowUp') moveForward = true;
    if(key === 'KeyS' || key === 'ArrowDown') moveBackward = true;
    if(key === 'KeyA' || key === 'ArrowLeft') moveLeft = true;
    if(key === 'KeyD' || key === 'ArrowRight') moveRight = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.code;
    if(key === 'KeyW' || key === 'ArrowUp') moveForward = false;
    if(key === 'KeyS' || key === 'ArrowDown') moveBackward = false;
    if(key === 'KeyA' || key === 'ArrowLeft') moveLeft = false;
    if(key === 'KeyD' || key === 'ArrowRight') moveRight = false;
});

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted) {
        const speed = 0.3;
        if (moveForward) camera.position.z -= speed;
        if (moveBackward) camera.position.z += speed;
        if (moveLeft) camera.position.x -= speed;
        if (moveRight) camera.position.x += speed;
    }

    renderer.render(scene, camera);
}

// Ensure the game fills the window
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
animate();
