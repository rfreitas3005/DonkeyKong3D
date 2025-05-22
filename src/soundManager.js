export class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.volume = 0.5;
        
        // Pré-carregar sons
        this.loadSound('barrel_throw', 'sounds/barrel_throw.mp3');
        this.loadSound('dkroar', 'sounds/dkroar.mp3');
        this.loadSound('jump', 'sounds/jump.mp3');
        this.loadSound('death', 'sounds/death.mp3');
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        audio.volume = this.volume;
        this.sounds.set(name, audio);
    }

    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            // Criar uma nova instância para permitir sobreposição de sons
            const soundInstance = sound.cloneNode();
            soundInstance.volume = this.volume;
            soundInstance.play().catch(err => {
                console.warn(`Erro ao tocar som ${name}:`, err);
            });
        }
    }

    setVolume(volume) {
        this.volume = volume;
        // Atualizar volume de todos os sons carregados
        this.sounds.forEach(sound => {
            sound.volume = volume;
        });
    }

    stopAll() {
        this.sounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
} 