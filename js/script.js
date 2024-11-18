const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 4;
canvas.height = window.innerHeight - 4;

// Parametri igre
let totalBricks;
let brickRowCount;
let brickColumnCount;
const brickWidth = 70;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 50;
let ballSpeed;
let score;
let highScore = localStorage.getItem('highScore') || 0;

var gameStartAudio = new Audio('../audio/arcade-ui-14-229514.mp3');
var gameOverAudio = new Audio('../audio/game-over-arcade-6435.mp3');
var gameFinishedAudio = new Audio('../audio/arcade-ui-18-229517.mp3');
var roundScoreAudio = new Audio('../audio/arcade-ui-6-229503.mp3');
var tapAudio = new Audio('../audio/tap-dull-betacut-1-00-00.mp3');
var hitAudio = new Audio('../audio/countdown-sound-effect-8-bit-151797-cropped.mp3');

let roundScoreAudioPlayed;
let gameLoaded = false;
let gameOver = false;
let gameFinished = false;
let spaceKeyHandled = false;

// Centering bricks by calculating the left offset
let totalBrickWidth = (brickWidth + brickPadding) * brickColumnCount - brickPadding;
let brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;

// Objekti igre
let ball;
let paddle;
let bricks;

function calculateGrid() {
    // Step 1: Start with an approximate square root for one dimension
    brickRowCount = Math.floor(Math.sqrt(totalBricks));
    brickColumnCount = Math.ceil(totalBricks / brickRowCount); // Ceiling of totalBricks / rowCount

    // Step 2: Check if the grid can be made more balanced
    while (brickRowCount * brickColumnCount < totalBricks) {
        brickRowCount++;
        brickColumnCount = Math.ceil(totalBricks / brickRowCount);
    }
}

// Kreiranje cigli
function createBricks() {
    let bricksCreated = 0;
    for (let row = 0; row < brickRowCount; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickColumnCount; col++) {
            if (bricksCreated < totalBricks) {
                const x = col * (brickWidth + brickPadding) + brickOffsetLeft;
                const y = row * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[row][col] = { x, y, width: brickWidth, height: brickHeight, visible: true };
                bricksCreated++;
            }
            else
                break;
        }
    }
}

// Randomize the initial direction of the ball
function setRandomBallDirection() {
     // Generate a random angle between 30 and 150 degrees, converted to radians
     const angle = (Math.random() * (150 - 30) + 30) * (Math.PI / 180);
    ball.dx = ballSpeed * Math.cos(angle);
    ball.dy = -ballSpeed * Math.sin(angle); // Initially moving upwards
}

// Iscrtavanje loptice
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
}

// Iscrtavanje palice
function drawPaddle() {
    // Create a gradient for shading
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    paddleGradient.addColorStop(0, '#ff4d4d'); // Lighter red
    paddleGradient.addColorStop(1, '#cc0000'); // Darker red

    // Draw paddle with shading
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add edge stroke for a clear boundary
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Iscrtavanje cigli
function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                // Create a gradient for shading
                const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.width, brick.y + brick.height);
                brickGradient.addColorStop(0, '#4d94ff'); // Lighter blue
                brickGradient.addColorStop(1, '#003d99'); // Darker blue

                // Draw brick with shading
                ctx.fillStyle = brickGradient;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

                // Add edge stroke for a clear boundary
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        });
    });
}

// Iscrtavanje rezultata
function drawScore() {
    if (score > 0 && score % 10 == 0 && !roundScoreAudioPlayed) {
        roundScoreAudio.play();
        roundScoreAudioPlayed = true;
    }
    // Resetiramo roundScoreAudioPlayed varijablu jednom kada smo se makli od okruglog scorea
    if (score % 10 == 1)
        roundScoreAudioPlayed = false;
    
    const padding = 10; // Padding from the top and right edge
    const textAlign = 'right'; // Align the text to the right

    // Set text properties
    ctx.fillStyle = '#ffffff'; // White text color
    ctx.font = '20px Arial'; // Font size and style
    ctx.textAlign = textAlign; // Align text to the right

    // Draw the score
    ctx.fillText(`Score: ${score}`, canvas.width - padding, padding + 20);

    // Draw the high score
    ctx.fillText(`High Score: ${highScore}`, canvas.width - padding, padding + 40);
}

