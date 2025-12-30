// --- CONFIG & DATA ---
const mapConfig = {
    "houseName": "Thornton 104th Ave",
    "lanes": [-8, 0, 8], // Subway Surfer Lanes
    "currentLane": 1
};

let scene, camera, renderer, spiderMan;
let targetX = 0;

// --- INITIALIZATION ---
async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x000000, 0.08); // Thick Granny Fog

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Realistic Lighting (Spotlight for that Spider-Man/Granny vibe)
    const flash = new THREE.SpotLight(0xffffff, 25, 50, 0.4);
    flash.position.set(0, 5, 0);
    camera.add(flash);
    scene.add(camera);

    buildThorntonHouse();
    spawnSpiderMan();
    animate();
}

// --- SUBWAY SURFER LANE LOGIC (C# Style) ---
window.addEventListener('keydown', e => {
    if(e.code === 'KeyA' && mapConfig.currentLane > 0) {
        mapConfig.currentLane--;
    }
    if(e.code === 'KeyD' && mapConfig.currentLane < 2) {
        mapConfig.currentLane++;
    }
    targetX = mapConfig.lanes[mapConfig.currentLane];
});

function buildThorntonHouse() {
    // Reading your JSON data for the walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.9,
        metalness: 0.1 
    });

    const walls = [
        { "x": 0, "z": -25, "w": 50, "d": 2 },
        { "x": -25, "z": 0, "w": 2, "d": 50 },
        { "x": 25, "z": 0, "w": 2, "d": 50 },
        { "x": 0, "z": 25, "w": 50, "d": 2 }
    ];

    walls.forEach(data => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(data.w, 15, data.d), wallMaterial);
        wall.position.set(data.x, 7.5, data.z);
        scene.add(wall);
    });
}

function spawnSpiderMan() {
    // For "Realistic Graphics," we use a Sprite with high-res textures
    const loader = new THREE.TextureLoader();
    const spideyTex = loader.load('https://i.imgur.com/your-realistic-spiderman.png'); 
    const mat = new THREE.SpriteMaterial({ map: spideyTex });
    spiderMan = new THREE.Sprite(mat);
    spiderMan.scale.set(5, 8, 1);
    spiderMan.position.y = 4;
    scene.add(spiderMan);
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Subway Surfer Smooth Lane Slide (Interpolation)
    if(spiderMan) {
        spiderMan.position.x = THREE.MathUtils.lerp(spiderMan.position.x, targetX, 0.15);
        
        // Sync camera to follow Spider-Man like Subway Surfers
        camera.position.x = spiderMan.position.x;
        camera.position.z = spiderMan.position.z + 20;
        camera.position.y = 10;
        camera.lookAt(spiderMan.position);
    }

    renderer.render(scene, camera);
}
