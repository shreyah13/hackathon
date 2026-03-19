// Elements
const loginSection = document.getElementById('login-section');
const notificationSection = document.getElementById('notification-section');
const patternSection = document.getElementById('pattern-section');
const resultSection = document.getElementById('result-section');
const resultMessage = document.getElementById('result-message');
const patternCanvas = document.getElementById('pattern-canvas');
const ctx = patternCanvas.getContext('2d');

// Simulated server data
const correctPattern = ['00', '01', '11', '21']; // Example of a 2x2 grid pattern

// Handle login
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get username and password values (hardcoded for demo)
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'user1' && password === 'password123') {
        alert('Login successful! A push notification has been sent to your device.');
        loginSection.classList.add('hidden');
        notificationSection.classList.remove('hidden');
    } else {
        alert('Invalid username or password.');
    }
});

// Simulate push notification approval
document.getElementById('approve-push').addEventListener('click', function() {
    alert('Push notification approved!');
    notificationSection.classList.add('hidden');
    patternSection.classList.remove('hidden');
});

// Pattern drawing
let isDrawing = false;
let userPattern = [];
let lastPosition = null;

patternCanvas.addEventListener('mousedown', startDrawing);
patternCanvas.addEventListener('mousemove', drawPattern);
patternCanvas.addEventListener('mouseup', stopDrawing);

function startDrawing(event) {
    isDrawing = true;
    lastPosition = getMousePosition(event);
    userPattern.push(getGridPosition(lastPosition));
}

function drawPattern(event) {
    if (!isDrawing) return;

    const currentPosition = getMousePosition(event);
    drawLine(lastPosition, currentPosition);
    lastPosition = currentPosition;
    userPattern.push(getGridPosition(lastPosition));
}

function stopDrawing() {
    isDrawing = false;
}

function getMousePosition(event) {
    const rect = patternCanvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function getGridPosition(position) {
    const gridX = Math.floor(position.x / 100); // Assuming 3x3 grid
    const gridY = Math.floor(position.y / 100);
    return `${gridX}${gridY}`;
}

function drawLine(from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

document.getElementById('submit-pattern').addEventListener('click', function() {
    if (JSON.stringify(userPattern) === JSON.stringify(correctPattern)) {
        resultMessage.textContent = 'Pattern correct! Access granted.';
    } else {
        resultMessage.textContent = 'Incorrect pattern. Try again.';
    }
    patternSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
});