// Get the game canvas element from the DOM by its ID
const canvas = document.getElementById('gameCanvas');

// Get the 2D rendering context for drawing on the canvas
const ctx = canvas.getContext('2d');

// Set canvas dimensions dynamically to fill the window, leaving a small margin
canvas.width = window.innerWidth - 4;
canvas.height = window.innerHeight - 4;

// Game parameters
let totalBricks; // Total number of bricks in the game
let brickRowCount; // Number of rows of bricks
let brickColumnCount; // Number of columns of bricks
const brickWidth = 70; // Width of each brick
const brickHeight = 20; // Height of each brick
const brickPadding = 5; // Spacing between bricks
const brickOffsetTop = 50; // Vertical offset for the brick grid
let ballSpeed; // Speed of the ball
let score; // Current game score
let highScore = localStorage.getItem('highScore') || 0; // Retrieve high score from local storage or default to 0

// Audio files for game events
var gameStartAudio = new Audio('../audio/arcade-ui-14-229514.mp3'); // Audio for game start
var gameOverAudio = new Audio('../audio/game-over-arcade-6435.mp3'); // Audio for game over
var gameFinishedAudio = new Audio('../audio/arcade-ui-18-229517.mp3'); // Audio for completing the game
var roundScoreAudio = new Audio('../audio/arcade-ui-6-229503.mp3'); // Audio for milestone scores
var tapAudio = new Audio('../audio/tap-dull-betacut-1-00-00.mp3'); // Audio for collisions
var hitAudio = new Audio('../audio/countdown-sound-effect-8-bit-151797-cropped.mp3'); // Audio for hitting a brick

// Flags for tracking game state
let roundScoreAudioPlayed; // Prevents repeated audio for milestone scores
let gameLoaded = false; // Tracks whether the game has started
let gameOver = false; // Indicates if the game is over
let gameFinished = false; // Indicates if the game is completed
let spaceKeyHandled = false; // Prevents multiple space key actions

// Calculate the horizontal offset to center the bricks
let totalBrickWidth = (brickWidth + brickPadding) * brickColumnCount - brickPadding;
let brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;

// Game objects
let ball; // Object representing the ball
let paddle; // Object representing the paddle
let bricks; // 2D array of brick objects

/* Dynamically calculate the grid dimensions (rows and columns) 
based on the total number of bricks while keeping the grid balanced. */
function calculateGrid() {
    // Estimate the number of rows based on the square root of total bricks
    brickRowCount = Math.floor(Math.sqrt(totalBricks));
    // Calculate the number of columns to fit all bricks
    brickColumnCount = Math.ceil(totalBricks / brickRowCount);

    // Adjust the rows and columns to ensure all bricks fit
    while (brickRowCount * brickColumnCount < totalBricks) {
        brickRowCount++;
        brickColumnCount = Math.ceil(totalBricks / brickRowCount);
    }
}

// Create the grid of bricks with specified dimensions and positioning.
function createBricks() {
    let bricksCreated = 0; // Counter to track the number of bricks created
    for (let row = 0; row < brickRowCount; row++) {
        bricks[row] = []; // Initialize each row in the bricks array
        for (let col = 0; col < brickColumnCount; col++) {
            if (bricksCreated < totalBricks) {
                // Calculate the x and y position of the brick
                const x = col * (brickWidth + brickPadding) + brickOffsetLeft;
                const y = row * (brickHeight + brickPadding) + brickOffsetTop;
                // Add a brick object to the current row
                bricks[row][col] = { x, y, width: brickWidth, height: brickHeight, visible: true };
                bricksCreated++; // Increment the counter
            } else {
                break; // Stop if all the required bricks have been created
            }
        }
    }
}

// Set a random initial direction for the ball's movement.
function setRandomBallDirection() {
    // Generate a random angle (30° to 150°) in radians
    const angle = (Math.random() * (150 - 30) + 30) * (Math.PI / 180);
    // Set horizontal and vertical velocity based on the random angle
    ball.dx = ballSpeed * Math.cos(angle);
    ball.dy = -ballSpeed * Math.sin(angle); // Negative to move upwards initially
}

// Draw the ball on the canvas.
function drawBall() {
    ctx.beginPath();
    // Create a circle representing the ball
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red'; // Fill color
    ctx.strokeStyle = '#fff'; // Outline color
    ctx.lineWidth = 2; // Outline thickness
    ctx.stroke(); // Draw the outline
    ctx.fill(); // Fill the circle
    ctx.closePath();
}

