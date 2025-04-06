// Sound Manager for Dungeon Runner
class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.soundVolume = 0.7;
        this.isMuted = false;
        this.musicEnabled = true;
        this.audioInitialized = false;
        this.deathSoundPlaying = false;
        
        // Load all sounds
        this.loadSounds();
        
        // Log creation for debugging
        console.log('SoundManager created');
    }
    
    loadSounds() {
        // Sound effects
        this.sounds = {
            // UI sounds
            buttonClick: new Audio('sounds/button-click.mp3'),
            gameStart: new Audio('sounds/game-start.mp3'),
            levelUp: new Audio('sounds/level-up.mp3'),
            
            // Combat sounds
            swordSwing: new Audio('sounds/sword-swing.mp3'),
            magicCast: new Audio('sounds/magic-cast.mp3'),
            fireball: new Audio('sounds/fireball.mp3'),
            lightning: new Audio('sounds/lightning.mp3'),
            freezeSpell: new Audio('sounds/freeze.mp3'),
            bowShoot: new Audio('sounds/bow-shoot.mp3'),
            explosion: new Audio('sounds/explosion.mp3'),
            
            // Enemy sounds
            enemyHit: new Audio('sounds/enemy-hit.mp3'),
            enemyDeath: new Audio('sounds/enemy-death.mp3'),
            
            // Player sounds
            playerHit: new Audio('sounds/player-hit.mp3'),
            playerDeath: new Audio('sounds/player-death.mp3'),
            
            // Pickup sounds
            coinPickup: new Audio('sounds/coin-pickup.mp3'),
            powerup: new Audio('sounds/powerup.mp3')
        };
        
        // Set volume for all sounds
        for (const sound in this.sounds) {
            this.sounds[sound].volume = this.soundVolume;
        }
        
        // Load background music
        this.music = new Audio('sounds/dungeon-theme.mp3');
        this.music.volume = this.musicVolume;
        this.music.loop = true;
        
        // Log sounds loaded
        console.log('Sounds loaded, gameStart sound:', this.sounds.gameStart);
    }
    
    // Helper method to initialize audio context (must be called after user interaction)
    initializeAudio() {
        if (this.audioInitialized) return;
        
        // Try to play a silent sound to initialize audio context
        const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
        silentSound.play().catch(err => {
            console.log("Silent sound failed to initialize audio:", err);
        });
        
        // Try to load the game start sound immediately
        this.sounds.gameStart.load();
        
        this.audioInitialized = true;
        console.log('Audio initialized');
    }
    
    // Method to specifically play the game start sound (for troubleshooting)
    forcePlayGameStart() {
        if (this.isMuted) {
            console.log('Sound is muted, not playing game start');
            return;
        }
        
        try {
            console.log('Attempting to force play game start sound');
            const gameStartSound = this.sounds.gameStart.cloneNode();
            gameStartSound.volume = this.soundVolume;
            
            // Add event listener to check if sound actually plays
            gameStartSound.addEventListener('play', () => {
                console.log('Game start sound is playing');
            });
            
            gameStartSound.addEventListener('error', (e) => {
                console.error('Game start sound play error:', e);
            });
            
            const playPromise = gameStartSound.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Game start sound playback started successfully');
                    })
                    .catch(error => {
                        console.error('Game start sound playback failed:', error);
                    });
            }
        } catch (err) {
            console.error('Error forcing game start sound:', err);
        }
    }
    
    playSound(soundName) {
        if (this.isMuted || !this.sounds[soundName]) {
            console.log(`Not playing ${soundName} - muted: ${this.isMuted}, exists: ${!!this.sounds[soundName]}`);
            return;
        }
        
        // Create a clone to allow overlapping sounds
        try {
            const soundClone = this.sounds[soundName].cloneNode();
            soundClone.volume = this.soundVolume;
            
            const playPromise = soundClone.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error(`Error playing ${soundName}:`, error);
                });
            }
            
            if (soundName === 'gameStart') {
                console.log('Regular playSound for gameStart called');
            }
        } catch (err) {
            console.error(`Error playing ${soundName}:`, err);
        }
    }
    
    playSpecificClassSound(className, action) {
        // Maps class names to appropriate sounds
        const classSoundMap = {
            'Warrior': {
                attack: 'swordSwing'
            },
            'Ice Mage': {
                attack: 'freezeSpell'
            },
            'Thunder Mage': {
                attack: 'lightning'
            },
            'Shroom Pixie': {
                attack: 'magicCast'
            },
            'Ninja': {
                attack: 'swordSwing'
            },
            'Holy Bard': {
                attack: 'magicCast'
            },
            'Dark Mage': {
                attack: 'magicCast'
            },
            'Shotgunner': {
                attack: 'bowShoot'
            },
            'Sniper': {
                attack: 'bowShoot'
            },
            'Goblin Trapper': {
                attack: 'explosion'
            },
            'Shaman': {
                attack: 'magicCast'
            }
        };
        
        if (classSoundMap[className] && classSoundMap[className][action]) {
            this.playSound(classSoundMap[className][action]);
        }
    }
    
    playMusic() {
        if (!this.isMuted && this.musicEnabled && this.music) {
            this.music.play();
        }
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopMusic();
        } else if (this.musicEnabled) {
            this.playMusic();
        }
        
        return this.isMuted;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled && !this.isMuted) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        
        return this.musicEnabled;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }
    
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        for (const sound in this.sounds) {
            this.sounds[sound].volume = this.soundVolume;
        }
    }
    
    // Dedicated method for playing the death sound once
    playDeathSound() {
        if (this.isMuted || this.deathSoundPlaying) {
            console.log('Not playing death sound: muted or already playing');
            return;
        }
        
        this.deathSoundPlaying = true;
        console.log('SoundManager: Playing death sound isolated');
        
        try {
            // Create a new standalone Audio object (not from pool)
            const deathSound = new Audio('sounds/player-death.mp3');
            deathSound.volume = this.soundVolume;
            
            // Reset flag when sound ends
            deathSound.onended = () => {
                this.deathSoundPlaying = false;
                console.log('Death sound playback completed');
            };
            
            // Handle errors
            deathSound.onerror = (e) => {
                console.error('Death sound error:', e);
                this.deathSoundPlaying = false;
            };
            
            // Play with proper error handling
            const playPromise = deathSound.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => console.log('Death sound started successfully'))
                    .catch(error => {
                        console.error('Death sound playback failed:', error);
                        this.deathSoundPlaying = false;
                    });
            }
        } catch (err) {
            console.error('Exception playing death sound:', err);
            this.deathSoundPlaying = false;
        }
        
        // Ensure flag is reset after a timeout as a fallback
        setTimeout(() => {
            this.deathSoundPlaying = false;
        }, 5000);
    }
}

// Create global instance
const soundManager = new SoundManager(); 