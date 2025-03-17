// Glimmer Hold in p5.js
let player;
let tendrils = [];
let orbs = [];
let sparks = [];
let powerUps = [];
let energy = 100;
let survivalTime = 0;
let score = 0;
let highScore = 0;
let highScores = {}; // Object to store high scores for each difficulty
let gameState = "title"; // "title", "playing", "over"
let difficulty = "normal"; // "easy", "normal", "hard", "insane"
let particles = [];
let backgroundStars = [];
let sounds = {};

// Character selection
let characterType = "balanced"; // "balanced", "tank", "scout"
let characterTypes = {
  balanced: {
    name: "SOLDIER",
    baseSpeed: 4,
    maxEnergy: 100,
    description: "Average speed and energy"
  },
  tank: {
    name: "TANK",
    baseSpeed: 2.2, // Reduced from 3 to make it very slow
    maxEnergy: 150,
    description: "Slower but more energy"
  },
  scout: {
    name: "FIGHTER JET",
    baseSpeed: 5.5,
    maxEnergy: 75,
    description: "Faster but less energy"
  }
};

let difficultySettings = {
  easy: { 
    energyDrain: 0.3, 
    tendrilSpeed: 0.6, // Increased from 0.5
    orbSpeed: 2.2, // Increased from 1.8
    sparkFrequency: 0.04,
    tendrilColor: [60, 100, 150],
    orbColor: [150, 30, 30],
    sparkColor: [200, 200, 0],
    damageMultiplier: 2.2, // Increased from 1.8
    spawnRate: 0.05 // Increased from 0.04
  },
  normal: { 
    energyDrain: 0.5, 
    tendrilSpeed: 0.8, // Increased from 0.7
    orbSpeed: 3.0, // Increased from 2.5
    sparkFrequency: 0.03,
    tendrilColor: [80, 120, 180],
    orbColor: [180, 40, 40],
    sparkColor: [200, 200, 0],
    damageMultiplier: 2.8, // Increased from 2.3
    spawnRate: 0.045 // Increased from 0.035
  },
  hard: { 
    energyDrain: 0.8, 
    tendrilSpeed: 1.1, // Increased from 0.9
    orbSpeed: 3.8, // Increased from 3.2
    sparkFrequency: 0.015,
    tendrilColor: [100, 140, 210],
    orbColor: [210, 50, 50],
    sparkColor: [180, 180, 0],
    damageMultiplier: 3.5, // Increased from 2.8
    spawnRate: 0.04 // Increased from 0.03
  },
  insane: { 
    energyDrain: 1.2, 
    tendrilSpeed: 1.5, // Increased from 1.2
    orbSpeed: 4.8, // Increased from 4.0
    sparkFrequency: 0.008,
    tendrilColor: [150, 100, 255],
    orbColor: [255, 30, 30],
    sparkColor: [180, 160, 0],
    damageMultiplier: 5.5, // Increased from 4.5
    spawnRate: 0.035 // Increased from 0.025
  }
};
let powerUpTypes = ["shield", "speed", "energy", "blast"];
let activeEffects = { shield: 0, speed: 0 };
let gameTime = 0;

// Enemy types
const ENEMY_TYPES = {
  HUNTER: 'hunter',     // Standard enemy that chases the player
  DASHER: 'dasher',     // Moves in bursts, faster but pauses between dashes
  SPLITTER: 'splitter', // Splits into smaller enemies when destroyed
  BOMBER: 'bomber'      // Explodes when near the player, causing area damage
};

// Add a loading state variable
let isLoading = false;

console.log("Script started loading");

function preload() {
  console.log("Preload function started");
  // We're skipping sound loading for now
  console.log("Sound loading skipped");
  
  // Initialize high scores object to track scores for each difficulty
  highScores = {
    easy: 0,
    normal: 0,
    hard: 0,
    insane: 0
  };
  
  // Load high scores from localStorage if available
  const difficulties = ["easy", "normal", "hard", "insane"];
  difficulties.forEach(diff => {
    const key = `glimmerHoldHighScore_${diff}`;
    if (localStorage.getItem(key)) {
      highScores[diff] = parseInt(localStorage.getItem(key));
      console.log(`Loaded ${diff} high score: ${highScores[diff]}`);
    }
  });
  
  // Set initial highScore variable based on current difficulty
  highScore = highScores[difficulty];
}

function setup() {
  console.log("Setup function started");
  createCanvas(600, 600);
  textAlign(CENTER, CENTER);
  textSize(20);
  
  // Initialize player with character type properties
  initializePlayer();
  
  // Create background stars
  for (let i = 0; i < 100; i++) {
    backgroundStars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(100, 200),
      twinkleSpeed: random(0.02, 0.05)
    });
  }
  
  console.log("Player initialized");
  
  // Initial tendrils (one per side)
  resetGame();
  console.log("Game reset complete");
  
  // Hide the loading screen if it's still visible from a previous session
  hideLoadingScreen();
  
  // Make sure title text is hidden on startup
  const titleEl = document.getElementById('game-title');
  const subtitleEl = document.getElementById('game-subtitle');
  if (titleEl) {
    titleEl.style.opacity = '0';
    titleEl.style.display = 'none';
  }
  if (subtitleEl) {
    subtitleEl.style.opacity = '0';
    subtitleEl.style.display = 'none';
  }
}

// Function to initialize player based on character type
function initializePlayer() {
  player = {
    x: width / 2, 
    y: height / 2, 
    baseSpeed: characterTypes[characterType].baseSpeed,
    get speed() { return this.baseSpeed * (1 + (activeEffects.speed > 0 ? 0.5 : 0)); },
    lightIntensity: 1.0,
    lightPulse: 0,
    maxEnergy: characterTypes[characterType].maxEnergy
  };
  
  // Set initial energy based on character type
  energy = player.maxEnergy;
}

function draw() {
  // Don't update the game if we're in loading state
  if (isLoading) {
    // Just draw a simple background to avoid flickering
    background(0);
    return;
  }
  
  // Clear the canvas with a dark background
  background(0);
  
  // Update game time
  gameTime += 1/60;
  
  if (gameState === "title") {
    drawBackground();
    drawTitleScreen();
  } else if (gameState === "playing") {
    // Only draw the background and game elements during gameplay
    // No title text should appear here
    drawBackground();
    updateGame();
    drawGame();
  } else if (gameState === "over") {
    drawBackground();
    drawGameOver();
  }
}

function drawBackground() {
  // Draw stars
  noStroke();
  for (let star of backgroundStars) {
    let twinkle = sin(frameCount * star.twinkleSpeed) * 55 + 200;
    fill(star.brightness, star.brightness, twinkle, twinkle);
    ellipse(star.x, star.y, star.size);
  }
  
  // Removed the nebula-like clouds to clean up the background
}

// Unused function - kept for reference
function drawCloud(x, y, size, color, alpha) {
  noStroke();
  for (let i = 0; i < 6; i++) {
    let px = x + cos(i * TWO_PI/6) * size/2;
    let py = y + sin(i * TWO_PI/6) * size/2;
    let gradient = drawingContext.createRadialGradient(px, py, 0, px, py, size);
    gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha/100})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    drawingContext.fillStyle = gradient;
    drawingContext.beginPath();
    drawingContext.arc(px, py, size, 0, TWO_PI);
    drawingContext.fill();
  }
}

// Add this function after resetGame function
function getDifficultyScaling() {
  // Calculate scaling factors based on survival time
  // These will increase as the player survives longer
  let timeScaling = {
    // Speed scaling increases up to 100% over time
    speedScale: min(1 + (survivalTime / 120), 2.0),
    
    // Damage scaling increases up to 100% over time
    damageScale: min(1 + (survivalTime / 90), 2.0),
    
    // Spawn rate scaling increases up to 100% over time
    spawnScale: min(1 + (survivalTime / 150), 2.0)
  };
  
  return timeScaling;
}

