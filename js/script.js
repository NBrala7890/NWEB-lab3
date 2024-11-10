const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 4;
canvas.height = window.innerHeight - 4;

// Parametri igre
const brickRowCount = 5;
const brickColumnCount = 7;
const ballSpeed = 3;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Objekti igre
let ball = { x: canvas.width / 2, y: canvas.height - 30, dx: ballSpeed, dy: -ballSpeed, radius: 10 };
let paddle = { x: canvas.width / 2 - 50, y: canvas.height - 20, width: 100, height: 10, speed: 10, dx: 0 };
let bricks = [];

// Kreiranje cigli
function createBricks() {
    for (let row = 0; row < brickRowCount; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickColumnCount; col++) {
            bricks[row][col] = { x: col * 60, y: row * 20 + 50, width: 55, height: 15, visible: true };
        }
    }
}

createBricks();

// Iscrtavanje loptice
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#00f';
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
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width - 100, 30);
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 147, 50);
}

function collisionDetection() {
    // Sudar s rubovima ekrana
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Sudar s palicom
    if (
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y
    ) {
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

let gameOver = false;
let gameCompleted = false;

function checkAllBricksDestroyed() {
    return bricks.every(row => row.every(brick => !brick.visible));
}

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

    // Check if the ball hits the bottom edge
    if (ball.y + ball.radius > canvas.height) {
        // Only show the alert once and reload the game
        if (!gameOver) {
            gameOver = true; // Set gameOver to true to prevent further execution
            alert("GAME OVER"); // Show the game over alert
            document.location.reload(); // Reload the game only after alert is dismissed
        }
        return; // Exit the update function to stop further rendering
    }

    // Check if all bricks are destroyed (Game Completed)
    if (checkAllBricksDestroyed()) {
        if (!gameCompleted) {
            gameCompleted = true;
            alert("CONGRATULATIONS! YOU COMPLETED THE GAME!");
            document.location.reload();
        }
        return;
    }

    // Request the next animation frame if game is not over or completed
    if (!gameOver && !gameCompleted) {
        requestAnimationFrame(update);
    }

    // if (ball.y + ball.radius > canvas.height) {
    //     alert("GAME OVER");
    //     document.location.reload();
    // }

    // requestAnimationFrame(update);
}

update();

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    }
});

document.addEventListener('keyup', () => {
    paddle.dx = 0;
});
