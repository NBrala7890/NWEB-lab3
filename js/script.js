const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 4;
canvas.height = window.innerHeight - 4;

// Parametri igre
const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 55;
const brickHeight = 15;
const brickPadding = 5;
const brickOffsetTop = 50;
const ballSpeed = 4;
let score;
let highScore = localStorage.getItem('highScore') || 0;

var gameStartAudio = new Audio('../audio/arcade-ui-14-229514.mp3');
var gameOverAudio = new Audio('../audio/game-over-arcade-6435.mp3');
var gameFinishedAudio = new Audio('../audio/arcade-ui-18-229517.mp3');
var roundScoreAudio = new Audio('../audio/arcade-ui-6-229503.mp3');
var tapAudio = new Audio('../audio/tap-dull-betacut-1-00-00.mp3');
var hitAudio = new Audio('../audio/countdown-sound-effect-8-bit-151797-cropped.mp3');

let gameStart = true;
let roundScoreAudioPlayed;
let gameOver;
let gameFinished;

// Centering bricks by calculating the left offset
const totalBrickWidth = (brickWidth + brickPadding) * brickColumnCount - brickPadding;
const brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;

// Objekti igre
let ball = { x: canvas.width / 2, y: canvas.height - 30, radius: 10 };;
let paddle = { x: canvas.width / 2 - 50, y: canvas.height - 20, width: 100, height: 10, speed: 10, dx: 0 };;
let bricks = [];

// Kreiranje cigli
function createBricks() {
    for (let row = 0; row < brickRowCount; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickColumnCount; col++) {
            const x = col * (brickWidth + brickPadding) + brickOffsetLeft;
            const y = row * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[row][col] = { x, y, width: brickWidth, height: brickHeight, visible: true };
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
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    ctx.closePath();
}

// Iscrtavanje palice
function drawPaddle() {
    ctx.fillStyle = 'red';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Iscrtavanje cigli
function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                ctx.fillStyle = '#00f';
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                ctx.strokeStyle = '#fff';
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
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';

    // Always calculate the x-coordinate based on the current canvas width
    const scoreXPosition = canvas.width - 70;
    const highScoreXPosition = canvas.width - 93;

    ctx.fillText(`Score: ${score}`, scoreXPosition, 30);
    ctx.fillText(`High Score: ${highScore}`, highScoreXPosition, 50);
}

function drawStartGameMessage() {
    ctx.fillStyle = '#ffff00';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("WELCOME TO BREAKOUT", canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE key to start the game", canvas.width / 2, canvas.height / 2 + 40);
}

function drawGameOverMessage() {
    ctx.fillStyle = '#ff0000';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE key to restart", canvas.width / 2, canvas.height / 2 + 40);
}

function drawGameFinishedMessage() {
    ctx.fillStyle = '#00ff00';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("CONGRATULATIONS! YOU COMPLETED THE GAME! :D", canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press SPACE key to restart", canvas.width / 2, canvas.height / 2 + 40);
}

function collisionDetection() {
    // Sudar s rubovima ekrana
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        // tapAudio.play();
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        // tapAudio.play();
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
                    // hitAudio.play();
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
    gameStart = false;
    gameOver = false;
    gameFinished = false;
    roundScoreAudioPlayed = false;

    console.log(canvas.width);
    console.log(canvas.height);

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

    if (gameStart) {
        drawStartGameMessage();
    }
    else {
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
    
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    }

    // Restart game on space key press if game is over
    if (e.key === ' ' && (gameOver || gameFinished || gameStart)) 
        resetGame();
});

document.addEventListener('keyup', () => {
    paddle.dx = 0;
});

update();
