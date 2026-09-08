/* =========================================================
   CRACKER GAMES - TELEGRAM MINI APP
   game.js
   ========================================================= */

"use strict";


/* =========================================================
   TELEGRAM WEB APP
   ========================================================= */

const tg = window.Telegram && window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;

if (tg) {
    tg.ready();
    tg.expand();
}


/* =========================================================
   DOM
   ========================================================= */

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");

const closeAppBtn = document.getElementById("closeAppBtn");
const backBtn = document.getElementById("backBtn");

const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startGameBtn = document.getElementById("startGameBtn");
const restartGameBtn = document.getElementById("restartGameBtn");
const menuGameBtn = document.getElementById("menuGameBtn");

const currentGameIcon = document.getElementById("currentGameIcon");
const currentGameName = document.getElementById("currentGameName");

const overlayIcon = document.getElementById("overlayIcon");
const overlayTitle = document.getElementById("overlayTitle");
const overlayDescription = document.getElementById("overlayDescription");

const gameScore = document.getElementById("gameScore");
const finalScore = document.getElementById("finalScore");
const finalBestScore = document.getElementById("finalBestScore");

const playerName = document.getElementById("playerName");
const playerAvatar = document.getElementById("playerAvatar");
const bestScoreElement = document.getElementById("bestScore");

const gameCanvas = document.getElementById("gameCanvas");
const gameContainer = document.getElementById("gameContainer");
const gameControls = document.getElementById("gameControls");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const ctx = gameCanvas.getContext("2d");


/* =========================================================
   GAME DATA
   ========================================================= */

const GAME_INFO = {

    racing: {
        name: "Car Racing",
        icon: "🏎️",
        description: "Dodge traffic and survive as long as possible."
    },

    fighting: {
        name: "Fighting Arena",
        icon: "🥊",
        description: "Defeat your opponent before your health reaches zero."
    },

    space: {
        name: "Space Shooter",
        icon: "🚀",
        description: "Destroy enemy ships and protect your spaceship."
    },

    runner: {
        name: "Endless Runner",
        icon: "🏃",
        description: "Run, jump and avoid obstacles."
    },

    penalty: {
        name: "Penalty Shootout",
        icon: "⚽",
        description: "Choose your shot direction and score goals."
    },

    basketball: {
        name: "Basketball",
        icon: "🏀",
        description: "Shoot the ball through the moving hoop."
    },

    archery: {
        name: "Archery",
        icon: "🏹",
        description: "Aim carefully and hit the target."
    },

    target: {
        name: "Target Shooter",
        icon: "🎯",
        description: "Hit targets before they disappear."
    }

};


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentGame = null;

let animationId = null;

let lastFrameTime = 0;

let gameRunning = false;

let score = 0;

let gameTime = 0;

let cleanupCurrentGame = null;

let keyState = {};

let pointerState = {
    down: false,
    x: 0,
    y: 0
};


/* =========================================================
   CANVAS
   ========================================================= */

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

gameCanvas.width = CANVAS_WIDTH;
gameCanvas.height = CANVAS_HEIGHT;


/* =========================================================
   UTILITIES
   ========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function random(min, max) {
    return Math.random() * (max - min) + min;
}


function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}


function distance(x1, y1, x2, y2) {
    return Math.sqrt(
        Math.pow(x2 - x1, 2) +
        Math.pow(y2 - y1, 2)
    );
}


function circleCollision(a, b) {
    return distance(a.x, a.y, b.x, b.y) <
        (a.radius || 0) + (b.radius || 0);
}


function rectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


function setScore(value) {
    score = Math.max(0, Math.floor(value));
    gameScore.textContent = score;
}


function addScore(value) {
    setScore(score + value);
}


function hide(element) {
    if (element) {
        element.classList.add("hidden");
    }
}


function show(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}


function clearCanvas() {
    ctx.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );
}


function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );
    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );
    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );
    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );
    ctx.closePath();
}


function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent = message;

    show(toast);

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        hide(toast);
    }, 1800);
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getBestScore(game) {

    try {
        return Number(
            localStorage.getItem(
                `cracker_games_best_${game}`
            )
        ) || 0;
    } catch {
        return 0;
    }
}


function saveBestScore(game, value) {

    try {
        const oldBest = getBestScore(game);

        if (value > oldBest) {
            localStorage.setItem(
                `cracker_games_best_${game}`,
                String(value)
            );

            return true;
        }

    } catch {
        // Ignore storage errors.
    }

    return false;
}


function updateBestScore() {

    if (!currentGame) {
        bestScoreElement.textContent = "0";
        return;
    }

    bestScoreElement.textContent =
        getBestScore(currentGame);
}


/* =========================================================
   PLAYER
   ========================================================= */

function loadTelegramUser() {

    if (!tg || !tg.initDataUnsafe) {
        return;
    }

    const user = tg.initDataUnsafe.user;

    if (!user) {
        return;
    }

    let name = "";

    if (user.first_name) {
        name += user.first_name;
    }

    if (user.last_name) {
        name += ` ${user.last_name}`;
    }

    if (!name && user.username) {
        name = `@${user.username}`;
    }

    if (name) {
        playerName.textContent = name;
    }

    if (user.photo_url) {
        playerAvatar.textContent = "";

        playerAvatar.style.backgroundImage =
            `url("${user.photo_url}")`;

        playerAvatar.style.backgroundSize = "cover";
        playerAvatar.style.backgroundPosition = "center";
    }
}


/* =========================================================
   GAME NAVIGATION
   ========================================================= */

function openGame(gameName) {

    if (!GAME_INFO[gameName]) {
        return;
    }

    stopGame();

    currentGame = gameName;

    const info = GAME_INFO[gameName];

    currentGameIcon.textContent = info.icon;
    currentGameName.textContent = info.name;

    overlayIcon.textContent = info.icon;
    overlayTitle.textContent = "Ready?";
    overlayDescription.textContent =
        info.description;

    setScore(0);

    updateBestScore();

    hide(homeScreen);
    show(gameScreen);

    show(startOverlay);
    hide(gameOverOverlay);

    gameControls.innerHTML = "";

    drawPreview(gameName);
}