// Draw the paddle with a gradient for visual appeal.
function drawPaddle() {
    // Create a gradient for a visually appealing shading effect on the paddle
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    paddleGradient.addColorStop(0, '#ff4d4d'); // Light red at one end
    paddleGradient.addColorStop(1, '#cc0000'); // Dark red at the other end

    // Draw the paddle rectangle
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add a stroke for a clear boundary
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                // Create a gradient for a visually appealing shading effect on bricks
                const brickGradient = ctx.createLinearGradient(
                    brick.x, brick.y,
                    brick.x + brick.width, brick.y + brick.height
                );
                brickGradient.addColorStop(0, '#4d94ff'); // Lighter blue for the top
                brickGradient.addColorStop(1, '#003d99'); // Darker blue for the bottom

                // Draw the brick with the gradient fill
                ctx.fillStyle = brickGradient;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

                // Draw a white border around the brick for better visibility
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        });
    });
}

function drawScore() {
    // Play audio feedback when score reaches a multiple of 10, only once per event
    if (score > 0 && score % 10 === 0 && !roundScoreAudioPlayed) {
        roundScoreAudio.play();
        roundScoreAudioPlayed = true;
    }

    // Reset the audio feedback flag once the score moves past a multiple of 10
    if (score % 10 === 1) roundScoreAudioPlayed = false;

    const padding = 10; // Padding from the top-right corner
    const textAlign = 'right'; // Align score and high score text to the right

    // Set font and color properties for text
    ctx.fillStyle = '#ffffff'; // White color
    ctx.font = '20px Arial'; // 20px Arial font
    ctx.textAlign = textAlign;

    // Display the current score in the top-right corner
    ctx.fillText(`Score: ${score}`, canvas.width - padding, padding + 20);

    // Display the high score below the current score
    ctx.fillText(`High Score: ${highScore}`, canvas.width - padding, padding + 40);
}

function drawGameOverMessage() {
    // Create a gradient for the "GAME OVER" message
    const gradient = ctx.createLinearGradient(0, canvas.height / 2 - 50, 0, canvas.height / 2 + 50);
    gradient.addColorStop(0, '#ff4e00'); // Bright orange-red
    gradient.addColorStop(1, '#ff1900'); // Darker red

    ctx.fillStyle = gradient; // Apply the gradient to the text
    ctx.font = 'bold 50px Arial'; // Large, bold font for "GAME OVER"
    ctx.textAlign = 'center'; // Center-align the text
    ctx.shadowColor = 'rgba(255, 25, 0, 0.5)'; // Red shadow for text
    ctx.shadowBlur = 20;

    // Display the "GAME OVER" message in the center of the canvas
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    // Reset shadow effects for subsequent text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Display the restart instructions below "GAME OVER"
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 50);

    spaceKeyHandled = false; // Reset the space key handling flag
}

function drawGameFinishedMessage() {
    // Create a gradient for the "CONGRATULATIONS" message
    const gradient = ctx.createLinearGradient(0, canvas.height / 2 - 50, 0, canvas.height / 2 + 50);
    gradient.addColorStop(0, '#00ff88'); // Bright green
    gradient.addColorStop(1, '#008844'); // Darker green

    ctx.fillStyle = gradient; // Apply the gradient to the text
    ctx.font = 'bold 40px Arial'; // Large, bold font for "CONGRATULATIONS"
    ctx.textAlign = 'center'; // Center-align the text
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)'; // Green shadow for text
    ctx.shadowBlur = 20;

    // Display the "CONGRATULATIONS" message in the center
    ctx.fillText("CONGRATULATIONS! YOU COMPLETED THE GAME! :D", canvas.width / 2, canvas.height / 2);

    // Reset shadow effects for subsequent text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Display the restart instructions below the message
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 50);

    spaceKeyHandled = false; // Reset the space key handling flag
}

