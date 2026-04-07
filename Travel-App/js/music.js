// Background Music Module
let audioContext = null;
let musicPlaying = false;
let oscillators = [];
let gainNodes = [];

function createSoothingMusic() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioContext.destination);
    
    frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        oscillators.push(osc);
        gainNodes.push(gain);
        
        osc.start();
        
        const now = audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.5 + index * 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 4 + index * 0.2);
        
        setInterval(() => {
            const now = audioContext.currentTime;
            const randomDelay = Math.random() * 3;
            gain.gain.setValueAtTime(0, now + randomDelay);
            gain.gain.linearRampToValueAtTime(0.1, now + randomDelay + 2);
            gain.gain.linearRampToValueAtTime(0, now + randomDelay + 6);
        }, 8000 + index * 1000);
    });
}

function stopSoothingMusic() {
    oscillators.forEach(osc => osc.stop());
    oscillators = [];
    gainNodes = [];
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

function initMusic() {
    document.getElementById('toggleMusicBtn').addEventListener('click', function() {
        const btn = this;
        const btnText = btn.querySelector('span');
        
        if (!musicPlaying) {
            createSoothingMusic();
            musicPlaying = true;
            btnText.textContent = 'Pause Music';
            btn.style.background = 'rgba(76, 175, 80, 0.3)';
        } else {
            stopSoothingMusic();
            musicPlaying = false;
            btnText.textContent = 'Play Music';
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
        }
    });
}
