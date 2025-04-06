// Minimal debug version of the game
class MinimalGame {
    constructor() {
        console.log('MinimalGame constructor called');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        console.log('MinimalGame initialized');
    }

    startGame() {
        console.log('MinimalGame.startGame() called');
        this.isPlaying = true;
        
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        
        // Draw a red square to confirm the game started
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(100, 100, 200, 200);
        
        // Draw a green square
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(400, 300, 200, 200);
        
        console.log('Game started - drew test squares');
    }
}

// Simple initialization
window.onload = function() {
    console.log('Window loaded in debug-game.js');
    
    // Create game instance
    const game = new MinimalGame();
    
    // Add direct click handler to start button
    const startButton = document.getElementById('startButton');
    console.log('Start button found:', !!startButton);
    
    if (startButton) {
        startButton.onclick = function() {
            console.log('Start button clicked in debug-game.js');
            game.startGame();
            return false; // Prevent default
        };
    }
}; 