function returnToMenu() {

    stopGame();

    currentGame = null;

    hide(gameScreen);
    show(homeScreen);

    gameControls.innerHTML = "";

    setScore(0);
}


function startCurrentGame() {

    if (!currentGame) {
        return;
    }

    stopGame();

    setScore(0);

    gameTime = 0;

    hide(startOverlay);
    hide(gameOverOverlay);

    gameRunning = true;

    lastFrameTime = performance.now();

    setupControls(currentGame);

    const starters = {
        racing: startRacing,
        fighting: startFighting,
        space: startSpaceShooter,
        runner: startRunner,
        penalty: startPenalty,
        basketball: startBasketball,
        archery: startArchery,
        target: startTarget
    };

    if (starters[currentGame]) {
        cleanupCurrentGame =
            starters[currentGame]();
    }

    animationId = requestAnimationFrame(gameLoop);
}


function gameOver() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    const isNewBest =
        saveBestScore(currentGame, score);

    finalScore.textContent = score;

    finalBestScore.textContent =
        getBestScore(currentGame);

    updateBestScore();

    show(gameOverOverlay);

    if (isNewBest) {
        showToast("🏆 New Best Score!");
    }

    if (tg && tg.HapticFeedback) {
        try {
            tg.HapticFeedback.notificationOccurred(
                "success"
            );
        } catch {
            // Ignore.
        }
    }
}


function stopGame() {

    gameRunning = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (cleanupCurrentGame) {
        try {
            cleanupCurrentGame();
        } catch {
            // Ignore cleanup errors.
        }
    }

    cleanupCurrentGame = null;

    keyState = {};

    pointerState.down = false;
}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    let delta = timestamp - lastFrameTime;

    if (!Number.isFinite(delta)) {
        delta = 16.67;
    }

    delta = Math.min(delta, 50);

    lastFrameTime = timestamp;

    const dt = delta / 1000;

    gameTime += dt;

    updateGame(dt);
    drawGame();

    animationId =
        requestAnimationFrame(gameLoop);
}


/* =========================================================
   GAME UPDATE
   ========================================================= */

function updateGame(dt) {

    switch (currentGame) {

        case "racing":
            if (racingGame.update) {
                racingGame.update(dt);
            }
            break;

        case "fighting":
            if (fightingGame.update) {
                fightingGame.update(dt);
            }
            break;

        case "space":
            if (spaceGame.update) {
                spaceGame.update(dt);
            }
            break;

        case "runner":
            if (runnerGame.update) {
                runnerGame.update(dt);
            }
            break;

        case "penalty":
            if (penaltyGame.update) {
                penaltyGame.update(dt);
            }
            break;

        case "basketball":
            if (basketballGame.update) {
                basketballGame.update(dt);
            }
            break;

        case "archery":
            if (archeryGame.update) {
                archeryGame.update(dt);
            }
            break;

        case "target":
            if (targetGame.update) {
                targetGame.update(dt);
            }
            break;
    }
}


/* =========================================================
   GAME DRAW
   ========================================================= */

function drawGame() {

    switch (currentGame) {

        case "racing":
            racingGame.draw();
            break;

        case "fighting":
            fightingGame.draw();
            break;

        case "space":
            spaceGame.draw();
            break;

        case "runner":
            runnerGame.draw();
            break;

        case "penalty":
            penaltyGame.draw();
            break;

        case "basketball":
            basketballGame.draw();
            break;

        case "archery":
            archeryGame.draw();
            break;

        case "target":
            targetGame.draw();
            break;
    }
}


/* =========================================================
   PREVIEW
   ========================================================= */

function drawPreview(game) {

    clearCanvas();

    ctx.fillStyle = "#050914";
    ctx.fillRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    const info = GAME_INFO[game];

    ctx.textAlign = "center";

    ctx.font = "80px sans-serif";
    ctx.fillText(
        info.icon,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 20
    );

    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        info.name,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 65
    );

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#8f9ab5";

    ctx.fillText(
        "Tap Start Game to play",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 100
    );
}


/* =========================================================
   CONTROLS
   ========================================================= */

function createControl(
    text,
    className = "",
    callback = null
) {

    const button =
        document.createElement("button");

    button.type = "button";
    button.className =
        `control-btn ${className}`;

    button.textContent = text;

    if (callback) {

        button.addEventListener(
            "pointerdown",
            event => {
                event.preventDefault();
                callback("down");
            }
        );

        button.addEventListener(
            "pointerup",
            event => {
                event.preventDefault();
                callback("up");
            }
        );

        button.addEventListener(
            "pointercancel",
            event => {
                event.preventDefault();
                callback("up");
            }
        );

        button.addEventListener(
            "pointerleave",
            event => {
                if (event.buttons) {
                    callback("up");
                }
            }
        );
    }

    gameControls.appendChild(button);

    return button;
}


function setupControls(game) {

    gameControls.innerHTML = "";

    if (game === "racing") {

        createControl(
            "◀",
            "",
            state => {
                keyState.ArrowLeft =
                    state === "down";
            }
        );

        createControl(
            "🚗",
            "large",
            state => {
                keyState.ArrowUp =
                    state === "down";
            }
        );

        createControl(
            "▶",
            "",
            state => {
                keyState.ArrowRight =
                    state === "down";
            }
        );
    }


    if (game === "fighting") {

        createControl(
            "⬅️",
            "",
            state => {
                keyState.ArrowLeft =
                    state === "down";
            }
        );

        createControl(
            "👊",
            "large",
            state => {
                if (state === "down") {
                    fightingGame.punch();
                }
            }
        );

        createControl(
            "➡️",
            "",
            state => {
                keyState.ArrowRight =
                    state === "down";
            }
        );
    }


    if (game === "space") {

        createControl(
            "◀",
            "",
            state => {
                keyState.ArrowLeft =
                    state === "down";
            }
        );

        createControl(
            "🔥 FIRE",
            "large",
            state => {
                if (state === "down") {
                    spaceGame.shoot();
                }
            }
        );

        createControl(
            "▶",
            "",
            state => {
                keyState.ArrowRight =
                    state === "down";
            }
        );
    }


    if (game === "runner") {

        createControl(
            "⬆️ JUMP",
            "large",
            state => {
                if (state === "down") {
                    runnerGame.jump();
                }
            }
        );
    }


    if (game === "penalty") {

        createControl(
            "↖️",
            "",
            () => penaltyGame.shoot("left")
        );

        createControl(
            "⬆️",
            "",
            () => penaltyGame.shoot("center")
        );

        createControl(
            "↗️",
            "",
            () => penaltyGame.shoot("right")
        );
    }


    if (game === "basketball") {

        createControl(
            "🏀 SHOOT",
            "large",
            state => {
                if (state === "down") {
                    basketballGame.shoot();
                }
            }
        );
    }


    if (game === "archery") {

        createControl(
            "🏹 FIRE",
            "large",
            state => {
                if (state === "down") {
                    archeryGame.shoot();
                }
            }
        );
    }


    if (game === "target") {

        createControl(
            "🎯 SHOOT",
            "large",
            state => {
                if (state === "down") {
                    targetGame.shoot(
                        pointerState.x,
                        pointerState.y
                    );
                }
            }
        );
    }
}