// Modify the updateGame function to use the dynamic difficulty scaling
function updateGame() {
  // Player movement
  if (keyIsDown(LEFT_ARROW)) player.x -= player.speed;
  if (keyIsDown(RIGHT_ARROW)) player.x += player.speed;
  if (keyIsDown(UP_ARROW)) player.y -= player.speed;
  if (keyIsDown(DOWN_ARROW)) player.y += player.speed;
  player.x = constrain(player.x, 0, width);
  player.y = constrain(player.y, 0, height);

  // Energy depletion
  energy -= difficultySettings[difficulty].energyDrain / 60; // Drain based on difficulty
  survivalTime += 1 / 60;
  
  // Get current difficulty scaling based on survival time
  let difficultyScaling = getDifficultyScaling();
  
  // Update player light pulse
  player.lightPulse = (player.lightPulse + 0.05) % TWO_PI;
  player.lightIntensity = 0.8 + sin(player.lightPulse) * 0.2;
  
  // Update active effects timers
  for (let effect in activeEffects) {
    if (activeEffects[effect] > 0) {
      activeEffects[effect] -= 1/60;
    }
  }

  // Shadow Orbs - now with different enemy types
  for (let i = orbs.length - 1; i >= 0; i--) {
    let o = orbs[i];
    
    // Apply dynamic speed scaling to enemies based on survival time
    let scaledSpeed = o.baseSpeed || o.speed;
    scaledSpeed *= difficultyScaling.speedScale;
    
    // Update enemy based on its type
    switch(o.type) {
      case ENEMY_TYPES.HUNTER:
        // Standard chasing behavior
        let angle = atan2(player.y - o.y, player.x - o.x);
        o.x += cos(angle) * scaledSpeed;
        o.y += sin(angle) * scaledSpeed;
        break;
        
      case ENEMY_TYPES.DASHER:
        // Dash behavior - moves in bursts
        o.dashTimer -= 1/60;
        
        if (o.dashTimer <= 0) {
          if (o.isDashing) {
            // End dash, start cooldown
            o.isDashing = false;
            o.dashTimer = random(0.6, 1.2); // Reduced cooldown period for more frequent dashing
          } else {
            // Start dash
            o.isDashing = true;
            o.dashTimer = 0.5; // Dash duration
            o.dashAngle = atan2(player.y - o.y, player.x - o.x);
          }
        }
        
        if (o.isDashing) {
          o.x += cos(o.dashAngle) * scaledSpeed * 3.5; // Increased dash speed multiplier from 3.0
          o.y += sin(o.dashAngle) * scaledSpeed * 3.5;
          
          // Create trail particles during dash
          if (frameCount % 3 === 0) {
            createParticles(o.x, o.y, 1, [255, 100, 100]);
          }
        } else {
          // Slight movement during cooldown
          let angle = atan2(player.y - o.y, player.x - o.x);
          o.x += cos(angle) * scaledSpeed * 0.3;
          o.y += sin(angle) * scaledSpeed * 0.3;
        }
        break;
        
      case ENEMY_TYPES.SPLITTER:
        // Move slightly slower than hunters but still faster than before
        let splitterAngle = atan2(player.y - o.y, player.x - o.x);
        o.x += cos(splitterAngle) * scaledSpeed * 0.9; // Increased from 0.8
        o.y += sin(splitterAngle) * scaledSpeed * 0.9;
        break;
        
      case ENEMY_TYPES.BOMBER:
        // Move toward player, then explode when close
        let bomberAngle = atan2(player.y - o.y, player.x - o.x);
        let distToPlayer = dist(player.x, player.y, o.x, o.y);
        
        // Start explosion sequence when closer to player (reduced from 100 to 80)
        if (distToPlayer < 80 && !o.isExploding) {
          // Start explosion sequence
          o.isExploding = true;
          o.explosionTimer = 0.8; // Reduced from 1 second countdown
        }
        
        if (o.isExploding) {
          o.explosionTimer -= 1/60;
          
          // Pulsate during countdown
          o.pulseScale = 1 + sin(frameCount * 0.2) * 0.3;
          
          // Create warning particles
          if (frameCount % 5 === 0) {
            createParticles(o.x, o.y, 2, [255, 150, 0]);
          }
          
          // Explode when timer reaches zero
          if (o.explosionTimer <= 0) {
            // Create explosion particles with enhanced options
            createParticles(o.x, o.y, 50, [255, 100, 0], {
              minSize: 5,
              maxSize: 15,
              minSpeed: 3,
              maxSpeed: 8,
              lifespan: 1.5
            });
            
            // Create secondary explosion particles
            createParticles(o.x, o.y, 30, [255, 255, 0], {
              minSize: 2,
              maxSize: 8,
              minSpeed: 1,
              maxSpeed: 5,
              lifespan: 1.2
            });
            
            // Damage player if in explosion radius - increased from 120 to 150
            if (dist(player.x, player.y, o.x, o.y) < 150 && activeEffects.shield <= 0) {
              let explosionDamage = 150 * difficultySettings[difficulty].damageMultiplier * difficultyScaling.damageScale / 60; // Increased from 90 to 150
              energy -= explosionDamage;
              createParticles(player.x, player.y, 12, [255, 0, 0]);
            }
            
            // Remove the bomber
            orbs.splice(i, 1);
            score += 30;
            continue;
          }
        } else {
          // Normal movement when not exploding - faster than before
          o.x += cos(bomberAngle) * scaledSpeed * 0.85; // Increased from 0.7
          o.y += sin(bomberAngle) * scaledSpeed * 0.85;
        }
        break;
    }
    
    // Check for collision with player
    if (dist(player.x, player.y, o.x, o.y) < (o.size/2 + 10)) {
      if (activeEffects.shield <= 0) {
        // Apply damage based on difficulty and enemy type
        let baseDamage = o.damage / 60;
        let scaledDamage = baseDamage * difficultySettings[difficulty].damageMultiplier * difficultyScaling.damageScale;
        energy -= scaledDamage;
        
        // Create hit particles
        createParticles(player.x, player.y, 5, [255, 0, 0]);
      }
      
      // Handle splitter enemy destruction on collision
      if (o.type === ENEMY_TYPES.SPLITTER && o.size > 20) {
        // Create smaller splitters
        for (let j = 0; j < 2; j++) {
          createSplitterFragment(o.x, o.y, o.size * 0.6);
        }
        // No points for collision kills
        // score += 25;
        // No floating score text for collision kills
        // createFloatingText(o.x, o.y, "+25", [255, 255, 100]);
      } else if (o.type === ENEMY_TYPES.BOMBER) {
        // Trigger bomber explosion on collision
        createParticles(o.x, o.y, 20, [255, 100, 0]);
        
        // Damage player if in explosion radius and not shielded
        if (activeEffects.shield <= 0) {
          let explosionDamage = 75 * difficultySettings[difficulty].damageMultiplier * difficultyScaling.damageScale / 60; // Increased from 45 to 75
          energy -= explosionDamage; // Additional explosion damage
        }
        
        // No points for collision kills
        // score += 30;
        // No floating score text for collision kills
        // createFloatingText(o.x, o.y, "+30", [255, 255, 100]);
      } else {
        // Standard enemy destruction - no points for collision kills
        // let scoreValue = o.type === ENEMY_TYPES.DASHER ? 25 : 20;
        // score += scoreValue;
        // No floating score text for collision kills
        // createFloatingText(o.x, o.y, `+${scoreValue}`, [255, 255, 100]);
      }
      
      // Create destruction particles
      createParticles(o.x, o.y, 8, o.color);
      
      // Chance to spawn a power-up when defeating an enemy
      if (random() < 0.02 && powerUps.length < 2) { // Increased from 1% to 2% chance
        let type = random(powerUpTypes);
        powerUps.push({ 
          x: o.x, 
          y: o.y,
          type: type
        });
        
        // Create a burst of particles to make the power-up spawn more noticeable
        createParticles(o.x, o.y, 12, [0, 255, 255], {
          minSize: 3,
          maxSize: 8,
          minSpeed: 1,
          maxSpeed: 3,
          lifespan: 1.2
        });
      }
      
      // Remove the enemy
      orbs.splice(i, 1);
      continue;
    }
    
    // Remove if off-screen
    if (o.x < -50 || o.x > width + 50 || o.y < -50 || o.y > height + 50) {
      orbs.splice(i, 1);
    }
  }
  
  // Spawn orbs based on difficulty settings - using the new spawn rate parameter
  let orbChance = difficultySettings[difficulty].spawnRate + min(survivalTime / 120, 0.02);
  if (random() < orbChance) { // Removed the orbs.length limit to allow unlimited enemies
    spawnRandomEnemy();
  }

  // Sparks
  for (let i = sparks.length - 1; i >= 0; i--) {
    let s = sparks[i];
    if (dist(player.x, player.y, s.x, s.y) < 20) {
      energy = min(energy + 25, player.maxEnergy);
      score += 50;
      sparks.splice(i, 1);
      createParticles(s.x, s.y, 10, [255, 255, 0]);
    }
  }
  if (random() < difficultySettings[difficulty].sparkFrequency) {
    sparks.push({ x: random(width), y: random(height) });
  }
  
  // Power-ups with increased spawn rate
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let p = powerUps[i];
    if (dist(player.x, player.y, p.x, p.y) < 20) {
      activatePowerUp(p.type);
      powerUps.splice(i, 1);
      createParticles(p.x, p.y, 15, [0, 255, 255]);
      score += 100;
    }
  }
  // Only spawn new power-ups if there are fewer than 2 on screen
  if (random() < 0.0002 && powerUps.length < 2) { // Increased from 0.0001 to 0.0002
    let type = random(powerUpTypes);
    let x = random(width);
    let y = random(height);
    powerUps.push({ 
      x: x, 
      y: y,
      type: type
    });
    
    // Create a burst of particles to make the power-up spawn more noticeable
    createParticles(x, y, 12, [0, 255, 255], {
      minSize: 3,
      maxSize: 8,
      minSpeed: 1,
      maxSpeed: 3,
      lifespan: 1.2
    });
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Score increases with time
  score += 1;

  // Game over check
  if (energy <= 0) {
    energy = 0;
    gameState = "over";
    if (score > highScores[difficulty]) {
      // Update both the current highScore and the difficulty-specific highScore
      highScore = score;
      highScores[difficulty] = score;
      
      // Save high score to localStorage with difficulty-specific key
      localStorage.setItem(`glimmerHoldHighScore_${difficulty}`, score);
      console.log(`New ${difficulty} high score saved: ${score}`);
    }
  }
}

