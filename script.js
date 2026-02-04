// REGISTER SERVICE WORKER
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Service Worker Registrado (PWA Ready)"))
        .catch((err) => console.log("Service Worker Error:", err));
}

// GLOBAL VARIABLES
let isSirenActive = false;
let sirenOscillator = null;
let audioContext = null;

// --- DOM ELEMENTS ---
const mainScreen = document.getElementById('main-screen');
const optionsScreen = document.getElementById('options-screen');
const gpsStatus = document.getElementById('gps-status');

// --- INIT ---
window.onload = function () {
    getLocation();
};

function activateEmergencyMode() {
    mainScreen.style.display = 'none';
    optionsScreen.style.display = 'flex';

    // TTS: Speak Instructions
    speak("Seleccione su emergencia: Ambulancia, Policía, Serenazgo o Bomberos");

    // Vibrate phone to confirm activation
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

function resetApp() {
    optionsScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
    stopSiren();
}

// --- GEOLOCATION FUNCTION ---
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(5);
                const lon = position.coords.longitude.toFixed(5);
                gpsStatus.innerHTML = `Lat: ${lat}, Lon: ${lon} (Preciso)`;
            },
            (error) => {
                console.warn("GPS Error:", error);
                gpsStatus.innerHTML = "GPS no disponible / Sin Permiso";
            }
        );
    } else {
        gpsStatus.innerHTML = "GPS no soportado por este navegador.";
    }
}

// --- TEXT TO SPEECH (TTS) ---
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.1; // Slightly faster for urgency
        // Mobile browsers require user interaction first, usually triggered by the click
        window.speechSynthesis.speak(utterance);
    }
}

// --- SIREN LOGIC (WEB AUDIO API) ---
function toggleSiren() {
    const btn = document.querySelector('.siren-btn');

    if (isSirenActive) {
        stopSiren();
        btn.classList.remove('active');
        btn.innerText = "🔊 ACTIVAR SIRENA DE PÁNICO";
    } else {
        startSiren();
        btn.classList.add('active');
        btn.innerText = "🔇 DETENER SIRENA";
    }
}

function startSiren() {
    isSirenActive = true;

    // Init Audio Context (must be on user gesture)
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create Oscillator
    sirenOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    sirenOscillator.type = 'sawtooth'; // Harsh sound
    sirenOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Siren Wailing Effect (Frequency Sweep)
    // Low to High loop
    const now = audioContext.currentTime;
    sirenOscillator.frequency.setValueAtTime(600, now);
    sirenOscillator.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
    sirenOscillator.frequency.exponentialRampToValueAtTime(600, now + 1.0);

    // Loop the frequency ramp manually or use LFO? 
    // For simplicity, we restart the simple oscillator or trust the browser to loop?
    // Web Audio doesn't loop freq ramps automatically easily. 
    // Let's use a simpler approach: An interval.

    sirenOscillator.start();

    // Wailing Interval
    sirenInterval = setInterval(() => {
        if (!isSirenActive || !audioContext) return;
        const t = audioContext.currentTime;
        sirenOscillator.frequency.setValueAtTime(600, t);
        sirenOscillator.frequency.linearRampToValueAtTime(1500, t + 0.4);
        sirenOscillator.frequency.linearRampToValueAtTime(600, t + 0.8);
    }, 800);
}

let sirenInterval = null;

function stopSiren() {
    isSirenActive = false;
    if (sirenOscillator) {
        try {
            sirenOscillator.stop();
        } catch (e) { }
        sirenOscillator.disconnect();
        sirenOscillator = null;
    }
    if (sirenInterval) clearInterval(sirenInterval);
}

// --- PWA INSTALLATION LOGIC ---
let deferredPrompt;
const installBox = document.getElementById('install-prompt');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    installBox.style.display = 'flex';
});

function installApp() {
    // Hide the app provided install promotion
    installBox.style.display = 'none';
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
    });
}

function closeInstall() {
    installBox.style.display = 'none';
}
