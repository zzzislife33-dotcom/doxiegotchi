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

let pet = { happy: 5, hunger: 5, clean: 5, lv: 1, xp: 0, age: 0, isDead: false };
let selectedIdx = 0, menuIdx = 0, menuOpen = false, isPlaying = false;

function saveGame() { localStorage.setItem('doxiePet', JSON.stringify(pet)); }

function loadGame() { 
    const saved = localStorage.getItem('doxiePet'); 
    if (saved) { 
        pet = JSON.parse(saved); 
        render(); 
    } 
}

function wakeUp() { 
    isPlaying = true; 
    document.getElementById('splash-screen').style.display = 'none'; 
    loadGame(); 
    render(); 
    playBeep(880, 'square', 0.1); 
}

function resetGame() { 
    localStorage.clear(); 
    pet = { happy: 5, hunger: 5, clean: 5, lv: 1, xp: 0, age: 0, isDead: false };
    document.getElementById('dead-overlay').style.display = 'none';
    document.getElementById('restart-container').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'none';
    document.getElementById('pet-container').style.display = 'flex';
    saveGame(); 
    render(); 
    playBeep(1200, 'square', 0.2); 
    menuOpen = false;
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
    if(pet.isDead) return;

    let canAwardXP = false;
    let reactionSrc = ""; 

    if(selectedIdx === 0 && pet.hunger < 5) { pet.hunger++; canAwardXP = true; reactionSrc = "assets/icon_hungry.png"; }
    else if(selectedIdx === 1 && pet.happy < 5) { pet.happy++; pet.hunger = Math.max(0, pet.hunger - 0.5); canAwardXP = true; reactionSrc = "assets/icon_happy.png"; }
    else if(selectedIdx === 2 && pet.clean < 5) { pet.clean = 5; canAwardXP = true; reactionSrc = "assets/icon_clean.png"; }

    if(canAwardXP) { 
        pet.xp += 10;
        if (pet.xp >= 100) { pet.lv += 1; pet.xp = 0; playBeep(1500, 'square', 0.3); }
        const h = document.getElementById('heart-overlay'); 
        h.innerHTML = `<img src="${reactionSrc}" style="width:20px; height:20px; image-rendering:pixelated;">`; 
        h.classList.remove('float-up'); 
        void h.offsetWidth; 
        h.classList.add('float-up'); 
        saveGame(); 
        render();
    } else { playBeep(220, 'square', 0.1); }
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
    // Removed isPlaying check here so UI loads on refresh
    const deadOverlay = document.getElementById('dead-overlay');
    const petContainer = document.getElementById('pet-container');
    const actionBar = document.getElementById('action-bar');
    const restartContainer = document.getElementById('restart-container');
    const petImg = document.getElementById('pet-image');
    const poop = document.getElementById('poop-emoji');

    if(pet.isDead) {
        petContainer.style.display = 'none'; poop.style.display = 'none';
        deadOverlay.style.display = 'block'; actionBar.style.display = 'none';
        restartContainer.style.display = 'flex'; 
    } else {
        petContainer.style.display = 'flex'; deadOverlay.style.display = 'none';
        actionBar.style.display = 'flex'; restartContainer.style.display = 'none';
        petImg.src = (pet.hunger <= 1) ? "assets/doxie_hungry.png" : "assets/doxie_idle.png";
        poop.style.display = (pet.clean <= 4) ? 'block' : 'none';
    }

    const stats = [{ id: 'f-dots', val: pet.hunger }, { id: 'h-dots', val: pet.happy }, { id: 'c-dots', val: pet.clean }];
    stats.forEach(s => {
        const el = document.getElementById(s.id);
        const displayVal = Math.ceil(s.val); 
        el.innerText = "■".repeat(displayVal) + "□".repeat(5 - displayVal);
        el.style.color = getStatColor(displayVal);
    });
    
    document.getElementById('lv-display').innerText = `LV.${pet.lv}`;
    for(let i=0; i<4; i++) { document.getElementById(`act-${i}`).className = (i === selectedIdx) ? "icon active" : "icon"; }
    document.getElementById('act-0').classList.toggle('critical-hunger', pet.hunger <= 1);
}

// Unified Time & Background Interval
setInterval(() => {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const isDayTime = (now.getHours() >= 7 && now.getHours() < 19);
    const screen = document.getElementById('screen');
    screen.style.backgroundImage = isDayTime ? "url('assets/bg_day.png')" : "url('assets/bg_night.png')";
    screen.style.backgroundSize = "cover";
}, 1000);

// Unified Decay & Auto-Save (Once every 30s)
setInterval(() => { 
    if (!isPlaying || menuOpen || pet.isDead) return;
    pet.age += 0.02;
    pet.hunger = Math.max(0, pet.hunger - 1); 
    if (pet.hunger <= 0) pet.isDead = true; 
    pet.clean = Math.max(0, pet.clean - 1);
    pet.happy = Math.max(0, pet.happy - 1);
    render(); 
    saveGame(); 
}, 30000);

// Single Load Event
window.addEventListener('load', loadGame);