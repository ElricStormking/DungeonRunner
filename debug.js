// Simple debug script
window.onload = function() {
    console.log('Debug script loaded');
    
    // Check if elements exist
    const canvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    
    console.log('Canvas found:', !!canvas);
    console.log('Start button found:', !!startButton);
    console.log('Start screen found:', !!startScreen);
    
    // Add test event listener
    if (startButton) {
        startButton.addEventListener('click', function() {
            console.log('Start button clicked!');
            
            // Hide start screen
            if (startScreen) {
                startScreen.style.display = 'none';
                console.log('Start screen hidden');
            }
            
            // Draw something on the canvas
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'red';
                ctx.fillRect(100, 100, 200, 200);
                console.log('Drew a red square on canvas');
            }
        });
    }
}; 