function drawGameOverMessage() {
    // Create gradient for text
    const gradient = ctx.createLinearGradient(0, canvas.height / 2 - 50, 0, canvas.height / 2 + 50);
    gradient.addColorStop(0, '#ff4e00'); // Bright orange-red
    gradient.addColorStop(1, '#ff1900'); // Darker red

    ctx.fillStyle = gradient;
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 25, 0, 0.5)';
    ctx.shadowBlur = 20;

    // Draw "GAME OVER" message
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    // Reset shadow for the next text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw "Press SPACE to restart" message
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 50);

    spaceKeyHandled = false;
}

function drawGameFinishedMessage() {
    // Create gradient for text
    const gradient = ctx.createLinearGradient(0, canvas.height / 2 - 50, 0, canvas.height / 2 + 50);
    gradient.addColorStop(0, '#00ff88'); // Bright green
    gradient.addColorStop(1, '#008844'); // Darker green

    ctx.fillStyle = gradient;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 20;

    // Draw "CONGRATULATIONS" message
    ctx.fillText("CONGRATULATIONS! YOU COMPLETED THE GAME! :D", canvas.width / 2, canvas.height / 2);

    // Reset shadow for the next text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw "Press SPACE to restart" message
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 50);

    spaceKeyHandled = false;
}

function collisionDetection() {
    // Sudar s rubovima ekrana
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        tapAudio.play();
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        tapAudio.play();
        ball.dy *= -1;
    }

    // Game over if ball hits the bottom
    if (ball.y + ball.radius > canvas.height)
        endGame();

    // Sudar s palicom
    if (
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y
    ) {
        tapAudio.play();
        ball.dy *= -1;
        ball.y = paddle.y - ball.radius;
    }

    // Sudar s ciglama
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brick.width &&
                    ball.y - ball.radius < brick.y + brick.height &&
                    ball.y + ball.radius > brick.y
                ) {
                    hitAudio.play();
                    ball.dy *= -1;
                    brick.visible = false;
                    score++;
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('highScore', highScore);
                    }
                }
            }
        });
    });
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
}

function movePaddle() {
    paddle.x += paddle.dx;

    // Sprječavanje prelaska preko ruba
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function checkAllBricksDestroyed() {
    return bricks.every(row => row.every(brick => !brick.visible));
}

function resetGame() {
    score = 0;
    gameOver = false;
    gameFinished = false;
    roundScoreAudioPlayed = false;
    spaceKeyHandled = false;

    // Initialising the game parameters
    ball = { x: canvas.width / 2, y: canvas.height - 30, radius: 10 };
    paddle = { x: canvas.width / 2 - 50, y: canvas.height - 20, width: 100, height: 10, speed: 10, dx: 0 };
    bricks = [];
    
    createBricks();
    setRandomBallDirection();
    gameStartAudio.play();
    update();
}

function endGame() {
    gameOver = true;
    gameOverAudio.play();
    drawGameOverMessage();
}

function finishGame() {
    gameFinished = true;
    gameFinishedAudio.play();
    drawGameFinishedMessage();
}

// Game update loop
function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();

    // Move game elements
    moveBall();
    movePaddle();
    collisionDetection();

    if (checkAllBricksDestroyed())
        finishGame();

    if (!gameOver && !gameFinished)
        requestAnimationFrame(update);
    
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    }

    if (e.key === ' ' && !spaceKeyHandled && (gameOver || gameFinished || !gameLoaded))  {
        spaceKeyHandled = true;
        if (!gameLoaded) {
            const totalBricksInput = document.getElementById('totalBricks');
            const speedInput = document.getElementById('ballSpeed');

            // Parse input values
            totalBricks = parseInt(totalBricksInput.value);
            ballSpeed = parseFloat(speedInput.value);

            // Validate input
            if (isNaN(totalBricks) || isNaN(ballSpeed) || totalBricks <= 0 || ballSpeed <= 0) {
                alert("Please enter valid positive numbers for all fields.");
                spaceKeyHandled = false; // Allow retry if inputs are invalid
                return;
            }

            calculateGrid();

            // Hide input screen
            document.getElementById('startScreen').style.display = 'none';

            // Initialize brick offset and create bricks
            brickOffsetLeft = (canvas.width - (brickWidth + brickPadding) * brickColumnCount + brickPadding) / 2;

            gameLoaded = true;
        }
        
        resetGame();

    }
});

document.addEventListener('keyup', () => {
    paddle.dx = 0;
});