function drawGame() {
  // Draw light aura around player first (as a base layer)
  let playerGlow = drawingContext.createRadialGradient(
    player.x, player.y, 0, 
    player.x, player.y, 150 * player.lightIntensity
  );
  playerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  playerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  drawingContext.fillStyle = playerGlow;
  drawingContext.fillRect(0, 0, width, height);
  
  // Shadow Orbs with different enemy types
  noStroke();
  for (let o of orbs) {
    // Determine size based on enemy type and state
    let displaySize = o.size;
    if (o.type === ENEMY_TYPES.BOMBER && o.isExploding) {
      displaySize *= o.pulseScale;
    }
    
    // Outer glow
    let orbGlow = drawingContext.createRadialGradient(
      o.x, o.y, 0, 
      o.x, o.y, displaySize
    );
    
    // Use enemy-specific colors
    let orbColor = o.color;
    
    // Special effects for different enemy types
    if (o.type === ENEMY_TYPES.DASHER && o.isDashing) {
      // Brighter glow during dash
      orbGlow.addColorStop(0, `rgba(${orbColor[0]}, ${orbColor[1]}, ${orbColor[2]}, 0.8)`);
      orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (o.type === ENEMY_TYPES.BOMBER && o.isExploding) {
      // Pulsating red/orange for bomber countdown
      let pulseIntensity = 0.5 + sin(frameCount * 0.2) * 0.3;
      orbGlow.addColorStop(0, `rgba(255, ${100 + sin(frameCount * 0.3) * 50}, 0, ${pulseIntensity})`);
      orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      // Standard glow
      orbGlow.addColorStop(0, `rgba(${orbColor[0]}, ${orbColor[1]}, ${orbColor[2]}, 0.5)`);
      orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    
    drawingContext.fillStyle = orbGlow;
    drawingContext.beginPath();
    drawingContext.arc(o.x, o.y, displaySize, 0, TWO_PI);
    drawingContext.fill();
    
    // Core
    fill(orbColor[0], orbColor[1], orbColor[2], 200);
    ellipse(o.x, o.y, displaySize * 0.7);
    
    // Inner core with special effects for each enemy type
    switch(o.type) {
      case ENEMY_TYPES.HUNTER:
        // Standard red core
        fill(255, 150 + sin(frameCount * 0.1) * 50, 100);
        ellipse(o.x, o.y, displaySize * 0.3);
        break;
        
      case ENEMY_TYPES.DASHER:
        // Blue core with dash indicator
        if (o.isDashing) {
          fill(100, 100, 255);
          ellipse(o.x, o.y, displaySize * 0.4);
          
          // Direction indicator
          fill(255);
          let dx = cos(o.dashAngle) * displaySize * 0.25;
          let dy = sin(o.dashAngle) * displaySize * 0.25;
          triangle(
            o.x + dx, o.y + dy,
            o.x - dy * 0.5, o.y + dx * 0.5,
            o.x + dy * 0.5, o.y - dx * 0.5
          );
        } else {
          // Charging indicator
          let chargeProgress = 1 - (o.dashTimer / 2);
          fill(100, 100, 255);
          ellipse(o.x, o.y, displaySize * 0.3);
          
          // Charge ring
          noFill();
          stroke(255);
          strokeWeight(2);
          arc(o.x, o.y, displaySize * 0.5, displaySize * 0.5, 0, TWO_PI * chargeProgress);
          noStroke();
        }
        break;
        
      case ENEMY_TYPES.SPLITTER:
        // Purple core with split indicator
        fill(255, 100, 255);
        ellipse(o.x, o.y, displaySize * 0.3);
        
        // Split lines
        stroke(255, 200, 255, 150);
        strokeWeight(1);
        line(o.x - displaySize * 0.3, o.y, o.x + displaySize * 0.3, o.y);
        line(o.x, o.y - displaySize * 0.3, o.x, o.y + displaySize * 0.3);
        noStroke();
        break;
        
      case ENEMY_TYPES.BOMBER:
        // Orange/yellow core with countdown
        if (o.isExploding) {
          // Countdown visualization
          let countdownProgress = 1 - o.explosionTimer;
          
          // Pulsating core during explosion countdown
          fill(255, 150 + sin(frameCount * 0.3) * 50, 0);
          ellipse(o.x, o.y, displaySize * 0.4 * (1 + sin(frameCount * 0.2) * 0.2));
          
          // Countdown ring
          noFill();
          stroke(255, 255, 0);
          strokeWeight(3);
          arc(o.x, o.y, displaySize * 0.6, displaySize * 0.6, 0, TWO_PI * countdownProgress);
          
          // Add warning flashes as explosion gets closer
          if (o.explosionTimer < 0.3) {
            stroke(255, 0, 0, 150 + sin(frameCount * 0.5) * 100);
            strokeWeight(2);
            ellipse(o.x, o.y, displaySize * 0.8 + sin(frameCount * 0.5) * 10);
          }
          
          noStroke();
        } else {
          fill(255, 150, 0);
          ellipse(o.x, o.y, displaySize * 0.3);
        }
        break;
    }
  }

  // Sparks
  let sparkColor = difficultySettings[difficulty].sparkColor;
  for (let s of sparks) {
    // Outer glow
    let sparkGlow = drawingContext.createRadialGradient(
      s.x, s.y, 0, 
      s.x, s.y, 15 + sin(frameCount * 0.2) * 3
    );
    sparkGlow.addColorStop(0, `rgba(${sparkColor[0]}, ${sparkColor[1]}, 150, 0.7)`);
    sparkGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    drawingContext.fillStyle = sparkGlow;
    drawingContext.beginPath();
    drawingContext.arc(s.x, s.y, 15 + sin(frameCount * 0.2) * 3, 0, TWO_PI);
    drawingContext.fill();
    
    // Core
    fill(sparkColor[0], sparkColor[1], 150, 200 + sin(frameCount * 0.15) * 55);
    ellipse(s.x, s.y, 8);
    
    // Center
    fill(255);
    ellipse(s.x, s.y, 3);
  }
  
  // Power-ups with enhanced visuals
  for (let p of powerUps) {
    noStroke();
    
    // Outer glow
    let powerUpGlow;
    let glowColor;
    
    // Different colors for different power-ups
    if (p.type === "shield") {
      glowColor = [0, 100, 255];
    } else if (p.type === "speed") {
      glowColor = [0, 255, 100];
    } else if (p.type === "energy") {
      glowColor = [255, 100, 255];
    } else if (p.type === "blast") {
      glowColor = [255, 150, 0];
    }
    
    // Create glow effect
    powerUpGlow = drawingContext.createRadialGradient(
      p.x, p.y, 0, 
      p.x, p.y, 12  // Reduced from 20 to 12
    );
    powerUpGlow.addColorStop(0, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, 0.4)`);  // Reduced opacity from 0.7 to 0.4
    powerUpGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    drawingContext.fillStyle = powerUpGlow;
    drawingContext.beginPath();
    drawingContext.arc(p.x, p.y, 12, 0, TWO_PI);  // Reduced from 20 to 12
    drawingContext.fill();
    
    // Main power-up
    fill(glowColor[0], glowColor[1], glowColor[2], 200 + sin(frameCount * 0.15) * 55);
    ellipse(p.x, p.y, 15);
    
    // Icon in the middle
    fill(255);
    if (p.type === "shield") {
      ellipse(p.x, p.y, 8);
      noFill();
      stroke(255);
      strokeWeight(2);
      ellipse(p.x, p.y, 12);
      noStroke();
    } else if (p.type === "speed") {
      triangle(p.x - 4, p.y + 3, p.x - 4, p.y - 3, p.x + 4, p.y);
    } else if (p.type === "energy") {
      rect(p.x - 3, p.y - 3, 6, 6);
    } else if (p.type === "blast") {
      for (let a = 0; a < TWO_PI; a += PI/4) {
        let x2 = p.x + cos(a) * 4;
        let y2 = p.y + sin(a) * 4;
        ellipse(x2, y2, 2);
      }
    }
  }
  
  // Particles
  noStroke();
  for (let p of particles) {
    if (p.isText) {
      // Draw floating text
      textAlign(CENTER, CENTER);
      textSize(p.size || 16); // Use the stored size or default to 16
      fill(p.r, p.g, p.b, p.life * 255);
      text(p.text, p.x, p.y);
    } else {
      // Draw regular particles
      fill(p.r, p.g, p.b, p.life * 255);
      ellipse(p.x, p.y, p.size * p.life);
    }
  }

  // Player (Light)
  noStroke();
  
  // Shield effect
  if (activeEffects.shield > 0) {
    for (let r = 40; r > 35; r -= 1) {
      fill(0, 100, 255, 50 + sin(frameCount * 0.2) * 20);
      ellipse(player.x, player.y, r + 10);
    }
    
    // Add shield particles
    if (frameCount % 5 === 0) {
      let angle = random(TWO_PI);
      let distance = 30;
      createParticles(
        player.x + cos(angle) * distance,
        player.y + sin(angle) * distance,
        1,
        [0, 100, 255]
      );
    }
  }
  
  // Speed effect
  if (activeEffects.speed > 0) {
    for (let i = 0; i < 5; i++) {
      fill(0, 255, 100, 100 - i * 20);
      ellipse(player.x - cos(frameCount * 0.1) * i * 3, 
              player.y - sin(frameCount * 0.1) * i * 3, 15 - i * 2);
    }
    
    // Add speed trail
    if (frameCount % 3 === 0) {
      createParticles(player.x, player.y, 1, [0, 255, 100]);
    }
  }
  
  // Player light with enhanced glow
  let playerCoreGlow = drawingContext.createRadialGradient(
    player.x, player.y, 0, 
    player.x, player.y, 30 * player.lightIntensity
  );
  playerCoreGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
  playerCoreGlow.addColorStop(0.5, 'rgba(200, 220, 255, 0.8)');
  playerCoreGlow.addColorStop(1, 'rgba(100, 150, 255, 0)');
  drawingContext.fillStyle = playerCoreGlow;
  drawingContext.beginPath();
  drawingContext.arc(player.x, player.y, 30 * player.lightIntensity, 0, TWO_PI);
  drawingContext.fill();
  
  // Player core
  fill(255);
  ellipse(player.x, player.y, 10);

  // UI
  drawUI();
}

function drawUI() {
  // Energy bar background with gradient
  noStroke();
  let barWidth = 200;
  let barHeight = 20;
  let barX = 20;
  let barY = 20;
  let cornerRadius = 10;
  
  // Background gradient
  let barGradient = drawingContext.createLinearGradient(barX, barY, barX + barWidth, barY);
  barGradient.addColorStop(0, 'rgba(30, 30, 40, 0.7)');
  barGradient.addColorStop(1, 'rgba(40, 40, 60, 0.7)');
  drawingContext.fillStyle = barGradient;
  
  // Draw rounded rectangle manually instead of using roundRect
  drawRoundedRect(barX, barY, barWidth, barHeight, cornerRadius);
  
  // Energy level with gradient
  let energyColor;
  let energyPercentage = (energy / player.maxEnergy) * 100;
  
  if (energyPercentage < 25) {
    energyColor = [255, 50, 50]; // Red
  } else if (energyPercentage < 50) {
    energyColor = [255, 255, 50]; // Yellow
  } else {
    energyColor = [50, 255, 100]; // Green
  }
  
  let energyWidth = (energy / player.maxEnergy) * barWidth;
  let energyGradient = drawingContext.createLinearGradient(barX, barY, barX + energyWidth, barY);
  energyGradient.addColorStop(0, `rgba(${energyColor[0]}, ${energyColor[1]}, ${energyColor[2]}, 0.8)`);
  energyGradient.addColorStop(1, `rgba(${energyColor[0] + 50}, ${energyColor[1] + 50}, ${energyColor[2] + 50}, 0.8)`);
  drawingContext.fillStyle = energyGradient;
  
  // Draw rounded rectangle manually for energy bar
  if (energyWidth > 0) {
    drawRoundedRect(barX, barY, energyWidth, barHeight, cornerRadius);
  }
  
  // Energy text - show just the current energy value with a percent symbol for all character types
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  
  // Display just the current energy value with a percent symbol
  text(`${floor(energy)}%`, barX + barWidth/2, barY + barHeight/2);
  
  // Time and score with enhanced styling
  fill(255);
  textAlign(RIGHT, TOP);
  textSize(18);
  
  // Time display with icon
  text(`${floor(survivalTime)}s`, width - 20, barY);
  noStroke();
  fill(200, 200, 255);
  ellipse(width - 10, barY + 10, 6);
  
  // Score display with icon
  text(`${score}`, width - 20, barY + 30);
  fill(255, 255, 100);
  ellipse(width - 10, barY + 40, 6);
  
  // Active effects with enhanced styling
  textAlign(LEFT, TOP);
  let effectY = barY + 30;
  for (let effect in activeEffects) {
    if (activeEffects[effect] > 0) {
      // Effect background
      noStroke();
      let effectWidth = 120;
      let effectHeight = 20;
      let effectX = barX;
      
      if (effect === "shield") {
        fill(0, 100, 255, 100);
        rect(effectX, effectY, effectWidth, effectHeight, 5);
        fill(0, 150, 255);
        text(`Shield: ${floor(activeEffects[effect])}s`, effectX + 10, effectY + 3);
      } else if (effect === "speed") {
        fill(0, 255, 100, 100);
        rect(effectX, effectY, effectWidth, effectHeight, 5);
        fill(0, 255, 150);
        text(`Speed: ${floor(activeEffects[effect])}s`, effectX + 10, effectY + 3);
      }
      effectY += 25;
    }
  }
  
  // Difficulty indicator with enhanced styling
  textAlign(CENTER, TOP);
  let diffX = width/2;
  let diffY = barY;
  let diffWidth = 100;
  let diffHeight = 25;
  
  // Difficulty background
  noStroke();
  if (difficulty === "easy") {
    fill(0, 150, 0, 150);
  } else if (difficulty === "normal") {
    fill(150, 150, 0, 150);
  } else if (difficulty === "hard") {
    fill(150, 0, 0, 150);
  } else if (difficulty === "insane") {
    fill(150, 0, 150, 150);
  }
  rect(diffX - diffWidth/2, diffY, diffWidth, diffHeight, 5);
  
  // Difficulty text
  if (difficulty === "easy") {
    fill(100, 255, 100);
  } else if (difficulty === "normal") {
    fill(255, 255, 100);
  } else if (difficulty === "hard") {
    fill(255, 100, 100);
  } else if (difficulty === "insane") {
    fill(255, 100, 255);
  }
  textSize(16);
  text(difficulty.toUpperCase(), diffX, diffY + 5);
  
  // Display damage multiplier
  textSize(12);
  fill(255, 200, 200);
  text(`DMG x${difficultySettings[difficulty].damageMultiplier.toFixed(1)}`, diffX, diffY + 30);
  textSize(20);
  
  // Controls reminder
  textAlign(CENTER, BOTTOM);
  fill(200, 200, 200, 150);
  textSize(14);
  text("SPACE: Blast", width/2, height - 10);
  textSize(20);

  // Character type indicator
  textAlign(CENTER, TOP);
  let charX = width/2;
  let charY = barY + 50;
  let charWidth = 120;
  let charHeight = 25;
  
  // Character background
  noStroke();
  if (characterType === "balanced") {
    fill(100, 100, 200, 150);
  } else if (characterType === "tank") {
    fill(100, 200, 100, 150);
  } else if (characterType === "scout") {
    fill(200, 100, 100, 150);
  }
  rect(charX - charWidth/2, charY, charWidth, charHeight, 5);
  
  // Character text
  if (characterType === "balanced") {
    fill(150, 150, 255);
  } else if (characterType === "tank") {
    fill(150, 255, 150);
  } else if (characterType === "scout") {
    fill(255, 150, 150);
  }
  textSize(16);
  text(characterTypes[characterType].name, charX, charY + 5);
}

// Helper function to draw rounded rectangles
function drawRoundedRect(x, y, width, height, radius) {
  drawingContext.beginPath();
  drawingContext.moveTo(x + radius, y);
  drawingContext.lineTo(x + width - radius, y);
  drawingContext.arcTo(x + width, y, x + width, y + radius, radius);
  drawingContext.lineTo(x + width, y + height - radius);
  drawingContext.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  drawingContext.lineTo(x + radius, y + height);
  drawingContext.arcTo(x, y + height, x, y + height - radius, radius);
  drawingContext.lineTo(x, y + radius);
  drawingContext.arcTo(x, y, x + radius, y, radius);
  drawingContext.closePath();
  drawingContext.fill();
}

function drawTitleScreen() {
  // Title with glow effect - moved up even more
  let titleX = width/2;
  let titleY = height/6; // Moved up from height/5
  
  // Title glow
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = "rgba(100, 100, 255, 0.8)";
  
  fill(255);
  textSize(50);
  text("GLIMMER HOLD", titleX, titleY);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Subtitle with animation - increased spacing
  textSize(20);
  fill(200, 200, 255, 150 + sin(frameCount * 0.05) * 50);
  text("A GAME OF LIGHT AND SURVIVAL", titleX, titleY + 60);
  
  // Enemy types info - increased spacing
  textSize(14);
  let enemyInfoY = titleY + 110;
  fill(220, 30, 30);
  text("HUNTERS", titleX - 150, enemyInfoY);
  fill(30, 30, 220);
  text("DASHERS", titleX - 50, enemyInfoY);
  fill(220, 30, 220);
  text("SPLITTERS", titleX + 50, enemyInfoY);
  fill(255, 120, 0);
  text("BOMBERS", titleX + 150, enemyInfoY);
  
  // Enemy descriptions - increased spacing
  textSize(12);
  fill(180);
  let enemyDescY = enemyInfoY + 25;
  text("Fast pursuit", titleX - 150, enemyDescY);
  text("Rapid bursts", titleX - 50, enemyDescY);
  text("Split when hit", titleX + 50, enemyDescY);
  text("Explode near you", titleX + 150, enemyDescY);
  
  // Draw example enemies
  drawExampleEnemies(titleX, enemyInfoY - 5);
  
  // Character selection title - moved up
  textSize(18);
  fill(200, 200, 255);
  let charTitleY = enemyDescY + 40; // Changed from 50 to 40 to move up slightly
  text("SELECT CHARACTER", titleX, charTitleY);
  
  // Character selection buttons - moved up
  let charY = charTitleY + 50;
  let charWidth = 120;
  let charHeight = 80;
  let charSpacing = 140;
  
  // Balanced character
  drawCharacterButton(
    titleX - charSpacing, 
    charY, 
    charWidth, 
    charHeight, 
    "balanced",
    [100, 100, 200]
  );
  
  // Tank character
  drawCharacterButton(
    titleX, 
    charY, 
    charWidth, 
    charHeight, 
    "tank",
    [100, 200, 100]
  );
  
  // Scout character
  drawCharacterButton(
    titleX + charSpacing, 
    charY, 
    charWidth, 
    charHeight, 
    "scout",
    [200, 100, 100]
  );
  
  // Calculate position for UI elements
  let controlsY = charY + charHeight/2 + 40;
  
  // Display high score - in the position where controls text used to be
  textSize(18);
  fill(255, 215, 0); // Gold color
  text(`HIGH SCORE: ${highScores[difficulty]}`, titleX, controlsY);
  
  // Start button with animation - adjusted position since high score moved up
  let startY = controlsY + 40; // Adjusted from 65 to 40
  let startWidth = 250;
  let startHeight = 40;
  
  // Check if mouse is over start button
  let isHovering = (
    mouseX > titleX - startWidth/2 &&
    mouseX < titleX + startWidth/2 &&
    mouseY > startY - startHeight/2 &&
    mouseY < startY + startHeight/2
  );
  
  // Draw start button
  noStroke();
  fill(50, 50, 150, isHovering ? 200 : 150);
  rect(titleX - startWidth/2, startY - startHeight/2, startWidth, startHeight, 10);
  
  // Button border
  noFill();
  stroke(100, 100, 255, isHovering ? 255 : 150 + sin(frameCount * 0.1) * 50);
  strokeWeight(2);
  rect(titleX - startWidth/2, startY - startHeight/2, startWidth, startHeight, 10);
  
  // Button text
  noStroke();
  fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 100);
  textSize(24);
  text("START GAME", titleX, startY + 5);
  
  // Difficulty selection with enhanced styling
  let diffY = startY + 60;
  
  // Center the difficulty section
  textSize(18);
  fill(200);
  
  // Calculate total width of all difficulty buttons and spacing
  let easyWidth = 50;
  let normalWidth = 70;
  let hardWidth = 50;
  let insaneWidth = 70;
  let buttonSpacing = 20; // Space between buttons
  let labelWidth = 100; // Approximate width of "DIFFICULTY:" text
  
  // Total width of all elements in the difficulty section
  let totalWidth = labelWidth + easyWidth + normalWidth + hardWidth + insaneWidth + (buttonSpacing * 4);
  
  // Start position to center everything
  let diffX = titleX - totalWidth/2;
  
  // Draw the difficulty label - moved to the left
  text("DIFFICULTY:", diffX + labelWidth/2 - 20, diffY); // Shifted 20 pixels to the left
  diffX += labelWidth + buttonSpacing;
  
  // Easy button
  // Button background - always use darker shade
  noStroke();
  fill(100, 150, 100, 150);
  rect(diffX - easyWidth/2, diffY - 15, easyWidth, 30, 5);
  
  // Button border - highlighted when selected
  noFill();
  if (difficulty === "easy") {
    stroke(100, 255, 100, 255);
    strokeWeight(3);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(0, 255, 0, 0.5)";
  } else {
    stroke(100, 150, 100, 150);
    strokeWeight(2);
  }
  rect(diffX - easyWidth/2, diffY - 15, easyWidth, 30, 5);
  
  // Button text
  noStroke();
  fill(255);
  text("EASY", diffX, diffY);
  
  // Display damage multiplier below the button
  textSize(12);
  fill(200);
  text(`x${difficultySettings.easy.damageMultiplier.toFixed(1)}`, diffX, diffY + 25);
  textSize(18);
  
  // Normal button
  diffX += easyWidth/2 + buttonSpacing + normalWidth/2;
  drawingContext.shadowBlur = 0;
  
  // Button background - always use darker shade
  noStroke();
  fill(150, 150, 100, 150);
  rect(diffX - normalWidth/2, diffY - 15, normalWidth, 30, 5);
  
  // Button border - highlighted when selected
  noFill();
  if (difficulty === "normal") {
    stroke(255, 255, 100, 255);
    strokeWeight(3);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(255, 255, 0, 0.5)";
  } else {
    stroke(150, 150, 100, 150);
    strokeWeight(2);
  }
  rect(diffX - normalWidth/2, diffY - 15, normalWidth, 30, 5);
  
  // Button text
  noStroke();
  fill(255);
  text("NORMAL", diffX, diffY);
  
  // Display damage multiplier below the button
  textSize(12);
  fill(200);
  text(`x${difficultySettings.normal.damageMultiplier.toFixed(1)}`, diffX, diffY + 25);
  textSize(18);
  
  // Hard button
  diffX += normalWidth/2 + buttonSpacing + hardWidth/2;
  drawingContext.shadowBlur = 0;
  
  // Button background - always use darker shade
  noStroke();
  fill(150, 100, 100, 150);
  rect(diffX - hardWidth/2, diffY - 15, hardWidth, 30, 5);
  
  // Button border - highlighted when selected
  noFill();
  if (difficulty === "hard") {
    stroke(255, 100, 100, 255);
    strokeWeight(3);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(255, 0, 0, 0.5)";
  } else {
    stroke(150, 100, 100, 150);
    strokeWeight(2);
  }
  rect(diffX - hardWidth/2, diffY - 15, hardWidth, 30, 5);
  
  // Button text
  noStroke();
  fill(255);
  text("HARD", diffX, diffY);
  
  // Display damage multiplier below the button
  textSize(12);
  fill(200);
  text(`x${difficultySettings.hard.damageMultiplier.toFixed(1)}`, diffX, diffY + 25);
  textSize(18);
  
  // Insane button
  diffX += hardWidth/2 + buttonSpacing + insaneWidth/2;
  drawingContext.shadowBlur = 0;
  
  // Button background - always use darker shade
  noStroke();
  fill(150, 100, 150, 150);
  rect(diffX - insaneWidth/2, diffY - 15, insaneWidth, 30, 5);
  
  // Button border - highlighted when selected
  noFill();
  if (difficulty === "insane") {
    stroke(255, 100, 255, 255);
    strokeWeight(3);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(255, 0, 255, 0.5)";
  } else {
    stroke(150, 100, 150, 150);
    strokeWeight(2);
  }
  rect(diffX - insaneWidth/2, diffY - 15, insaneWidth, 30, 5);
  
  // Button text
  noStroke();
  fill(255);
  text("INSANE", diffX, diffY);
  
  // Display damage multiplier below the button
  textSize(12);
  fill(200);
  text(`x${difficultySettings.insane.damageMultiplier.toFixed(1)}`, diffX, diffY + 25);
  textSize(18);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Controls text at the bottom of the screen
  textSize(16);
  fill(180);
  textAlign(CENTER, BOTTOM);
  text("Arrow Keys: Move | Space: Blast", width/2, height - 20);
  textAlign(CENTER, CENTER); // Reset text alignment
}

// Function to draw character selection buttons
function drawCharacterButton(x, y, w, h, type, color) {
  // Check if mouse is over this character button
  let isHovering = (
    mouseX > x - w/2 &&
    mouseX < x + w/2 &&
    mouseY > y - h/2 &&
    mouseY < y + h/2
  );
  
  // Check if this is the selected character
  let isSelected = (characterType === type);
  
  // Button background
  noStroke();
  fill(color[0]/3, color[1]/3, color[2]/3, isHovering ? 200 : 150);
  rect(x - w/2, y - h/2, w, h, 10);
  
  // Button border
  noFill();
  if (isSelected) {
    stroke(color[0], color[1], color[2], 255);
    strokeWeight(3);
  } else {
    stroke(color[0], color[1], color[2], isHovering ? 200 : 150);
    strokeWeight(2);
  }
  rect(x - w/2, y - h/2, w, h, 10);
  
  // Character name
  noStroke();
  fill(color[0], color[1], color[2]);
  textSize(18);
  textAlign(CENTER, TOP);
  text(characterTypes[type].name, x, y - h/2 + 15);
  
  // Character description text instead of stats - reduced font size
  textSize(12); // Reduced from 14 to 12
  fill(255);
  textAlign(CENTER, CENTER);
  
  // Different descriptions based on character type
  let description;
  if (type === "balanced") {
    description = "Balanced";
  } else if (type === "tank") {
    description = "Slow but strong";
  } else if (type === "scout") {
    description = "Fast but fragile";
  }
  
  // Draw the description text in the center of the button
  text(description, x, y + 10);
}

function drawGameOver() {
  // Draw the game in the background
  drawGame();
  
  // Semi-transparent overlay with gradient
  drawingContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  drawingContext.fillRect(0, 0, width, height);
  
  // Add vignette effect
  let vignetteGradient = drawingContext.createRadialGradient(
    width/2, height/2, 100, 
    width/2, height/2, width/1.5
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  drawingContext.fillStyle = vignetteGradient;
  drawingContext.fillRect(0, 0, width, height);
  
  // Game over text with glow effect
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = "rgba(255, 0, 0, 0.8)";
  
  fill(255, 50, 50);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("GAME OVER", width/2, height/3 - 40);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Create a decorative line
  stroke(255, 50, 50, 150);
  strokeWeight(2);
  line(width/2 - 100, height/3 - 10, width/2 + 100, height/3 - 10);
  noStroke();
  
  // Stats with enhanced styling
  let statsX = width/2;
  let statsY = height/3 + 10;
  let statsSpacing = 35;
  
  // Time stat
  textSize(24);
  fill(200, 200, 255);
  text("SURVIVAL TIME", statsX, statsY);
  
  textSize(32);
  fill(255);
  text(`${floor(survivalTime)}s`, statsX, statsY + 30);
  
  // Score stat
  textSize(24);
  fill(255, 255, 100);
  text("FINAL SCORE", statsX, statsY + 70);
  
  textSize(32);
  fill(255);
  text(`${score}`, statsX, statsY + 100);
  
  // High score with animation if new high score
  textSize(20);
  if (score > highScore - 1) { // New high score (or tied)
    fill(255, 200, 0, 150 + sin(frameCount * 0.1) * 100);
    text("NEW HIGH SCORE!", statsX, statsY + 135);
  } else {
    fill(150, 150, 150);
    text(`High Score: ${highScore}`, statsX, statsY + 135);
  }
  
  // Character type indicator
  textSize(18);
  if (characterType === "balanced") {
    fill(150, 150, 255);
  } else if (characterType === "tank") {
    fill(150, 255, 150);
  } else if (characterType === "scout") {
    fill(255, 150, 150);
  }
  text(`Character: ${characterTypes[characterType].name}`, statsX, statsY + 165);
  
  // Difficulty indicator
  textSize(18);
  if (difficulty === "easy") {
    fill(100, 255, 100);
  } else if (difficulty === "normal") {
    fill(255, 255, 100);
  } else if (difficulty === "hard") {
    fill(255, 100, 100);
  } else if (difficulty === "insane") {
    fill(255, 100, 255);
  }
  text(`Difficulty: ${difficulty.toUpperCase()}`, statsX, statsY + 195);
  
  // Display damage multiplier
  textSize(14);
  fill(255, 200, 200);
  text(`Damage Multiplier: x${difficultySettings[difficulty].damageMultiplier.toFixed(1)}`, statsX, statsY + 220);
  
  // Create button-like elements for restart options
  let buttonY = height * 3/4 + 20;
  let buttonWidth = 200;
  let buttonHeight = 40;
  let buttonSpacing = 50;
  
  // Clear previous buttons
  gameOverButtons = [];
  
  // Restart button
  drawButton(
    width/2, 
    buttonY, 
    buttonWidth, 
    buttonHeight, 
    "RESTART", 
    [100, 100, 255],
    function() {
      // Reset the game before showing loading screen
      resetGame();
      
      // Show loading screen
      showLoadingScreen();
      
      // Set a timer to transition to playing state
      setTimeout(() => {
        gameState = "playing";
        hideLoadingScreen();
      }, 1500);
    }
  );
  
  // Title screen button
  drawButton(
    width/2, 
    buttonY + buttonSpacing, 
    buttonWidth, 
    buttonHeight, 
    "TITLE SCREEN", 
    [100, 255, 100],
    function() {
      gameState = "title";
    }
  );
  
  // Add some particles for visual effect
  if (frameCount % 5 === 0) {
    createParticles(
      random(width), 
      random(height), 
      1, 
      [255, random(0, 100), random(0, 100)]
    );
  }
}

// Track buttons for click handling
let gameOverButtons = [];

function drawButton(x, y, w, h, label, color, clickHandler) {
  // Store button data for click detection
  gameOverButtons.push({
    x: x,
    y: y,
    width: w,
    height: h,
    handler: clickHandler
  });
  
  // Button background
  noStroke();
  fill(color[0]/5, color[1]/5, color[2]/5, 200);
  rect(x - w/2, y - h/2, w, h, 10);
  
  // Button border
  noFill();
  stroke(color[0], color[1], color[2]);
  strokeWeight(2);
  rect(x - w/2, y - h/2, w, h, 10);
  
  // Button text
  noStroke();
  fill(color[0], color[1], color[2]);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x, y);
  
  // Button hover effect (simulated with animation)
  noFill();
  stroke(color[0], color[1], color[2], 50 + sin(frameCount * 0.1) * 50);
  strokeWeight(1);
  rect(x - w/2 - 3, y - h/2 - 3, w + 6, h + 6, 12);
}

function mousePressed() {
  // Don't process mouse presses during loading
  if (isLoading) return;
  
  if (gameState === "over") {
    checkButtonClicks();
  } else if (gameState === "title") {
    // Handle character selection
    let titleX = width/2;
    let titleY = height/6; // Updated to match drawTitleScreen
    
    // Calculate positions based on the same logic as in drawTitleScreen
    let enemyInfoY = titleY + 110;
    let enemyDescY = enemyInfoY + 25;
    let charTitleY = enemyDescY + 40; // Changed from 50 to 40 to match the updated position
    let charY = charTitleY + 50;
    let charWidth = 120;
    let charHeight = 80;
    let charSpacing = 140;
    
    // Balanced character button
    if (
      mouseX > (titleX - charSpacing) - charWidth/2 &&
      mouseX < (titleX - charSpacing) + charWidth/2 &&
      mouseY > charY - charHeight/2 &&
      mouseY < charY + charHeight/2
    ) {
      characterType = "balanced";
    }
    
    // Tank character button
    if (
      mouseX > titleX - charWidth/2 &&
      mouseX < titleX + charWidth/2 &&
      mouseY > charY - charHeight/2 &&
      mouseY < charY + charHeight/2
    ) {
      characterType = "tank";
    }
    
    // Scout character button
    if (
      mouseX > (titleX + charSpacing) - charWidth/2 &&
      mouseX < (titleX + charSpacing) + charWidth/2 &&
      mouseY > charY - charHeight/2 &&
      mouseY < charY + charHeight/2
    ) {
      characterType = "scout";
    }
    
    // Calculate more positions
    let controlsY = charY + charHeight/2 + 40;
    let startY = controlsY + 40; // Updated to match the new position in drawTitleScreen
    let startWidth = 250;
    let startHeight = 40;
    let diffY = startY + 60;
    
    // Handle difficulty button clicks in title screen
    // Calculate the same button dimensions as in drawTitleScreen
    let easyWidth = 50;
    let normalWidth = 70;
    let hardWidth = 50;
    let insaneWidth = 70;
    let buttonSpacing = 20;
    let labelWidth = 100;
    
    // Total width of all elements in the difficulty section
    let totalWidth = labelWidth + easyWidth + normalWidth + hardWidth + insaneWidth + (buttonSpacing * 4);
    
    // Start position to center everything
    let diffX = titleX - totalWidth/2;
    
    // Skip the label
    diffX += labelWidth + buttonSpacing;
    
    // Easy button
    if (
      mouseX > diffX - easyWidth/2 &&
      mouseX < diffX + easyWidth/2 &&
      mouseY > diffY - 15 &&
      mouseY < diffY + 15
    ) {
      difficulty = "easy";
      highScore = highScores[difficulty]; // Update current highScore to match selected difficulty
    }
    
    // Normal button
    diffX += easyWidth/2 + buttonSpacing + normalWidth/2;
    if (
      mouseX > diffX - normalWidth/2 &&
      mouseX < diffX + normalWidth/2 &&
      mouseY > diffY - 15 &&
      mouseY < diffY + 15
    ) {
      difficulty = "normal";
      highScore = highScores[difficulty]; // Update current highScore to match selected difficulty
    }
    
    // Hard button
    diffX += normalWidth/2 + buttonSpacing + hardWidth/2;
    if (
      mouseX > diffX - hardWidth/2 &&
      mouseX < diffX + hardWidth/2 &&
      mouseY > diffY - 15 &&
      mouseY < diffY + 15
    ) {
      difficulty = "hard";
      highScore = highScores[difficulty]; // Update current highScore to match selected difficulty
    }
    
    // Insane button
    diffX += hardWidth/2 + buttonSpacing + insaneWidth/2;
    if (
      mouseX > diffX - insaneWidth/2 &&
      mouseX < diffX + insaneWidth/2 &&
      mouseY > diffY - 15 &&
      mouseY < diffY + 15
    ) {
      difficulty = "insane";
      highScore = highScores[difficulty]; // Update current highScore to match selected difficulty
    }
    
    // Start game button
    if (
      mouseX > titleX - startWidth/2 &&
      mouseX < titleX + startWidth/2 &&
      mouseY > startY - startHeight/2 &&
      mouseY < startY + startHeight/2
    ) {
      // Reset the game before showing loading screen
      resetGame();
      
      // Show loading screen which will display the title text
      showLoadingScreen();
      setTimeout(() => {
        gameState = "playing";
        hideLoadingScreen();
      }, 1500);
    }
  }
}

function checkButtonClicks() {
  for (let button of gameOverButtons) {
    if (
      mouseX > button.x - button.width/2 &&
      mouseX < button.x + button.width/2 &&
      mouseY > button.y - button.height/2 &&
      mouseY < button.y + button.height/2
    ) {
      button.handler();
      break;
    }
  }
  
  // Clear buttons array after checking
  gameOverButtons = [];
}

function keyPressed() {
  // Don't process key presses during loading
  if (isLoading) return;
  
  // Title screen controls
  if (gameState === "title") {
    if (keyCode === ENTER) {
      // Reset the game before showing loading screen
      resetGame();
      
      // Show loading screen
      showLoadingScreen();
      
      // Set a timer to transition to playing state
      setTimeout(() => {
      gameState = "playing";
        hideLoadingScreen();
      }, 1500);
    } else if (keyCode === SHIFT) {
      cycleDifficulty();
    }
    return;
  }
  
  // Game controls
  if (key === ' ' && gameState === "playing") {
    useBlast();
  }
  
  // Pause functionality removed
  
  // Game over controls
  if (key === 'r' && gameState === "over") {
    // Reset the game before showing loading screen
    resetGame();
    
    // Show loading screen
    showLoadingScreen();
    
    // Set a timer to transition to playing state
    setTimeout(() => {
    gameState = "playing";
      hideLoadingScreen();
    }, 1500);
  }
  
  if (key === 't' && gameState === "over") {
    gameState = "title";
  }
}

function useBlast() {
  if (energy >= 20) {
    energy -= 20;
    
    // Get current difficulty scaling based on survival time
    let difficultyScaling = getDifficultyScaling();
    
    // Visual effect
    createParticles(player.x, player.y, 30, [255, 150, 0]);
    
    // Add dash functionality
    // Determine dash direction based on arrow keys or default to right if no keys pressed
    let dashX = 0;
    let dashY = 0;
    let dashDistance = player.speed * 20; // Increased from 10 to 20 for much longer dash
    
    if (keyIsDown(LEFT_ARROW)) dashX = -1;
    else if (keyIsDown(RIGHT_ARROW)) dashX = 1;
    
    if (keyIsDown(UP_ARROW)) dashY = -1;
    else if (keyIsDown(DOWN_ARROW)) dashY = 1;
    
    // If no direction keys are pressed, dash forward based on last movement
    if (dashX === 0 && dashY === 0) {
      dashX = 1; // Default dash to the right if no direction
    }
    
    // Normalize diagonal movement
    if (dashX !== 0 && dashY !== 0) {
      let magnitude = Math.sqrt(dashX * dashX + dashY * dashY);
      dashX = dashX / magnitude;
      dashY = dashY / magnitude;
    }
    
    // Apply dash movement
    player.x += dashX * dashDistance;
    player.y += dashY * dashDistance;
    
    // Constrain player position to canvas boundaries
    player.x = constrain(player.x, 0, width);
    player.y = constrain(player.y, 0, height);
    
    // Create dash trail particles - increase number of particles for longer trail
    for (let i = 0; i < 25; i++) {
      let trailX = player.x - dashX * (i * dashDistance / 25);
      let trailY = player.y - dashY * (i * dashDistance / 25);
      createParticles(trailX, trailY, 2, [100, 150, 255]);
    }
    
    // Remove nearby orbs and handle special cases
    for (let i = orbs.length - 1; i >= 0; i--) {
      let o = orbs[i];
      let distToPlayer = dist(player.x, player.y, o.x, o.y);
      
      if (distToPlayer < 100) {
        // Handle special enemy types
        if (o.type === ENEMY_TYPES.SPLITTER && o.size > 20) {
          // Create smaller splitters
          for (let j = 0; j < 2; j++) {
            createSplitterFragment(o.x, o.y, o.size * 0.6);
          }
        } else if (o.type === ENEMY_TYPES.BOMBER && !o.isExploding) {
          // Trigger bomber explosion with enhanced particles
          createParticles(o.x, o.y, 50, [255, 100, 0], {
            minSize: 5,
            maxSize: 15,
            minSpeed: 3,
            maxSpeed: 8,
            lifespan: 1.5
          });
          
          // Create secondary explosion particles
          createParticles(o.x, o.y, 30, [255, 255, 0], {
            minSize: 2,
            maxSize: 8,
            minSpeed: 1,
            maxSpeed: 5,
            lifespan: 1.2
          });
          
          // Check if player is in explosion radius
          if (distToPlayer < 150 && activeEffects.shield <= 0) { // Increased from 120
            let explosionDamage = 150 * difficultySettings[difficulty].damageMultiplier * difficultyScaling.damageScale / 60; // Increased from 90 to 150
            energy -= explosionDamage;
            createParticles(player.x, player.y, 12, [255, 0, 0]);
          }
          
          // Create a burst of particles to make the power-up spawn more noticeable
          createParticles(o.x, o.y, 12, [0, 255, 255], {
            minSize: 3,
            maxSize: 8,
            minSpeed: 1,
            maxSpeed: 3,
            lifespan: 1.2
          });
        }
        
        // Remove the enemy and add score based on type
        let scoreValue = 20;
        if (o.type === ENEMY_TYPES.DASHER) scoreValue = 25;
        if (o.type === ENEMY_TYPES.BOMBER) scoreValue = 30;
        if (o.type === ENEMY_TYPES.SPLITTER) scoreValue = 25;
        
        // Increase score value for blast kills (300% bonus - 3x more points)
        scoreValue = Math.floor(scoreValue * 3);
        
        score += scoreValue;
        createParticles(o.x, o.y, 5, [255, 0, 0]);
        
        // Create floating score text with larger font to emphasize higher score
        createFloatingText(o.x, o.y, `+${scoreValue}`, [255, 255, 0], 20);
        
        // Chance to spawn a power-up when defeating an enemy with blast
        if (random() < 0.02 && powerUps.length < 2) { // Increased from 1% to 2% chance
          let type = random(powerUpTypes);
          powerUps.push({ 
            x: o.x, 
            y: o.y,
            type: type
          });
          
          // Create a burst of particles to make the power-up spawn more noticeable
          createParticles(o.x, o.y, 12, [0, 255, 255], {
            minSize: 3,
            maxSize: 8,
            minSpeed: 1,
            maxSpeed: 3,
            lifespan: 1.2
          });
        }
        
        orbs.splice(i, 1);
      }
    }
  }
}

function activatePowerUp(type) {
  switch(type) {
    case "shield":
      activeEffects.shield = 10; // 10 seconds of shield
      break;
    case "speed":
      activeEffects.speed = 8; // 8 seconds of speed boost
      break;
    case "energy":
      energy = player.maxEnergy; // Full energy based on character type
      break;
    case "blast":
      // Super blast that clears the whole screen
      let totalScore = 0;
      for (let i = orbs.length - 1; i >= 0; i--) {
        let o = orbs[i];
        createParticles(o.x, o.y, 5, [255, 0, 0]);
        
        // Determine score based on enemy type
        let scoreValue = 20;
        if (o.type === ENEMY_TYPES.DASHER) scoreValue = 25;
        if (o.type === ENEMY_TYPES.BOMBER) scoreValue = 30;
        if (o.type === ENEMY_TYPES.SPLITTER) scoreValue = 25;
        
        // Bonus for blast power-up (quadruple points - 4x)
        scoreValue *= 4;
        
        score += scoreValue;
        totalScore += scoreValue;
        
        // Show floating score text for each enemy with larger font
        createFloatingText(o.x, o.y, `+${scoreValue}`, [255, 255, 0], 20);
      }
      
      // Show total score gained at player position with even larger font
      if (totalScore > 0) {
        createFloatingText(player.x, player.y - 30, `+${totalScore} TOTAL`, [255, 215, 0], 24);
      }
      
      orbs = [];
      
      createParticles(player.x, player.y, 50, [255, 150, 0]);
      // Comment out sound playing
      // if (sounds.blast) sounds.blast.play();
      break;
  }
}

function createParticles(x, y, count, color, options = {}) {
  let defaultOptions = {
    minSize: 3,
    maxSize: 8,
    minSpeed: 2,
    maxSpeed: 4,
    lifespan: 1.0
  };
  
  // Merge default options with provided options
  let settings = {...defaultOptions, ...options};
  
  for (let i = 0; i < count; i++) {
    let speed = random(settings.minSpeed, settings.maxSpeed);
    let angle = random(TWO_PI);
    
    particles.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(settings.minSize, settings.maxSize),
      life: settings.lifespan,
      r: color[0],
      g: color[1],
      b: color[2]
    });
  }
}

function cycleDifficulty() {
  if (difficulty === "easy") {
    difficulty = "normal";
  } else if (difficulty === "normal") {
    difficulty = "hard";
  } else if (difficulty === "hard") {
    difficulty = "insane";
  } else {
    difficulty = "easy";
  }
  
  // Update current highScore to match the new difficulty
  highScore = highScores[difficulty];
}

function resetGame() {
  // Reset game state
  survivalTime = 0;
  score = 0;
  
  // Reset player position and reinitialize with current character type
  initializePlayer();
  player.x = width / 2;
  player.y = height / 2;
  
  // Clear arrays
  tendrils = [];
  orbs = [];
  sparks = [];
  powerUps = [];
  particles = [];
  
  // Reset active effects
  activeEffects = { shield: 0, speed: 0 };
  
  // Add some initial enemies
  for (let i = 0; i < 3; i++) { // Increased from 2 to 3
    spawnRandomEnemy();
  }
}

// Function to spawn a random enemy type
function spawnRandomEnemy() {
  // Spawn from edges
  let side = floor(random(4));
  let x, y;
  
  switch(side) {
    case 0: // top
      x = random(width);
      y = -20;
      break;
    case 1: // right
      x = width + 20;
      y = random(height);
      break;
    case 2: // bottom
      x = random(width);
      y = height + 20;
      break;
    case 3: // left
      x = -20;
      y = random(height);
      break;
  }
  
  // Determine enemy type based on survival time and randomness
  let enemyType;
  let typeRoll = random();
  
  if (survivalTime < 20) { // Reduced from 30
    // Early game: mostly hunters, some dashers
    if (typeRoll < 0.7) { // Reduced from 0.8
      enemyType = ENEMY_TYPES.HUNTER;
    } else {
      enemyType = ENEMY_TYPES.DASHER;
    }
  } else if (survivalTime < 40) { // Reduced from 60
    // Mid game: add splitters
    if (typeRoll < 0.4) { // Reduced from 0.5
      enemyType = ENEMY_TYPES.HUNTER;
    } else if (typeRoll < 0.7) { // Reduced from 0.8
      enemyType = ENEMY_TYPES.DASHER;
    } else {
      enemyType = ENEMY_TYPES.SPLITTER;
    }
  } else {
    // Late game: all enemy types
    if (typeRoll < 0.3) { // Reduced from 0.4
      enemyType = ENEMY_TYPES.HUNTER;
    } else if (typeRoll < 0.55) { // Reduced from 0.65
      enemyType = ENEMY_TYPES.DASHER;
    } else if (typeRoll < 0.8) { // Reduced from 0.85
      enemyType = ENEMY_TYPES.SPLITTER;
    } else {
      enemyType = ENEMY_TYPES.BOMBER;
    }
  }
  
  // Create the enemy with appropriate properties
  let newEnemy = { 
    x: x, 
    y: y, 
    type: enemyType,
    speed: difficultySettings[difficulty].orbSpeed
  };
  
  // Set type-specific properties
  switch(enemyType) {
    case ENEMY_TYPES.HUNTER:
      newEnemy.size = 30;
      newEnemy.damage = 9.0; // Increased by 300% from 3.0
      newEnemy.color = [220, 30, 30];
      break;
      
    case ENEMY_TYPES.DASHER:
      newEnemy.size = 25;
      newEnemy.damage = 18.0; // Increased from 12.0 to make dashers more dangerous than hunters
      newEnemy.color = [30, 30, 220];
      newEnemy.isDashing = false;
      newEnemy.dashTimer = random(0.7, 1.3); // Reduced cooldown period for more frequent dashing
      newEnemy.dashAngle = 0;
      break;
      
    case ENEMY_TYPES.SPLITTER:
      newEnemy.size = 40;
      newEnemy.damage = 7.5; // Increased by 300% from 2.5
      newEnemy.color = [220, 30, 220];
      break;
      
    case ENEMY_TYPES.BOMBER:
      newEnemy.size = 35;
      newEnemy.damage = 4.5; // Increased by 300% from 1.5
      newEnemy.color = [255, 120, 0];
      newEnemy.isExploding = false;
      newEnemy.explosionTimer = 0;
      newEnemy.pulseScale = 1;
      break;
  }
  
  orbs.push(newEnemy);
}

// Function to create splitter fragments when a splitter is destroyed
function createSplitterFragment(x, y, size) {
  let fragment = {
    x: x + random(-10, 10),
    y: y + random(-10, 10),
    type: ENEMY_TYPES.SPLITTER,
    size: size,
    damage: 6.0, // Increased by 300% from 2.0
    color: [220, 30, 220],
    speed: difficultySettings[difficulty].orbSpeed * 1.8 // Increased from 1.6
  };
  
  orbs.push(fragment);
}

// Update the show/hide loading screen functions
function showLoadingScreen() {
  isLoading = true;
  
  // Show title text during loading
  let titleElement = document.getElementById('game-title');
  let subtitleElement = document.getElementById('game-subtitle');
  
  if (titleElement && subtitleElement) {
    titleElement.style.opacity = '1';
    titleElement.style.display = 'block';
    subtitleElement.style.opacity = '1';
    subtitleElement.style.display = 'block';
  }
  
  // No loading box will be displayed
}

function hideLoadingScreen() {
  isLoading = false;
  
  // Hide title text when loading is complete
  let titleElement = document.getElementById('game-title');
  let subtitleElement = document.getElementById('game-subtitle');
  
  if (titleElement && subtitleElement) {
    titleElement.style.opacity = '0';
    titleElement.style.display = 'none';
    subtitleElement.style.opacity = '0';
    subtitleElement.style.display = 'none';
  }
}

// Function to draw example enemies on the title screen
function drawExampleEnemies(centerX, baseY) {
  // Draw a small example of each enemy type
  
  // Hunter (red)
  let hunterX = centerX - 150;
  let hunterY = baseY - 15;
  let hunterSize = 20;
  
  // Outer glow
  let hunterGlow = drawingContext.createRadialGradient(
    hunterX, hunterY, 0, 
    hunterX, hunterY, hunterSize
  );
  hunterGlow.addColorStop(0, 'rgba(220, 30, 30, 0.5)');
  hunterGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  drawingContext.fillStyle = hunterGlow;
  drawingContext.beginPath();
  drawingContext.arc(hunterX, hunterY, hunterSize, 0, TWO_PI);
  drawingContext.fill();
  
  // Core
  fill(220, 30, 30, 200);
  ellipse(hunterX, hunterY, hunterSize * 0.7);
  
  // Inner core
  fill(255, 150, 100);
  ellipse(hunterX, hunterY, hunterSize * 0.3);
  
  // Dasher (blue)
  let dasherX = centerX - 50;
  let dasherY = baseY - 15;
  let dasherSize = 18;
  
  // Outer glow
  let dasherGlow = drawingContext.createRadialGradient(
    dasherX, dasherY, 0, 
    dasherX, dasherY, dasherSize
  );
  dasherGlow.addColorStop(0, 'rgba(30, 30, 220, 0.5)');
  dasherGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  drawingContext.fillStyle = dasherGlow;
  drawingContext.beginPath();
  drawingContext.arc(dasherX, dasherY, dasherSize, 0, TWO_PI);
  drawingContext.fill();
  
  // Core
  fill(30, 30, 220, 200);
  ellipse(dasherX, dasherY, dasherSize * 0.7);
  
  // Inner core with direction indicator
  fill(100, 100, 255);
  ellipse(dasherX, dasherY, dasherSize * 0.4);
  
  // Direction indicator
  fill(255);
  let dashAngle = PI * 0.25; // 45 degrees
  let dx = cos(dashAngle) * dasherSize * 0.25;
  let dy = sin(dashAngle) * dasherSize * 0.25;
  triangle(
    dasherX + dx, dasherY + dy,
    dasherX - dy * 0.5, dasherY + dx * 0.5,
    dasherX + dy * 0.5, dasherY - dx * 0.5
  );
  
  // Splitter (purple)
  let splitterX = centerX + 50;
  let splitterY = baseY - 15;
  let splitterSize = 25;
  
  // Outer glow
  let splitterGlow = drawingContext.createRadialGradient(
    splitterX, splitterY, 0, 
    splitterX, splitterY, splitterSize
  );
  splitterGlow.addColorStop(0, 'rgba(220, 30, 220, 0.5)');
  splitterGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  drawingContext.fillStyle = splitterGlow;
  drawingContext.beginPath();
  drawingContext.arc(splitterX, splitterY, splitterSize, 0, TWO_PI);
  drawingContext.fill();
  
  // Core
  fill(220, 30, 220, 200);
  ellipse(splitterX, splitterY, splitterSize * 0.7);
  
  // Inner core
  fill(255, 100, 255);
  ellipse(splitterX, splitterY, splitterSize * 0.3);
  
  // Split lines
  stroke(255, 200, 255, 150);
  strokeWeight(1);
  line(splitterX - splitterSize * 0.3, splitterY, splitterX + splitterSize * 0.3, splitterY);
  line(splitterX, splitterY - splitterSize * 0.3, splitterX, splitterY + splitterSize * 0.3);
  noStroke();
  
  // Bomber (orange)
  let bomberX = centerX + 150;
  let bomberY = baseY - 15;
  let bomberSize = 22;
  
  // Outer glow
  let bomberGlow = drawingContext.createRadialGradient(
    bomberX, bomberY, 0, 
    bomberX, bomberY, bomberSize
  );
  bomberGlow.addColorStop(0, 'rgba(255, 120, 0, 0.5)');
  bomberGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  drawingContext.fillStyle = bomberGlow;
  drawingContext.beginPath();
  drawingContext.arc(bomberX, bomberY, bomberSize, 0, TWO_PI);
  drawingContext.fill();
  
  // Core
  fill(255, 120, 0, 200);
  ellipse(bomberX, bomberY, bomberSize * 0.7);
  
  // Inner core
  fill(255, 150, 0);
  ellipse(bomberX, bomberY, bomberSize * 0.3);
  
  // Countdown ring
  noFill();
  stroke(255, 255, 0);
  strokeWeight(2);
  arc(bomberX, bomberY, bomberSize * 0.6, bomberSize * 0.6, 0, TWO_PI * 0.75);
  noStroke();
}

// Add new function to create floating score text
function createFloatingText(x, y, text, color, size = 16) {
  particles.push({
    x: x,
    y: y,
    vx: 0,
    vy: -1.5, // Float upward
    size: size, // Use the provided size or default to 16
    life: 1.0,
    r: color[0],
    g: color[1],
    b: color[2],
    text: text, // Store the text to display
    isText: true // Flag to identify this as text, not a particle
  });
}
