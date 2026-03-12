const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, type, duration) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

let pet = { happy: 5, hunger: 5, clean: 5, age: 0, isDead: false };
let selectedIdx = 0, menuIdx = 0, menuOpen = false, isPlaying = false;

function saveGame() { localStorage.setItem('doxiePet', JSON.stringify(pet)); }

function loadGame() { 
    const saved = localStorage.getItem('doxiePet'); 
    if (saved) { pet = JSON.parse(saved); render(); } 
}

function wakeUp() { 
    isPlaying = true; 
    document.getElementById('splash-screen').style.display = 'none'; 
    loadGame(); 
    playBeep(880, 'square', 0.1); 
}

function resetGame() { 
    pet = { happy: 5, hunger: 5, clean: 5, age: 0, isDead: false }; 
    saveGame(); 
    render(); 
    playBeep(1200, 'square', 0.2); 
}

function handleBtn(type) {
    if(!isPlaying) { wakeUp(); return; }
    if(pet.isDead) { resetGame(); return; }
    if(type === 'A') pressA();
    if(type === 'B') pressB();
    if(type === 'C') pressC();
}

function pressA() { 
    playBeep(880, 'square', 0.1); 
    if (menuOpen) { menuIdx = (menuIdx + 1) % 2; updateMenuUI(); } 
    else { selectedIdx = (selectedIdx + 1) % 4; render(); }
}

function pressB() {
    playBeep(660, 'square', 0.05);
    if (menuOpen) {
        if (menuIdx === 0) {
            isPlaying = false; 
            document.getElementById('splash-screen').style.display = 'flex'; 
            document.getElementById('menu-overlay').style.display = 'none';
        } else { resetGame(); }
        menuOpen = false; return;
    }
    
    if(selectedIdx === 3) { pressC(); return; }
    
    let success = false;
    let emoji = "";

    if(selectedIdx === 0) { 
        if(pet.hunger < 5) { pet.hunger++; emoji = "🍖"; success = true; }
        else { emoji = "❤️"; success = true; }
    }
    else if(selectedIdx === 1) { 
        if(pet.happy < 5) { pet.happy++; pet.hunger = Math.max(0, pet.hunger - 1); emoji = "🎾"; success = true; }
        else { emoji = "❤️"; success = true; }
    }
    else if(selectedIdx === 2) { 
        pet.clean = 5; success = true; emoji = "🧼";
    }

    if(success) { 
        const h = document.getElementById('heart-overlay'); 
        h.innerText = emoji; h.classList.remove('float-up'); 
        void h.offsetWidth; h.classList.add('float-up'); 
        saveGame(); render();
        setTimeout(() => playBeep(880, 'square', 0.1), 50);
    }
}

function pressC() { 
    playBeep(440, 'square', 0.1);
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOpen) { menuOpen = false; menuOverlay.style.display = 'none'; } 
    else if (isPlaying && !pet.isDead) { menuOpen = true; menuIdx = 0; menuOverlay.style.display = 'flex'; updateMenuUI(); }
}

function updateMenuUI() {
    document.getElementById('m-0').className = (menuIdx === 0) ? "menu-item active-menu" : "menu-item";
    document.getElementById('m-1').className = (menuIdx === 1) ? "menu-item active-menu" : "menu-item";
}

function getStatColor(val) {
    if (val >= 4) return 'var(--stat-green)';
    if (val === 3) return 'var(--stat-orange)';
    return 'var(--stat-red)';
}

function render() {
    if(!isPlaying) return;
    const deadOverlay = document.getElementById('dead-overlay');
    const petContainer = document.getElementById('pet-container');
    const actionBar = document.getElementById('action-bar');
    const restartContainer = document.getElementById('restart-container');
    const petImg = document.getElementById('pet-image');
    const poop = document.getElementById('poop-emoji');

    if(pet.isDead) {
        petContainer.style.display = 'none'; poop.style.display = 'none';
        deadOverlay.style.display = 'block'; actionBar.style.display = 'none';
        restartContainer.style.display = 'flex'; return;
    } else {
        petContainer.style.display = 'flex'; deadOverlay.style.display = 'none';
        actionBar.style.display = 'flex'; restartContainer.style.display = 'none';
    }

    // Path updated to assets/
    petImg.src = (pet.hunger <= 1) ? "assets/doxie_hungry.png" : "assets/doxie_idle.png";
    poop.style.display = (pet.clean <= 1) ? 'block' : 'none';

    const stats = [
        { id: 'h-dots', val: pet.happy },
        { id: 'f-dots', val: pet.hunger },
        { id: 'c-dots', val: pet.clean }
    ];

    stats.forEach(s => {
        const el = document.getElementById(s.id);
        el.innerText = "■".repeat(s.val) + "□".repeat(5 - s.val);
        el.style.color = getStatColor(s.val);
    });
    
    document.getElementById('age-display').innerText = `AGE:${Math.floor(pet.age)}d`;

    for(let i=0; i<4; i++) {
        document.getElementById(`act-${i}`).className = (i === selectedIdx) ? "icon active" : "icon";
    }
    
    document.getElementById('act-0').classList.toggle('critical-hunger', pet.hunger <= 1);
}

// Clock and Day/Night Background
setInterval(() => {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const day = (now.getHours() >= 7 && now.getHours() < 20);
    // Path updated to assets/
    document.getElementById('screen').style.backgroundImage = day ? "url('assets/bg_day.png')" : "url('assets/bg_night.png')";
}, 1000);

// Stat Decay
setInterval(() => { 
    if (!isPlaying || menuOpen || pet.isDead) return;
    pet.age += 0.02;
    if (pet.hunger > 0) { pet.hunger -= 1; } else { pet.isDead = true; }
    if (pet.clean > 0) pet.clean -= 1;
    if (pet.happy > 0) pet.happy -= 1;
    render(); saveGame();
}, 30000);

// Pet Movement
setInterval(() => {
    if(!isPlaying || pet.isDead || menuOpen) return;
    const container = document.getElementById('pet-container'), img = document.getElementById('pet-image'), randomX = Math.floor(Math.random() * 100) + 20;
    img.style.transform = (randomX > parseInt(container.style.left)) ? "scaleX(-1)" : "scaleX(1)"; 
    container.style.left = randomX + "px";
}, 4000);