function collisionDetection() {
    // Ball collision with canvas edges
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        tapAudio.play(); // Play collision sound
        ball.dx *= -1; // Reverse ball's horizontal direction
    }
    if (ball.y - ball.radius < 0) {
        tapAudio.play(); // Play collision sound
        ball.dy *= -1; // Reverse ball's vertical direction
    }

    // Check if the ball hits the bottom of the canvas
    if (ball.y + ball.radius > canvas.height) endGame(); // End the game

    // Ball collision with the paddle
    if (
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y
    ) {
        tapAudio.play(); // Play collision sound
        ball.dy *= -1; // Reverse ball's vertical direction
        ball.y = paddle.y - ball.radius; // Position the ball above the paddle
    }

    // Ball collision with bricks
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brick.width &&
                    ball.y - ball.radius < brick.y + brick.height &&
                    ball.y + ball.radius > brick.y
                ) {
                    hitAudio.play(); // Play brick hit sound
                    ball.dy *= -1; // Reverse ball's vertical direction
                    brick.visible = false; // Hide the brick
                    score++; // Increment the score
                    if (score > highScore) {
                        highScore = score; // Update the high score
                        localStorage.setItem('highScore', highScore); // Save high score to localStorage
                    }
                }
            }
        });
    });
}

function moveBall() {
    // Update ball's position based on its velocity
    ball.x += ball.dx;
    ball.y += ball.dy;
}

function movePaddle() {
    // Update paddle's position based on its velocity
    paddle.x += paddle.dx;

    // Prevent paddle from moving out of the canvas
    if (paddle.x < 0) paddle.x = 0; // Prevent left overflow
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width; // Prevent right overflow
}

function checkAllBricksDestroyed() {
    // Return true if all the bricks are no longer visible
    return bricks.every(row => row.every(brick => !brick.visible));
}


function resetGame() {
    // Reset score and game states
    score = 0;
    gameOver = false;
    gameFinished = false;
    roundScoreAudioPlayed = false; // Reset round audio tracking
    spaceKeyHandled = false; // Allow space key press for new game

    // Initialize ball position and properties
    ball = { 
        x: canvas.width / 2, 
        y: canvas.height - 30, 
        radius: 10 };

    // Initialize paddle position and properties
    paddle = { 
        x: canvas.width / 2 - 50, 
        y: canvas.height - 20, 
        width: 100, 
        height: 10, 
        speed: 10, 
        dx: 0 
    };

    // Clear all the existing bricks and recreate them
    bricks = [];
    createBricks();

    // Set ball to move in a random direction
    setRandomBallDirection();

    // Play game start sound
    gameStartAudio.play();

    // Start the game loop
    update();
}


function endGame() {
    // Set the game over state
    gameOver = true;

    // Play the game over audio
    gameOverAudio.play();

    // Display the "GAME OVER" message
    drawGameOverMessage();
}


function finishGame() {
    // Set the game finished state
    gameFinished = true;

    // Play the game finished audio
    gameFinishedAudio.play();

    // Display the "CONGRATULATIONS" message
    drawGameFinishedMessage();
}


function update() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();

    // Update positions of ball and paddle
    moveBall();
    movePaddle();

    // Check for collisions (with walls, paddle, and bricks)
    collisionDetection();

    // Check if all the bricks are destroyed to finish the game
    if (checkAllBricksDestroyed()) {
        finishGame();
    }

    // Continue the game loop if the game is nor over nor finished
    if (!gameOver && !gameFinished) {
        requestAnimationFrame(update); // Recursively calls update for smooth animation
    }
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        // Move paddle to the right
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        // Move paddle to the left
        paddle.dx = -paddle.speed;
    }

    // Start or restart the game on space key press
    if (e.key === ' ' && !spaceKeyHandled && (gameOver || gameFinished || !gameLoaded)) {
        spaceKeyHandled = true;

        // Handle initial game setup if not loaded
        if (!gameLoaded) {
            const totalBricksInput = document.getElementById('totalBricks'); // Input for total bricks
            const speedInput = document.getElementById('ballSpeed'); // Input for ball speed

            // Parse input values
            totalBricks = parseInt(totalBricksInput.value);
            ballSpeed = parseFloat(speedInput.value);

            // Validate input values
            if (isNaN(totalBricks) || isNaN(ballSpeed) || totalBricks <= 0 || ballSpeed <= 0) {
                alert("Please enter valid positive numbers for all fields."); // Show error message
                spaceKeyHandled = false; // Allow retry if inputs are invalid
                return;
            }

            calculateGrid(); // Calculate grid dimensions based on inputs

            // Hide the input screen after validation
            document.getElementById('startScreen').style.display = 'none';

            // Center the bricks grid horizontally on the canvas
            brickOffsetLeft = (canvas.width - (brickWidth + brickPadding) * brickColumnCount + brickPadding) / 2;

            gameLoaded = true; // Mark game as loaded
        }

        // Reset the game state and start a new game
        resetGame();
    }
});


document.addEventListener('keyup', () => {
    // Stop paddle movement when key is released
    paddle.dx = 0;
});