/* =========================================================
   KEYBOARD
   ========================================================= */

window.addEventListener(
    "keydown",
    event => {

        keyState[event.key] = true;

        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " "
            ].includes(event.key)
        ) {
            event.preventDefault();
        }

        if (
            currentGame === "runner" &&
            (
                event.key === " " ||
                event.key === "ArrowUp"
            )
        ) {
            runnerGame.jump();
        }

        if (
            currentGame === "space" &&
            event.key === " "
        ) {
            spaceGame.shoot();
        }

        if (
            currentGame === "fighting" &&
            (
                event.key === "f" ||
                event.key === "F"
            )
        ) {
            fightingGame.punch();
        }

        if (
            currentGame === "basketball" &&
            event.key === " "
        ) {
            basketballGame.shoot();
        }

        if (
            currentGame === "archery" &&
            event.key === " "
        ) {
            archeryGame.shoot();
        }

        if (
            currentGame === "target" &&
            event.key === " "
        ) {
            targetGame.shoot(
                pointerState.x,
                pointerState.y
            );
        }
    }
);


window.addEventListener(
    "keyup",
    event => {
        keyState[event.key] = false;
    }
);


/* =========================================================
   CANVAS POINTER
   ========================================================= */

gameCanvas.addEventListener(
    "pointerdown",
    event => {

        pointerState.down = true;

        updatePointerPosition(event);

        if (currentGame === "target") {
            targetGame.shoot(
                pointerState.x,
                pointerState.y
            );
        }

        if (currentGame === "basketball") {
            basketballGame.shoot();
        }

        if (currentGame === "archery") {
            archeryGame.shoot();
        }
    }
);


gameCanvas.addEventListener(
    "pointermove",
    event => {
        updatePointerPosition(event);
    }
);


gameCanvas.addEventListener(
    "pointerup",
    () => {
        pointerState.down = false;
    }
);


gameCanvas.addEventListener(
    "pointercancel",
    () => {
        pointerState.down = false;
    }
);


function updatePointerPosition(event) {

    const rect =
        gameCanvas.getBoundingClientRect();

    pointerState.x =
        (event.clientX - rect.left) *
        (CANVAS_WIDTH / rect.width);

    pointerState.y =
        (event.clientY - rect.top) *
        (CANVAS_HEIGHT / rect.height);
}


/* =========================================================
   1. CAR RACING
   ========================================================= */

