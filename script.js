// Select canvas and get its context
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// Set canvas dimensions to match the window
canvas.width = innerWidth;
canvas.height = innerHeight;

// Select DOM elements for score, start button, modal, and final score
const scoreElement = document.querySelector('#score');
const startGameBtn = document.querySelector('#startGameBtn');
const modalElement = document.querySelector('#modal');
const finalScoreElement = document.querySelector('#finalScore');

// Player class
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    // Draw player on canvas
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

// Projectile class
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    // Draw projectile on canvas
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    // Update projectile position
    update() {
        this.draw();

        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    // Draw enemy on canvas
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    // Update enemy position
    update() {
        this.draw();

        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

// Friction for particles
const friction = 0.99;

// Particle class
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1; // Transparency
    }

    // Draw particle on canvas
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill(); 
        c.restore();
    }

    // Update particle position and transparency
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

// Initial player position
const x = canvas.width / 2;
const y = canvas.height / 2;

// Initialize variables
let player = new Player(x, y, 10, 'white');
let projectiles = [];
let enemies = [];
let particles = [];

// Initializing Interval Variables
let intervalVar;

// Initalizing Timeout Variables
let projectileTimeoutVar, clearTimeoutVar, deleteTimeoutVar;

// Initialize game state
function init() {
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreElement.innerHTML = score;
    finalScoreElement.innerHTML = score;
}

// Spawn enemies at regular intervals
function spawnEnemies() {
    intervalVar = setInterval(() => {        
        const radius = Math.random() * (30 - 4) + 4;

        let x,y; 
        // Randomly choose spawn point on canvas edges
        if (Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height;
        }
        else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        // Random color
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        
        // Calculate angle towards player
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        // Create new enemy and add to array
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

let animationId;
let score = 0;

// Animation loop 
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    
    // Update particles
    particles.forEach((particle, particleIndex) => {
        if (particle.alpha <= 0) {
            particles.splice(particleIndex, 1);
        } else {
            particle.update();
        }
    })

    // Update projectiles
    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        // Remove projectiles that go off-screen
        if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height){
            projectileTimeoutVar = setTimeout(() => {
                projectiles.splice(projectileIndex, 1);
            }, 0);
        }
    });

    // Update enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // Check for collision with player
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // End game
        if (distToPlayer - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            modalElement.style.display = 'flex';
            finalScoreElement.innerHTML = score;
            clearInterval(intervalVar);
            clearTimeout(projectileTimeoutVar);
            clearTimeout(clearTimeoutVar);
            clearTimeout(deleteTimeoutVar);
        }
        
        // Check for collision with projectiles
        projectiles.forEach((projectile, projectileIndex) => {
            const distToProjectile = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // when projectile touches enemy
            if (distToProjectile - enemy.radius - projectile.radius< 1) {

                // Create explosion effect
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y , Math.random() * 2, enemy.color, {x: (Math.random() - 0.5) * (Math.random() * 5), y: (Math.random() - 0.5) * (Math.random() * 5)}));
                }

                // Shrink or remove enemy
                if (enemy.radius - 10 > 5) {
                    score += 100; // Increase score for shrinking
                    scoreElement.innerHTML = score;

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    clearTimeoutVar = setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);                    
                    }, 0);
                }
                else {
                    score += 250; // Increase score for killing
                    scoreElement.innerHTML = score;

                    // Remove enemy and projectile from scene
                    deleteTimeoutVar = setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);                    
                    }, 0);
                }
            }
        })
    })
}

// Shoot projectiles on mouse click
addEventListener('click', (event) =>{
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    };
    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
})

// Start game on button click
startGameBtn.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();

    modalElement.style.display = 'none';
})
