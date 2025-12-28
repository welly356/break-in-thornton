let localStream;
let micActive = false;

// --- VOICE CHAT LOGIC ---
async function toggleMic() {
    if (!micActive) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micActive = true;
            document.getElementById('mic-btn').innerText = "🎤 Mic: ON";
            document.getElementById('mic-btn').style.background = "#0a0";
            
            // If already connected to a friend, call them with the audio
            if (conn && conn.open) {
                const call = peer.call(conn.peer, localStream);
                handleCall(call);
            }
        } catch (err) {
            console.error("Mic access denied", err);
        }
    } else {
        localStream.getTracks().forEach(track => track.stop());
        micActive = false;
        document.getElementById('mic-btn').innerText = "🎤 Mic: OFF";
        document.getElementById('mic-btn').style.background = "#444";
    }
}

// Answer incoming calls
peer.on('call', (call) => {
    // Answer automatically with our stream if active, or empty stream if not
    call.answer(localStream);
    handleCall(call);
});

function handleCall(call) {
    call.on('stream', (remoteStream) => {
        const audio = document.getElementById('remote-audio');
        audio.srcObject = remoteStream;
        document.getElementById('vc-status').innerText = "Connected to VC";
    });
}

// --- TEXT & QUICK CHAT LOGIC ---
function sendQuickChat(txt) {
    displayChatMessage('You', txt);
    if(conn && conn.open) conn.send({ type: 'chat', message: txt });
}

window.addEventListener('keydown', e => {
    if(e.code === 'Enter') {
        const input = document.getElementById('chat-msg');
        if (document.activeElement === input) {
            if(input.value.trim()) {
                sendQuickChat(input.value);
                input.value = '';
            }
            input.blur();
        } else {
            input.focus();
        }
    }
});

function displayChatMessage(sender, msg) {
    const log = document.getElementById('chat-log');
    log.innerHTML += `<div><b>${sender}:</b> ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

// Update your setupDataListener to handle incoming chat
function setupDataListener() {
    conn.on('data', data => {
        if(data.type === 'move') {
            if(!players[data.id]) spawnPlayer(data.id);
            players[data.id].position.set(data.x, 2, data.z);
        }
        if(data.type === 'chat') {
            displayChatMessage('Friend', data.message);
        }
    });
}