const racingGame = {

    player: null,
    cars: [],
    roadOffset: 0,
    spawnTimer: 0,
    speed: 260,
    distance: 0,

    update(dt) {

        const g = this;

        g.speed += dt * 3;

        g.roadOffset += g.speed * dt;

        if (g.roadOffset > 80) {
            g.roadOffset -= 80;
        }

        const moveSpeed = 360;

        if (keyState.ArrowLeft) {
            g.player.x -= moveSpeed * dt;
        }

        if (keyState.ArrowRight) {
            g.player.x += moveSpeed * dt;
        }

        g.player.x = clamp(
            g.player.x,
            250,
            650
        );

        g.spawnTimer -= dt;

        if (g.spawnTimer <= 0) {

            g.spawnTimer =
                Math.max(
                    0.35,
                    0.85 - gameTime * 0.008
                );

            const lanes = [310, 410, 510];

            const lane =
                lanes[randomInt(0, lanes.length - 1)];

            g.cars.push({
                x: lane,
                y: -100,
                width: 55,
                height: 95,
                speed: g.speed + random(30, 100),
                type: randomInt(0, 2)
            });
        }

        for (const car of g.cars) {

            car.y += car.speed * dt;

            if (
                rectCollision(
                    {
                        x: g.player.x - 22,
                        y: g.player.y - 40,
                        width: 44,
                        height: 80
                    },
                    car
                )
            ) {
                gameOver();
                return;
            }
        }

        g.cars =
            g.cars.filter(car => {
                if (car.y > CANVAS_HEIGHT + 120) {
                    addScore(1);
                    return false;
                }

                return true;
            });

        g.distance += g.speed * dt;

        if (g.distance >= 500) {
            g.distance = 0;
            addScore(1);
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Sky */

        ctx.fillStyle = "#101a31";
        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Grass */

        ctx.fillStyle = "#162b24";

        ctx.fillRect(
            0,
            0,
            220,
            CANVAS_HEIGHT
        );

        ctx.fillRect(
            680,
            0,
            220,
            CANVAS_HEIGHT
        );

        /* Road */

        ctx.fillStyle = "#242936";

        ctx.fillRect(
            220,
            0,
            460,
            CANVAS_HEIGHT
        );

        /* Road borders */

        ctx.fillStyle = "#eeeeee";

        ctx.fillRect(
            220,
            0,
            7,
            CANVAS_HEIGHT
        );

        ctx.fillRect(
            673,
            0,
            7,
            CANVAS_HEIGHT
        );

        /* Lane lines */

        ctx.fillStyle = "#d6d6d6";

        for (
            let y = -80 + g.roadOffset;
            y < CANVAS_HEIGHT;
            y += 80
        ) {

            ctx.fillRect(
                370,
                y,
                7,
                45
            );

            ctx.fillRect(
                520,
                y,
                7,
                45
            );
        }

        /* Traffic */

        for (const car of g.cars) {

            ctx.fillStyle =
                car.type === 0
                    ? "#e74c5c"
                    : car.type === 1
                        ? "#4d9cff"
                        : "#f0a34e";

            roundedRect(
                car.x - 27,
                car.y,
                54,
                90,
                12
            );

            ctx.fill();

            ctx.fillStyle = "#10151f";

            roundedRect(
                car.x - 18,
                car.y + 13,
                36,
                25,
                7
            );

            ctx.fill();

            ctx.fillStyle = "#111";

            ctx.fillRect(
                car.x - 32,
                car.y + 18,
                7,
                18
            );

            ctx.fillRect(
                car.x + 25,
                car.y + 18,
                7,
                18
            );

            ctx.fillRect(
                car.x - 32,
                car.y + 64,
                7,
                18
            );

            ctx.fillRect(
                car.x + 25,
                car.y + 64,
                7,
                18
            );
        }

        /* Player car */

        ctx.fillStyle = "#6c63ff";

        roundedRect(
            g.player.x - 27,
            g.player.y - 45,
            54,
            90,
            12
        );

        ctx.fill();

        ctx.fillStyle = "#bfc8ff";

        roundedRect(
            g.player.x - 18,
            g.player.y - 28,
            36,
            25,
            7
        );

        ctx.fill();

        ctx.fillStyle = "#111";

        ctx.fillRect(
            g.player.x - 32,
            g.player.y - 25,
            7,
            18
        );

        ctx.fillRect(
            g.player.x + 25,
            g.player.y - 25,
            7,
            18
        );

        ctx.fillRect(
            g.player.x - 32,
            g.player.y + 20,
            7,
            18
        );

        ctx.fillRect(
            g.player.x + 25,
            g.player.y + 20,
            7,
            18
        );
    }
};


function startRacing() {

    racingGame.player = {
        x: 450,
        y: 500
    };

    racingGame.cars = [];
    racingGame.roadOffset = 0;
    racingGame.spawnTimer = 0.5;
    racingGame.speed = 260;
    racingGame.distance = 0;

    return null;
}


/* =========================================================
   2. FIGHTING ARENA
   ========================================================= */

const fightingGame = {

    player: null,
    enemy: null,
    attackTimer: 0,
    enemyAttackTimer: 1.4,
    hitFlash: 0,

    update(dt) {

        const g = this;

        if (g.hitFlash > 0) {
            g.hitFlash -= dt;
        }

        if (keyState.ArrowLeft) {
            g.player.x -= 180 * dt;
        }

        if (keyState.ArrowRight) {
            g.player.x += 180 * dt;
        }

        g.player.x =
            clamp(g.player.x, 140, 520);

        g.attackTimer =
            Math.max(0, g.attackTimer - dt);

        g.enemyAttackTimer -= dt;

        if (g.enemyAttackTimer <= 0) {

            g.enemyAttackTimer =
                random(1.0, 1.8);

            const closeEnough =
                Math.abs(
                    g.enemy.x - g.player.x
                ) < 150;

            if (closeEnough) {

                g.player.health -=
                    randomInt(7, 13);

                g.hitFlash = 0.15;

                if (g.player.health <= 0) {
                    gameOver();
                    return;
                }
            } else {

                if (g.enemy.x > g.player.x) {
                    g.enemy.x -= 35;
                } else {
                    g.enemy.x += 35;
                }
            }
        }
    },


    punch() {

        if (!gameRunning) {
            return;
        }

        if (this.attackTimer > 0) {
            return;
        }

        this.attackTimer = 0.45;

        const d =
            Math.abs(
                this.enemy.x - this.player.x
            );

        if (d < 155) {

            this.enemy.health -=
                randomInt(10, 18);

            addScore(5);

            if (this.enemy.health <= 0) {
                addScore(30);
                gameOver();
            }
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Arena */

        ctx.fillStyle = "#111a31";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.fillStyle = "#1b2744";

        ctx.fillRect(
            0,
            400,
            CANVAS_WIDTH,
            200
        );

        /* Ring ropes */

        ctx.strokeStyle = "#59647f";
        ctx.lineWidth = 5;

        for (const y of [250, 300, 350]) {

            ctx.beginPath();

            ctx.moveTo(80, y);
            ctx.lineTo(820, y);

            ctx.stroke();
        }

        /* Health bars */

        drawHealthBar(
            80,
            65,
            300,
            20,
            g.player.health,
            100,
            "#4ee28a"
        );

        drawHealthBar(
            520,
            65,
            300,
            20,
            g.enemy.health,
            100,
            "#ff5d73"
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 15px sans-serif";

        ctx.textAlign = "left";
        ctx.fillText(
            "PLAYER",
            80,
            52
        );

        ctx.textAlign = "right";
        ctx.fillText(
            "OPPONENT",
            820,
            52
        );

        /* Player */

        drawFighter(
            g.player.x,
            365,
            "#6c63ff",
            g.attackTimer > 0
        );

        /* Enemy */

        drawFighter(
            g.enemy.x,
            365,
            "#ff5d73",
            false
        );

        if (g.hitFlash > 0) {

            ctx.fillStyle =
                "rgba(255,255,255,0.18)";

            ctx.fillRect(
                0,
                0,
                CANVAS_WIDTH,
                CANVAS_HEIGHT
            );
        }
    }
};


function drawHealthBar(
    x,
    y,
    width,
    height,
    health,
    maxHealth,
    fill
) {

    ctx.fillStyle = "#20283d";

    roundedRect(
        x,
        y,
        width,
        height,
        10
    );

    ctx.fill();

    ctx.fillStyle = fill;

    roundedRect(
        x,
        y,
        width * clamp(
            health / maxHealth,
            0,
            1
        ),
        height,
        10
    );

    ctx.fill();
}


function drawFighter(
    x,
    y,
    color,
    attacking
) {

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(
        x,
        y - 95,
        27,
        0,
        Math.PI * 2
    );

    ctx.fill();

    roundedRect(
        x - 30,
        y - 65,
        60,
        80,
        18
    );

    ctx.fill();

    ctx.fillStyle = "#d9d9d9";

    ctx.fillRect(
        x - 8,
        y - 48,
        16,
        50
    );

    ctx.strokeStyle = color;
    ctx.lineWidth = 14;

    ctx.beginPath();

    ctx.moveTo(x - 25, y - 45);
    ctx.lineTo(
        x - (attacking ? 70 : 45),
        y - 20
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(x + 25, y - 45);
    ctx.lineTo(
        x + (attacking ? 75 : 45),
        y - 20
    );

    ctx.stroke();

    ctx.lineWidth = 18;

    ctx.beginPath();

    ctx.moveTo(x - 15, y + 10);
    ctx.lineTo(x - 25, y + 70);

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(x + 15, y + 10);
    ctx.lineTo(x + 25, y + 70);

    ctx.stroke();
}


function startFighting() {

    fightingGame.player = {
        x: 330,
        health: 100
    };

    fightingGame.enemy = {
        x: 570,
        health: 100
    };

    fightingGame.attackTimer = 0;
    fightingGame.enemyAttackTimer = 1.4;
    fightingGame.hitFlash = 0;

    return null;
}


/* =========================================================
   3. SPACE SHOOTER
   ========================================================= */

const spaceGame = {

    player: null,
    bullets: [],
    enemies: [],
    stars: [],
    spawnTimer: 0,
    fireTimer: 0,

    update(dt) {

        const g = this;

        for (const star of g.stars) {

            star.y += star.speed * dt;

            if (star.y > CANVAS_HEIGHT) {
                star.y = 0;
                star.x =
                    random(0, CANVAS_WIDTH);
            }
        }

        if (keyState.ArrowLeft) {
            g.player.x -= 330 * dt;
        }

        if (keyState.ArrowRight) {
            g.player.x += 330 * dt;
        }

        g.player.x =
            clamp(g.player.x, 30, 870);

        g.fireTimer =
            Math.max(0, g.fireTimer - dt);

        g.spawnTimer -= dt;

        if (g.spawnTimer <= 0) {

            g.spawnTimer =
                Math.max(
                    0.25,
                    0.8 - gameTime * 0.006
                );

            g.enemies.push({
                x: random(40, 860),
                y: -30,
                radius: 20,
                speed: random(90, 150)
                    + gameTime * 2,
                health: 1
            });
        }

        for (const bullet of g.bullets) {
            bullet.y -= 600 * dt;
        }

        for (const enemy of g.enemies) {

            enemy.y += enemy.speed * dt;

            if (
                distance(
                    enemy.x,
                    enemy.y,
                    g.player.x,
                    g.player.y
                ) < enemy.radius + 18
            ) {

                g.player.health -= 20;

                enemy.y =
                    CANVAS_HEIGHT + 100;

                if (g.player.health <= 0) {
                    gameOver();
                    return;
                }
            }
        }

        for (const bullet of g.bullets) {

            for (const enemy of g.enemies) {

                if (bullet.hit) {
                    continue;
                }

                if (
                    distance(
                        bullet.x,
                        bullet.y,
                        enemy.x,
                        enemy.y
                    ) <
                    enemy.radius + bullet.radius
                ) {

                    bullet.hit = true;
                    enemy.health--;

                    if (enemy.health <= 0) {
                        enemy.y =
                            CANVAS_HEIGHT + 100;

                        addScore(10);
                    }
                }
            }
        }

        g.bullets =
            g.bullets.filter(
                bullet =>
                    bullet.y > -50 &&
                    !bullet.hit
            );

        g.enemies =
            g.enemies.filter(
                enemy =>
                    enemy.y <
                    CANVAS_HEIGHT + 100
            );
    },


    shoot() {

        if (
            !gameRunning ||
            this.fireTimer > 0
        ) {
            return;
        }

        this.fireTimer = 0.18;

        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 25,
            radius: 5,
            hit: false
        });
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#050914";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Stars */

        ctx.fillStyle = "#ffffff";

        for (const star of g.stars) {

            ctx.globalAlpha = star.alpha;

            ctx.fillRect(
                star.x,
                star.y,
                star.size,
                star.size
            );
        }

        ctx.globalAlpha = 1;

        /* Bullets */

        ctx.fillStyle = "#7ff5ff";

        for (const bullet of g.bullets) {

            ctx.beginPath();

            ctx.arc(
                bullet.x,
                bullet.y,
                bullet.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        /* Enemies */

        for (const enemy of g.enemies) {

            ctx.fillStyle = "#ff5870";

            ctx.beginPath();

            ctx.moveTo(
                enemy.x,
                enemy.y - 24
            );

            ctx.lineTo(
                enemy.x - 24,
                enemy.y + 20
            );

            ctx.lineTo(
                enemy.x,
                enemy.y + 10
            );

            ctx.lineTo(
                enemy.x + 24,
                enemy.y + 20
            );

            ctx.closePath();

            ctx.fill();
        }

        /* Player ship */

        ctx.fillStyle = "#6c63ff";

        ctx.beginPath();

        ctx.moveTo(
            g.player.x,
            g.player.y - 30
        );

        ctx.lineTo(
            g.player.x - 25,
            g.player.y + 25
        );

        ctx.lineTo(
            g.player.x,
            g.player.y + 15
        );

        ctx.lineTo(
            g.player.x + 25,
            g.player.y + 25
        );

        ctx.closePath();

        ctx.fill();

        /* Health */

        drawHealthBar(
            20,
            20,
            180,
            14,
            g.player.health,
            100,
            "#4ee28a"
        );
    }
};


function startSpaceShooter() {

    spaceGame.player = {
        x: 450,
        y: 520,
        health: 100
    };

    spaceGame.bullets = [];
    spaceGame.enemies = [];
    spaceGame.spawnTimer = 0.5;
    spaceGame.fireTimer = 0;

    spaceGame.stars = [];

    for (let i = 0; i < 90; i++) {

        spaceGame.stars.push({
            x: random(0, CANVAS_WIDTH),
            y: random(0, CANVAS_HEIGHT),
            size: random(1, 3),
            speed: random(15, 60),
            alpha: random(0.3, 1)
        });
    }

    return null;
}


/* =========================================================
   4. ENDLESS RUNNER
   ========================================================= */

const runnerGame = {

    player: null,
    obstacles: [],
    groundOffset: 0,
    spawnTimer: 1,
    speed: 320,

    update(dt) {

        const g = this;

        g.speed += dt * 3;

        g.groundOffset +=
            g.speed * dt;

        if (g.groundOffset > 50) {
            g.groundOffset -= 50;
        }

        g.player.vy +=
            1300 * dt;

        g.player.y +=
            g.player.vy * dt;

        if (g.player.y >= 470) {

            g.player.y = 470;
            g.player.vy = 0;
            g.player.grounded = true;
        }

        g.spawnTimer -= dt;

        if (g.spawnTimer <= 0) {

            g.spawnTimer =
                random(0.8, 1.5);

            g.obstacles.push({
                x: 930,
                y: 425,
                width: random(25, 45),
                height: random(45, 70)
            });
        }

        for (const obstacle of g.obstacles) {

            obstacle.x -=
                g.speed * dt;

            if (
                rectCollision(
                    {
                        x: g.player.x - 20,
                        y: g.player.y - 55,
                        width: 40,
                        height: 55
                    },
                    obstacle
                )
            ) {

                gameOver();
                return;
            }
        }

        g.obstacles =
            g.obstacles.filter(
                obstacle => {

                    if (
                        obstacle.x +
                        obstacle.width <
                        0
                    ) {
                        addScore(2);
                        return false;
                    }

                    return true;
                }
            );
    },


    jump() {

        if (
            !gameRunning ||
            !this.player.grounded
        ) {
            return;
        }

        this.player.vy = -650;
        this.player.grounded = false;
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Sky */

        ctx.fillStyle = "#101a31";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Moon */

        ctx.fillStyle = "#fff3bd";

        ctx.beginPath();

        ctx.arc(
            750,
            110,
            42,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Ground */

        ctx.fillStyle = "#182e29";

        ctx.fillRect(
            0,
            500,
            CANVAS_WIDTH,
            100
        );

        /* Ground lines */

        ctx.strokeStyle = "#29493f";
        ctx.lineWidth = 3;

        for (
            let x = -50 + g.groundOffset;
            x < CANVAS_WIDTH;
            x += 50
        ) {

            ctx.beginPath();

            ctx.moveTo(x, 520);
            ctx.lineTo(x + 25, 520);

            ctx.stroke();
        }

        /* Obstacles */

        ctx.fillStyle = "#ff6a59";

        for (const obstacle of g.obstacles) {

            roundedRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height,
                8
            );

            ctx.fill();
        }

        /* Player */

        ctx.fillStyle = "#6c63ff";

        roundedRect(
            g.player.x - 22,
            g.player.y - 55,
            44,
            55,
            12
        );

        ctx.fill();

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            g.player.x - 8,
            g.player.y - 38,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            g.player.x + 8,
            g.player.y - 38,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
};


function startRunner() {

    runnerGame.player = {
        x: 150,
        y: 470,
        vy: 0,
        grounded: true
    };

    runnerGame.obstacles = [];
    runnerGame.groundOffset = 0;
    runnerGame.spawnTimer = 1;
    runnerGame.speed = 320;

    return null;
}


/* =========================================================
   5. PENALTY SHOOTOUT
   ========================================================= */

const penaltyGame = {

    shots: 0,
    goals: 0,
    cooldown: 0,
    keeper: null,
    message: "",

    update(dt) {

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        this.keeper.x =
            450 +
            Math.sin(gameTime * 2.3) * 180;
    },


    shoot(direction) {

        if (
            !gameRunning ||
            this.cooldown > 0
        ) {
            return;
        }

        this.cooldown = 0.7;

        this.shots++;

        const targetX = {
            left: 320,
            center: 450,
            right: 580
        }[direction];

        const keeperX =
            this.keeper.x;

        const saved =
            Math.abs(
                targetX - keeperX
            ) < 85;

        if (saved) {

            this.message = "🧤 SAVED!";

        } else {

            this.goals++;

            addScore(10);

            this.message = "⚽ GOAL!";
        }

        if (this.shots >= 10) {
            setTimeout(() => {
                if (gameRunning) {
                    gameOver();
                }
            }, 500);
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Stadium */

        ctx.fillStyle = "#10182c";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Grass */

        ctx.fillStyle = "#1e5739";

        ctx.fillRect(
            0,
            170,
            CANVAS_WIDTH,
            430
        );

        /* Goal */

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 9;

        ctx.strokeRect(
            270,
            90,
            360,
            210
        );

        /* Net */

        ctx.strokeStyle =
            "rgba(255,255,255,0.18)";

        ctx.lineWidth = 2;

        for (let x = 290; x < 630; x += 30) {

            ctx.beginPath();

            ctx.moveTo(x, 100);
            ctx.lineTo(x, 290);

            ctx.stroke();
        }

        for (let y = 110; y < 290; y += 30) {

            ctx.beginPath();

            ctx.moveTo(280, y);
            ctx.lineTo(620, y);

            ctx.stroke();
        }

        /* Keeper */

        ctx.fillStyle = "#ff5d73";

        roundedRect(
            g.keeper.x - 22,
            220,
            44,
            75,
            12
        );

        ctx.fill();

        ctx.fillStyle = "#ffd6b0";

        ctx.beginPath();

        ctx.arc(
            g.keeper.x,
            205,
            20,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Ball */

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            450,
            470,
            17,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Text */

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 26px sans-serif";

        ctx.fillText(
            g.message || "Choose a direction",
            450,
            55
        );

        ctx.font = "14px sans-serif";

        ctx.fillStyle = "#b7c0d5";

        ctx.fillText(
            `Shots: ${g.shots}/10   Goals: ${g.goals}`,
            450,
            80
        );
    }
};


function startPenalty() {

    penaltyGame.shots = 0;
    penaltyGame.goals = 0;
    penaltyGame.cooldown = 0;
    penaltyGame.message = "";

    penaltyGame.keeper = {
        x: 450
    };

    return null;
}


/* =========================================================
   6. BASKETBALL
   ========================================================= */

const basketballGame = {

    ball: null,
    hoop: null,
    shotCooldown: 0,
    shots: 0,
    made: 0,

    update(dt) {

        const g = this;

        if (g.shotCooldown > 0) {
            g.shotCooldown -= dt;
        }

        g.hoop.x =
            450 +
            Math.sin(gameTime * 1.8) * 170;

        if (g.ball.active) {

            g.ball.vy +=
                700 * dt;

            g.ball.x +=
                g.ball.vx * dt;

            g.ball.y +=
                g.ball.vy * dt;

            if (
                !g.ball.scored &&
                g.ball.vy > 0 &&
                g.ball.y >= g.hoop.y &&
                g.ball.y <= g.hoop.y + 35 &&
                Math.abs(
                    g.ball.x - g.hoop.x
                ) < 38
            ) {

                g.ball.scored = true;

                g.made++;

                addScore(10);
            }

            if (
                g.ball.y >
                CANVAS_HEIGHT + 50
            ) {

                g.ball.active = false;

                if (g.shots >= 10) {
                    setTimeout(() => {
                        if (gameRunning) {
                            gameOver();
                        }
                    }, 300);
                }
            }
        }
    },


    shoot() {

        if (
            !gameRunning ||
            this.shotCooldown > 0 ||
            this.ball.active
        ) {
            return;
        }

        this.shotCooldown = 0.35;

        this.shots++;

        this.ball = {
            x: 220,
            y: 500,
            vx: random(330, 440),
            vy: random(-680, -560),
            active: true,
            scored: false
        };
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Background */

        ctx.fillStyle = "#10182b";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Court */

        ctx.fillStyle = "#2a3150";

        ctx.fillRect(
            0,
            470,
            CANVAS_WIDTH,
            130
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.25)";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
            200,
            530,
            120,
            Math.PI,
            0
        );

        ctx.stroke();

        /* Backboard */

        ctx.fillStyle = "#e7eaf2";

        ctx.fillRect(
            g.hoop.x - 65,
            g.hoop.y - 75,
            130,
            8
        );

        /* Rim */

        ctx.strokeStyle = "#ff7043";
        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.ellipse(
            g.hoop.x,
            g.hoop.y,
            40,
            10,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        /* Net */

        ctx.strokeStyle =
            "rgba(255,255,255,0.7)";

        ctx.lineWidth = 2;

        for (
            let x = g.hoop.x - 32;
            x <= g.hoop.x + 32;
            x += 16
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                g.hoop.y + 8
            );

            ctx.lineTo(
                g.hoop.x,
                g.hoop.y + 60
            );

            ctx.stroke();
        }

        /* Ball */

        if (g.ball.active) {

            ctx.fillStyle = "#f28c3c";

            ctx.beginPath();

            ctx.arc(
                g.ball.x,
                g.ball.y,
                18,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle = "#512d18";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.arc(
                g.ball.x,
                g.ball.y,
                18,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        } else {

            ctx.fillStyle = "#f28c3c";

            ctx.beginPath();

            ctx.arc(
                220,
                500,
                18,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        ctx.font = "bold 20px sans-serif";

        ctx.fillText(
            `Shots ${g.shots}/10   •   Made ${g.made}`,
            450,
            45
        );
    }
};


function startBasketball() {

    basketballGame.ball = {
        x: 220,
        y: 500,
        active: false,
        scored: false
    };

    basketballGame.hoop = {
        x: 650,
        y: 210
    };

    basketballGame.shotCooldown = 0;
    basketballGame.shots = 0;
    basketballGame.made = 0;

    return null;
}


/* =========================================================
   7. ARCHERY
   ========================================================= */

const archeryGame = {

    target: null,
    arrow: null,
    shots: 0,
    maxShots: 15,
    cooldown: 0,

    update(dt) {

        const g = this;

        if (g.cooldown > 0) {
            g.cooldown -= dt;
        }

        g.target.x =
            450 +
            Math.sin(gameTime * 1.7) * 280;

        g.target.y =
            260 +
            Math.cos(gameTime * 1.3) * 100;

        if (g.arrow) {

            g.arrow.x +=
                g.arrow.vx * dt;

            g.arrow.y +=
                g.arrow.vy * dt;

            const hit =
                distance(
                    g.arrow.x,
                    g.arrow.y,
                    g.target.x,
                    g.target.y
                ) < g.target.radius;

            if (hit) {

                const d =
                    distance(
                        g.arrow.x,
                        g.arrow.y,
                        g.target.x,
                        g.target.y
                    );

                const points =
                    d < 18
                        ? 30
                        : d < 38
                            ? 20
                            : 10;

                addScore(points);

                g.arrow = null;
            }

            if (
                g.arrow &&
                (
                    g.arrow.x < -50 ||
                    g.arrow.x >
                    CANVAS_WIDTH + 50 ||
                    g.arrow.y < -50 ||
                    g.arrow.y >
                    CANVAS_HEIGHT + 50
                )
            ) {
                g.arrow = null;
            }
        }

        if (
            g.shots >= g.maxShots &&
            !g.arrow
        ) {

            setTimeout(() => {
                if (gameRunning) {
                    gameOver();
                }
            }, 250);
        }
    },


    shoot() {

        if (
            !gameRunning ||
            this.cooldown > 0 ||
            this.arrow
        ) {
            return;
        }

        this.cooldown = 0.3;

        this.shots++;

        const startX = 120;
        const startY = 480;

        const dx =
            this.target.x - startX;

        const dy =
            this.target.y - startY;

        const length =
            Math.sqrt(dx * dx + dy * dy);

        const speed = 700;

        this.arrow = {
            x: startX,
            y: startY,
            vx: (dx / length) * speed,
            vy: (dy / length) * speed
        };
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Background */

        ctx.fillStyle = "#10192d";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Ground */

        ctx.fillStyle = "#1b3028";

        ctx.fillRect(
            0,
            520,
            CANVAS_WIDTH,
            80
        );

        /* Bow */

        ctx.strokeStyle = "#c79255";
        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
            120,
            450,
            70,
            -Math.PI / 2,
            Math.PI / 2
        );

        ctx.stroke();

        ctx.strokeStyle = "#eeeeee";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            120,
            380
        );

        ctx.lineTo(
            120,
            520
        );

        ctx.stroke();

        /* Target */

        const rings = [
            {
                radius: g.target.radius,
                color: "#f5f5f5"
            },
            {
                radius: 48,
                color: "#e64e5c"
            },
            {
                radius: 34,
                color: "#f5f5f5"
            },
            {
                radius: 20,
                color: "#e64e5c"
            },
            {
                radius: 9,
                color: "#ffd34e"
            }
        ];

        for (const ring of rings) {

            ctx.fillStyle = ring.color;

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                ring.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        /* Arrow */

        if (g.arrow) {

            const angle =
                Math.atan2(
                    g.arrow.vy,
                    g.arrow.vx
                );

            ctx.save();

            ctx.translate(
                g.arrow.x,
                g.arrow.y
            );

            ctx.rotate(angle);

            ctx.strokeStyle = "#d7b06f";
            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.moveTo(-30, 0);
            ctx.lineTo(30, 0);

            ctx.stroke();

            ctx.restore();
        }

        ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";

        ctx.font = "bold 20px sans-serif";

        ctx.fillText(
            `Shots ${g.shots}/${g.maxShots}`,
            450,
            45
        );
    }
};


function startArchery() {

    archeryGame.target = {
        x: 650,
        y: 260,
        radius: 60
    };

    archeryGame.arrow = null;
    archeryGame.shots = 0;
    archeryGame.maxShots = 15;
    archeryGame.cooldown = 0;

    return null;
}


/* =========================================================
   8. TARGET SHOOTER
   ========================================================= */

const targetGame = {

    target: null,
    targetsHit: 0,
    misses: 0,
    spawnTimer: 0,
    lifetime: 1.4,

    update(dt) {

        const g = this;

        g.spawnTimer -= dt;

        if (
            !g.target ||
            g.spawnTimer <= 0
        ) {

            g.spawnTimer =
                Math.max(
                    0.45,
                    g.lifetime -
                    gameTime * 0.005
                );

            g.target = {
                x: random(70, 830),
                y: random(100, 500),
                radius: random(25, 48),
                life: g.spawnTimer
            };
        }

        if (g.target) {

            g.target.life -= dt;

            if (g.target.life <= 0) {

                g.misses++;

                g.target = null;

                if (g.misses >= 5) {
                    gameOver();
                }
            }
        }
    },


    shoot(x, y) {

        if (
            !gameRunning ||
            !this.target
        ) {
            return;
        }

        const hit =
            distance(
                x,
                y,
                this.target.x,
                this.target.y
            ) <= this.target.radius;

        if (hit) {

            const d =
                distance(
                    x,
                    y,
                    this.target.x,
                    this.target.y
                );

            const points =
                d < this.target.radius * 0.3
                    ? 20
                    : 10;

            addScore(points);

            this.targetsHit++;

            this.target = null;

            this.spawnTimer = 0.05;

        } else {

            this.misses++;

            if (this.misses >= 5) {
                gameOver();
            }
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        /* Background */

        ctx.fillStyle = "#080d1c";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        /* Grid */

        ctx.strokeStyle =
            "rgba(255,255,255,0.05)";

        ctx.lineWidth = 1;

        for (let x = 0; x <= 900; x += 50) {

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, 600);

            ctx.stroke();
        }

        for (let y = 0; y <= 600; y += 50) {

            ctx.beginPath();

            ctx.moveTo(0, y);
            ctx.lineTo(900, y);

            ctx.stroke();
        }

        /* Target */

        if (g.target) {

            ctx.fillStyle = "#ffffff";

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                g.target.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle = "#ff5d73";

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                g.target.radius * 0.7,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle = "#ffffff";

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                g.target.radius * 0.4,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle = "#ff5d73";

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                g.target.radius * 0.17,
                0,
                Math.PI * 2
            );

            ctx.fill();

            /* Timer ring */

            ctx.strokeStyle =
                "#6c63ff";

            ctx.lineWidth = 5;

            ctx.beginPath();

            ctx.arc(
                g.target.x,
                g.target.y,
                g.target.radius + 8,
                -Math.PI / 2,
                -Math.PI / 2 +
                Math.PI * 2 *
                clamp(
                    g.target.life /
                    Math.max(
                        g.spawnTimer,
                        0.01
                    ),
                    0,
                    1
                )
            );

            ctx.stroke();
        }

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 20px sans-serif";

        ctx.fillText(
            `🎯 Hit: ${g.targetsHit}   ❌ Miss: ${g.misses}/5`,
            450,
            35
        );
    }
};


function startTarget() {

    targetGame.target = null;
    targetGame.targetsHit = 0;
    targetGame.misses = 0;
    targetGame.spawnTimer = 0.2;
    targetGame.lifetime = 1.4;

    return null;
}


/* =========================================================
   EVENTS
   ========================================================= */

document.querySelectorAll(
    ".game-card"
).forEach(card => {

    card.addEventListener(
        "click",
        () => {
            openGame(
                card.dataset.game
            );
        }
    );
});


startGameBtn.addEventListener(
    "click",
    startCurrentGame
);


restartGameBtn.addEventListener(
    "click",
    startCurrentGame
);


backBtn.addEventListener(
    "click",
    returnToMenu
);


menuGameBtn.addEventListener(
    "click",
    returnToMenu
);


closeAppBtn.addEventListener(
    "click",
    () => {

        stopGame();

        if (tg) {

            try {
                tg.close();
            } catch {
                window.history.back();
            }

        } else {

            window.history.back();
        }
    }
);


/* =========================================================
   RESIZE / ORIENTATION
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            gameScreen &&
            !gameScreen.classList.contains(
                "hidden"
            )
        ) {
            updatePointerPositionFromCenter();
        }
    }
);


function updatePointerPositionFromCenter() {

    const rect =
        gameCanvas.getBoundingClientRect();

    pointerState.x =
        clamp(
            CANVAS_WIDTH / 2,
            0,
            CANVAS_WIDTH
        );

    pointerState.y =
        clamp(
            CANVAS_HEIGHT / 2,
            0,
            CANVAS_HEIGHT
        );
}


/* =========================================================
   TELEGRAM BACK BUTTON
   ========================================================= */

if (tg && tg.BackButton) {

    tg.BackButton.onClick(
        () => {

            if (
                gameScreen &&
                !gameScreen.classList.contains(
                    "hidden"
                )
            ) {
                returnToMenu();
            } else {
                tg.close();
            }
        }
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

loadTelegramUser();

setScore(0);

updateBestScore();

drawPreview("racing");


/* =========================================================
   END
   ========================================================= */
