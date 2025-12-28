let scene, camera, renderer, player;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let gameStarted = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510); // Night Sky

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x202020));

    // Floor (The Thornton House Ground)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls (Simple House Box)
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x333344 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(30, 15, 1), wallMat);
    wall.position.set(0, 7.5, -15);
    scene.add(wall);

    camera.position.set(0, 5, 15);
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    gameStarted = true;
    
    // Start 60-second Countdown to Night
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft + "s";
        if (timeLeft <= 10) document.getElementById('timer').style.color = "red";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('message').innerText = "THEY ARE BREAKING IN!";
            scene.background = new THREE.Color(0x000000);
        }
    }, 1000);
}

// Controls
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});

function animate() {
    requestAnimationFrame(animate);
    if (gameStarted) {
        if (moveForward) camera.position.z -= 0.15;
        if (moveBackward) camera.position.z += 0.15;
        if (moveLeft) camera.position.x -= 0.15;
        if (moveRight) camera.position.x += 0.15;
    }
    renderer.render(scene, camera);
}

init();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
