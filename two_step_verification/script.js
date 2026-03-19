let isDrawing = false;
let points = [];
let attemptCount = 0;
let maxAttempts = 2;
let lockTimeout = false;
let countdownTime = 30;
let countdownInterval;
const ANGLE_TOLERANCE = 10;  // Allowable deviation for angle in degrees
const DISTANCE_TOLERANCE = 0.2;  // Allowable deviation for side lengths (20%)
const CIRCLE_TOLERANCE = 0.3;  // Allowable deviation for circularity

// Simulate the login verification process (same as previous logic)
function verifyLogin() {
    const username = document.getElementById("username").value;
    const irisColor = document.getElementById("iriscolor").value;
    const birthplace = document.getElementById("birthplace").value;

    if (username === "user1" && irisColor === "blue" && birthplace === "pune") {
        document.getElementById("notification").style.display = "block";  // Show notification
    } else {
        alert("Incorrect credentials. Please try again.");
    }
}

// Handle notification click to proceed to pattern page
document.getElementById("notification").addEventListener("click", function() {
    this.style.display = "none";  // Hide notification
    document.getElementById("pattern-page").style.display = "block";  // Show pattern drawing page
    initPatternDrawing();  // Initialize drawing
});

// Initialize pattern drawing
function initPatternDrawing() {
    const canvas = document.getElementById("patternCanvas");
    const ctx = canvas.getContext("2d");

    canvas.addEventListener("mousedown", () => {
        if (attemptCount < maxAttempts && !lockTimeout) {
            isDrawing = true;
            points = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous drawings
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            points.push({ x, y });
            drawCircle(ctx, x, y);
        }
    });

    canvas.addEventListener("mouseup", () => {
        isDrawing = false;
    });
}

// Draw circles on the canvas where the mouse moves
function drawCircle(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
}

// Submit the drawn pattern for validation
function submitPattern() {
    if (lockTimeout) {
        alert("System is locked. Please wait.");
        return;
    }

    const patternType = detectPattern(points);

    if (patternType === "square" || patternType === "rectangle" || patternType === "triangle" || patternType === "circle") {
        document.getElementById("result-message").textContent = "Pattern recognized, Access granted!";
        document.getElementById("result-message").style.color = "green";
        attemptCount = 0;  // Reset attempts on success
    } else {
        attemptCount++;
        if (attemptCount < maxAttempts) {
            document.getElementById("result-message").textContent = "Pattern incorrect, please try again!";
            document.getElementById("result-message").style.color = "red";
        } else {
            document.getElementById("result-message").textContent = "Access denied, please try again later!";
            document.getElementById("result-message").style.color = "red";
            lockSystem();  // Lock system for 30 seconds after two failed attempts
        }
    }
}

// Pattern recognition logic
function detectPattern(points) {
    if (points.length < 3) return "none";  // Too few points to form a pattern

    if (isSquare(points)) return "square";
    if (isRectangle(points)) return "rectangle";
    if (isTriangle(points)) return "triangle";
    if (isCircle(points)) return "circle";

    return "none";
}

// Check if the drawn pattern is a square
function isSquare(points) {
    if (points.length < 4) return false;

    const sides = getSideLengths(points);
    const angles = getAngles(points);

    const isEqualSides = sides.every((side, _, arr) => Math.abs(side - arr[0]) < arr[0] * DISTANCE_TOLERANCE);
    const isRightAngles = angles.every(angle => Math.abs(angle - 90) < ANGLE_TOLERANCE);

    return isEqualSides && isRightAngles;
}

// Check if the drawn pattern is a rectangle
function isRectangle(points) {
    if (points.length < 4) return false;

    const sides = getSideLengths(points);
    const angles = getAngles(points);

    // Rectangles have opposite sides equal and 90 degree angles
    const isOppositeSidesEqual = Math.abs(sides[0] - sides[2]) < sides[0] * DISTANCE_TOLERANCE &&
                                 Math.abs(sides[1] - sides[3]) < sides[1] * DISTANCE_TOLERANCE;
    const isRightAngles = angles.every(angle => Math.abs(angle - 90) < ANGLE_TOLERANCE);

    return isOppositeSidesEqual && isRightAngles;
}

// Check if the drawn pattern is a triangle
function isTriangle(points) {
    if (points.length < 3) return false;

    const angles = getAngles(points);
    const sumOfAngles = angles.reduce((sum, angle) => sum + angle, 0);

    return Math.abs(sumOfAngles - 180) < ANGLE_TOLERANCE;  // Sum of angles in a triangle is 180 degrees
}

// Check if the drawn pattern is a circle
function isCircle(points) {
    const center = getCenter(points);
    const radii = points.map(p => distance(p, center));

    const averageRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
    const radiusTolerance = averageRadius * CIRCLE_TOLERANCE;

    return radii.every(r => Math.abs(r - averageRadius) < radiusTolerance);
}

// Get the lengths of the sides of the drawn pattern
function getSideLengths(points) {
    const sideLengths = [];

    for (let i = 0; i < points.length - 1; i++) {
        sideLengths.push(distance(points[i], points[i + 1]));
    }

    // Close the shape (last point to first point)
    sideLengths.push(distance(points[points.length - 1], points[0]));

    return sideLengths;
}

// Get the angles between consecutive sides
function getAngles(points) {
    const angles = [];

    for (let i = 0; i < points.length; i++) {
        const prev = points[i === 0 ? points.length - 1 : i - 1];
        const curr = points[i];
        const next = points[i === points.length - 1 ? 0 : i + 1];

        const angle = getAngle(prev, curr, next);
        angles.push(angle);
    }

    return angles;
}

// Calculate distance between two points
function distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// Calculate the angle between three points (using the law of cosines)
function getAngle(p1, p2, p3) {
    const a = distance(p2, p3);
    const b = distance(p1, p3);
    const c = distance(p1, p2);

    const cosTheta = (b * b + c * c - a * a) / (2 * b * c);
    const angle = Math.acos(cosTheta) * (180 / Math.PI);  // Convert to degrees

    return angle;
}

// Get the center of a set of points (average x and y coordinates)
function getCenter(points) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
}

// Lock the system for 30 seconds and show a countdown timer
function lockSystem() {
    lockTimeout = true;
    document.getElementById("timer").style.display = "block";
    countdownTime = 30;
    document.getElementById("timer").textContent = countdownTime + "s";

    countdownInterval = setInterval(() => {
        countdownTime--;
        document.getElementById("timer").textContent = countdownTime + "s";

        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            document.getElementById("timer").style.display = "none";
            resetLoginPage();  // Reset the page after the countdown
        }
    }, 1000);
}

// Reset the login page after the countdown
function resetLoginPage() {
    document.getElementById("login-page").style.display = "block";
    document.getElementById("pattern-page").style.display = "none";
    document.getElementById("result-message").textContent = "";
    attemptCount = 0;
    lockTimeout = false;
}