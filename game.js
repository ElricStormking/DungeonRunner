// Add global pixelation settings at the top before class definitions
const PIXEL_SIZE = 4; // Size of each "pixel" in the pixel art style
const PIXEL_COLORS = {
    GOLD: '#FFD700',
    BRASS: '#B8860B',
    COPPER: '#B87333',
    SILVER: '#C0C0C0',
    STEAM: '#E6E6E6',
    RUST: '#8B4513',
    BLOOD: '#8B0000'
};

// Add environment constants near the top of the file, after PIXEL_COLORS
const ENVIRONMENT_TYPES = {
    GRASS: {
        color: '#4CAF50',      // Brighter green
        secondaryColor: '#388E3C',
        speedModifier: 1
    },
    BUSH: {
        color: '#2E7D32',      // Darker green
        secondaryColor: '#1B5E20',
        speedModifier: 0.8
    },
    FOREST: {
        color: '#1B5E20',      // Deep green
        secondaryColor: '#004D40', // Teal-green
        speedModifier: 0.5     // Entities move at half speed in forests
    }
};

// Add this function to pixelate drawing
function pixelRect(ctx, x, y, width, height, color) {
    // Snap to pixel grid
    const pixelX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelWidth = Math.ceil(width / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelHeight = Math.ceil(height / PIXEL_SIZE) * PIXEL_SIZE;
    
    ctx.fillStyle = color;
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
}

// Add function to draw pixel circles
function pixelCircle(ctx, centerX, centerY, radius, color) {
    // Snap to pixel grid
    const pixelCenterX = Math.floor(centerX / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelCenterY = Math.floor(centerY / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelRadius = Math.ceil(radius / PIXEL_SIZE) * PIXEL_SIZE;
    
    // Draw a "pixelated" circle using small squares
    for (let y = -pixelRadius; y <= pixelRadius; y += PIXEL_SIZE) {
        for (let x = -pixelRadius; x <= pixelRadius; x += PIXEL_SIZE) {
            // If this pixel is inside the circle
            if (x*x + y*y <= pixelRadius*pixelRadius) {
                pixelRect(ctx, pixelCenterX + x, pixelCenterY + y, PIXEL_SIZE, PIXEL_SIZE, color);
            }
        }
    }
}

// Add pixel line function
function pixelLine(ctx, x1, y1, x2, y2, color, thickness = PIXEL_SIZE) {
    // Snap to pixel grid
    const pixelX1 = Math.floor(x1 / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelY1 = Math.floor(y1 / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelX2 = Math.floor(x2 / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelY2 = Math.floor(y2 / PIXEL_SIZE) * PIXEL_SIZE;
    
    const dx = Math.abs(pixelX2 - pixelX1);
    const dy = Math.abs(pixelY2 - pixelY1);
    const sx = pixelX1 < pixelX2 ? PIXEL_SIZE : -PIXEL_SIZE;
    const sy = pixelY1 < pixelY2 ? PIXEL_SIZE : -PIXEL_SIZE;
    let err = dx - dy;
    
    let x = pixelX1;
    let y = pixelY1;
    
    while (true) {
        pixelRect(ctx, x - thickness/2, y - thickness/2, thickness, thickness, color);
        if (x === pixelX2 && y === pixelY2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

// Add the EnvironmentElement class before the Game class
class EnvironmentElement {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.color = ENVIRONMENT_TYPES[type].color;
        this.secondaryColor = ENVIRONMENT_TYPES[type].secondaryColor;
        this.speedModifier = ENVIRONMENT_TYPES[type].speedModifier;
        
        // Create a pregenerated pattern for better performance
        this.createPattern();
    }

    // Create a reusable pattern with decorations
    createPattern() {
        // Create a pattern canvas with a reasonable size
        const patternSize = 64; // Use a power of 2 for better performance
        const canvas = document.createElement('canvas');
        canvas.width = patternSize;
        canvas.height = patternSize;
        const ctx = canvas.getContext('2d');
        
        // Fill with base color
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, patternSize, patternSize);
        
        // Add texture with secondary color
        const blockSize = PIXEL_SIZE * 3; // Larger blocks for better performance
        for (let x = 0; x < patternSize; x += blockSize) {
            for (let y = 0; y < patternSize; y += blockSize) {
                // Use a deterministic pattern instead of random
                if ((x + y) % (blockSize * 3) === 0) {
                    ctx.fillStyle = this.secondaryColor;
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        }
        
        // Add type-specific decoration
        if (this.type === 'BUSH') {
            // Just a few berry dots
            ctx.fillStyle = '#FF1744'; // Brighter red for better visibility
            ctx.fillRect(patternSize / 4, patternSize / 4, blockSize, blockSize);
            ctx.fillRect(patternSize * 3/4, patternSize * 3/4, blockSize, blockSize);
        } else if (this.type === 'FOREST') {
            // Simplified tree trunks
            ctx.fillStyle = '#795548'; // Better brown color
            ctx.fillRect(patternSize / 4, patternSize / 3, blockSize, blockSize * 2);
            ctx.fillRect(patternSize * 3/4, patternSize / 2, blockSize, blockSize * 2);
            
            // Add tree tops
            ctx.fillStyle = '#33691E'; // Dark green tree tops
            const treeTopSize = blockSize * 1.5;
            ctx.beginPath();
            ctx.arc(patternSize / 4 + blockSize/2, patternSize / 3 - blockSize/2, treeTopSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(patternSize * 3/4 + blockSize/2, patternSize / 2 - blockSize/2, treeTopSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Create a pattern from this canvas
        this.pattern = ctx.createPattern(canvas, 'repeat');
    }

    // Check if a point is inside this environment element
    contains(x, y) {
        return x >= this.x && x < this.x + this.width && 
               y >= this.y && y < this.y + this.height;
    }

    draw(ctx) {
        // Save context to restore pattern transform later
        ctx.save();
        
        // Set pattern transform to align with element position
        ctx.translate(this.x, this.y);
        
        // Draw element using the pregenerated pattern
        ctx.fillStyle = this.pattern;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Restore context
        ctx.restore();
        
        // Draw a simple border to help identify different terrain types
        if (this.type === 'FOREST') {
            ctx.strokeStyle = '#004D40'; // Use the teal-green color
            ctx.lineWidth = PIXEL_SIZE * 2; // Thicker border
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Add a dashed line inside for better visibility
            ctx.strokeStyle = '#00C853'; // Bright green
            ctx.lineWidth = PIXEL_SIZE;
            ctx.setLineDash([PIXEL_SIZE * 3, PIXEL_SIZE * 3]);
            ctx.strokeRect(this.x + PIXEL_SIZE * 4, this.y + PIXEL_SIZE * 4, 
                          this.width - PIXEL_SIZE * 8, this.height - PIXEL_SIZE * 8);
            ctx.setLineDash([]); // Reset dash pattern
        }
    }
}

class Commander {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 2;
        this.direction = { x: 0, y: 0 };
        this.color = '#8B4513'; // Brown color for steampunk theme
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.regenRate = 0.05; // Health regenerated per frame
        this.lastDamageTime = 0;
        this.regenDelay = 3000; // 3 seconds before regen starts
        this.game = game; // Store reference to game instance

        // Add attack properties
        this.attackRange = 80;
        this.attackDamage = 3;
        this.attackSpeed = 800; // Slightly faster than followers
        this.lastAttackTime = 0;
        this.attackEffects = [];
    }

    update() {
        // Apply environment speed modifier
        const speedModifier = this.game ? this.game.getEnvironmentSpeedModifier(this.x, this.y) : 1;
        
        // Apply modified speed
        this.x += this.direction.x * this.speed * speedModifier;
        this.y += this.direction.y * this.speed * speedModifier;
        
        // Health regeneration
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime > this.regenDelay && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.regenRate);
        }

        // Auto sword sweep attack
        if (this.game && this.game.enemies) {
            this.performSwordSweep(this.game.enemies);
        }

        // Update attack effects
        this.attackEffects = this.attackEffects.filter(effect => {
            return Date.now() - effect.startTime < effect.duration;
        });
    }

    performSwordSweep(enemies) {
        performSwordSweepAttack(this, enemies);
    }

    isInRange(enemy, range) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= range;
    }

    takeDamage(amount) {
        // Store previous health to check for critical health threshold
        const previousHealth = this.health;
        
        // Apply damage
        this.health -= amount;
        this.lastDamageTime = Date.now();
        
        // Show damage number if we have a game reference
        if (this.game) {
            this.game.showDamageNumber(amount, this.x, this.y, this.size);
        }
        
        // Check if health dropped below critical threshold (25%)
        if (previousHealth > this.maxHealth * 0.25 && this.health <= this.maxHealth * 0.25 && this.health > 0) {
            // Trigger critical health warning if we have a game reference
            if (this.game) {
                // Flash screen red
                this.game.flashEffect.alpha = 0.5;
                this.game.flashEffect.color = '#FF0000';
                
                // Show critical health warning
                this.game.waveStatusAlpha = 1;
                this.game.waveStatusText = "CRITICAL DAMAGE!";
                
                // Extra screen shake
                this.game.triggerScreenShake(12, 20);
            }
        }
    }

    draw(ctx) {
        // Draw attack effects first using the global function
        this.attackEffects.forEach(effect => {
            // Pass 'this' as the attacker context
            drawAttackEffect(ctx, effect, this);
        });

        // Draw the Commander pixel art avatar based on the reference image
        const px = PIXEL_SIZE; // Shorthand for pixel size
        
        // Draw helmet/head (light gray with gold cross)
        pixelRect(ctx, this.x - px*3, this.y - px*6, px*6, px*5, '#E6E6E6'); // Light gray helmet
        pixelRect(ctx, this.x, this.y - px*4, px, px*3, '#FFD700'); // Vertical gold cross
        pixelRect(ctx, this.x - px, this.y - px*3, px*3, px, '#FFD700'); // Horizontal gold cross
        
        // Draw black outlines for helmet
        pixelRect(ctx, this.x - px*4, this.y - px*6, px, px*5, '#1A1A1A'); // Left outline
        pixelRect(ctx, this.x + px*3, this.y - px*6, px, px*5, '#1A1A1A'); // Right outline
        pixelRect(ctx, this.x - px*3, this.y - px*7, px*6, px, '#1A1A1A'); // Top outline
        pixelRect(ctx, this.x - px*3, this.y - px*1, px*2, px, '#1A1A1A'); // Bottom left outline
        pixelRect(ctx, this.x + px, this.y - px*1, px*2, px, '#1A1A1A'); // Bottom right outline
        
        // Draw body armor (gray with gold cross)
        pixelRect(ctx, this.x - px*3, this.y, px*6, px*4, '#B0B0B0'); // Main armor
        pixelRect(ctx, this.x, this.y + px, px, px*3, '#FFD700'); // Vertical gold cross
        pixelRect(ctx, this.x - px, this.y + px*2, px*3, px, '#FFD700'); // Horizontal gold cross
        
        // Draw sword handle and blade (black, gold, gray)
        pixelRect(ctx, this.x + px*4, this.y - px*4, px, px*5, '#1A1A1A'); // Sword handle outline
        pixelRect(ctx, this.x + px*4, this.y - px*3, px, px*3, '#FFD700'); // Gold handle
        pixelRect(ctx, this.x + px*4, this.y - px*8, px, px*4, '#C0C0C0'); // Silver blade
        pixelRect(ctx, this.x + px*3, this.y - px*9, px*3, px, '#1A1A1A'); // Sword top outline
        pixelRect(ctx, this.x + px*5, this.y - px*8, px, px*4, '#1A1A1A'); // Sword right outline
        pixelRect(ctx, this.x + px*3, this.y - px*4, px, px, '#1A1A1A'); // Sword hilt left
        pixelRect(ctx, this.x + px*5, this.y - px*4, px, px, '#1A1A1A'); // Sword hilt right
        
        // Draw shoulder pauldron (left side, gray)
        pixelRect(ctx, this.x - px*6, this.y, px*3, px*3, '#A0A0A0');
        
        // Draw shield (gray with gold borders and blue center)
        pixelRect(ctx, this.x - px*8, this.y + px*2, px*3, px*5, '#B0B0B0'); // Shield base
        pixelRect(ctx, this.x - px*7, this.y + px*3, px, px*3, '#4169E1'); // Blue center of shield
        pixelRect(ctx, this.x - px*9, this.y + px*2, px, px*5, '#1A1A1A'); // Left shield outline
        pixelRect(ctx, this.x - px*8, this.y + px*1, px*3, px, '#1A1A1A'); // Top shield outline
        pixelRect(ctx, this.x - px*8, this.y + px*7, px*3, px, '#1A1A1A'); // Bottom shield outline
        pixelRect(ctx, this.x - px*5, this.y + px*2, px, px*5, '#1A1A1A'); // Right shield outline
        
        // Draw legs (blue tabard and armor)
        // Left leg
        pixelRect(ctx, this.x - px*2, this.y + px*4, px*2, px*4, '#4169E1'); // Blue tabard left leg
        pixelRect(ctx, this.x - px*3, this.y + px*4, px, px*4, '#1A1A1A'); // Left leg outline
        
        // Right leg
        pixelRect(ctx, this.x + px*1, this.y + px*4, px*2, px*4, '#4169E1'); // Blue tabard right leg
        pixelRect(ctx, this.x + px*3, this.y + px*4, px, px*4, '#1A1A1A'); // Right leg outline
        
        // Brown belt
        pixelRect(ctx, this.x - px*3, this.y + px*4, px*7, px, '#8B4513'); 
        
        // Small face detail
        pixelRect(ctx, this.x + px*2, this.y - px*3, px, px, '#FFC090'); // Skin tone detail
        
        // Draw black outlines for body
        pixelRect(ctx, this.x - px*4, this.y, px, px*4, '#1A1A1A'); // Left outline 
        pixelRect(ctx, this.x + px*3, this.y, px, px*4, '#1A1A1A'); // Right outline
        
        // Add feet details
        pixelRect(ctx, this.x - px*3, this.y + px*8, px*2, px, '#A0A0A0'); // Left foot
        pixelRect(ctx, this.x + px*1, this.y + px*8, px*2, px, '#A0A0A0'); // Right foot

        // Draw pixelated HP bar (using the global drawHealthBar function)
        drawHealthBar(ctx, this.x, this.y - this.size - 10, this.size * 2, 8, this.health, this.maxHealth);

        // Draw regeneration effect when healing
        if (Date.now() - this.lastDamageTime > this.regenDelay && this.health < this.maxHealth) {
            const regenColor = 'rgba(0, 255, 0, 0.3)';
            const regenRadius = this.size + 7;
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const regenX = this.x + Math.cos(angle) * regenRadius;
                const regenY = this.y + Math.sin(angle) * regenRadius;
                pixelRect(ctx, regenX, regenY, PIXEL_SIZE, PIXEL_SIZE, regenColor);
            }
        }
    }
}

class Engineer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.color = '#DAA520'; // Golden color for engineers
        this.collected = false;
        
        // Use weighted selection instead of pure random
        this.steamClass = selectWeightedSteamClass();
        this.color = this.steamClass.color; // Use the class color
    }

    draw(ctx) {
        if (this.collected) return;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw gear effect
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Draw class name above engineer
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(this.steamClass.name, this.x, this.y - this.size - 5);
    }
}

// Add before the Follower class
const STEAM_CLASSES = {
    WARRIOR: {
        name: 'Warrior',
        color: '#FFD700', // Gold color
        attackStyle: 'SWORD_SWEEP',
        description: 'Leads the team with powerful melee attacks',
        baseStats: { damage: 2.5, range: 180, speed: 1.6 },
        spawnRate: 100 // Base spawn rate (percentage relative to other classes)
    },
    ICE_MAGE: {
        name: 'Ice Mage',
        color: '#C0B283',
        attackStyle: 'TIME_BURST',
        description: 'Ice-manipulating mage who slows enemies',
        baseStats: { damage: 1.2, range: 120, speed: 1.8 },
        spawnRate: 100
    },
    THUNDER_MAGE: {
        name: 'Thunder Mage',
        color: '#7DF9FF',
        attackStyle: 'CHAIN_LIGHTNING',
        description: 'Electric specialist with chain lightning attacks',
        baseStats: { damage: 1.5, range: 150, speed: 1.5 },
        spawnRate: 100
    },
    SHROOM_PIXIE: {
        name: 'Shroom Pixie',
        color: '#CD7F32',
        attackStyle: 'PRESSURE_BLAST',
        description: 'Magical pixie who harnesses mushroom energy',
        baseStats: { damage: 2.0, range: 80, speed: 1.2 },
        spawnRate: 100
    },
    NINJA: {
        name: 'Ninja',
        color: '#B87333',
        attackStyle: 'GEAR_THROW',
        description: 'Throws deadly spinning shurikens',
        baseStats: { damage: 1.8, range: 200, speed: 1.3 },
        spawnRate: 100
    },
    HOLY_BARD: {
        name: 'Holy Bard',
        color: '#B5A642',
        attackStyle: 'SHRAPNEL_FIELD',
        description: 'Creates fields of holy energy',
        baseStats: { damage: 1.6, range: 100, speed: 1.4 },
        spawnRate: 100
    },
    DARK_MAGE: {
        name: 'Dark Mage',
        color: '#9B111E',
        attackStyle: 'AETHER_BEAM',
        description: 'Channels dark energy beams',
        baseStats: { damage: 2.2, range: 180, speed: 1.1 },
        spawnRate: 100
    },
    SHOTGUNNER: {
        name: 'Shotgunner',
        color: '#4A412A',
        attackStyle: 'EMBER_SPRAY',
        description: 'Fires spread of deadly pellets',
        baseStats: { damage: 1.7, range: 90, speed: 1.6 },
        spawnRate: 100
    },
    SNIPER: {
        name: 'Sniper',
        color: '#71797E',
        attackStyle: 'PISTON_PUNCH',
        description: 'Precise long-range specialist',
        baseStats: { damage: 1.9, range: 60, speed: 2.0 },
        spawnRate: 100
    },
    GOBLIN_TRAPPER: {
        name: 'Goblin Trapper',
        color: '#CFB53B',
        attackStyle: 'TEMPORAL_MINE',
        description: 'Places explosive goblin traps',
        baseStats: { damage: 2.5, range: 140, speed: 1.0 },
        spawnRate: 100
    },
    SHAMAN: {
        name: 'Shaman',
        color: '#8B4513',
        attackStyle: 'CORROSION_CLOUD',
        description: 'Creates clouds of poisonous toxins',
        baseStats: { damage: 1.4, range: 110, speed: 1.7 },
        spawnRate: 100
    }
};

class Follower {
    constructor(x, y, target, game) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 2;
        this.target = target;
        this.minDistance = 20;
        this.game = game; // Store game reference directly
        
        // Assign random class if not specified
        this.assignClass(Object.keys(STEAM_CLASSES)[Math.floor(Math.random() * Object.keys(STEAM_CLASSES).length)]);
        
        // Position history for snake-like movement
        this.positionHistory = [];
        this.historyUpdateInterval = 3;
        this.historyUpdateTimer = 0;
        this.followDelay = 5;
        
        // Attack properties
        this.attackRange = this.steamClass.baseStats.range;
        this.attackDamage = this.steamClass.baseStats.damage;
        this.speed = this.steamClass.baseStats.speed;
        this.attackSpeed = 1000;
        this.lastAttackTime = 0;
        this.attackTarget = null;
        
        // Special attack properties
        this.specialAttackTimer = 0;
        this.specialAttackCooldown = 5000; // 5 seconds
        this.attackEffects = [];
        
        // Upgrade tracking
        this.upgrades = {
            damage: 0,
            range: 0,
            speed: 0
        };
        
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.regenRate = 0.02; // Health regenerated per frame
        this.lastDamageTime = 0;
        this.regenDelay = 5000; // 5 seconds before regen starts
        
        // Trail effect properties
        this.trail = [];
        this.maxTrailLength = 15;
        this.trailUpdateInterval = 3;
        this.trailUpdateTimer = 0;
        this.gearRotation = 0;
    }

    assignClass(className) {
        this.steamClass = STEAM_CLASSES[className];
        this.color = this.steamClass.color;
    }

    update(enemies) {
        // Update trail
        this.trailUpdateTimer++;
        if (this.trailUpdateTimer >= this.trailUpdateInterval) {
            this.trailUpdateTimer = 0;
            this.trail.unshift({ x: this.x, y: this.y, rotation: this.gearRotation });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.pop();
            }
        }
        
        // Update position history
        this.historyUpdateTimer++;
        if (this.historyUpdateTimer >= this.historyUpdateInterval) {
            this.historyUpdateTimer = 0;
            this.positionHistory.unshift({ x: this.target.x, y: this.target.y });
            if (this.positionHistory.length > 60) { // Cap history at 60 frames
                this.positionHistory.pop();
            }
        }

        // Apply environment speed modifier
        const speedModifier = this.game ? this.game.getEnvironmentSpeedModifier(this.x, this.y) : 1;

        // Move towards historical position with smoother interpolation
        if (this.positionHistory.length >= this.followDelay) {
            const targetPos = this.positionHistory[this.followDelay - 1];
            const dx = targetPos.x - this.x;
            const dy = targetPos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.5) { // Reduced threshold for more precise movement
                const speed = Math.min(this.speed, distance * 0.5) * speedModifier; // Apply environment speed modifier
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            }
        }
        
        // Auto-attack logic
        this.updateAttack(enemies);

        // Health regeneration
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime > this.regenDelay && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.regenRate);
        }

        // Check if we have a valid enemies array before performing special attack
        if (enemies && enemies.length > 0) {
            // Perform special attack if available
            this.performSpecialAttack(enemies);
        }
        
        // Update attack effects
        this.attackEffects = this.attackEffects.filter(effect => {
            return Date.now() - effect.startTime < effect.duration;
        });
    }

    updateAttack(enemies) {
        const currentTime = Date.now();
        
        // If we can't attack yet, return
        if (currentTime - this.lastAttackTime < this.attackSpeed) {
            return;
        }
        
        // Find closest enemy in range
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            if (enemy.collected) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.attackRange && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        // If an enemy is in range, attack it
        if (closestEnemy) {
            this.attackTarget = closestEnemy;
            this.attackEnemy(closestEnemy);
            this.lastAttackTime = currentTime;
        } else {
            this.attackTarget = null;
        }
    }
    
    attackEnemy(enemy) {
        // Store previous health to check for damage
        const previousHealth = enemy.health;
        
        // Apply damage
        enemy.health -= this.attackDamage;
        
        // Show damage number if we have a game reference
        if (this.game && enemy.health < previousHealth) {
            const damageDone = previousHealth - enemy.health;
            this.game.showDamageNumber(damageDone, enemy.x, enemy.y, enemy.size);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.lastDamageTime = Date.now();
        
        // Show damage number if we have a game reference
        if (this.game) {
            this.game.showDamageNumber(amount, this.x, this.y, this.size);
        }
        
        // Ensure health doesn't go below 0
        if (this.health < 0) {
            this.health = 0;
        }
        
        // Return whether the follower is dead
        return this.health <= 0;
    }

    draw(ctx) {
        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = (1 - index / this.maxTrailLength) * 0.3;
            const size = this.size * (1 - index / this.maxTrailLength * 0.5);
            
            // Draw steam trail
            ctx.strokeStyle = `rgba(169, 169, 169, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size + 2, 0, Math.PI * 2);
            ctx.stroke();

            // Draw gear in trail
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate(point.rotation);
            
            // Draw gear teeth
            ctx.strokeStyle = `rgba(205, 133, 63, ${alpha})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                ctx.beginPath();
                ctx.moveTo(size * 0.7, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
                ctx.rotate(Math.PI / 4);
            }
            
            // Draw gear center
            ctx.fillStyle = `rgba(205, 133, 63, ${alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });

        // Draw follower base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw upgrade indicators
        if (this.upgrades.damage > 0) {
            // Draw damage upgrade (orange-red glow)
            ctx.strokeStyle = `rgba(255, 69, 0, ${Math.min(this.upgrades.damage * 0.3, 0.8)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.upgrades.range > 0) {
            // Draw range upgrade (blue circles)
            ctx.strokeStyle = `rgba(65, 105, 225, ${Math.min(this.upgrades.range * 0.015, 0.5)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.upgrades.speed > 0) {
            // Draw speed upgrade (green trail)
            ctx.strokeStyle = `rgba(50, 205, 50, ${Math.min(this.upgrades.speed * 0.3, 0.6)})`;
            ctx.lineWidth = 2;
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 3, angle - Math.PI * 0.8, angle + Math.PI * 0.8);
            ctx.stroke();
        }
        
        // Draw attack range indicator when attacking
        if (this.attackTarget) {
            // Base attack range circle
            ctx.strokeStyle = 'rgba(205, 133, 63, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
            
            // Enhanced attack line based on damage
            const attackAlpha = 0.5 + (this.upgrades.damage * 0.1);
            ctx.strokeStyle = `rgba(205, 133, 63, ${attackAlpha})`;
            ctx.lineWidth = 1 + (this.upgrades.damage * 0.5);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.attackTarget.x, this.attackTarget.y);
            ctx.stroke();
        }

        // Draw HP bar
        drawHealthBar(ctx, this.x, this.y - this.size - 10, this.size * 2, 4, this.health, this.maxHealth);

        // Draw regeneration effect when healing
        if (Date.now() - this.lastDamageTime > this.regenDelay && this.health < this.maxHealth) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 7, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw class indicator
        ctx.fillStyle = this.color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.steamClass.name, this.x, this.y - this.size - 20);

        // Draw attack effects using the global function
        this.attackEffects.forEach(effect => {
             // Pass 'this' as the attacker context
             drawAttackEffect(ctx, effect, this);
        });
    }

    // Special attack implementations
    timeburstAttack(enemies) {
        // Add a global flash effect for time manipulation
        if (this.game) {
            this.game.flashEffect = {
                alpha: 0.3,
                color: '#00CCFF', // Cyan-blue color for time manipulation
                duration: 15,
                startTime: Date.now()
            };
            
            // Screen shake for general time burst is added here if needed (currently not)
             // this.game.triggerScreenShake(2, 5); // Example: small shake for any time burst
        }
        
        // Find and affect enemies in range
        const affectedEnemies = [];
        enemies.forEach(enemy => {
            if (this.isInRange(enemy, this.attackRange * 1.5)) {
                // Apply slow effect
                enemy.speed *= 0.5;
                setTimeout(() => enemy.speed *= 2, 3000);
                
                // Mark affected enemies
                affectedEnemies.push(enemy);
                
                // Create time distortion particles around the enemy
                for (let i = 0; i < 10; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = enemy.size * (0.8 + Math.random() * 0.8);
                    
                    if (this.game && this.game.particlePool) {
                        const particle = this.game.particlePool.get(
                            enemy.x + Math.cos(angle) * distance,
                            enemy.y + Math.sin(angle) * distance,
                            '#00FFFF' // Cyan color for time particles
                        );
                        
                        if (particle) {
                            particle.speedX *= 0.3; // Slow moving particles to indicate time slow
                            particle.speedY *= 0.3;
                            particle.decay *= 0.7; // Longer lasting particles
                        }
                    }
                }
                
                // Create a distinctive time burst effect using global function
                 const timeBurstEffect = createAttackEffect(this, 'TIME_BURST', enemy.x, enemy.y);
                 // Override default radius if needed based on enemy size
                 timeBurstEffect.radius = enemy.size * 2;
                 timeBurstEffect.duration = 2000; // Explicitly set duration
                 // Note: effect is already pushed to this.attackEffects by createAttackEffect
            }
        });
        
        // If we affected enemies, create additional visual cues
        if (affectedEnemies.length > 0) {
            // Log for debugging
            console.log(`Time Burst affected ${affectedEnemies.length} enemies`);
            
            // Create a central time burst effect at the caster's position using global function
             const casterEffect = createAttackEffect(this, 'TIME_BURST', this.x, this.y);
             casterEffect.radius = this.attackRange * 0.5; // Use follower's range
             casterEffect.isCaster = true; // Mark as caster effect
             casterEffect.duration = 1500; // Explicitly set duration
             // Note: effect is already pushed to this.attackEffects by createAttackEffect

             // Add screen shake specifically for the caster effect HERE
             if (casterEffect.isCaster && this.game) {
                 this.game.triggerScreenShake(3, 8);
             }
        }
    }

    chainLightningAttack(enemies) {
        let remainingJumps = 5; // Increased from 3 to 5 jumps
        let lastTarget = null;
        let damage = this.attackDamage * 1.2; // Increased base damage

        // Add a flash effect at the beginning of chain lightning attack
        if (this.game) {
            this.game.flashEffect = {
                alpha: 0.5,
                color: '#FFFF00',
                duration: 10,
                startTime: Date.now()
            };
        }

        // Find the primary targets
        const targets = enemies
            .filter(enemy => this.isInRange(enemy, this.attackRange))
            .sort((a, b) => this.getDistance(a) - this.getDistance(b))
            .slice(0, remainingJumps);
            
        if (targets.length === 0) return;
            
        // Get the nearest enemy as the starting point
        lastTarget = { x: this.x, y: this.y }; // Start from the follower
        let primaryTarget = targets[0];
        
        // Strike the primary target
        // createLightningEffect now returns the effect object, including segments
        const primaryLightning = this.createLightningEffect(lastTarget, primaryTarget);
         // We don't need to call createAttackEffect separately if createLightningEffect handles adding to the list
         // Ensure createLightningEffect adds the created lightning object to this.attackEffects
        primaryTarget.health -= damage;
        lastTarget = primaryTarget;
        remainingJumps--;
        
        // Then branch out to others
        let hitEnemies = [primaryTarget];
        
        // Process secondary targets
        for (let i = 1; i < targets.length && remainingJumps > 0; i++) {
            const enemy = targets[i];
            if (hitEnemies.includes(enemy)) continue;
            
            enemy.health -= damage * 0.8; // Slightly less damage for branch targets
            // createLightningEffect now returns the effect object, including segments
            const branchLightning = this.createLightningEffect(lastTarget, enemy);
            // Ensure createLightningEffect adds the created lightning object to this.attackEffects
            hitEnemies.push(enemy);
            lastTarget = enemy;
            remainingJumps--;
        }
        
        // If we still have remaining jumps but ran out of targets in range,
        // find more enemies that might be just outside the range
        if (remainingJumps > 0 && lastTarget) {
            const secondaryRange = this.attackRange * 1.5;
            enemies
                .filter(enemy => !hitEnemies.includes(enemy) && 
                                this.getDistance(enemy) <= secondaryRange)
                .sort((a, b) => {
                    const distA = Math.sqrt(
                        Math.pow(a.x - lastTarget.x, 2) + 
                        Math.pow(a.y - lastTarget.y, 2)
                    );
                    const distB = Math.sqrt(
                        Math.pow(b.x - lastTarget.x, 2) + 
                        Math.pow(b.y - lastTarget.y, 2)
                    );
                    return distA - distB;
                })
                .slice(0, remainingJumps)
                .forEach(enemy => {
                    enemy.health -= damage * 0.6; // Even less damage for distant targets
                     // createLightningEffect now returns the effect object, including segments
                     const distantLightning = this.createLightningEffect(lastTarget, enemy);
                     // Ensure createLightningEffect adds the created lightning object to this.attackEffects
                    lastTarget = enemy;
                    remainingJumps--;
                });
        }
    }

    pressureBlastAttack(enemies) {
        const blastRadius = 100;
        enemies.forEach(enemy => {
            if (this.isInRange(enemy, blastRadius)) {
                const distance = this.getDistance(enemy);
                const knockback = (blastRadius - distance) / blastRadius * 50;
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.x += Math.cos(angle) * knockback;
                enemy.y += Math.sin(angle) * knockback;
                enemy.health -= this.attackDamage;
            }
        });
    }

    gearThrowAttack(enemies) {
        const gearDamage = this.attackDamage * 2;
        let nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
            // Create launch effect first
            createAttackEffect(this, 'GEAR_LAUNCH', this.x, this.y); // Default duration (200ms) is fine

            // Use createProjectile which internally calls createAttackEffect or manages its own effects
            this.createProjectile(nearestEnemy, 'GEAR', gearDamage);
        }
    }

    shrapnelFieldAttack(enemies) {
        const fieldRadius = this.attackRange * 0.8;
        
        // Create a visual effect at the caster's position
        createAttackEffect(this, 'SHRAPNEL_FIELD_CAST', this.x, this.y, 0, { duration: 800 });
        
        // Increase the number of shrapnel pieces for better visibility
        for (let i = 0; i < 18; i++) {
            const angle = (Math.PI * 2 * i) / 18;
            const distance = fieldRadius * (0.7 + Math.random() * 0.3); // Randomize distance slightly
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            // Add slight variation in timing for more dynamic effect
            setTimeout(() => {
            this.createShrapnel(x, y, this.attackDamage / 2);
            }, i * 30); // Stagger the shrapnel creation
        }
        
        // Add screen shake for impact
        if (this.game) {
            this.game.triggerScreenShake(4, 8);
        }
    }

    aetherBeamAttack(enemies) {
        // Increase beam width to make it more visible
        const beamWidth = Math.PI / 8; // Wider beam (about 22.5 degrees)
        let nearestEnemy = this.findNearestEnemy(enemies);
        
        // Get the Ethermancer's color for visual consistency
        const beamBaseColor = this.steamClass.color || '#9B111E'; // Default to dark red if color not available
        
        if (nearestEnemy) {
            // Calculate angle to target
            const angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            
            // Create beam visual effect using global createAttackEffect
            createAttackEffect(this, 'AETHER_BEAM', this.x, this.y, angle);
            
            // Apply damage to enemies in the beam path
            enemies.forEach(enemy => {
                if (this.isInBeam(enemy, angle, beamWidth)) {
                    enemy.health -= this.attackDamage * 1.5;
                    
                    // Add hit effect at enemy location
                    if (this.game) {
                        this.game.triggerScreenShake(3, 5); // Smaller screen shake for beam hit
                    }
                }
            });
            
            // Add console logging to help debug
            console.log(`AETHER_BEAM attack fired at angle ${angle.toFixed(2)} targeting enemy at (${nearestEnemy.x}, ${nearestEnemy.y})`);
        } else if (this.target) {
            // If no enemies, fire in direction of movement
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            
            // Create beam visual effect using global createAttackEffect
            createAttackEffect(this, 'AETHER_BEAM', this.x, this.y, angle);
            
            // Add console logging to help debug
            console.log(`AETHER_BEAM attack fired at angle ${angle.toFixed(2)} with no targets`);
        }
    }

    emberSprayAttack(enemies) {
        const sprayAngle = Math.PI / 4; // 45 degrees
        const emberCount = 8;
        
        // Find target direction - either towards nearest enemy or forward if no enemies
        let targetAngle = 0; // Default direction (right)
        
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
            targetAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
        } else if (this.target) {
            // Use direction towards the target (commander or previous follower)
            targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        }
        
        // Create embers in a spread pattern
        for (let i = 0; i < emberCount; i++) {
            // Calculate angle as offset from target angle
            const spreadOffset = sprayAngle * (i / (emberCount - 1) - 0.5);
            const angle = targetAngle + spreadOffset;
            
            // Create ember with the calculated angle
            this.createEmber(angle, this.attackDamage / 2);
        }
    }

    pistonPunchAttack(enemies) {
        const punchRange = this.attackRange * 0.6;
        let nearestEnemyAngle = null;
        let firstHit = true; // To only create one punch effect

        enemies.forEach(enemy => {
            if (this.isInRange(enemy, punchRange)) {
                 // Calculate angle for knockback and visual effect direction
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                 if (firstHit) {
                     nearestEnemyAngle = angle;
                     // Create the main punch effect originating from the follower
                     // Offset slightly in the direction of the first hit enemy
                     const effectX = this.x + Math.cos(angle) * 10;
                     const effectY = this.y + Math.sin(angle) * 10;
                     createAttackEffect(this, 'PISTON_PUNCH', effectX, effectY, angle, { duration: 150 }); // Short duration punch effect
                     firstHit = false;
                 }

                // Apply damage and knockback
                enemy.health -= this.attackDamage * 1.2;
                enemy.x += Math.cos(angle) * 30;
                enemy.y += Math.sin(angle) * 30;

                // Create hit effect on the enemy
                createAttackEffect(this, 'PISTON_HIT', enemy.x, enemy.y, 0, { duration: 100 }); // Very short hit effect

                // Show damage number
                if (this.game) {
                     this.game.showDamageNumber(this.attackDamage * 1.2, enemy.x, enemy.y, enemy.size);
                }
            }
        });

        // Optional: Add sound/shake if an enemy was hit
         if (!firstHit && this.game) { // If firstHit is false, it means we hit at least one enemy
             // this.game.triggerScreenShake(2, 5); // Subtle shake
         }
    }

    temporalMineAttack() {
        const mine = {
            x: this.x,
            y: this.y,
            damage: this.attackDamage * 2,
            radius: 80,
            detonationTime: Date.now() + 2000
        };
        
        // Use the direct game reference
        if (this.game && this.game.temporalMines) {
            this.game.temporalMines.push(mine);
            // Create visual effect for the mine placement using global function
             createAttackEffect(this, 'TEMPORAL_MINE', mine.x, mine.y);
        }
    }

    corrosionCloudAttack(enemies) {
        const cloudRadius = this.attackRange * 0.7;
        let affected = false;

        // Create the visual cloud effect centered on the follower
        // Use a longer duration for the visual effect
        createAttackEffect(this, 'CORROSION_CLOUD', this.x, this.y, 0, { duration: 1500 });

        enemies.forEach(enemy => {
            if (this.isInRange(enemy, cloudRadius)) {
                affected = true;
                // Apply small initial damage
                enemy.health -= this.attackDamage * 0.5;
                if (this.game) {
                     this.game.showDamageNumber(this.attackDamage * 0.5, enemy.x, enemy.y, enemy.size);
                }

                // Add corrosion effect that deals damage over time
                if (!enemy.corrosion) {
                    enemy.corrosion = {
                        damagePerTick: this.attackDamage * 0.2, // Store damage per tick
                        tickInterval: 1000, // Apply damage every 1000ms (1 second)
                        remainingDuration: 3000, // Total duration of the DoT
                        lastTickTime: Date.now() // Track time for ticks
                    };
                } else {
                     // Refresh duration if already corroding
                     enemy.corrosion.remainingDuration = 3000;
                }
            }
        });

        // Optional: Add sound effect or minor screen shake if any enemy was affected
        if (affected && this.game) {
             // this.game.triggerScreenShake(1, 4); // Very subtle shake
        }
    }

    // Helper methods
    isInRange(enemy, range) {
        return this.getDistance(enemy) <= range;
    }

    getDistance(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let minDistance = Infinity;
        enemies.forEach(enemy => {
            const distance = this.getDistance(enemy);
            if (distance < minDistance && distance <= this.attackRange) {
                nearest = enemy;
                minDistance = distance;
            }
        });
        return nearest;
    }

    isInBeam(enemy, angle, width) {
        const enemyAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        
        // Normalize angles to handle the -π to π boundary
        let angleDiff = Math.abs(enemyAngle - angle);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }
        
        // Check both distance and angle
        return angleDiff <= width && this.isInRange(enemy, this.attackRange);
    }

    createEmber(angle, damage) {
        // Implementation of createEmber method
        const speed = 4;
        const ember = {
            x: this.x,
            y: this.y,
            angle: angle,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            damage: damage,
            radius: 5,
            life: 1,
            decay: 0.01,
            type: 'EMBER_SPRAY',
            startTime: Date.now(),
            duration: 1000 // 1 second duration
        };
        
        // Manually add ember effect as it has custom update logic
        this.attackEffects.push(ember);
        
        // The update logic for movement and collision needs to remain tied to the effect object
         ember.intervalId = setInterval(() => { // Store intervalId on the effect
            if (ember.life <= 0) {
                clearInterval(ember.intervalId);
                 // Remove effect from list when interval clears
                 const index = this.attackEffects.indexOf(ember);
                 if (index !== -1) this.attackEffects.splice(index, 1);
                return;
            }
            
            // Move ember
            ember.x += ember.speedX;
            ember.y += ember.speedY;
            ember.life -= ember.decay;
            
            // Check for enemy collisions
            if (this.game && this.game.enemies) {
                this.game.enemies.forEach(enemy => {
                    const dx = enemy.x - ember.x;
                    const dy = enemy.y - ember.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < enemy.size + ember.radius) {
                        enemy.health -= damage;
                        ember.life = 0; // Ember is consumed on hit
                    }
                });
            }
        }, 16);
    }

    createProjectile(target, type, damage) {
        // Implementation of createProjectile method
        const speed = 6;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const projectile = {
            x: this.x,
            y: this.y,
            targetX: target.x,
            targetY: target.y,
            angle: angle,
            speedX: (dx / distance) * speed,
            speedY: (dy / distance) * speed,
            damage: damage,
            radius: 8,
            life: 1,
            type: type,
            startTime: Date.now(),
            duration: 1500 // 1.5 second duration
        };
        
         // Add trail array specifically for GEAR type
         if (type === 'GEAR') {
             projectile.trail = [];
             projectile.maxTrailLength = 20; // Increased trail length
             projectile.trailUpdateTimer = 0;
             projectile.trailUpdateInterval = 2; // Update trail every 2 frames
         }

         // Manually add projectile effect as it has custom update logic
        this.attackEffects.push(projectile);
        
        // The update logic for movement and collision needs to remain tied to the effect object
         projectile.intervalId = setInterval(() => { // Store intervalId on the effect
            if (projectile.life <= 0) {
                clearInterval(projectile.intervalId);
                 // Remove effect from list when interval clears
                 const index = this.attackEffects.indexOf(projectile);
                 if (index !== -1) this.attackEffects.splice(index, 1);
                return;
            }
            
            // Move projectile
            projectile.x += projectile.speedX;
            projectile.y += projectile.speedY;
            
            // Update trail for GEAR
            if (projectile.type === 'GEAR') {
                projectile.trailUpdateTimer++;
                if (projectile.trailUpdateTimer >= projectile.trailUpdateInterval) {
                    projectile.trailUpdateTimer = 0;
                    projectile.trail.push({ x: projectile.x, y: projectile.y });
                    if (projectile.trail.length > projectile.maxTrailLength) {
                        projectile.trail.shift(); // Remove oldest point
                    }
                }
            }
            
            // Check if projectile reached its target or went off screen
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
            
            if (distanceToTarget < 10 || 
                projectile.x < 0 || projectile.x > this.game.canvas.width ||
                projectile.y < 0 || projectile.y > this.game.canvas.height) {
                projectile.life = 0;
                // Trigger impact effect on expiration
                 if (this.game) {
                     this.game.createCollectionEffect(projectile.x, projectile.y, '#B87333', true); // Gear color, WITH shake
                 }
            }
            
            // Check for enemy collisions
            if (this.game && this.game.enemies) {
                this.game.enemies.forEach(enemy => {
                    const dx = enemy.x - projectile.x;
                    const dy = enemy.y - projectile.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < enemy.size + projectile.radius) {
                        enemy.health -= damage;
                        projectile.life = 0; // Projectile is consumed on hit
                         // Trigger impact effect on hit
                         if (this.game) {
                             this.game.createCollectionEffect(projectile.x, projectile.y, '#FFFF00', true); // Brighter Spark color (Yellow), WITH shake
                         }
                    }
                });
            }
        }, 16);
    }

    createShrapnel(x, y, damage) {
        // Implementation of createShrapnel method
        const shrapnel = {
            x: x,
            y: y,
            damage: damage,
            radius: 20,
            life: 1,
            decay: 0.05,
            type: 'SHRAPNEL_FIELD',
            startTime: Date.now(),
            duration: 700, // Extended duration for better visibility
            // Add particle system for each shrapnel
            particles: Array.from({ length: 6 }, () => ({
                x: x + (Math.random() - 0.5) * 15,
                y: y + (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 3 + Math.random() * 3
            }))
        };
        
        // Manually add shrapnel effect as it has custom update logic/lifetime check
        this.attackEffects.push(shrapnel);
        
        // Check for enemies hit by shrapnel
        if (this.game && this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - shrapnel.x;
                const dy = enemy.y - shrapnel.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size + shrapnel.radius) {
                    enemy.health -= damage;
                    // Add hit effect
                    createAttackEffect(this, 'SHRAPNEL_HIT', enemy.x, enemy.y, 0, { duration: 300 });
                    if (this.game) {
                        this.game.showDamageNumber(damage, enemy.x, enemy.y, enemy.size);
                    }
                }
            });
        }
        
        // Let shrapnel exist for visual effect, remove after duration
        setTimeout(() => {
            const index = this.attackEffects.indexOf(shrapnel);
            if (index !== -1) {
                this.attackEffects.splice(index, 1);
            }
        }, shrapnel.duration);
    }

    createLightningEffect(start, end) {
        // Implementation of createLightningEffect method
        console.log(`Creating lightning effect from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        
        const lightning = {
            startX: start.x,
            startY: start.y,
            endX: end.x,
            endY: end.y,
            type: 'CHAIN_LIGHTNING', // Ensure type is correct
            startTime: Date.now(),
            duration: 600, // Doubled duration to 0.6 seconds
            segments: [],
            // Add additional properties to make this effect distinct
            isPlayerLightning: true,
            followerId: this.id || Date.now(),
            brightness: 1.0,
            thickness: 15
        };
        
        // Create lightning path segments (zigzag)
        const segmentCount = 12; // Increased segment count for more zigzag
        const dx = (end.x - start.x) / segmentCount;
        const dy = (end.y - start.y) / segmentCount;
        
        let prevX = start.x;
        let prevY = start.y;
        
        for (let i = 1; i <= segmentCount; i++) {
            const targetX = start.x + dx * i;
            const targetY = start.y + dy * i;
            
            // Add randomness to each segment for zigzag effect
            const offsetMagnitude = 20; // Increased offset for more dramatic zigzag
            const perpendicularX = -dy;
            const perpendicularY = dx;
            const offset = (Math.random() - 0.5) * 2 * offsetMagnitude;
            
            const segmentX = targetX + perpendicularX * offset;
            const segmentY = targetY + perpendicularY * offset;
            
            lightning.segments.push({
                x1: prevX,
                y1: prevY,
                x2: segmentX,
                y2: segmentY
            });
            
            prevX = segmentX;
            prevY = segmentY;
        }
        
        // Add final segment to target
        lightning.segments.push({
            x1: prevX,
            y1: prevY,
            x2: end.x,
            y2: end.y
        });
        
        // Inspect current attackEffects before adding
        console.log(`Current attack effects before adding: ${this.attackEffects.length}`);
        console.log(`Adding lightning effect with ${lightning.segments.length} segments and type ${lightning.type}`);
        
        this.attackEffects.push(lightning);
        
        // Debug output
        console.log(`Created lightning effect with ${lightning.segments.length} segments from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        console.log(`Current attack effects after adding: ${this.attackEffects.length}`);
        
        // Add screen shake for more impact
        if (this.game) {
            this.game.triggerScreenShake(4, 5);
        }
        
        // Remove effect after duration
        setTimeout(() => {
            const index = this.attackEffects.indexOf(lightning);
            if (index !== -1) {
                this.attackEffects.splice(index, 1);
                console.log(`Removed lightning effect, remaining effects: ${this.attackEffects.length}`);
            }
        }, lightning.duration);
        
        return lightning; // Return the created effect for reference
    }

    // Add after update method in Follower class
    performSpecialAttack(enemies) {
        const currentTime = Date.now();
        
        // Reduce cooldown for AETHER_BEAM and SWORD_SWEEP to make them more visible
        let cooldown = this.specialAttackCooldown;
        if (this.steamClass.attackStyle === 'SWORD_SWEEP') {
            cooldown = 2000;
        } else if (this.steamClass.attackStyle === 'AETHER_BEAM') {
            cooldown = 1500; // Even shorter cooldown for Ethermancer's beam
        }
        
        if (currentTime - this.specialAttackTimer < cooldown) return;
        
        // Log the attack style to see if it's being correctly identified
        if (this.game && this.game.isPlaying) {
            console.log("Performing special attack: " + this.steamClass.attackStyle + " for " + this.steamClass.name);
        }
        
        switch (this.steamClass.attackStyle) {
            case 'SWORD_SWEEP':
                 // Call the global function
                 performSwordSweepAttack(this, enemies);
                break;
            case 'TIME_BURST':
                this.timeburstAttack(enemies);
                break;
            case 'CHAIN_LIGHTNING':
                this.chainLightningAttack(enemies);
                break;
            case 'PRESSURE_BLAST':
                this.pressureBlastAttack(enemies);
                break;
            case 'GEAR_THROW':
                this.gearThrowAttack(enemies);
                break;
            case 'SHRAPNEL_FIELD':
                this.shrapnelFieldAttack(enemies);
                break;
            case 'AETHER_BEAM':
                this.aetherBeamAttack(enemies);
                break;
            case 'EMBER_SPRAY':
                this.emberSprayAttack(enemies);
                break;
            case 'PISTON_PUNCH':
                this.pistonPunchAttack(enemies);
                break;
            case 'TEMPORAL_MINE':
                this.temporalMineAttack();
                break;
            case 'CORROSION_CLOUD':
                this.corrosionCloudAttack(enemies);
                break;
        }
        
        this.specialAttackTimer = currentTime;
    }

    // Add a method to check if the follower is dead
    isDead() {
        return this.health <= 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.reset(x, y, color);
    }

    reset(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    isActive() {
        return this.life > 0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawPixelated(ctx) {
        ctx.globalAlpha = this.life;
        pixelRect(ctx, this.x, this.y, PIXEL_SIZE, PIXEL_SIZE, this.color);
        ctx.globalAlpha = 1;
    }
}

class CollectionEffect {
    constructor(x, y, color) {
        this.reset(x, y, color);
    }

    reset(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = 30;
        this.life = 1;
        this.expansionRate = 2;
    }

    isActive() {
        return this.life > 0;
    }

    update() {
        this.radius += this.expansionRate;
        this.life -= 1;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawPixelated(ctx) {
        ctx.globalAlpha = this.life;
        pixelCircle(ctx, this.x, this.y, this.radius, this.color);
        ctx.globalAlpha = 1;
    }
}

class Enemy {
    constructor(x, y, type, isBoss = false, game = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.isBoss = isBoss;
        this.game = game; // Store game reference
        
        // Different properties based on type
        switch(type) {
            case 'cultist':
                this.size = isBoss ? 30 : 15;
                this.speed = isBoss ? 1.5 : 1;
                this.maxHealth = isBoss ? 10 : 2;
                this.health = this.maxHealth;
                this.color = isBoss ? '#FF0000' : '#8B0000';
                this.damage = isBoss ? 20 : 10;
                break;
            case 'deep_one':
                this.size = isBoss ? 40 : 20;
                this.speed = isBoss ? 2 : 1.5;
                this.maxHealth = isBoss ? 15 : 3;
                this.health = this.maxHealth;
                this.color = isBoss ? '#00FF00' : '#006400';
                this.damage = isBoss ? 30 : 15;
                break;
            case 'shoggoth':
                this.size = isBoss ? 50 : 25;
                this.speed = isBoss ? 1.2 : 0.8;
                this.maxHealth = isBoss ? 25 : 5;
                this.health = this.maxHealth;
                this.color = isBoss ? '#9400D3' : '#4B0082';
                this.damage = isBoss ? 40 : 20;
                break;
        }

        if (isBoss) {
            this.specialAttackTimer = 0;
            this.specialAttackInterval = 3000;
            this.phase = 1;
            this.phaseThresholds = [0.7, 0.3]; // Phase changes at 70% and 30% health
            this.phaseTransitioning = false;
            this.transitionTimer = 0;
            this.transitionDuration = 1000; // 1 second transition
            this.originalColor = this.color;
        }
    }

    update(commander) {
        // Store current health to detect damage
        const previousHealth = this.health;
        
        // Move towards commander
        const dx = commander.x - this.x;
        const dy = commander.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply environment speed modifier if game reference exists
        const speedModifier = this.game ? this.game.getEnvironmentSpeedModifier(this.x, this.y) : 1;
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * speedModifier;
            this.y += (dy / distance) * this.speed * speedModifier;
        }

        if (this.isBoss) {
            // Check for phase transitions
            if (!this.phaseTransitioning) {
                const healthPercent = this.health / this.maxHealth;
                if (this.phase === 1 && healthPercent <= this.phaseThresholds[0]) {
                    this.startPhaseTransition(2);
                } else if (this.phase === 2 && healthPercent <= this.phaseThresholds[1]) {
                    this.startPhaseTransition(3);
                }
            } else {
                this.updatePhaseTransition();
            }

            // Boss special attacks with phase modifiers
            this.specialAttackTimer += 16.67;
            if (this.specialAttackTimer >= this.specialAttackInterval) {
                this.specialAttackTimer = 0;
                this.performSpecialAttack(commander);
            }
        }

        // Check if enemy took damage and show damage number
        if (this.game && this.health < previousHealth) {
            const damageTaken = previousHealth - this.health;
            this.game.showDamageNumber(damageTaken, this.x, this.y, this.size);
        }

        // Handle Corrosion DoT
        if (this.corrosion) {
            this.corrosion.remainingDuration -= 16.67; // Approximate ms per frame

            if (Date.now() - this.corrosion.lastTickTime >= this.corrosion.tickInterval) {
                this.health -= this.corrosion.damagePerTick;
                this.corrosion.lastTickTime = Date.now();
                // Show DoT damage number
                if (this.game) {
                    this.game.showDamageNumber(this.corrosion.damagePerTick, this.x, this.y + 10, this.size, { color: '#A0522D' }); // Show below main damage, different color
                }
            }

            if (this.corrosion.remainingDuration <= 0) {
                this.corrosion = null; // Remove effect when duration ends
            }
        }
    }

    startPhaseTransition(newPhase) {
        this.phaseTransitioning = true;
        this.transitionTimer = 0;
        this.phase = newPhase;
        
        // Phase transition effects
        switch(this.type) {
            case 'cultist':
                if (newPhase === 2) {
                    this.damage *= 1.5;
                    this.speed *= 1.2;
                } else if (newPhase === 3) {
                    this.damage *= 2;
                    this.specialAttackInterval *= 0.7;
                }
                break;
            case 'deep_one':
                if (newPhase === 2) {
                    this.speed *= 1.5;
                    this.size *= 1.2;
                } else if (newPhase === 3) {
                    this.speed *= 2;
                    this.damage *= 1.5;
                }
                break;
            case 'shoggoth':
                if (newPhase === 2) {
                    this.size *= 1.3;
                    this.damage *= 1.3;
                } else if (newPhase === 3) {
                    this.size *= 1.5;
                    this.specialAttackInterval *= 0.5;
                }
                break;
        }
    }

    updatePhaseTransition() {
        this.transitionTimer += 16.67;
        
        // Transition effects
        const progress = this.transitionTimer / this.transitionDuration;
        if (progress <= 1) {
            // Pulse effect
            const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
            this.size *= pulseScale;
            
            // Color transition
            const intensity = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
            this.color = `rgba(255, ${intensity * 255}, 0, 1)`;
        } else {
            this.phaseTransitioning = false;
            this.color = this.originalColor;
        }
    }

    performSpecialAttack(commander) {
        switch(this.type) {
            case 'cultist':
                // Phase-based cultist attacks
                if (this.phase === 1) {
                    // Basic minion summoning
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI * 2 * i) / 3;
                        const newX = this.x + Math.cos(angle) * 50;
                        const newY = this.y + Math.sin(angle) * 50;
                        this.game.enemies.push(new Enemy(newX, newY, 'cultist'));
                    }
                } else if (this.phase === 2) {
                    // Enhanced minion summoning + projectiles
                    for (let i = 0; i < 4; i++) {
                        const angle = (Math.PI * 2 * i) / 4;
                        const newX = this.x + Math.cos(angle) * 50;
                        const newY = this.y + Math.sin(angle) * 50;
                        const enemy = new Enemy(newX, newY, 'cultist');
                        enemy.damage *= 1.5;
                        this.game.enemies.push(enemy);
                    }
                } else {
                    // Final phase: Circle of minions
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI * 2 * i) / 6;
                        const newX = this.x + Math.cos(angle) * 50;
                        const newY = this.y + Math.sin(angle) * 50;
                        const enemy = new Enemy(newX, newY, 'cultist');
                        enemy.damage *= 2;
                        enemy.speed *= 1.5;
                        this.game.enemies.push(enemy);
                    }
                }
                break;

            case 'deep_one':
                // Phase-based deep one attacks
                if (this.phase === 1) {
                    // Basic speed burst
                    this.speed *= 2;
                    setTimeout(() => this.speed /= 2, 1000);
                } else if (this.phase === 2) {
                    // Longer speed burst + damage boost
                    this.speed *= 2.5;
                    this.damage *= 1.5;
                    setTimeout(() => {
                        this.speed /= 2.5;
                        this.damage /= 1.5;
                    }, 1500);
                } else {
                    // Final phase: Berserk mode
                    this.speed *= 3;
                    this.damage *= 2;
                    setTimeout(() => {
                        this.speed /= 3;
                        this.damage /= 2;
                    }, 2000);
                }
                break;

            case 'shoggoth':
                // Phase-based shoggoth attacks
                const baseRadius = 100;
                if (this.phase === 1) {
                    // Basic area damage
                    this.performAreaDamage(commander, baseRadius, this.damage / 2);
                } else if (this.phase === 2) {
                    // Dual-ring area damage
                    this.performAreaDamage(commander, baseRadius, this.damage * 0.7);
                    this.performAreaDamage(commander, baseRadius * 0.5, this.damage);
                } else {
                    // Final phase: Triple-ring expanding damage
                    this.performAreaDamage(commander, baseRadius * 1.5, this.damage * 0.5);
                    this.performAreaDamage(commander, baseRadius, this.damage * 0.75);
                    this.performAreaDamage(commander, baseRadius * 0.5, this.damage);
                }
                break;
        }
    }

    performAreaDamage(commander, radius, damage) {
        if (Math.sqrt((commander.x - this.x) ** 2 + (commander.y - this.y) ** 2) < radius) {
            commander.takeDamage(damage);
            
            // Check if commander health dropped to zero or below
            if (commander.health <= 0 && this.game) {
                this.game.triggerGameOver();
                return;
            }
        }
        
        // Fix reference to game and followers
        if (this.game && this.game.followers) {
            this.game.followers.forEach(follower => {
                if (Math.sqrt((follower.x - this.x) ** 2 + (follower.y - this.y) ** 2) < radius) {
                    follower.takeDamage(damage);
                }
            });
        }
    }

    draw(ctx) {
        if (this.collected) return;
        
        // Phase transition visual effects with pixelated style
        if (this.phaseTransitioning) {
            const progress = this.transitionTimer / this.transitionDuration;
            const pulseSize = this.size * (1 + Math.sin(progress * Math.PI * 4) * 0.2);
            
            // Draw pixelated energy burst
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const x = this.x + Math.cos(angle) * pulseSize * 2;
                const y = this.y + Math.sin(angle) * pulseSize * 2;
                pixelRect(ctx, x, y, PIXEL_SIZE, PIXEL_SIZE, `rgba(255, 200, 0, ${1 - progress})`);
            }
        }

        // Draw enemy with pixelated style
        pixelCircle(ctx, this.x, this.y, this.size, this.color);
        
        // Draw mechanical parts
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const x = this.x + Math.cos(angle) * (this.size + 3);
            const y = this.y + Math.sin(angle) * (this.size + 3);
            pixelRect(ctx, x - PIXEL_SIZE/2, y - PIXEL_SIZE/2, PIXEL_SIZE, PIXEL_SIZE, '#A9A9A9');
        }

        // Boss-specific visual effects
        if (this.isBoss) {
            // Pixelated crown 
            const crownSize = this.size * 0.7;
            const crownHeight = 10;
            const crownY = this.y - this.size - 5;
            
            // Draw crown base
            for (let x = -crownSize; x <= crownSize; x += PIXEL_SIZE) {
                pixelRect(ctx, this.x + x, crownY, PIXEL_SIZE, PIXEL_SIZE, PIXEL_COLORS.GOLD);
            }
            
            // Draw crown spikes
            for (let i = -2; i <= 2; i += 2) {
                const spikeX = this.x + i * (crownSize/2);
                for (let y = 1; y <= crownHeight/PIXEL_SIZE; y++) {
                    if (Math.abs(i) === 2 && y > crownHeight/(PIXEL_SIZE*1.5)) continue;
                    pixelRect(ctx, spikeX, crownY - y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE, PIXEL_COLORS.GOLD);
                }
            }

            // Pixelated aura
            const phaseColors = ['#FFD700', '#FF4500', '#FF0000'];
            const auraColor = phaseColors[this.phase - 1];
            
            for (let i = 0; i < this.phase; i++) {
                const radius = this.size + 15 + i * 5;
                for (let j = 0; j < 16; j++) {
                    const angle = (Math.PI * 2 * j) / 16;
                    const x = this.x + Math.cos(angle) * radius;
                    const y = this.y + Math.sin(angle) * radius;
                    pixelRect(ctx, x - PIXEL_SIZE/2, y - PIXEL_SIZE/2, PIXEL_SIZE, PIXEL_SIZE, auraColor);
                }
            }
        }

        // Draw pixelated HP bar
        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        
        // HP Bar background
        pixelRect(ctx, this.x - this.size, this.y - this.size - 10, this.size * 2, PIXEL_SIZE*2, 'rgba(0, 0, 0, 0.8)');
        
        // HP Bar fill
        let healthColor;
        if (healthPercentage > 0.7) healthColor = '#00FF00'; // Green
        else if (healthPercentage > 0.3) healthColor = '#FFFF00'; // Yellow
        else healthColor = '#FF0000'; // Red
        
        pixelRect(ctx, this.x - this.size, this.y - this.size - 10, 
                 this.size * 2 * healthPercentage, PIXEL_SIZE*2, healthColor);

        // Draw Corrosion Effect visualization on enemy
        if (this.corrosion) {
            const corrosionProgress = this.corrosion.remainingDuration / 3000;
            const dripCount = 3;
            for (let i = 0; i < dripCount; i++) {
                 // Simple dripping effect using pixelRect
                 const dripYOffset = (this.size + 5 + (Date.now() / 100 + i * 50) % 15) * (1 - corrosionProgress * 0.5); // Drips slow down as effect fades
                 const dripAlpha = 0.7 * corrosionProgress;
                 const dripColor = i % 2 === 0 ? '#A0522D' : '#8B4513'; // Alternating rust colors
                 pixelRect(ctx, this.x - PIXEL_SIZE + (i - 1) * PIXEL_SIZE*2, this.y + dripYOffset, PIXEL_SIZE*2, PIXEL_SIZE*2, `rgba(${parseInt(dripColor.substring(1,3),16)}, ${parseInt(dripColor.substring(3,5),16)}, ${parseInt(dripColor.substring(5,7),16)}, ${dripAlpha})`);
            }
            // Optional: slight color tint - might be too much visual noise
            // ctx.fillStyle = `rgba(139, 69, 19, ${0.1 * corrosionProgress})`;
            // pixelCircle(ctx, this.x, this.y, this.size, `rgba(139, 69, 19, ${0.1 * corrosionProgress})`);
        }
    }
}

class SteamCore {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.collected = false;
        this.type = type;
        
        // Different types of cores
        switch(type) {
            case 'damage':
                this.color = '#FF4500'; // Orange-red
                this.bonus = 1;
                break;
            case 'range':
                this.color = '#4169E1'; // Royal blue
                this.bonus = 20;
                break;
            case 'speed':
                this.color = '#32CD32'; // Lime green
                this.bonus = 0.5;
                break;
        }
    }

    draw(ctx) {
        if (this.collected) return;
        
        // Draw core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw gear effect
        ctx.strokeStyle = '#A9A9A9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner steam effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size - 4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Add at the top of the file, after the pixel helper functions
class ObjectPool {
    constructor(createFn, maxSize = 1000) {
        this.createFn = createFn;
        this.maxSize = maxSize;
        this.objects = [];
        this.activeObjects = new Set();
    }

    get() {
        let obj;
        if (this.objects.length > 0) {
            obj = this.objects.pop();
            obj.reset(...arguments);
        } else if (this.activeObjects.size < this.maxSize) {
            obj = this.createFn(...arguments);
        } else {
            return null; // Pool is full
        }
        this.activeObjects.add(obj);
        return obj;
    }

    release(obj) {
        if (this.activeObjects.has(obj)) {
            this.activeObjects.delete(obj);
            this.objects.push(obj);
        }
    }

    update() {
        for (const obj of this.activeObjects) {
            obj.update();
            if (!obj.isActive()) {
                this.release(obj);
            }
        }
    }

    draw(ctx, cameraX = 0, cameraY = 0) {
        for (const obj of this.activeObjects) {
            // Apply camera offset for rendering
            ctx.save();
            ctx.translate(-cameraX, -cameraY);
            obj.draw(ctx);
            ctx.restore();
        }
    }
}

class Game {
    constructor() {
        console.log('Game constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Force canvas dimensions to be 4x the area (2x width, 2x height)
        this.canvas.width = 2048;  // Doubled from 1024
        this.canvas.height = 1536; // Doubled from 768
        
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        
        // Add camera system
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // Add environment elements
        this.environment = [];
        
        // Create some grass patches
        for (let i = 0; i < 20; i++) {
            const width = 100 + Math.random() * 300;
            const height = 100 + Math.random() * 300;
            const x = Math.random() * (this.canvas.width - width);
            const y = Math.random() * (this.canvas.height - height);
            this.environment.push(new EnvironmentElement(x, y, width, height, 'GRASS'));
        }
        
        // Create some bushes
        for (let i = 0; i < 10; i++) {
            const width = 50 + Math.random() * 150;
            const height = 50 + Math.random() * 150;
            const x = Math.random() * (this.canvas.width - width);
            const y = Math.random() * (this.canvas.height - height);
            this.environment.push(new EnvironmentElement(x, y, width, height, 'BUSH'));
        }
        
        // Create a few forests (that will slow movement)
        for (let i = 0; i < 3; i++) {
            const width = 200 + Math.random() * 400;
            const height = 200 + Math.random() * 400;
            const x = Math.random() * (this.canvas.width - width);
            const y = Math.random() * (this.canvas.height - height);
            this.environment.push(new EnvironmentElement(x, y, width, height, 'FOREST'));
        }
        
        this.isPlaying = false;
        this.commander = null;
        this.followers = [];
        this.engineers = [];
        this.score = 0;
        this.health = 100;
        this.engineerSpawnTimer = 0;
        this.engineerSpawnInterval = 10000; // 30% of original 3000ms rate
        this.particles = [];
        this.collectionEffects = [];
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2000; // Enemy spawn rate unchanged
        this.lastEnemySpawnTime = 0;
        this.enemySpawnDelay = 2000; // Reduced from 5000 to 2000 to allow more frequent spawns
        
        this.screenShake = {
            intensity: 0,
            duration: 0,
            offsetX: 0,
            offsetY: 0
        };
        
        this.flashEffect = {
            alpha: 0,
            color: '#DAA520'
        };
        
        this.steamCores = [];
        this.steamCoreSpawnTimer = 0;
        this.steamCoreSpawnInterval = 16667; // 30% of original 5000ms rate
        
        // Level progression properties
        this.level = 1;
        this.waveTimer = 0;
        this.waveDuration = 30000; // 30 seconds per wave
        this.enemiesDefeated = 0;
        this.enemiesRequiredForWave = 10; // Initial requirement
        this.waveCompleted = false;
        
        // Wave status display
        this.waveStatusAlpha = 0;
        this.waveStatusText = '';
        
        this.currentBoss = null;
        this.bossDefeated = false;
        
        // Enhanced UI properties
        this.uiFont = '"Courier New"';
        this.uiPanelHeight = 80;
        this.uiTextSpacing = 25;
        this.uiPanelAlpha = 0.85;
        this.gearRotation = 0;
        this.uiBorderPattern = null;
        
        this.temporalMines = []; // Add temporal mines array
        
        // Add pixelation canvas
        this.pixelCanvas = document.createElement('canvas');
        this.pixelCanvas.width = this.canvas.width;
        this.pixelCanvas.height = this.canvas.height;
        this.pixelCtx = this.pixelCanvas.getContext('2d');
        
        // Replace particle and effect arrays with pools
        this.particlePool = new ObjectPool((x, y, color) => new Particle(x, y, color), 1000);
        this.effectPool = new ObjectPool((x, y, color) => new CollectionEffect(x, y, color), 100);
        
        // Remove old arrays
        // this.particles = [];
        // this.collectionEffects = [];
        
        this.setupEventListeners();
        this.showStartScreen();
        
        console.log('Game initialization complete');
        
        // Add notification system
        this.notifications = [];
        this.notificationDuration = 3000; // 3 seconds
    }

    setupEventListeners() {
        // Don't add start button listener here, we'll add it in window.onload
        // to avoid double binding and potential conflicts
        
        window.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            
            switch(e.key.toLowerCase()) {
                case 'w':
                    this.commander.direction = { x: 0, y: -1 };
                    break;
                case 's':
                    this.commander.direction = { x: 0, y: 1 };
                    break;
                case 'a':
                    this.commander.direction = { x: -1, y: 0 };
                    break;
                case 'd':
                    this.commander.direction = { x: 1, y: 0 };
                    break;
            }
        });
    }

    startGame() {
        console.log('Starting game...');
        this.isPlaying = true;
        this.score = 0;
        this.health = 100;
        
        // Initialize commander and pass game reference
        // Use exact center calculation to avoid any rounding issues
        const centerX = Math.floor(this.canvas.width / 2);
        const centerY = Math.floor(this.canvas.height / 2);
        this.commander = new Commander(centerX, centerY, this);
        console.log('Commander created at:', centerX, centerY);
        
        // Immediately update camera to center on commander
        this.updateCamera();
        
        this.followers = [];
        this.engineers = [];
        this.enemies = [];
        this.engineerSpawnTimer = 0;
        this.enemySpawnTimer = 0;
        this.lastEnemySpawnTime = 0;
        this.enemySpawnDelay = 2000; // Reset spawn delay
        this.steamCores = [];
        this.steamCoreSpawnTimer = 0;
        
        // Reset level properties
        this.level = 1;
        this.waveTimer = 0;
        this.enemiesDefeated = 0;
        this.enemiesRequiredForWave = 10; // Initial requirement: 10 enemies in first wave
        this.waveCompleted = false;
        this.waveStatusAlpha = 1;
        this.waveStatusText = 'Wave 1 Started!';
        
        // Hide the start screen
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            console.log('Hiding start screen');
            startScreen.style.display = 'none';
        } else {
            console.error('Start screen element not found!');
        }
        
        // Start the game loop
        console.log('Starting game loop');
        this.gameLoop();
    }

    showStartScreen() {
        console.log('Showing start screen');
        
        // Initialize border pattern if needed
        if (!this.uiBorderPattern && this.ctx) {
            this.uiBorderPattern = this.createBorderPattern();
        }
        
        // Make sure the start screen is visible
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            console.log('Start screen set to display: flex');
        } else {
            console.error('Start screen element not found!');
        }
    }

    spawnEngineer() {
        const margin = 40; // Minimum distance from edges
        const minDistanceBetweenEngineers = 100; // Minimum distance between engineers
        const maxAttempts = 50; // Maximum attempts to find a valid spawn position
        
        let attempts = 0;
        let validPosition = false;
        let x, y;
        
        while (!validPosition && attempts < maxAttempts) {
            // Generate random position with margin
            x = Math.random() * (this.canvas.width - 2 * margin) + margin;
            y = Math.random() * (this.canvas.height - 2 * margin) + margin;
            
            // Check distance from other engineers
            validPosition = true;
            for (const engineer of this.engineers) {
                if (!engineer.collected) {
                    const dx = x - engineer.x;
                    const dy = y - engineer.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistanceBetweenEngineers) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Check distance from commander and followers
            if (validPosition && this.commander) {
                const dx = x - this.commander.x;
                const dy = y - this.commander.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistanceBetweenEngineers) {
                    validPosition = false;
                }
            }
            
            if (validPosition) {
                for (const follower of this.followers) {
                    const dx = x - follower.x;
                    const dy = y - follower.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistanceBetweenEngineers) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // Only spawn if we found a valid position
        if (validPosition) {
            this.engineers.push(new Engineer(x, y));
            
            // Add spawn notification
            this.addNotification(
                `${this.engineers[this.engineers.length - 1].steamClass.name} Engineer Appeared!`,
                this.engineers[this.engineers.length - 1].color,
                x,
                y - 30
            );
        }
    }

    spawnEnemy() {
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawnTime < this.enemySpawnDelay) return;

        // Calculate how many enemies we can spawn at once based on level
        const spawnCount = Math.min(Math.floor(this.level), 5); // Cap at 5 enemies per spawn to prevent overwhelming
        
        for (let i = 0; i < spawnCount; i++) {
            // Adjust enemy probabilities based on level
            const rand = Math.random();
            let type;
            if (this.level <= 2) {
                type = rand < 0.7 ? 'cultist' : rand < 0.9 ? 'deep_one' : 'shoggoth';
            } else if (this.level <= 5) {
                type = rand < 0.4 ? 'cultist' : rand < 0.8 ? 'deep_one' : 'shoggoth';
            } else {
                type = rand < 0.3 ? 'cultist' : rand < 0.6 ? 'deep_one' : 'shoggoth';
            }

            // Enhanced spawn position logic
            const spawnPatterns = [
                // Random edge spawn
                () => {
                    if (Math.random() < 0.5) {
                        return {
                            x: Math.random() < 0.5 ? -20 : this.canvas.width + 20,
                            y: Math.random() * this.canvas.height
                        };
                    } else {
                        return {
                            x: Math.random() * this.canvas.width,
                            y: Math.random() < 0.5 ? -20 : this.canvas.height + 20
                        };
                    }
                },
                // Corner spawn
                () => {
                    const corner = Math.floor(Math.random() * 4);
                    return {
                        x: corner % 2 === 0 ? -20 : this.canvas.width + 20,
                        y: corner < 2 ? -20 : this.canvas.height + 20
                    };
                },
                // Group spawn (multiple enemies in formation)
                () => {
                    const baseX = Math.random() < 0.5 ? -20 : this.canvas.width + 20;
                    const baseY = Math.random() * this.canvas.height;
                    // Additional enemies will be spawned in formation in the update loop
                    this.pendingGroupSpawn = {
                        count: Math.floor(2 + Math.random() * 3),
                        baseX,
                        baseY,
                        type,
                        spacing: 40
                    };
                    return { x: baseX, y: baseY };
                }
            ];

            // Choose spawn pattern based on level and randomness
            let spawnPos;
            if (this.level >= 5 && Math.random() < 0.3) {
                // Higher levels have chance for group spawns
                spawnPos = spawnPatterns[2]();
            } else if (this.level >= 3 && Math.random() < 0.4) {
                // Mid levels have chance for corner spawns
                spawnPos = spawnPatterns[1]();
            } else {
                // Default to random edge spawn
                spawnPos = spawnPatterns[0]();
            }

            const enemy = new Enemy(spawnPos.x, spawnPos.y, type, false, this);
            
            // Scale enemy stats with level
            const levelMultiplier = 1 + (this.level - 1) * 0.2;
            enemy.maxHealth *= levelMultiplier;
            enemy.health = enemy.maxHealth;
            enemy.damage *= 1 + (this.level - 1) * 0.1;
            enemy.speed *= 1 + (this.level - 1) * 0.05;

            this.enemies.push(enemy);
        }
        
        this.lastEnemySpawnTime = currentTime;
        
        // Reduce the spawn delay based on level to increase spawn frequency
        this.enemySpawnDelay = Math.max(1000, 5000 - (this.level * 500));
    }

    spawnSteamCore() {
        const margin = 40;
        const minDistanceBetweenCores = 100;
        const maxAttempts = 50;
        
        let attempts = 0;
        let validPosition = false;
        let x, y;
        
        while (!validPosition && attempts < maxAttempts) {
            x = Math.random() * (this.canvas.width - 2 * margin) + margin;
            y = Math.random() * (this.canvas.height - 2 * margin) + margin;
            
            validPosition = true;
            
            // Check distance from other steam cores
            for (const core of this.steamCores) {
                const dx = x - core.x;
                const dy = y - core.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistanceBetweenCores) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check distance from engineers
            if (validPosition) {
                for (const engineer of this.engineers) {
                    if (!engineer.collected) {
                        const dx = x - engineer.x;
                        const dy = y - engineer.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < minDistanceBetweenCores) {
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            
            // Check distance from commander and followers
            if (validPosition && this.commander) {
                const dx = x - this.commander.x;
                const dy = y - this.commander.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistanceBetweenCores) {
                    validPosition = false;
                }
            }
            
            if (validPosition) {
                for (const follower of this.followers) {
                    const dx = x - follower.x;
                    const dy = y - follower.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistanceBetweenCores) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        if (validPosition) {
            const types = ['damage', 'range', 'speed'];
            const type = types[Math.floor(Math.random() * types.length)];
            const core = new SteamCore(x, y, type);
            this.steamCores.push(core);
            
            // Add spawn notification
            const typeColors = {
                damage: '#FF4500',
                range: '#4169E1',
                speed: '#32CD32'
            };
            this.addNotification(
                `${type.charAt(0).toUpperCase() + type.slice(1)} Core Appeared!`,
                typeColors[type],
                x,
                y - 30
            );
        }
    }

    createCollectionEffect(x, y, color, withShake = true) {
        // Create particles
        for (let i = 0; i < 20; i++) {
            this.particlePool.get(x, y, color);
        }
        
        // Create collection effect
        this.effectPool.get(x, y, color);
        
        // Optionally trigger screen shake
        if (withShake) {
            this.triggerScreenShake(5, 10);
            this.flashEffect.alpha = 0.3;
            this.flashEffect.color = color;
        }
    }

    // Create a dedicated method for collection effects without screen shake
    createEngineerCollectionEffect(x, y, color) {
        // Create particles
        for (let i = 0; i < 20; i++) {
            this.particlePool.get(x, y, color);
        }
        
        // Create collection effect
        this.effectPool.get(x, y, color);
        
        // No screen shake or flash effect for engineer collection
    }

    // Update the checkEngineerCollision method to use the new function
    checkEngineerCollision() {
        this.engineers.forEach((engineer, index) => {
            if (engineer.collected) return;
            
            const dx = this.commander.x - engineer.x;
            const dy = this.commander.y - engineer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.commander.size + engineer.size) {
                // Check if team is at max size
                if (this.followers.length >= 12) {
                    // Create a different effect to show rejection
                    this.createCollectionEffect(engineer.x, engineer.y, '#FF0000', false);
                    return;
                }

                engineer.collected = true;
                this.score += 100;
                
                // Use the new collection effect without screen shake
                this.createEngineerCollectionEffect(engineer.x, engineer.y, engineer.color);
                
                // Find class key by comparing class properties safely
                let classKey = null;
                for (const key in STEAM_CLASSES) {
                    if (STEAM_CLASSES[key].name === engineer.steamClass.name) {
                        classKey = key;
                        break;
                    }
                }
                
                // Add new follower with proper chain linking and assigned class
                if (this.followers.length === 0) {
                    // First follower follows the commander
                    const follower = new Follower(
                        this.commander.x - this.commander.direction.x * 30,
                        this.commander.y - this.commander.direction.y * 30,
                        this.commander,
                        this
                    );
                    if (classKey) {
                        follower.assignClass(classKey);
                    }
                    this.followers.push(follower);
                } else {
                    // New follower follows the last follower
                    const lastFollower = this.followers[this.followers.length - 1];
                    const newX = lastFollower.x;
                    const newY = lastFollower.y;
                    const follower = new Follower(newX, newY, lastFollower, this);
                    if (classKey) {
                        follower.assignClass(classKey);
                    }
                    this.followers.push(follower);
                }
                
                // Remove collected engineer
                this.engineers.splice(index, 1);
            }
        });
    }

    checkEnemyCollision() {
        let hitDetected = false;
        
        // Check collision with commander
        this.enemies.forEach(enemy => {
            const dx = this.commander.x - enemy.x;
            const dy = this.commander.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.commander.size + enemy.size) {
                hitDetected = true;
                this.commander.takeDamage(enemy.damage);
                
                // Check if commander is defeated
                if (this.commander.health <= 0) {
                    this.triggerGameOver();
                    return;
                }
                
                // Trigger screen shake for commander taking damage
                this.triggerScreenShake(8, 15);
                
                // Apply knockback to enemy
                const knockbackDistance = 30;
                const knockbackDirection = { x: dx / distance, y: dy / distance };
                enemy.x -= knockbackDirection.x * knockbackDistance;
                enemy.y -= knockbackDirection.y * knockbackDistance;
            }
        });
        
        // If game over was triggered, don't process further collisions
        if (!this.isPlaying) {
            return false;
        }
        
        // Check collision with followers - note we don't need to remove them here
        // as that's handled in the main update loop now
        this.followers.forEach((follower) => {
            this.enemies.forEach(enemy => {
                const dx = follower.x - enemy.x;
                const dy = follower.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < follower.size + enemy.size) {
                    hitDetected = true;
                    
                    // takeDamage now returns whether the follower died
                    follower.takeDamage(enemy.damage);
                    
                    // Apply knockback to enemy
                    const knockbackDistance = 20;
                    const knockbackDirection = { x: dx / distance, y: dy / distance };
                    enemy.x -= knockbackDirection.x * knockbackDistance;
                    enemy.y -= knockbackDirection.y * knockbackDistance;
                }
            });
        });
        
        return hitDetected;
    }

    checkSteamCoreCollision() {
        this.steamCores.forEach((core, index) => {
            if (core.collected) return;
            
            const dx = this.commander.x - core.x;
            const dy = this.commander.y - core.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.commander.size + core.size) {
                core.collected = true;
                
                // Get the attribute name and bonus value for the notification
                let attributeName = '';
                let bonusValue = '';
                
                switch(core.type) {
                    case 'damage':
                        attributeName = 'Damage';
                        bonusValue = `+${core.bonus}`;
                        break;
                    case 'range':
                        attributeName = 'Attack Range';
                        bonusValue = `+${core.bonus}`;
                        break;
                    case 'speed':
                        attributeName = 'Speed';
                        bonusValue = `+${core.bonus}`;
                        break;
                }
                
                // Apply upgrade to all followers
                this.followers.forEach(follower => {
                    switch(core.type) {
                        case 'damage':
                            follower.attackDamage += core.bonus;
                            follower.upgrades.damage++;
                            break;
                        case 'range':
                            follower.attackRange += core.bonus;
                            follower.upgrades.range++;
                            break;
                        case 'speed':
                            follower.speed += core.bonus;
                            follower.upgrades.speed++;
                            break;
                    }
                });
                
                // Create collection effect with core color (with screen shake)
                this.createCollectionEffect(core.x, core.y, core.color, true);
                
                // Add attribute upgrade notification at pickup location
                this.addNotification(
                    `${attributeName} ${bonusValue}!`,
                    core.color,
                    core.x,
                    core.y - 40
                );
                
                // Add more visible team-wide upgrade notification directly above the commander
                this.addNotification(
                    `TEAM ${attributeName.toUpperCase()} INCREASED!`,
                    core.color,
                    this.commander.x,
                    this.commander.y - 40,
                    {
                        fontSize: 24,
                        align: 'center',
                        duration: 3000,
                        isUpgrade: true
                    }
                );
                
                // Remove collected core
                this.steamCores.splice(index, 1);
            }
        });
    }

    gameOver() {
        this.isPlaying = false;
        
        // Create a game over overlay in the start screen
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            // Clear previous content
            startScreen.innerHTML = '';
            
            // Create game over content
            const gameOverDiv = document.createElement('div');
            gameOverDiv.style.textAlign = 'center';
            gameOverDiv.style.color = '#FFD700';
            gameOverDiv.style.fontFamily = '"Courier New", monospace';
            
            // Add game over message
            const gameOverTitle = document.createElement('h1');
            gameOverTitle.textContent = 'GAME OVER';
            gameOverTitle.style.fontSize = '48px';
            gameOverTitle.style.marginBottom = '20px';
            gameOverTitle.style.textShadow = '3px 3px #8B0000';
            gameOverDiv.appendChild(gameOverTitle);
            
            // Add final score
            const scoreText = document.createElement('h2');
            scoreText.textContent = `Final Score: ${this.finalScore || this.score}`;
            scoreText.style.fontSize = '32px';
            scoreText.style.marginBottom = '10px';
            gameOverDiv.appendChild(scoreText);
            
            // Add level reached
            const levelText = document.createElement('h3');
            levelText.textContent = `Level Reached: ${this.finalLevel || this.level}`;
            levelText.style.fontSize = '24px';
            levelText.style.marginBottom = '30px';
            gameOverDiv.appendChild(levelText);
            
            // Add restart button
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart Game';
            restartButton.id = 'startButton';
            restartButton.style.fontSize = '24px';
            restartButton.style.padding = '15px 30px';
            restartButton.style.backgroundColor = '#8B0000';
            restartButton.style.color = '#FFD700';
            restartButton.style.border = '3px solid #FFD700';
            restartButton.style.borderRadius = '10px';
            restartButton.style.cursor = 'pointer';
            restartButton.onclick = () => this.startGame();
            gameOverDiv.appendChild(restartButton);
            
            startScreen.appendChild(gameOverDiv);
            startScreen.style.display = 'flex';
        } else {
            console.error('Start screen element not found!');
        }
    }

    spawnBoss() {
        const spawnPositions = [
            { x: this.canvas.width / 2, y: -50 },
            { x: this.canvas.width / 2, y: this.canvas.height + 50 },
            { x: -50, y: this.canvas.height / 2 },
            { x: this.canvas.width + 50, y: this.canvas.height / 2 }
        ];
        
        const spawnPos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
        const types = ['cultist', 'deep_one', 'shoggoth'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.currentBoss = new Enemy(spawnPos.x, spawnPos.y, type, true, this);
        this.enemies.push(this.currentBoss);
        
        // Announce boss spawn
        this.waveStatusAlpha = 1;
        this.waveStatusText = `BOSS: ${type.toUpperCase()} COMMANDER`;
    }

    checkWaveProgress() {
        if (this.waveCompleted) return;

        this.waveTimer += 16.67;

        // Spawn boss when 75% of required enemies are defeated
        if (!this.currentBoss && !this.bossDefeated && this.enemiesDefeated >= this.enemiesRequiredForWave * 0.75) {
            this.spawnBoss();
        }

        // Check if wave is complete (all required enemies + boss defeated)
        if (this.enemiesDefeated >= this.enemiesRequiredForWave && this.bossDefeated) {
            this.completeWave();
        }

        // Update wave status display
        if (this.waveStatusAlpha > 0) {
            this.waveStatusAlpha -= 0.005;
        }
    }

    completeWave() {
        this.waveCompleted = true;
        this.level++;
        
        // Reset boss state
        this.currentBoss = null;
        this.bossDefeated = false;
        
        // Increase difficulty
        this.enemiesRequiredForWave = this.level === 2 ? 20 : this.enemiesRequiredForWave * 2; // Double enemies each wave
        this.enemySpawnInterval = Math.max(500, 2000 - (this.level - 1) * 200); // Faster spawns
        
        // Reset for next wave
        this.waveTimer = 0;
        this.enemiesDefeated = 0;
        this.waveCompleted = false;
        
        // Wave completion rewards
        this.score += this.level * 500; // Bonus points
        
        // Heal all units partially
        this.commander.health = Math.min(this.commander.maxHealth, this.commander.health + 20);
        this.followers.forEach(follower => {
            follower.health = Math.min(follower.maxHealth, follower.health + 10);
        });
        
        // Display wave completion
        this.waveStatusAlpha = 1;
        this.waveStatusText = `Wave ${this.level} Started!`;
        
        // Create celebration effect
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const distance = 100;
            const x = this.canvas.width / 2 + Math.cos(angle) * distance;
            const y = this.canvas.height / 2 + Math.sin(angle) * distance;
            this.createCollectionEffect(x, y, '#FFD700'); // Golden celebration
        }
    }

    update() {
        if (!this.isPlaying) return;
        
        this.commander.update();
        
        // Update camera to follow commander
        this.updateCamera();
        
        // Check if commander's health has dropped to zero or below
        if (this.commander.health <= 0) {
            this.triggerGameOver();
            return;
        }
        
        // FOLLOWER DEATH HANDLING: Check for dead followers and remove them
        // This is the main place where followers are removed from the game when they die
        for (let i = this.followers.length - 1; i >= 0; i--) {
            const follower = this.followers[i];
            
            // Check if the follower is dead
            if (follower.isDead()) {
                // Create death effect at follower position
                this.createCollectionEffect(follower.x, follower.y, follower.color);
                
                // Add death notification
                this.addNotification(
                    `${follower.steamClass.name} lost!`,
                    follower.color,
                    follower.x,
                    follower.y - 30
                );
                
                // Add small score penalty
                this.score = Math.max(0, this.score - 50);
                
                // Remove the follower
                this.followers.splice(i, 1);
                
                // If there are followers after this one, update their target to maintain the chain
                if (i < this.followers.length) {
                    // If it was the first follower, it should now follow the commander
                    if (i === 0) {
                        this.followers[0].target = this.commander;
                    } else {
                        // Otherwise, it should follow the previous follower
                        this.followers[i].target = this.followers[i-1];
                    }
                }
            }
        }
        
        // Update remaining followers with enemies for targeting
        this.followers.forEach(follower => follower.update(this.enemies));
        
        // Handle pending group spawns
        if (this.pendingGroupSpawn) {
            if (this.pendingGroupSpawn.count > 0) {
                const offset = (this.pendingGroupSpawn.count - 1) * this.pendingGroupSpawn.spacing / 2;
                const spawnY = this.pendingGroupSpawn.baseY - offset + 
                              (this.pendingGroupSpawn.spacing * (this.pendingGroupSpawn.count - 1));
                
                const enemy = new Enemy(
                    this.pendingGroupSpawn.baseX,
                    spawnY,
                    this.pendingGroupSpawn.type,
                    false,
                    this
                );
                
                // Scale enemy stats with level
                const levelMultiplier = 1 + (this.level - 1) * 0.2;
                enemy.maxHealth *= levelMultiplier;
                enemy.health = enemy.maxHealth;
                enemy.damage *= 1 + (this.level - 1) * 0.1;
                enemy.speed *= 1 + (this.level - 1) * 0.05;
                
                this.enemies.push(enemy);
                this.pendingGroupSpawn.count--;
            } else {
                this.pendingGroupSpawn = null;
            }
        }
        
        // Update enemies - use backwards iteration for safe removal
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.commander);
            
            if (enemy.health <= 0) {
                // Store if this was a boss before removing it
                const wasBoss = enemy === this.currentBoss;
                
                this.createCollectionEffect(enemy.x, enemy.y, enemy.color);
                
                // Add score based on enemy type and level
                const levelMultiplier = 1 + (this.level - 1) * 0.2;
                switch(enemy.type) {
                    case 'cultist': this.score += Math.floor(50 * levelMultiplier); break;
                    case 'deep_one': this.score += Math.floor(100 * levelMultiplier); break;
                    case 'shoggoth': this.score += Math.floor(200 * levelMultiplier); break;
                }
                
                this.enemiesDefeated++;
                this.enemies.splice(i, 1);
                
                // Handle boss defeat separately after it's removed from enemies array
                if (wasBoss) {
                    this.handleBossDefeat(enemy.x, enemy.y);
                }
            }
        }
        
        // Keep commander within bounds
        this.commander.x = Math.max(this.commander.size, Math.min(this.canvas.width - this.commander.size, this.commander.x));
        this.commander.y = Math.max(this.commander.size, Math.min(this.canvas.height - this.commander.size, this.commander.y));
        
        // Spawn engineers
        this.engineerSpawnTimer += 16.67;
        if (this.engineerSpawnTimer >= this.engineerSpawnInterval) {
            this.engineerSpawnTimer = 0;
            this.spawnEngineer();
        }

        // Spawn enemies
        this.enemySpawnTimer += 16.67;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            this.spawnEnemy();
        }
        
        // Spawn steam cores
        this.steamCoreSpawnTimer += 16.67;
        if (this.steamCoreSpawnTimer >= this.steamCoreSpawnInterval) {
            this.steamCoreSpawnTimer = 0;
            this.spawnSteamCore();
        }
        
        // Check collisions
        this.checkEngineerCollision();
        this.checkEnemyCollision();
        this.checkSteamCoreCollision();

        // Update particles and effects using pools
        this.particlePool.update();
        this.effectPool.update();

        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration--;
            this.screenShake.intensity *= 0.9;
        } else {
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
        }

        // Update flash effect
        if (this.flashEffect.alpha > 0) {
            this.flashEffect.alpha *= 0.9;
        }

        // Update wave progress
        this.checkWaveProgress();

        // Update and check temporal mines
        for (let i = this.temporalMines.length - 1; i >= 0; i--) {
            const mine = this.temporalMines[i];
            if (Date.now() >= mine.detonationTime) {
                // Create explosion effect with screen shake
                this.createCollectionEffect(mine.x, mine.y, '#CFB53B', true);
                
                // Damage nearby enemies
                this.enemies.forEach(enemy => {
                    const dx = enemy.x - mine.x;
                    const dy = enemy.y - mine.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= mine.radius) {
                        enemy.health -= mine.damage * (1 - distance / mine.radius);
                    }
                });
                
                // Remove the mine
                this.temporalMines.splice(i, 1);
            }
        }
        
        // Update notifications
        this.updateNotifications();
    }
    
    // New method to handle boss defeat
    handleBossDefeat(x, y) {
        this.bossDefeated = true;
        
        // Boss defeat rewards
        this.score += this.level * 1000;
        this.commander.health = Math.min(this.commander.maxHealth, this.commander.health + 30);
        this.followers.forEach(follower => {
            follower.health = Math.min(follower.maxHealth, follower.health + 20);
        });
        
        // Boss defeat celebration with screen shake
        this.waveStatusAlpha = 1;
        this.waveStatusText = "BOSS DEFEATED!";
        this.triggerScreenShake(10, 20); // More intense shake for boss defeat
        
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const distance = 150;
            const posX = x + Math.cos(angle) * distance;
            const posY = y + Math.sin(angle) * distance;
            // No additional screen shake for each particle
            this.createCollectionEffect(posX, posY, '#FFD700', false);
        }
        
        // Reset current boss reference
        this.currentBoss = null;
    }

    draw() {
        // Clear both canvases
        this.pixelCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake and camera transformation
        this.pixelCtx.save();
        this.pixelCtx.translate(
            this.screenShake.offsetX - this.camera.x,
            this.screenShake.offsetY - this.camera.y
        );
        
        // Draw grid with pixelated style
        this.drawPixelGrid();
        
        if (this.isPlaying) {
            // Draw environment elements
            this.environment.forEach(element => element.draw(this.pixelCtx));
            
            // Draw particles and effects using the pixelCtx which already has camera transform
            this.particlePool.draw(this.pixelCtx);
            this.effectPool.draw(this.pixelCtx);
            
            // Draw engineers
            this.engineers.forEach(engineer => engineer.draw(this.pixelCtx));
            
            // Draw enemies
            this.enemies.forEach(enemy => enemy.draw(this.pixelCtx));
            
            // Draw followers
            this.followers.forEach(follower => follower.draw(this.pixelCtx));
            
            // Draw steam cores
            this.steamCores.forEach(core => core.draw(this.pixelCtx));
            
            // Draw commander
            this.commander.draw(this.pixelCtx);
            
            // Draw all world-space notifications including damage numbers
            this.notifications.forEach(notification => {
                if (notification.isDamage) {
                    this.pixelCtx.globalAlpha = notification.alpha;
                    this.pixelCtx.fillStyle = notification.color;
                    this.pixelCtx.font = `bold ${notification.fontSize}px 'Press Start 2P'`;
                    this.pixelCtx.textAlign = notification.align;
                    this.pixelCtx.fillText(
                        notification.text,
                        notification.x,
                        notification.y + notification.yOffset
                    );
                    this.pixelCtx.globalAlpha = 1;
                }
            });
            
            // Draw temporal mines with pixel style
            this.temporalMines.forEach(mine => {
                this.drawPixelMine(mine);
            });
        }
        
        // Restore canvas state after drawing all world-space objects
        this.pixelCtx.restore();
        
        // Now draw UI elements that should be fixed on screen (not affected by camera)
        if (this.isPlaying) {
            // Draw wave status with pixel font style - fixed position on screen
            if (this.waveStatusAlpha > 0) {
                this.drawPixelText(this.waveStatusText, this.canvas.width / 2, this.canvas.height / 3, 30, 
                    `rgba(255, 255, 255, ${this.waveStatusAlpha})`, 'center');
                
                // Draw progress
                const progressText = `Enemies Defeated: ${this.enemiesDefeated}/${this.enemiesRequiredForWave}`;
                this.drawPixelText(progressText, this.canvas.width / 2, this.canvas.height / 3 + 40, 20, 
                    `rgba(255, 255, 255, ${this.waveStatusAlpha})`, 'center');
            }

            // Draw pixelated UI Panel - fixed position on screen
            this.drawPixelUIPanel();
            
            // Draw UI (non-damage) notifications
            this.notifications.forEach(notification => {
                if (!notification.isDamage) {
                    this.pixelCtx.globalAlpha = notification.alpha;
                    this.pixelCtx.fillStyle = notification.color;
                    this.pixelCtx.font = `${notification.fontSize}px 'Press Start 2P'`;
                    this.pixelCtx.textAlign = notification.align;
                    this.pixelCtx.fillText(
                        notification.text,
                        notification.x,
                        notification.y + notification.yOffset
                    );
                    this.pixelCtx.globalAlpha = 1;
                }
            });
        }
        
        // Draw the pixelated canvas onto the main canvas with nearest-neighbor interpolation
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.pixelCanvas, 0, 0, this.canvas.width, this.canvas.height);

        // Update UI with commander's health instead of game's health
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('healthValue').textContent = Math.ceil(this.commander.health);
    }
    
    drawPixelGrid() {
        // Calculate grid offset based on camera position
        const offsetX = this.camera.x % (PIXEL_SIZE * 10);
        const offsetY = this.camera.y % (PIXEL_SIZE * 10);
        
        // Draw a more subtle pixel grid
        this.pixelCtx.fillStyle = '#2a2a2a';
        
        // Draw grid starting from camera-adjusted position
        for (let x = -offsetX; x < this.canvas.width; x += PIXEL_SIZE * 10) {
            for (let y = -offsetY; y < this.canvas.height; y += PIXEL_SIZE * 10) {
                pixelRect(this.pixelCtx, x, y, PIXEL_SIZE, PIXEL_SIZE, '#3a3a3a');
            }
        }
    }
    
    drawPixelText(text, x, y, size, color, align = 'left') {
        this.pixelCtx.font = `${size}px 'Press Start 2P', 'Courier New'`;
        this.pixelCtx.textAlign = align;
        this.pixelCtx.fillStyle = color;
        
        // Draw text
        this.pixelCtx.fillText(text, x, y);
    }
    
    drawPixelUIPanel() {
        const ctx = this.pixelCtx;
        const panelHeight = this.uiPanelHeight;
        const padding = 20;
        
        // Draw panel background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, panelHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(20, 20, 20, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, panelHeight);
        
        // Draw border pattern
        if (this.uiBorderPattern) {
            ctx.fillStyle = this.uiBorderPattern;
            ctx.fillRect(0, panelHeight - 5, this.canvas.width, 5);
        }
        
        // Draw stats with pixel style - Repositioned for clarity
        const textY = panelHeight / 2 + 8; // Adjust Y position for better vertical centering with font
        const sectionWidth = this.canvas.width / 3;
        const centerPadding = 50; // Padding around center elements
        const sidePadding = padding + 50; // Increase padding on the sides

        // Left Section (Level & Score)
        ctx.textAlign = 'left';
        this.drawPixelText(`Level ${this.level}`, sidePadding, textY, 16, '#FFD700');
        this.drawPixelText(`Score: ${this.score}`, sidePadding + 150, textY, 16, '#FFD700'); // Add more space after Level

        // Center Section (Wave Progress & Team Size & Avg Stats)
        ctx.textAlign = 'center';
        const waveText = `Wave Progress: ${this.enemiesDefeated}/${this.enemiesRequiredForWave}`;
        this.drawPixelText(waveText, this.canvas.width / 2 - centerPadding, textY, 16, '#FFD700', 'right'); // Align right before center

        const teamSizeColor = this.followers.length >= 12 ? '#FF0000' : '#FFD700';
        const teamText = `Team: ${this.followers.length}/12`;
        this.drawPixelText(teamText, this.canvas.width / 2 + centerPadding, textY, 16, teamSizeColor, 'left'); // Align left after center

        // Calculate Average Team Stats
        let avgDamage = 0;
        let avgRange = 0;
        let avgSpeed = 0;
        if (this.followers.length > 0) {
            let totalDamage = 0;
            let totalRange = 0;
            let totalSpeed = 0;
            this.followers.forEach(f => {
                totalDamage += f.attackDamage;
                totalRange += f.attackRange;
                totalSpeed += f.speed;
            });
            avgDamage = totalDamage / this.followers.length;
            avgRange = totalRange / this.followers.length;
            avgSpeed = totalSpeed / this.followers.length;
        }

        // Display Average Team Stats (below wave/team text or adjust layout)
        const statsY = textY + 25; // Position stats below main line
        const statsPadding = 150; // Spacing for stats
        this.drawPixelText(`Avg DMG: ${avgDamage.toFixed(1)}`, this.canvas.width / 2 - statsPadding, statsY, 12, '#FFA500', 'center'); // Orange for damage
        this.drawPixelText(`Avg RNG: ${avgRange.toFixed(0)}`, this.canvas.width / 2, statsY, 12, '#ADD8E6', 'center');    // Light blue for range
        this.drawPixelText(`Avg SPD: ${avgSpeed.toFixed(1)}`, this.canvas.width / 2 + statsPadding, statsY, 12, '#90EE90', 'center'); // Light green for speed

        // Right Section (Boss HP & Time)
        ctx.textAlign = 'right';
        const timeLeft = Math.max(0, Math.ceil((this.waveDuration - this.waveTimer) / 1000));
        let timeX = this.canvas.width - sidePadding;
        this.drawPixelText(`Time: ${timeLeft}s`, timeX, textY, 16, '#FFD700');

        // Draw Boss HP to the left of Time if the boss exists
        if (this.currentBoss) {
            const bossHealth = Math.max(0, Math.ceil(this.currentBoss.health));
            const bossMaxHealth = this.currentBoss.maxHealth;
            let bossText = `Boss HP: ${bossHealth}/${bossMaxHealth}`;
            // Measure text to position correctly before Time
            const timeTextWidth = ctx.measureText(`Time: ${timeLeft}s`).width;
            const bossHpX = this.canvas.width - sidePadding - timeTextWidth - 50; // Position left of time with padding

            this.drawPixelText(bossText, bossHpX, textY, 16, '#FF0000');
        }
        
        // Draw decorative gears
        this.drawPixelGears();
    }
    
    drawPixelGears() {
        // Update gear rotation
        this.gearRotation += 0.01;
        
        // Draw simplified pixel gears
        const gearPositions = [
            { x: 40, y: 40, size: 16 },
            { x: this.canvas.width - 40, y: 40, size: 16 },
            { x: this.canvas.width / 2, y: 15, size: 12 }
        ];

        gearPositions.forEach(gear => {
            // Draw simplified pixel gear
            pixelCircle(this.pixelCtx, gear.x, gear.y, gear.size - PIXEL_SIZE*2, PIXEL_COLORS.GOLD);
            
            // Gear teeth with pixel art style
            const teethCount = 8;
            for (let i = 0; i < teethCount; i++) {
                const angle = this.gearRotation + (Math.PI * 2 * i) / teethCount;
                const toothX = gear.x + Math.cos(angle) * gear.size;
                const toothY = gear.y + Math.sin(angle) * gear.size;
                pixelRect(this.pixelCtx, toothX - PIXEL_SIZE/2, toothY - PIXEL_SIZE/2, 
                          PIXEL_SIZE, PIXEL_SIZE, PIXEL_COLORS.GOLD);
            }
            
            // Center rivet
            pixelCircle(this.pixelCtx, gear.x, gear.y, gear.size/4, PIXEL_COLORS.BRASS);
        });
    }
    
    drawPixelMine(mine) {
        const timeLeft = (mine.detonationTime - Date.now()) / 1000;
        const pulseSize = mine.radius * 0.2;
        
        // Draw mine outline with pixelated style
        for (let i = 0; i < 8; i++) {
            const angle = this.gearRotation + (Math.PI * 2 * i) / 8;
            const x = mine.x + Math.cos(angle) * pulseSize;
            const y = mine.y + Math.sin(angle) * pulseSize;
            pixelRect(this.pixelCtx, x - PIXEL_SIZE/2, y - PIXEL_SIZE/2, PIXEL_SIZE, PIXEL_SIZE, '#CFB53B');
        }
        
        // Draw center with pixel art
        pixelCircle(this.pixelCtx, mine.x, mine.y, pulseSize/2, '#CFB53B');
        
        // Draw countdown with pixelated font
        this.drawPixelText(timeLeft.toFixed(1), mine.x, mine.y - pulseSize - 5, 12, '#CFB53B', 'center');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    // Add a fixed implementation of createBorderPattern method
    createBorderPattern() {
        // Create a pixel-art border pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = PIXEL_SIZE * 4;
        patternCanvas.height = PIXEL_SIZE * 4;
        const pctx = patternCanvas.getContext('2d');
        
        // Draw pixel art rivets pattern
        pixelRect(pctx, 0, 0, PIXEL_SIZE, PIXEL_SIZE, PIXEL_COLORS.GOLD);
        pixelRect(pctx, PIXEL_SIZE * 2, PIXEL_SIZE * 2, PIXEL_SIZE, PIXEL_SIZE, PIXEL_COLORS.GOLD);
        
        try {
            // Create and return the pattern
            return this.ctx.createPattern(patternCanvas, 'repeat');
        } catch (error) {
            console.error('Failed to create border pattern:', error);
            // Return a fallback color if pattern creation fails
            return PIXEL_COLORS.GOLD;
        }
    }

    // Add a dedicated method for screen shake
    triggerScreenShake(intensity = 5, duration = 10) {
        // Only apply the new shake if it's more intense than the current one
        // or if the current shake is almost done (below 25% of its original duration)
        if (intensity > this.screenShake.intensity || this.screenShake.duration <= 3) {
            this.screenShake.intensity = intensity;
            this.screenShake.duration = duration;
        } else {
            // For less intense shakes, we'll still extend the duration slightly
            // but won't reset the intensity to prevent jarring visual changes
            this.screenShake.duration = Math.min(this.screenShake.duration + Math.floor(duration * 0.5), duration * 1.5);
        }
    }

    triggerGameOver() {
        // Create death explosion effect at commander position
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const distance = Math.random() * 80;
            const x = this.commander.x + Math.cos(angle) * distance;
            const y = this.commander.y + Math.sin(angle) * distance;
            this.createCollectionEffect(x, y, '#FF0000');
        }
        
        // Trigger screen shake for dramatic effect
        this.triggerScreenShake(15, 30);
        
        // Set game over state
        this.waveStatusAlpha = 1;
        this.waveStatusText = "GAME OVER";
        
        // Store final score and level
        this.finalScore = this.score;
        this.finalLevel = this.level;
        
        // Call game over after a short delay to show the explosion
        setTimeout(() => {
            this.gameOver();
        }, 2000);
    }

    // Add notification system methods
    addNotification(text, color, x, y, options = {}) {
        this.notifications.push({
            text,
            color,
            x,
            y,
            alpha: 1,
            startTime: Date.now(),
            yOffset: 0,
            fontSize: options.fontSize || 16,
            align: options.align || 'left',
            duration: options.duration || this.notificationDuration,
            isUpgrade: options.isUpgrade || false,
            isDamage: options.isDamage || false,
            isWorldPosition: options.isWorldPosition || false // Whether coordinates are in world space
        });
    }

    updateNotifications() {
        this.notifications = this.notifications.filter(notification => {
            const elapsed = Date.now() - notification.startTime;
            const duration = notification.duration || this.notificationDuration;
            
            if (elapsed > duration) return false;
            
            // Calculate alpha
            notification.alpha = 1 - (elapsed / duration);
            
            // Make different types of notifications move differently
            if (notification.isUpgrade) {
                notification.yOffset -= 0.2; // Slower float up speed for upgrade messages
            } else if (notification.isDamage) {
                // Damage numbers start slow then move faster
                const progress = elapsed / duration;
                notification.yOffset -= 0.3 + progress * 0.7; // Accelerating upward movement
                
                // Add slight random horizontal movement for visual interest
                notification.x += Math.sin(elapsed * 0.01) * 0.3;
            } else {
                notification.yOffset -= 0.5; // Normal float up speed
            }
            
            return true;
        });
    }

    drawDamageNotifications() {
        this.notifications.forEach(notification => {
            if (!notification.isDamage) return; // Only draw damage notifications here
            
            this.pixelCtx.globalAlpha = notification.alpha;
            
            // Draw damage numbers with special styling
            this.pixelCtx.save();
            
            // Add a drop shadow effect for visibility
            this.pixelCtx.shadowColor = 'black';
            this.pixelCtx.shadowBlur = 4;
            this.pixelCtx.shadowOffsetX = 1;
            this.pixelCtx.shadowOffsetY = 1;
            
            // Make damage text bold and larger
            const fontName = "'Press Start 2P', 'Courier New'";
            this.pixelCtx.font = `bold ${notification.fontSize}px ${fontName}`;
            this.pixelCtx.textAlign = notification.align;
            this.pixelCtx.fillStyle = notification.color;
            
            // Add a black outline for better visibility against all backgrounds
            this.pixelCtx.strokeStyle = 'black';
            this.pixelCtx.lineWidth = 3;
            
            // Draw at world position - no need to adjust for camera since we're inside the transformed context
            this.pixelCtx.strokeText(
                notification.text,
                notification.x,
                notification.y + notification.yOffset
            );
            
            // Draw damage text
            this.pixelCtx.fillText(
                notification.text,
                notification.x,
                notification.y + notification.yOffset
            );
            
            this.pixelCtx.restore();
            this.pixelCtx.globalAlpha = 1;
        });
    }

    // Fixed version of drawUINotifications
    drawUINotifications() {
        this.notifications.forEach(notification => {
            // Skip damage notifications, they're handled separately
            if (notification.isDamage) return;
            
            this.pixelCtx.globalAlpha = notification.alpha;
            
            if (notification.isUpgrade) {
                // Draw a background for upgrade notifications to make them more visible
                const textWidth = notification.text.length * notification.fontSize * 0.6;
                const padding = 10;
                const rectX = notification.x - textWidth/2 - padding;
                const rectY = notification.y + notification.yOffset - notification.fontSize - padding;
                const rectWidth = textWidth + padding * 2;
                const rectHeight = notification.fontSize + padding * 2;
                
                // Draw a semi-transparent background
                this.pixelCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.pixelCtx.fillRect(rectX, rectY, rectWidth, rectHeight);
                
                // Draw a border in the notification color
                this.pixelCtx.strokeStyle = notification.color;
                this.pixelCtx.lineWidth = 2;
                this.pixelCtx.strokeRect(rectX, rectY, rectWidth, rectHeight);
                
                // Draw text with glow effect
                this.pixelCtx.save();
                this.pixelCtx.shadowColor = notification.color;
                this.pixelCtx.shadowBlur = 8;
                this.drawPixelText(
                    notification.text,
                    notification.x,
                    notification.y + notification.yOffset,
                    notification.fontSize,
                    notification.color,
                    notification.align
                );
                this.pixelCtx.restore();
            } else {
                // Draw regular notifications normally
                this.drawPixelText(
                    notification.text,
                    notification.x,
                    notification.y + notification.yOffset,
                    notification.fontSize,
                    notification.color,
                    notification.align
                );
            }
            
            this.pixelCtx.globalAlpha = 1;
        });
    }

    updateCamera() {
        // Center the camera on the commander with precise calculations
        if (this.commander) {
            // Account for UI panel height in the vertical centering - use 2.5x the UI panel height
            // This shifts everything up to center the player in the visible game area below the UI panel
            const uiOffset = this.uiPanelHeight * 2.5;
            
            // Calculate exact center offsets, accounting for UI panel
            this.camera.x = Math.floor(this.commander.x - this.canvas.width / 2);
            this.camera.y = Math.floor(this.commander.y - (this.canvas.height / 2) + uiOffset);
            
            // Ensure camera position is pixel-aligned for clean rendering
            this.camera.x = Math.floor(this.camera.x / PIXEL_SIZE) * PIXEL_SIZE;
            this.camera.y = Math.floor(this.camera.y / PIXEL_SIZE) * PIXEL_SIZE;
        }
    }

    // Add method to get environment speed modifier at a position
    getEnvironmentSpeedModifier(x, y) {
        // Default speed modifier is 1 (no effect)
        let speedModifier = 1;
        
        // Check if position is inside any environment element
        for (const element of this.environment) {
            if (element.contains(x, y)) {
                // Use the lowest speed modifier found (slowest terrain takes precedence)
                speedModifier = Math.min(speedModifier, element.speedModifier);
            }
        }
        
        return speedModifier;
    }

    // Add a helper method in the Game class to display damage numbers
    showDamageNumber(amount, x, y, entitySize = 15) {
        // Create a damage notification with red color
        // Increase the offset to position damage numbers higher above entities
        const yOffset = entitySize * 2.5 + 20; // Much more space above the entity for better visibility

        this.addNotification(
            `-${Math.round(amount)}`,
            '#FF0000',
            x,
            y - yOffset,
            {
                fontSize: 20, // Slightly larger font size for better visibility
                align: 'center',
                duration: 1500,
                isDamage: true, // Special flag for damage numbers
                isWorldPosition: true // Flag to indicate these are world coordinates
            }
        );
    }

    // Add to Game class
    setClassSpawnRate(className, rate) {
        if (STEAM_CLASSES[className]) {
            STEAM_CLASSES[className].spawnRate = Math.max(0, rate); // Ensure non-negative
            console.log(`Set ${STEAM_CLASSES[className].name} spawn rate to ${rate}`);
            return true;
        }
        return false;
    }

    getClassSpawnRates() {
        const rates = {};
        for (const key in STEAM_CLASSES) {
            rates[key] = {
                name: STEAM_CLASSES[key].name,
                rate: STEAM_CLASSES[key].spawnRate
            };
        }
        return rates;
    }

    resetClassSpawnRates() {
        for (const key in STEAM_CLASSES) {
            STEAM_CLASSES[key].spawnRate = 100;
        }
        console.log("Reset all class spawn rates to default (100)");
    }

    disableClassSpawn(className) {
        return this.setClassSpawnRate(className, 0);
    }

    boostClassSpawn(className, multiplier = 2) {
        if (STEAM_CLASSES[className]) {
            const currentRate = STEAM_CLASSES[className].spawnRate;
            return this.setClassSpawnRate(className, currentRate * multiplier);
        }
        return false;
    }
}

// Add CSS to page for pixel font
document.addEventListener('DOMContentLoaded', () => {
    // Add Google Font - Press Start 2P is a pixel font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Add pixelated style to the game canvas
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.style.imageRendering = 'pixelated';
    }
    
    // Add pixelated style to the game UI
    const pixelStyle = document.createElement('style');
    pixelStyle.innerHTML = `
        #startScreen {
            font-family: 'Press Start 2P', monospace;
            background-color: #222;
        }
        #startButton {
            font-family: 'Press Start 2P', monospace;
            border: 4px solid #B8860B;
            background-color: #000;
            color: #FFD700;
            padding: 10px 20px;
            margin-top: 20px;
            cursor: pointer;
            image-rendering: pixelated;
        }
        #scoreDisplay, #healthDisplay {
            font-family: 'Press Start 2P', monospace;
            color: #FFD700;
            background-color: #000;
            border: 4px solid #B8860B;
            padding: 5px;
            margin: 5px;
        }
    `;
    document.head.appendChild(pixelStyle);
});

// Replace the global drawHealthBar function with pixelated version
function drawHealthBar(ctx, x, y, width, height, health, maxHealth) {
    const healthPercentage = Math.max(0, health / maxHealth);
    
    // Snap to pixel grid
    const pixelX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelWidth = Math.ceil(width / PIXEL_SIZE) * PIXEL_SIZE;
    const pixelHeight = Math.ceil(height / PIXEL_SIZE) * PIXEL_SIZE;
    
    // Draw background
    pixelRect(ctx, pixelX - pixelWidth/2, pixelY, pixelWidth, pixelHeight, 'rgba(0, 0, 0, 0.8)');
    
    // Draw health bar with pixel-art color based on health percentage
    let healthColor;
    if (healthPercentage > 0.7) healthColor = '#00FF00'; // Green
    else if (healthPercentage > 0.3) healthColor = '#FFFF00'; // Yellow
    else healthColor = '#FF0000'; // Red
    
    // Calculate health width without dividing by PIXEL_SIZE
    const healthWidth = Math.floor(pixelWidth * healthPercentage);
    
    // Only draw if we have health remaining
    if (healthWidth > 0) {
        pixelRect(ctx, pixelX - pixelWidth/2, pixelY, healthWidth, pixelHeight, healthColor);
    }
    
    // Draw pixelated border - use a semi-transparent white for better visibility
    const borderColor = 'rgba(255, 255, 255, 0.5)';
    
    // Top border
    pixelRect(ctx, pixelX - pixelWidth/2, pixelY, pixelWidth, PIXEL_SIZE, borderColor);
    // Bottom border
    pixelRect(ctx, pixelX - pixelWidth/2, pixelY + pixelHeight - PIXEL_SIZE, pixelWidth, PIXEL_SIZE, borderColor);
    // Left border
    pixelRect(ctx, pixelX - pixelWidth/2, pixelY, PIXEL_SIZE, pixelHeight, borderColor);
    // Right border
    pixelRect(ctx, pixelX - pixelWidth/2 + pixelWidth - PIXEL_SIZE, pixelY, PIXEL_SIZE, pixelHeight, borderColor);
}

// Replace the window.onload function at the end of the file
window.onload = function() {
    console.log('Window loaded with new implementation');
    
    // Initialize the game first
    const game = new Game();
    
    // Get the start button using direct DOM access
    const startButton = document.getElementById('startButton');
    console.log('Start button found:', !!startButton);
    
    // Use onclick instead of addEventListener for better compatibility
    if (startButton) {
        // IMPORTANT: Use function() instead of arrow function for better this binding
        startButton.onclick = function() {
            console.log('Start button clicked with direct onclick handler');
            game.startGame();
            return false; // Prevent default action
        };
    } else {
        console.error('Start button not found!');
    }
}; 

function selectWeightedSteamClass() {
    // Calculate total weight
    let totalWeight = 0;
    const classKeys = Object.keys(STEAM_CLASSES);
    
    for (const key of classKeys) {
        totalWeight += STEAM_CLASSES[key].spawnRate;
    }
    
    // Select a random value between 0 and totalWeight
    const randomValue = Math.random() * totalWeight;
    
    // Find which class that value corresponds to
    let cumulativeWeight = 0;
    for (const key of classKeys) {
        cumulativeWeight += STEAM_CLASSES[key].spawnRate;
        if (randomValue <= cumulativeWeight) {
            return STEAM_CLASSES[key];
        }
    }
    
    // Fallback
    return STEAM_CLASSES[classKeys[0]];
}

// Add global function for creating attack effects
function createAttackEffect(attacker, type, x, y, angle = 0, options = {}) {
    let duration = 200; // Default duration

    // Set different durations based on effect type
    if (type === 'SWORD_SWEEP') {
        duration = 300;
    } else if (type === 'AETHER_BEAM') {
        duration = 500; // Longer duration for beam effects
    } else if (type === 'CHAIN_LIGHTNING') {
        duration = 600; // Match the duration set in createLightningEffect
    } else if (type === 'TIME_BURST') {
        // Remove isCaster check - duration is set explicitly after creation in timeburstAttack
        duration = 2000; // Default duration for time burst
    } else if (type === 'EMBER_SPRAY') {
        duration = 1000;
    } else if (type === 'GEAR') { // Projectile type from gearThrowAttack
        duration = 1500;
    } else if (type === 'SHRAPNEL_FIELD') {
        duration = 500;
    } else if (type === 'SHRAPNEL_FIELD_CAST') {
        duration = 800; // New cast effect for shrapnel field
    } else if (type === 'SHRAPNEL_HIT') {
        duration = 300; // New hit effect for shrapnel
    }

    // Override duration if provided in options
    if (options.duration) {
        duration = options.duration;
    }

    const effect = {
        type,
        x,
        y,
        angle,
        startTime: Date.now(),
        duration: duration,
        // Add properties needed by specific effects if not passed directly
        ...(type === 'TIME_BURST' && { radius: attacker.size * 2, isCaster: (attacker instanceof Commander) }), // Example defaults
        ...(type === 'CHAIN_LIGHTNING' && { segments: [] }), // Ensure segments exist
        ...options // Allow passing additional properties
    };

    attacker.attackEffects.push(effect);

    // Add screen shake for certain effects
    if (attacker.game) {
        switch (type) {
            case 'SWORD_SWEEP':
                attacker.game.triggerScreenShake(5, 10);
                break;
            case 'AETHER_BEAM':
                attacker.game.triggerScreenShake(3, 8);
                break;
            case 'CHAIN_LIGHTNING':
                 attacker.game.triggerScreenShake(4, 5);
                 break;
            case 'SHRAPNEL_FIELD_CAST':
                attacker.game.triggerScreenShake(4, 8);
                break;
            // Add other cases if needed
        }
    }

    return effect; // Return the effect in case it needs modification
}


// Add global function for drawing attack effects
function drawAttackEffect(ctx, effect, attacker) {
    const progress = (Date.now() - effect.startTime) / effect.duration;
    if (progress >= 1) {
         if (effect.intervalId) clearInterval(effect.intervalId); // Clear intervals if used
         return;
    }

    ctx.save();

    const attackRange = attacker.attackRange || 80; // Use attacker's range or default

    switch (effect.type) {
        case 'SWORD_SWEEP':
            const alpha = 1 - progress;
            ctx.globalAlpha = alpha;

            // Draw sweep arc
            const startAngle = effect.angle - Math.PI / 2;

            // Draw main sweep effect with gradient
            const gradient = ctx.createLinearGradient(
                effect.x - Math.cos(effect.angle) * attackRange,
                effect.y - Math.sin(effect.angle) * attackRange,
                effect.x + Math.cos(effect.angle) * attackRange,
                effect.y + Math.sin(effect.angle) * attackRange
            );
            gradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
            gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

            // Draw multiple arcs for a more dramatic effect
            for (let i = 0; i < 3; i++) {
                const arcWidth = 8 - i * 2;
                ctx.lineWidth = arcWidth;
                ctx.strokeStyle = gradient;
                ctx.beginPath();
                ctx.arc(
                    effect.x,
                    effect.y,
                    attackRange - i * 10,
                    startAngle + progress * Math.PI * 1.2,
                    startAngle + progress * Math.PI * 1.2 + Math.PI / 2
                );
                ctx.stroke();
            }

            // Add particle effects along the arc
            const sweepParticleCount = 10;
            for (let i = 0; i < sweepParticleCount; i++) {
                const particleAngle = startAngle + progress * Math.PI * 1.2 + Math.PI / 4;
                const distance = attackRange * (0.8 + Math.random() * 0.4);
                const x = effect.x + Math.cos(particleAngle) * distance;
                const y = effect.y + Math.sin(particleAngle) * distance;

                ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add a bright flash at the sword's current position
            const flashX = effect.x + Math.cos(effect.angle + progress * Math.PI) * attackRange;
            const flashY = effect.y + Math.sin(effect.angle + progress * Math.PI) * attackRange;

            ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
            ctx.beginPath();
            ctx.arc(flashX, flashY, 10, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'SWORD_HIT':
            const hitAlpha = 1 - progress;
            ctx.globalAlpha = hitAlpha;

            // Draw hit spark
            const sparkSize = 10 * (1 - progress);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + progress * Math.PI;
                const x2 = effect.x + Math.cos(angle) * sparkSize;
                const y2 = effect.y + Math.sin(angle) * sparkSize;

                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            break;

        case 'TIME_BURST':
            ctx.save();
            const timeAlpha = 1 - progress;
            ctx.globalAlpha = timeAlpha;
            ctx.shadowColor = '#00FFFF'; // Cyan glow
            ctx.shadowBlur = 15;
            const maxRadius = effect.radius || 40;
            const ringCount = 4;
            for (let i = 0; i < ringCount; i++) {
                const ringOffset = i / ringCount;
                const ringProgress = (progress + ringOffset) % 1;
                const ringRadius = maxRadius * ringProgress;
                const ringColor = i % 2 === 0 ? '#00FFFF' : '#40C0FF';
                // Corrected RGBA string interpolation
                const r = parseInt(ringColor.substring(1, 3), 16);
                const g = parseInt(ringColor.substring(3, 5), 16);
                const b = parseInt(ringColor.substring(5, 7), 16);
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(1 - ringProgress) * timeAlpha})`;
                ctx.lineWidth = 3 * (1 - ringProgress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = `rgba(0, 180, 255, ${timeAlpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${timeAlpha * 0.9})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 12, 0, Math.PI * 2);
            ctx.stroke();
            const minuteAngle = progress * Math.PI * 8;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.lineTo(effect.x + Math.cos(minuteAngle) * 10, effect.y + Math.sin(minuteAngle) * 10);
            ctx.stroke();
            const hourAngle = -progress * Math.PI * 3;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.lineTo(effect.x + Math.cos(hourAngle) * 6, effect.y + Math.sin(hourAngle) * 6);
            ctx.stroke();
            const particleCount = 12;
            for (let i = 0; i < particleCount; i++) {
                const particleAngle = (i / particleCount) * Math.PI * 2 + progress * Math.PI * 3;
                const orbitRadius = maxRadius * 0.6;
                const px = effect.x + Math.cos(particleAngle) * orbitRadius;
                const py = effect.y + Math.sin(particleAngle) * orbitRadius;
                ctx.fillStyle = i % 2 === 0 ? '#80FFFF' : '#FFFFFF';
                const particleSize = 2 + Math.sin(progress * Math.PI * 10 + i) * 1.5;
                ctx.beginPath();
                ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.setLineDash([5, 3]);
            ctx.strokeStyle = `rgba(0, 255, 255, ${timeAlpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, maxRadius * progress * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            if (effect.isCaster) {
                ctx.strokeStyle = `rgba(0, 200, 255, ${timeAlpha * 0.5})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, maxRadius * 1.5 * progress, 0, Math.PI * 2);
                ctx.stroke();
                const glowSize = maxRadius * (0.8 + Math.sin(progress * Math.PI * 6) * 0.2);
                ctx.fillStyle = `rgba(0, 200, 255, ${timeAlpha * 0.2})`;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            break;

        case 'CHAIN_LIGHTNING':
            // console.log(`Drawing CHAIN_LIGHTNING effect at (${effect.startX}, ${effect.startY}) to (${effect.endX}, ${effect.endY}) with ${effect.segments ? effect.segments.length : 0} segments`);
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 12;
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 25;
            if (effect.segments && effect.segments.length > 0) {
                 //console.log(`Drawing ${effect.segments.length} lightning segments`);
                effect.segments.forEach((segment, index) => {
                     //console.log(`Drawing segment ${index}: (${segment.x1}, ${segment.y1}) to (${segment.x2}, ${segment.y2})`);
                    ctx.globalAlpha = 0.8 * (1 - progress);
                    ctx.lineWidth = 15;
                    ctx.beginPath();
                    ctx.moveTo(segment.x1, segment.y1);
                    ctx.lineTo(segment.x2, segment.y2);
                    ctx.stroke();
                    ctx.globalAlpha = 1 * (1 - progress);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(segment.x1, segment.y1);
                    ctx.lineTo(segment.x2, segment.y2);
                    ctx.stroke();
                     ctx.strokeStyle = '#FFFF00'; // Reset stroke style for next segment
                });
                effect.segments.forEach(segment => {
                    ctx.fillStyle = '#FFFF00';
                    ctx.globalAlpha = 0.95 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(segment.x2, segment.y2, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    const pulseSize = 12 + Math.sin(Date.now() * 0.02) * 4;
                    ctx.arc(segment.x1, segment.y1, pulseSize, 0, Math.PI * 2);
                    ctx.fill();
                    for (let i = 0; i < 5; i++) {
                        const sparkSize = 4 + Math.random() * 6;
                        const sparkX = segment.x2 + (Math.random() - 0.5) * 25;
                        const sparkY = segment.y2 + (Math.random() - 0.5) * 25;
                        ctx.fillStyle = i % 2 === 0 ? '#FFFF00' : '#FFFFFF';
                        ctx.beginPath();
                        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                for (let i = 0; i < effect.segments.length - 1; i++) {
                    const curr = effect.segments[i];
                    const next = effect.segments[i + 1];
                    const midX = (curr.x2 + next.x1) / 2;
                    const midY = (curr.y2 + next.y1) / 2;
                    ctx.fillStyle = 'rgba(255, 255, 150, ' + (0.7 * (1 - progress)) + ')';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 10 + Math.random() * 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                 //console.error('Missing or empty segments property in CHAIN_LIGHTNING effect:', effect);
            }
            break;

        case 'AETHER_BEAM':
            const beamAlpha = 1 - progress;
            ctx.globalAlpha = beamAlpha;
            const beamAngle = effect.angle || 0;
            const beamLength = attackRange * 1.2; // Make beam slightly longer than attack range for better visuals

            // Determine beam color based on attacker type or class
            let beamColor = '#9B111E'; // Default Ethermancer color
             if (attacker instanceof Follower && attacker.steamClass && attacker.steamClass.attackStyle === 'AETHER_BEAM') {
                 beamColor = attacker.steamClass.color;
             } else if (attacker instanceof Commander) {
                 // Commander might have a different color or fixed color for beams
                 // For now, let's use a commander-specific color or default
                 beamColor = '#4A90E2'; // Example blue beam for commander
             }

            const r_beam = parseInt(beamColor.substring(1, 3), 16);
            const g_beam = parseInt(beamColor.substring(3, 5), 16);
            const b_beam = parseInt(beamColor.substring(5, 7), 16);
            
            // Add a glow effect to make the beam more visible
            ctx.shadowColor = beamColor;
            ctx.shadowBlur = 15;
            
            // Save and transform context for beam drawing
            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.rotate(beamAngle);
            
            // Draw beam direction indicator - small arrow at start of beam
            const arrowSize = 6;
            ctx.fillStyle = `rgba(${r_beam}, ${g_beam}, ${b_beam}, ${beamAlpha * 0.9})`;
            ctx.beginPath();
            ctx.moveTo(arrowSize * 2, 0);
            ctx.lineTo(arrowSize, arrowSize);
            ctx.lineTo(arrowSize, -arrowSize);
            ctx.closePath();
            ctx.fill();
            
            // Create a more dramatic beam gradient
            const beamGradient = ctx.createLinearGradient(0, 0, beamLength, 0);
            beamGradient.addColorStop(0, `rgba(${r_beam}, ${g_beam}, ${b_beam}, ${beamAlpha})`);
            beamGradient.addColorStop(0.5, `rgba(${Math.min(255, r_beam + 100)}, ${Math.min(255, g_beam + 100)}, ${Math.min(255, b_beam + 100)}, ${beamAlpha * 0.8})`);
            beamGradient.addColorStop(1, `rgba(${r_beam}, ${g_beam}, ${b_beam}, ${beamAlpha * 0.3})`);
            
            // Make beam width pulse for more dynamic effect
            const beamWidth = 12 + Math.sin(progress * Math.PI * 8) * 6;
            ctx.fillStyle = beamGradient;
            
            // Draw main beam with slightly rounded ends
            ctx.beginPath();
            ctx.roundRect(0, -beamWidth / 2, beamLength, beamWidth, 4);
            ctx.fill();
            
            // Add beam wave effect particles
            const waveCount = 10; // Increased wave count
            for (let i = 0; i < waveCount; i++) {
                const wavePos = (i / waveCount + progress * 2) % 1; // Double speed for more motion
                const waveX = wavePos * beamLength;
                const waveSize = 8 + Math.sin(progress * Math.PI * 10) * 4;
                ctx.fillStyle = `rgba(${Math.min(255, r_beam + 120)}, ${Math.min(255, g_beam + 120)}, ${Math.min(255, b_beam + 120)}, ${beamAlpha * (1 - wavePos)})`;
                ctx.beginPath();
                ctx.arc(waveX, 0, waveSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add more particles around the beam for a 'powerful energy' effect
            const beamParticleCount = 25; // Increased particle count
            for (let i = 0; i < beamParticleCount; i++) {
                const particleX = Math.random() * beamLength;
                const particleY = (Math.random() - 0.5) * beamWidth * 5; // Wider particle spread
                const particleSize = 2 + Math.random() * 4; // Larger particles
                ctx.fillStyle = `rgba(${Math.min(255, r_beam + 80)}, ${Math.min(255, g_beam + 80)}, ${Math.min(255, b_beam + 80)}, ${beamAlpha * Math.random()})`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Enhanced glow effect at beam source
            const glowSize = 20 + Math.sin(progress * Math.PI * 6) * 8;
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            glowGradient.addColorStop(0, `rgba(${Math.min(255, r_beam + 50)}, ${Math.min(255, g_beam + 50)}, ${Math.min(255, b_beam + 50)}, ${beamAlpha})`);
            glowGradient.addColorStop(0.6, `rgba(${r_beam}, ${g_beam}, ${b_beam}, ${beamAlpha * 0.6})`);
            glowGradient.addColorStop(1, `rgba(${r_beam}, ${g_beam}, ${b_beam}, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add impact flare at end of beam
            ctx.beginPath();
            ctx.arc(beamLength, 0, beamWidth * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.min(255, r_beam + 100)}, ${Math.min(255, g_beam + 100)}, ${Math.min(255, b_beam + 100)}, ${beamAlpha * 0.7})`;
            ctx.fill();
            
            ctx.restore();
            break;

         case 'EMBER_SPRAY':
             // Draw ember particle
             ctx.globalAlpha = effect.life * (1 - progress); // Fade out with life and progress
             ctx.fillStyle = '#FF4500'; // Orange-red color for embers
             ctx.beginPath();
             ctx.arc(effect.x, effect.y, effect.radius * (1 + progress * 0.5), 0, Math.PI * 2); // Slightly grow ember
             ctx.fill();
             // Add some sparks
             for (let i = 0; i < 3; i++) {
                 const sparkAngle = Math.random() * Math.PI * 2;
                 const sparkDist = Math.random() * effect.radius * 2;
                 ctx.fillStyle = i % 2 === 0 ? '#FFA500' : '#FFD700';
                 ctx.fillRect(
                     effect.x + Math.cos(sparkAngle) * sparkDist - 1,
                     effect.y + Math.sin(sparkAngle) * sparkDist - 1,
                     2, 2
                 );
             }
             break;

         case 'GEAR': // Drawing for gear projectile
              ctx.save();
              ctx.translate(effect.x, effect.y);
              ctx.rotate(progress * Math.PI * 10); // Spin the gear
              ctx.strokeStyle = '#B87333'; // Gearwright color
              ctx.fillStyle = '#CD7F32';   // Steamsmith color (inner part)
              ctx.lineWidth = 3;
              const gearRadius = effect.radius || 8;
              // Draw gear teeth
              const teeth = 6;
              for(let i=0; i<teeth; i++) {
                   const angle = (i/teeth) * Math.PI * 2;
                   ctx.beginPath();
                   ctx.moveTo(Math.cos(angle) * gearRadius * 0.7, Math.sin(angle) * gearRadius * 0.7);
                   ctx.lineTo(Math.cos(angle + 0.1) * gearRadius, Math.sin(angle + 0.1) * gearRadius);
                   ctx.lineTo(Math.cos(angle + 0.2) * gearRadius, Math.sin(angle + 0.2) * gearRadius);
                   ctx.lineTo(Math.cos(angle + 0.3) * gearRadius * 0.7, Math.sin(angle + 0.3) * gearRadius * 0.7);
                   ctx.closePath();
                   ctx.stroke();
                   ctx.fill();
              }
              // Draw center
              ctx.fillStyle = '#B8860B'; // Brass color
              ctx.beginPath();
              ctx.arc(0, 0, gearRadius * 0.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              // Draw Trail
              if (effect.trail && effect.trail.length > 0) {
                  effect.trail.forEach((point, index) => {
                      const trailProgress = index / effect.trail.length;
                      const trailAlpha = (1 - trailProgress) * 0.6 * (1 - progress); // Fade out with trail age and effect progress
                      const trailSize = Math.max(PIXEL_SIZE * 2, PIXEL_SIZE * 4 * (1 - trailProgress)); // Make trail pixels larger

                      // Draw pixelated trail element
                      pixelRect(
                          ctx,
                          point.x - trailSize / 2,
                          point.y - trailSize / 2,
                          trailSize,
                          trailSize,
                          `rgba(184, 115, 51, ${trailAlpha})` // Use gear color (Brown/Brass) with alpha
                      );
                  });
              }
              break;

         case 'SHRAPNEL_FIELD':
             ctx.globalAlpha = effect.life * (1 - progress);
             // Use the Brassbinder's color - brighter and more visible
             const baseColor = '#B5A642'; // Brassbinder color
             const glowColor = '#FFD700'; // Gold/yellow glow
             
             // Draw glowing shrapnel core
             ctx.shadowColor = glowColor;
             ctx.shadowBlur = 10;
             ctx.fillStyle = baseColor;
             
             // Draw irregular shrapnel shape with more dynamic edges
             ctx.beginPath();
             const points = 5 + Math.floor(Math.random() * 3);
             for(let i = 0; i < points; i++) {
                 const angle = (i / points) * Math.PI * 2 + progress * Math.PI;
                 const dist = effect.radius * (0.5 + Math.random() * 0.5) * (1 - progress * 0.3);
                 const px = effect.x + Math.cos(angle) * dist;
                 const py = effect.y + Math.sin(angle) * dist;
                 if (i === 0) ctx.moveTo(px, py);
                 else ctx.lineTo(px, py);
             }
             ctx.closePath();
             ctx.fill();
             
             // Draw individual particles for each shrapnel
             if (effect.particles) {
                 effect.particles.forEach((particle, idx) => {
                     // Update particle positions
                     particle.x += particle.vx;
                     particle.y += particle.vy;
                     
                     ctx.fillStyle = idx % 2 === 0 ? baseColor : glowColor;
                     ctx.beginPath();
                     ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2);
                     ctx.fill();
                 });
             }
             
             // Add sparks/metal fragments
             for (let i = 0; i < 4; i++) {
                 const sparkAngle = Math.random() * Math.PI * 2;
                 const sparkDist = effect.radius * (0.3 + Math.random() * 0.7);
                 const sparkX = effect.x + Math.cos(sparkAngle) * sparkDist;
                 const sparkY = effect.y + Math.sin(sparkAngle) * sparkDist;
                 
                 ctx.fillStyle = '#FFFFFF';
                 ctx.beginPath();
                 ctx.arc(sparkX, sparkY, 2 * (1 - progress), 0, Math.PI * 2);
                 ctx.fill();
             }
             break;
             
         case 'SHRAPNEL_FIELD_CAST':
             // Draw expanding circle and shrapnel swirl from caster
             const castAlpha = 1 - progress;
             ctx.globalAlpha = castAlpha;
             
             // Draw expanding circles
             ctx.strokeStyle = '#B5A642'; // Brassbinder color
             ctx.lineWidth = 5 * (1 - progress);
             
             // Draw multiple expanding rings
             for (let i = 0; i < 3; i++) {
                 const ringProgress = (progress + i * 0.2) % 1;
                 const radius = attackRange * ringProgress * 0.8;
                 
                 ctx.strokeStyle = i % 2 === 0 ? '#B5A642' : '#FFD700';
                 ctx.beginPath();
                 ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                 ctx.stroke();
             }
             
             // Draw spinning shrapnel pieces around caster
             const pieces = 12;
             for (let i = 0; i < pieces; i++) {
                 const angle = (i / pieces) * Math.PI * 2 + progress * Math.PI * 4; // Spin rotation
                 const distance = attackRange * 0.5 * progress;
                 const pieceX = effect.x + Math.cos(angle) * distance;
                 const pieceY = effect.y + Math.sin(angle) * distance;
                 
                 ctx.fillStyle = '#B5A642';
                 ctx.save();
                 ctx.translate(pieceX, pieceY);
                 ctx.rotate(angle);
                 
                 // Draw diamond shaped shrapnel piece
                 ctx.beginPath();
                 ctx.moveTo(0, -6);
                 ctx.lineTo(4, 0);
                 ctx.lineTo(0, 6);
                 ctx.lineTo(-4, 0);
                 ctx.closePath();
                 ctx.fill();
                 
                 ctx.restore();
             }
             break;
             
         case 'SHRAPNEL_HIT':
            // Draw sharp metal impact effect
            const shrapnelHitProgress = progress;
            const shrapnelHitAlpha = 1 - shrapnelHitProgress;
            
            ctx.globalAlpha = shrapnelHitAlpha;
            ctx.shadowColor = '#FFD700'; // Gold glow
            ctx.shadowBlur = 10;
            
            // Draw metal fragments flying outward
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = 15 * shrapnelHitProgress;
                const fragX = effect.x + Math.cos(angle) * distance;
                const fragY = effect.y + Math.sin(angle) * distance;
                
                ctx.fillStyle = i % 2 === 0 ? '#B5A642' : '#FFD700';
                
                // Draw triangle shaped fragments
                ctx.save();
                ctx.translate(fragX, fragY);
                ctx.rotate(angle + shrapnelHitProgress * Math.PI);
                
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(3, 3);
                ctx.lineTo(-3, 3);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
            
            // Draw impact flash
            ctx.fillStyle = `rgba(255, 255, 200, ${shrapnelHitAlpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 8 * (1 - shrapnelHitProgress), 0, Math.PI * 2);
            ctx.fill();
            break;

         case 'TEMPORAL_MINE':
              const mineTimeLeft = Math.max(0, (effect.detonationTime - Date.now()) / 1000);
              const minePulseSize = (effect.radius || 80) * 0.2 * (1 + Math.sin(progress * Math.PI * 10) * 0.2); // Pulsating size
              const mineColor = '#CFB53B'; // Clockworker color

              // Draw mine body with pulsing effect
              ctx.fillStyle = `rgba(207, 181, 59, ${0.5 + Math.sin(progress * Math.PI * 6) * 0.3})`; // Pulsating alpha
              ctx.beginPath();
              ctx.arc(effect.x, effect.y, minePulseSize, 0, Math.PI * 2);
              ctx.fill();

              // Draw clock hands (static for simplicity in draw loop)
              ctx.strokeStyle = mineColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(effect.x, effect.y);
              ctx.lineTo(effect.x + Math.cos(progress * 5) * minePulseSize * 0.8, effect.y + Math.sin(progress * 5) * minePulseSize * 0.8);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(effect.x, effect.y);
              ctx.lineTo(effect.x + Math.cos(progress * 2) * minePulseSize * 0.5, effect.y + Math.sin(progress * 2) * minePulseSize * 0.5);
              ctx.stroke();

               // Draw countdown - Use the non-pixelated text for clarity on effects
               if (attacker.game) { // Check if game context is available
                 ctx.font = `bold 14px "Courier New"`;
                 ctx.textAlign = 'center';
                 ctx.fillStyle = mineColor;
                 ctx.fillText(mineTimeLeft.toFixed(1), effect.x, effect.y - minePulseSize - 8);
               }
              break;

         case 'GEAR_LAUNCH': // Draw the launch effect
             const launchAlpha = 1 - progress;
             ctx.globalAlpha = launchAlpha;
             const launchRadius = 15 * progress; // Expanding radius
             ctx.strokeStyle = '#A9A9A9'; // Grey steam color
             ctx.lineWidth = 4 * (1 - progress); // Fading thickness
             ctx.beginPath();
             ctx.arc(effect.x, effect.y, launchRadius, 0, Math.PI * 2);
             ctx.stroke();
             // Add more/larger sparks
             for(let i=0; i<8; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const dist = launchRadius * (0.5 + Math.random() * 0.5);
                 const sparkSize = PIXEL_SIZE * (1 + Math.random()); // Slightly larger sparks
                 pixelRect(ctx, effect.x + Math.cos(angle)*dist - sparkSize/2, effect.y + Math.sin(angle)*dist - sparkSize/2, sparkSize, sparkSize, '#FFD700');
             }
             // Add central flash
             ctx.fillStyle = `rgba(255, 255, 200, ${launchAlpha * 0.8})`;
             pixelCircle(ctx, effect.x, effect.y, 5 * progress, ctx.fillStyle);
             break;

         case 'CORROSION_CLOUD':
              const cloudAlpha = 0.6 * (1 - progress); // Fade out
              const cloudRadius = (attacker.attackRange || 110) * 0.7 * (0.5 + progress * 0.5); // Expanding radius
              const cloudColor = '#8B4513'; // Rustweaver color

              // Draw main cloud body using multiple layers
              for (let i = 0; i < 3; i++) {
                   ctx.fillStyle = `rgba(139, 69, 19, ${cloudAlpha * (1 - i * 0.2)})`; // Varying alpha
                   ctx.beginPath();
                   ctx.arc(effect.x, effect.y, cloudRadius * (1 - i * 0.1), 0, Math.PI * 2);
                   ctx.fill();
              }

              // Draw rust particles within the cloud
              const rustParticleCount = 15;
              for (let i = 0; i < rustParticleCount; i++) {
                   // Position particles randomly within the cloud radius
                   const angle = Math.random() * Math.PI * 2;
                   const dist = Math.random() * cloudRadius;
                   const px = effect.x + Math.cos(angle) * dist;
                   const py = effect.y + Math.sin(angle) * dist;
                   const particleSize = PIXEL_SIZE * (1 + Math.random());
                   const particleColor = Math.random() < 0.5 ? '#A0522D' : '#CD853F'; // Sienna/Peru colors

                   pixelRect(ctx, px, py, particleSize, particleSize, `rgba(${parseInt(particleColor.substring(1,3),16)}, ${parseInt(particleColor.substring(3,5),16)}, ${parseInt(particleColor.substring(5,7),16)}, ${cloudAlpha * 1.5})`);
              }
              break;

          case 'PISTON_PUNCH': // Main punch effect from follower
              const punchProgress = progress * 2; // Make it faster
              if (punchProgress < 1) { // Only draw for the first half of the duration
                  const punchAlpha = 1 - punchProgress;
                  const punchRadius = 25 * punchProgress; // Small expanding shockwave
                  ctx.strokeStyle = `rgba(113, 121, 126, ${punchAlpha})`; // Pistoneer color
                  ctx.lineWidth = 5 * punchAlpha;

                  // Draw expanding shockwave rings
                  ctx.beginPath();
                  ctx.arc(effect.x, effect.y, punchRadius, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.arc(effect.x, effect.y, punchRadius * 0.6, 0, Math.PI * 2);
                  ctx.stroke();

                  // Add sharp lines for impact feel
                  ctx.lineWidth = 2 * punchAlpha;
                  for(let i=0; i<6; i++) {
                       const angle = effect.angle + (i / 6) * Math.PI * 2; // Radiate based on attack angle
                       ctx.beginPath();
                       ctx.moveTo(effect.x + Math.cos(angle) * punchRadius * 0.5, effect.y + Math.sin(angle) * punchRadius * 0.5);
                       ctx.lineTo(effect.x + Math.cos(angle) * punchRadius * 1.2, effect.y + Math.sin(angle) * punchRadius * 1.2);
                       ctx.stroke();
                  }
              }
              break;

          case 'PISTON_HIT': // Impact effect on enemy
              const hitProgress = progress;
              const pistonHitAlpha = 1 - hitProgress;
              const hitSize = 15 * (1 - hitProgress); // Shrinking star/impact
              ctx.strokeStyle = `rgba(200, 200, 200, ${pistonHitAlpha})`; // Silver/Grey impact color
              ctx.lineWidth = 3 * pistonHitAlpha;

              // Draw starburst lines
              for(let i=0; i<5; i++) {
                   const angle = (i / 5) * Math.PI * 2 + hitProgress * Math.PI; // Rotate slightly
                   ctx.beginPath();
                   ctx.moveTo(effect.x, effect.y);
                   ctx.lineTo(effect.x + Math.cos(angle) * hitSize, effect.y + Math.sin(angle) * hitSize);
                   ctx.stroke();
              }
              break;

        // Add cases for other attack types if needed...
    }

    ctx.restore();
}


// Add global function for sword sweep attack logic
function performSwordSweepAttack(attacker, enemies) {
    if (!enemies || enemies.length === 0) return;

    // Use attacker's specific attack speed if available, else default
    const attackSpeed = attacker.attackSpeed || 800;
    const currentTime = Date.now();
    if (currentTime - (attacker.lastAttackTime || 0) < attackSpeed) return;

    // Find nearest enemy to determine attack direction
    let nearestEnemy = null;
    let minDistance = Infinity;
    const attackRange = attacker.attackRange || 80; // Use attacker's range

    enemies.forEach(enemy => {
        if (enemy.collected) return; // Skip collected enemies if applicable
        const dx = enemy.x - attacker.x;
        const dy = enemy.y - attacker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance && distance <= attackRange) {
            nearestEnemy = enemy;
            minDistance = distance;
        }
    });

    if (!nearestEnemy) return;

    // Calculate angle towards enemy
    const angle = Math.atan2(
        nearestEnemy.y - attacker.y,
        nearestEnemy.x - attacker.x
    );

    // Create the sweep effect using the global function
    createAttackEffect(attacker, 'SWORD_SWEEP', attacker.x, attacker.y, angle);

    // Check for enemies in the sweep arc (180 degrees)
    const attackDamage = attacker.attackDamage || 3; // Use attacker's damage

    enemies.forEach(enemy => {
         if (enemy.collected) return;
         const dx = enemy.x - attacker.x;
         const dy = enemy.y - attacker.y;
         const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= attackRange) { // Check if enemy is in range
            const enemyAngle = Math.atan2(
                enemy.y - attacker.y,
                enemy.x - attacker.x
            );

            // Calculate angle difference
            let angleDiff = enemyAngle - angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // If enemy is within 180 degree arc
            if (Math.abs(angleDiff) <= Math.PI / 2) {
                 const previousHealth = enemy.health; // Store health before damage
                enemy.health -= attackDamage;

                 // Show damage number if game context available
                 if (attacker.game && enemy.health < previousHealth) {
                     attacker.game.showDamageNumber(previousHealth - enemy.health, enemy.x, enemy.y, enemy.size);
                 }

                // Create hit effect using the global function
                createAttackEffect(attacker, 'SWORD_HIT', enemy.x, enemy.y);

                // Add knockback
                const knockback = 20;
                enemy.x += Math.cos(enemyAngle) * knockback;
                enemy.y += Math.sin(enemyAngle) * knockback;
            }
        }
    });

    attacker.lastAttackTime = currentTime;
}