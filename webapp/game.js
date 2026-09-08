/* =========================================================
   CRACKER GAMES - TELEGRAM MINI APP
   game.js

   Existing Games:
   1. Car Racing
   2. Fighting Arena
   3. Space Shooter
   4. Endless Runner
   5. Penalty Shootout
   6. Basketball
   7. Archery
   8. Target Shooter

   New Games:
   9. Pipe Connect
   10. Traffic Escape
   11. Lights Out
   12. Stack Tower
   13. Gravity Maze
   14. Treasure Hunt
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
    },

    /* =====================================================
       NEW GAMES
       ===================================================== */

    pipe: {
        name: "Pipe Connect",
        icon: "🧩",
        description: "Rotate pipes and connect the entire network."
    },

    traffic: {
        name: "Traffic Escape",
        icon: "🚦",
        description: "Move the cars and clear the red car's path."
    },

    lights: {
        name: "Lights Out",
        icon: "💡",
        description: "Turn every light off using as few moves as possible."
    },

    stack: {
        name: "Stack Tower",
        icon: "🏗️",
        description: "Drop moving blocks and build the tallest tower."
    },

    gravity: {
        name: "Gravity Maze",
        icon: "🌀",
        description: "Change gravity and guide the explorer to the exit."
    },

    treasure: {
        name: "Treasure Hunt",
        icon: "🗺️",
        description: "Explore the map, avoid traps and find the treasure."
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

    const r = Math.min(
        radius,
        width / 2,
        height / 2
    );

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
   ADD NEW GAME CARDS
   ========================================================= */

function addNewGameCards() {

    const existingCards =
        document.querySelectorAll(".game-card");

    if (!existingCards.length) {
        return;
    }

    const container =
        existingCards[0].parentElement;

    if (!container) {
        return;
    }

    const newGames = [
        "pipe",
        "traffic",
        "lights",
        "stack",
        "gravity",
        "treasure"
    ];

    newGames.forEach(gameName => {

        if (
            container.querySelector(
                `.game-card[data-game="${gameName}"]`
            )
        ) {
            return;
        }

        const info = GAME_INFO[gameName];

        const card =
            document.createElement("button");

        card.type = "button";
        card.className = "game-card";
        card.dataset.game = gameName;

        card.innerHTML = `
            <span class="game-icon">${info.icon}</span>
            <span class="game-name">${info.name}</span>
            <span class="game-description">${info.description}</span>
        `;

        container.appendChild(card);

        card.addEventListener(
            "click",
            () => openGame(gameName)
        );
    });
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

    lastFrameTime =
        performance.now();

    setupControls(currentGame);

    const starters = {

        racing: startRacing,
        fighting: startFighting,
        space: startSpaceShooter,
        runner: startRunner,
        penalty: startPenalty,
        basketball: startBasketball,
        archery: startArchery,
        target: startTarget,

        pipe: startPipeConnect,
        traffic: startTrafficEscape,
        lights: startLightsOut,
        stack: startStackTower,
        gravity: startGravityMaze,
        treasure: startTreasureHunt

    };

    if (starters[currentGame]) {

        cleanupCurrentGame =
            starters[currentGame]();
    }

    animationId =
        requestAnimationFrame(gameLoop);
}


function gameOver() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    if (animationId) {

        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    const isNewBest =
        saveBestScore(
            currentGame,
            score
        );

    finalScore.textContent =
        score;

    finalBestScore.textContent =
        getBestScore(currentGame);

    updateBestScore();

    show(gameOverOverlay);

    if (isNewBest) {
        showToast(
            "🏆 New Best Score!"
        );
    }

    if (
        tg &&
        tg.HapticFeedback
    ) {

        try {

            tg.HapticFeedback
                .notificationOccurred(
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

        cancelAnimationFrame(
            animationId
        );

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

    let delta =
        timestamp - lastFrameTime;

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
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   GAME UPDATE
   ========================================================= */

function updateGame(dt) {

    switch (currentGame) {

        case "racing":
            racingGame.update(dt);
            break;

        case "fighting":
            fightingGame.update(dt);
            break;

        case "space":
            spaceGame.update(dt);
            break;

        case "runner":
            runnerGame.update(dt);
            break;

        case "penalty":
            penaltyGame.update(dt);
            break;

        case "basketball":
            basketballGame.update(dt);
            break;

        case "archery":
            archeryGame.update(dt);
            break;

        case "target":
            targetGame.update(dt);
            break;

        case "pipe":
            pipeGame.update(dt);
            break;

        case "traffic":
            trafficGame.update(dt);
            break;

        case "lights":
            lightsGame.update(dt);
            break;

        case "stack":
            stackGame.update(dt);
            break;

        case "gravity":
            gravityGame.update(dt);
            break;

        case "treasure":
            treasureGame.update(dt);
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

        case "pipe":
            pipeGame.draw();
            break;

        case "traffic":
            trafficGame.draw();
            break;

        case "lights":
            lightsGame.draw();
            break;

        case "stack":
            stackGame.draw();
            break;

        case "gravity":
            gravityGame.draw();
            break;

        case "treasure":
            treasureGame.draw();
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

    ctx.font =
        "bold 28px sans-serif";

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


    /* =====================================================
       OLD GAMES
       ===================================================== */

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


    /* =====================================================
       NEW GAMES
       ===================================================== */

    if (game === "pipe") {

        createControl(
            "↺ ROTATE",
            "large",
            state => {

                if (state === "down") {
                    pipeGame.rotateSelected(-1);
                }
            }
        );

        createControl(
            "↻ ROTATE",
            "large",
            state => {

                if (state === "down") {
                    pipeGame.rotateSelected(1);
                }
            }
        );
    }


    if (game === "traffic") {

        createControl(
            "⬅️",
            "",
            state => {
                keyState.ArrowLeft =
                    state === "down";
            }
        );

        createControl(
            "⬆️",
            "",
            state => {
                keyState.ArrowUp =
                    state === "down";
            }
        );

        createControl(
            "⬇️",
            "",
            state => {
                keyState.ArrowDown =
                    state === "down";
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


    if (game === "lights") {

        createControl(
            "💡 TAP A TILE",
            "large",
            state => {

                if (state === "down") {

                    lightsGame.tap(
                        pointerState.x,
                        pointerState.y
                    );
                }
            }
        );
    }


    if (game === "stack") {

        createControl(
            "🏗️ DROP",
            "large",
            state => {

                if (state === "down") {
                    stackGame.drop();
                }
            }
        );
    }


    if (game === "gravity") {

        createControl(
            "⬆️",
            "",
            state => {

                if (state === "down") {
                    gravityGame.setGravity(
                        0,
                        -1
                    );
                }
            }
        );

        createControl(
            "⬅️",
            "",
            state => {

                if (state === "down") {
                    gravityGame.setGravity(
                        -1,
                        0
                    );
                }
            }
        );

        createControl(
            "⬇️",
            "",
            state => {

                if (state === "down") {
                    gravityGame.setGravity(
                        0,
                        1
                    );
                }
            }
        );

        createControl(
            "➡️",
            "",
            state => {

                if (state === "down") {
                    gravityGame.setGravity(
                        1,
                        0
                    );
                }
            }
        );
    }


    if (game === "treasure") {

        createControl(
            "⬅️",
            "",
            state => {

                keyState.ArrowLeft =
                    state === "down";
            }
        );

        createControl(
            "⬆️",
            "",
            state => {

                keyState.ArrowUp =
                    state === "down";
            }
        );

        createControl(
            "⬇️",
            "",
            state => {

                keyState.ArrowDown =
                    state === "down";
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


        /* NEW GAME KEYBOARD CONTROLS */

        if (currentGame === "pipe") {

            if (event.key === "Enter") {
                pipeGame.rotateSelected(1);
            }

            if (event.key === "q") {
                pipeGame.rotateSelected(-1);
            }

            if (event.key === "e") {
                pipeGame.rotateSelected(1);
            }

            if (
                event.key.startsWith("Arrow")
            ) {
                pipeGame.moveSelection(
                    event.key
                );
            }
        }


        if (currentGame === "stack") {

            if (event.key === " ") {
                stackGame.drop();
            }
        }


        if (currentGame === "gravity") {

            if (event.key === "ArrowUp") {
                gravityGame.setGravity(
                    0,
                    -1
                );
            }

            if (event.key === "ArrowDown") {
                gravityGame.setGravity(
                    0,
                    1
                );
            }

            if (event.key === "ArrowLeft") {
                gravityGame.setGravity(
                    -1,
                    0
                );
            }

            if (event.key === "ArrowRight") {
                gravityGame.setGravity(
                    1,
                    0
                );
            }
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


        if (currentGame === "pipe") {

            pipeGame.selectTile(
                pointerState.x,
                pointerState.y
            );
        }


        if (currentGame === "lights") {

            lightsGame.tap(
                pointerState.x,
                pointerState.y
            );
        }


        if (currentGame === "stack") {
            stackGame.drop();
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

        g.roadOffset +=
            g.speed * dt;

        if (g.roadOffset > 80) {
            g.roadOffset -= 80;
        }

        const moveSpeed = 360;

        if (keyState.ArrowLeft) {
            g.player.x -=
                moveSpeed * dt;
        }

        if (keyState.ArrowRight) {
            g.player.x +=
                moveSpeed * dt;
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
                    0.85 -
                    gameTime * 0.008
                );

            const lanes = [
                310,
                410,
                510
            ];

            const lane =
                lanes[
                    randomInt(
                        0,
                        lanes.length - 1
                    )
                ];

            g.cars.push({
                x: lane,
                y: -100,
                width: 55,
                height: 95,
                speed:
                    g.speed +
                    random(30, 100),
                type:
                    randomInt(0, 2)
            });
        }

        for (const car of g.cars) {

            car.y +=
                car.speed * dt;

            if (
                rectCollision(
                    {
                        x:
                            g.player.x - 22,
                        y:
                            g.player.y - 40,
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

                if (
                    car.y >
                    CANVAS_HEIGHT + 120
                ) {

                    addScore(1);

                    return false;
                }

                return true;
            });

        g.distance +=
            g.speed * dt;

        if (g.distance >= 500) {

            g.distance = 0;

            addScore(1);
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#101a31";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

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

        ctx.fillStyle = "#242936";

        ctx.fillRect(
            220,
            0,
            460,
            CANVAS_HEIGHT
        );

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
            clamp(
                g.player.x,
                140,
                520
            );

        g.attackTimer =
            Math.max(
                0,
                g.attackTimer - dt
            );

        g.enemyAttackTimer -= dt;

        if (
            g.enemyAttackTimer <= 0
        ) {

            g.enemyAttackTimer =
                random(1.0, 1.8);

            const closeEnough =
                Math.abs(
                    g.enemy.x -
                    g.player.x
                ) < 150;

            if (closeEnough) {

                g.player.health -=
                    randomInt(7, 13);

                g.hitFlash = 0.15;

                if (
                    g.player.health <= 0
                ) {

                    gameOver();

                    return;
                }

            } else {

                if (
                    g.enemy.x >
                    g.player.x
                ) {

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
                this.enemy.x -
                this.player.x
            );

        if (d < 155) {

            this.enemy.health -=
                randomInt(10, 18);

            addScore(5);

            if (
                this.enemy.health <= 0
            ) {

                addScore(30);

                gameOver();
            }
        }
    },


    draw() {

        const g = this;

        clearCanvas();

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

        ctx.strokeStyle = "#59647f";
        ctx.lineWidth = 5;

        for (
            const y of [
                250,
                300,
                350
            ]
        ) {

            ctx.beginPath();

            ctx.moveTo(80, y);
            ctx.lineTo(820, y);

            ctx.stroke();
        }

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

        ctx.font =
            "bold 15px sans-serif";

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

        drawFighter(
            g.player.x,
            365,
            "#6c63ff",
            g.attackTimer > 0
        );

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
        width *
            clamp(
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

    ctx.moveTo(
        x - 25,
        y - 45
    );

    ctx.lineTo(
        x -
        (attacking ? 70 : 45),
        y - 20
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x + 25,
        y - 45
    );

    ctx.lineTo(
        x +
        (attacking ? 75 : 45),
        y - 20
    );

    ctx.stroke();

    ctx.lineWidth = 18;

    ctx.beginPath();

    ctx.moveTo(
        x - 15,
        y + 10
    );

    ctx.lineTo(
        x - 25,
        y + 70
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x + 15,
        y + 10
    );

    ctx.lineTo(
        x + 25,
        y + 70
    );

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

            star.y +=
                star.speed * dt;

            if (
                star.y >
                CANVAS_HEIGHT
            ) {

                star.y = 0;

                star.x =
                    random(
                        0,
                        CANVAS_WIDTH
                    );
            }
        }

        if (keyState.ArrowLeft) {

            g.player.x -=
                330 * dt;
        }

        if (keyState.ArrowRight) {

            g.player.x +=
                330 * dt;
        }

        g.player.x =
            clamp(
                g.player.x,
                30,
                870
            );

        g.fireTimer =
            Math.max(
                0,
                g.fireTimer - dt
            );

        g.spawnTimer -= dt;

        if (g.spawnTimer <= 0) {

            g.spawnTimer =
                Math.max(
                    0.25,
                    0.8 -
                    gameTime * 0.006
                );

            g.enemies.push({

                x:
                    random(
                        40,
                        860
                    ),

                y: -30,

                radius: 20,

                speed:
                    random(
                        90,
                        150
                    ) +
                    gameTime * 2,

                health: 1
            });
        }

        for (const bullet of g.bullets) {

            bullet.y -=
                600 * dt;
        }

        for (const enemy of g.enemies) {

            enemy.y +=
                enemy.speed * dt;

            if (
                distance(
                    enemy.x,
                    enemy.y,
                    g.player.x,
                    g.player.y
                ) <
                enemy.radius + 18
            ) {

                g.player.health -= 20;

                enemy.y =
                    CANVAS_HEIGHT + 100;

                if (
                    g.player.health <= 0
                ) {

                    gameOver();

                    return;
                }
            }
        }

        for (const bullet of g.bullets) {

            for (
                const enemy of g.enemies
            ) {

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
                    enemy.radius +
                    bullet.radius
                ) {

                    bullet.hit = true;

                    enemy.health--;

                    if (
                        enemy.health <= 0
                    ) {

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

            x:
                this.player.x,

            y:
                this.player.y - 25,

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

        ctx.fillStyle = "#ffffff";

        for (
            const star of g.stars
        ) {

            ctx.globalAlpha =
                star.alpha;

            ctx.fillRect(
                star.x,
                star.y,
                star.size,
                star.size
            );
        }

        ctx.globalAlpha = 1;

        ctx.fillStyle = "#7ff5ff";

        for (
            const bullet of g.bullets
        ) {

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

        for (
            const enemy of g.enemies
        ) {

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

            x:
                random(
                    0,
                    CANVAS_WIDTH
                ),

            y:
                random(
                    0,
                    CANVAS_HEIGHT
                ),

            size:
                random(1, 3),

            speed:
                random(15, 60),

            alpha:
                random(0.3, 1)
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

        g.speed +=
            dt * 3;

        g.groundOffset +=
            g.speed * dt;

        if (
            g.groundOffset > 50
        ) {
            g.groundOffset -= 50;
        }

        g.player.vy +=
            1300 * dt;

        g.player.y +=
            g.player.vy * dt;

        if (
            g.player.y >= 470
        ) {

            g.player.y = 470;

            g.player.vy = 0;

            g.player.grounded = true;
        }

        g.spawnTimer -= dt;

        if (
            g.spawnTimer <= 0
        ) {

            g.spawnTimer =
                random(0.8, 1.5);

            g.obstacles.push({

                x: 930,

                y: 425,

                width:
                    random(25, 45),

                height:
                    random(45, 70)
            });
        }

        for (
            const obstacle of
            g.obstacles
        ) {

            obstacle.x -=
                g.speed * dt;

            if (
                rectCollision(
                    {
                        x:
                            g.player.x - 20,

                        y:
                            g.player.y - 55,

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

        this.player.grounded =
            false;
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#101a31";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

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

        ctx.fillStyle = "#182e29";

        ctx.fillRect(
            0,
            500,
            CANVAS_WIDTH,
            100
        );

        ctx.strokeStyle = "#29493f";

        ctx.lineWidth = 3;

        for (
            let x =
                -50 +
                g.groundOffset;

            x <
            CANVAS_WIDTH;

            x += 50
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                520
            );

            ctx.lineTo(
                x + 25,
                520
            );

            ctx.stroke();
        }

        ctx.fillStyle = "#ff6a59";

        for (
            const obstacle of
            g.obstacles
        ) {

            roundedRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height,
                8
            );

            ctx.fill();
        }

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
            Math.sin(
                gameTime * 2.3
            ) * 180;
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
                targetX -
                keeperX
            ) < 85;

        if (saved) {

            this.message =
                "🧤 SAVED!";

        } else {

            this.goals++;

            addScore(10);

            this.message =
                "⚽ GOAL!";
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

        ctx.fillStyle = "#10182c";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.fillStyle = "#1e5739";

        ctx.fillRect(
            0,
            170,
            CANVAS_WIDTH,
            430
        );

        ctx.strokeStyle = "#ffffff";

        ctx.lineWidth = 9;

        ctx.strokeRect(
            270,
            90,
            360,
            210
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.18)";

        ctx.lineWidth = 2;

        for (
            let x = 290;
            x < 630;
            x += 30
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                100
            );

            ctx.lineTo(
                x,
                290
            );

            ctx.stroke();
        }

        for (
            let y = 110;
            y < 290;
            y += 30
        ) {

            ctx.beginPath();

            ctx.moveTo(
                280,
                y
            );

            ctx.lineTo(
                620,
                y
            );

            ctx.stroke();
        }

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

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 26px sans-serif";

        ctx.fillText(
            g.message ||
            "Choose a direction",
            450,
            55
        );

        ctx.font =
            "14px sans-serif";

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

        if (
            g.shotCooldown > 0
        ) {
            g.shotCooldown -= dt;
        }

        g.hoop.x =
            450 +
            Math.sin(
                gameTime * 1.8
            ) * 170;

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
                g.ball.y >=
                    g.hoop.y &&
                g.ball.y <=
                    g.hoop.y + 35 &&
                Math.abs(
                    g.ball.x -
                    g.hoop.x
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

                if (
                    g.shots >= 10
                ) {

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

            vx:
                random(330, 440),

            vy:
                random(-680, -560),

            active: true,

            scored: false
        };
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#10182b";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

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

        ctx.fillStyle = "#e7eaf2";

        ctx.fillRect(
            g.hoop.x - 65,
            g.hoop.y - 75,
            130,
            8
        );

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

        ctx.strokeStyle =
            "rgba(255,255,255,0.7)";

        ctx.lineWidth = 2;

        for (
            let x =
                g.hoop.x - 32;

            x <=
                g.hoop.x + 32;

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

        ctx.font =
            "bold 20px sans-serif";

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

        if (
            g.cooldown > 0
        ) {
            g.cooldown -= dt;
        }

        g.target.x =
            450 +
            Math.sin(
                gameTime * 1.7
            ) * 280;

        g.target.y =
            260 +
            Math.cos(
                gameTime * 1.3
            ) * 100;

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
                ) <
                g.target.radius;

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
            g.shots >=
                g.maxShots &&
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
            this.target.x -
            startX;

        const dy =
            this.target.y -
            startY;

        const length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        const speed = 700;

        this.arrow = {

            x: startX,

            y: startY,

            vx:
                (dx / length) *
                speed,

            vy:
                (dy / length) *
                speed
        };
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#10192d";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.fillStyle = "#1b3028";

        ctx.fillRect(
            0,
            520,
            CANVAS_WIDTH,
            80
        );

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

        const rings = [

            {
                radius:
                    g.target.radius,

                color:
                    "#f5f5f5"
            },

            {
                radius: 48,

                color:
                    "#e64e5c"
            },

            {
                radius: 34,

                color:
                    "#f5f5f5"
            },

            {
                radius: 20,

                color:
                    "#e64e5c"
            },

            {
                radius: 9,

                color:
                    "#ffd34e"
            }
        ];

        for (
            const ring of rings
        ) {

            ctx.fillStyle =
                ring.color;

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

            ctx.strokeStyle =
                "#d7b06f";

            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.moveTo(
                -30,
                0
            );

            ctx.lineTo(
                30,
                0
            );

            ctx.stroke();

            ctx.restore();
        }

        ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";

        ctx.font =
            "bold 20px sans-serif";

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

                x:
                    random(70, 830),

                y:
                    random(100, 500),

                radius:
                    random(25, 48),

                life:
                    g.spawnTimer
            };
        }

        if (g.target) {

            g.target.life -= dt;

            if (
                g.target.life <= 0
            ) {

                g.misses++;

                g.target = null;

                if (
                    g.misses >= 5
                ) {
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
            ) <=
            this.target.radius;

        if (hit) {

            const d =
                distance(
                    x,
                    y,
                    this.target.x,
                    this.target.y
                );

            const points =
                d <
                this.target.radius * 0.3
                    ? 20
                    : 10;

            addScore(points);

            this.targetsHit++;

            this.target = null;

            this.spawnTimer = 0.05;

        } else {

            this.misses++;

            if (
                this.misses >= 5
            ) {
                gameOver();
            }
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#080d1c";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.05)";

        ctx.lineWidth = 1;

        for (
            let x = 0;
            x <= 900;
            x += 50
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                0
            );

            ctx.lineTo(
                x,
                600
            );

            ctx.stroke();
        }

        for (
            let y = 0;
            y <= 600;
            y += 50
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                900,
                y
            );

            ctx.stroke();
        }

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

        ctx.font =
            "bold 20px sans-serif";

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
   9. PIPE CONNECT
   ========================================================= */

const pipeGame = {

    size: 5,
    tileSize: 88,
    offsetX: 230,
    offsetY: 80,

    board: [],
    selectedRow: 0,
    selectedCol: 0,

    moves: 0,
    solved: false,

    update() {
        // Puzzle is input driven.
    },


    rotateSelected(direction) {

        if (!gameRunning) {
            return;
        }

        const tile =
            this.board[
                this.selectedRow
            ][this.selectedCol];

        tile.rotation =
            (
                tile.rotation +
                direction +
                4
            ) % 4;

        this.moves++;

        if (this.checkSolved()) {

            this.solved = true;

            addScore(
                Math.max(
                    50,
                    300 -
                    this.moves * 3
                )
            );

            showToast(
                "🎉 Network Connected!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);
        }
    },


    moveSelection(key) {

        if (key === "ArrowUp") {
            this.selectedRow =
                clamp(
                    this.selectedRow - 1,
                    0,
                    this.size - 1
                );
        }

        if (key === "ArrowDown") {
            this.selectedRow =
                clamp(
                    this.selectedRow + 1,
                    0,
                    this.size - 1
                );
        }

        if (key === "ArrowLeft") {
            this.selectedCol =
                clamp(
                    this.selectedCol - 1,
                    0,
                    this.size - 1
                );
        }

        if (key === "ArrowRight") {
            this.selectedCol =
                clamp(
                    this.selectedCol + 1,
                    0,
                    this.size - 1
                );
        }
    },


    selectTile(x, y) {

        const col =
            Math.floor(
                (
                    x -
                    this.offsetX
                ) /
                this.tileSize
            );

        const row =
            Math.floor(
                (
                    y -
                    this.offsetY
                ) /
                this.tileSize
            );

        if (
            row < 0 ||
            row >= this.size ||
            col < 0 ||
            col >= this.size
        ) {
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;

        this.rotateSelected(1);
    },


    checkSolved() {

        const size = this.size;

        const visited =
            Array.from(
                {
                    length: size
                },
                () =>
                    Array(
                        size
                    ).fill(false)
            );

        const queue = [
            {
                r: 0,
                c: 0
            }
        ];

        visited[0][0] = true;

        while (queue.length) {

            const node =
                queue.shift();

            const tile =
                this.board[
                    node.r
                ][node.c];

            const connections =
                this.getConnections(tile);

            const directions = [
                [-1, 0, 0, 2],
                [0, 1, 1, 3],
                [1, 0, 2, 0],
                [0, -1, 3, 1]
            ];

            for (
                const [
                    dr,
                    dc,
                    dir,
                    opposite
                ]
                of directions
            ) {

                if (
                    !connections.includes(
                        dir
                    )
                ) {
                    continue;
                }

                const nr =
                    node.r + dr;

                const nc =
                    node.c + dc;

                if (
                    nr < 0 ||
                    nr >= size ||
                    nc < 0 ||
                    nc >= size
                ) {
                    return false;
                }

                const next =
                    this.board[nr][nc];

                const nextConnections =
                    this.getConnections(
                        next
                    );

                if (
                    !nextConnections.includes(
                        opposite
                    )
                ) {
                    return false;
                }

                if (
                    !visited[nr][nc]
                ) {

                    visited[nr][nc] = true;

                    queue.push({
                        r: nr,
                        c: nc
                    });
                }
            }
        }

        for (let r = 0; r < size; r++) {

            for (
                let c = 0;
                c < size;
                c++
            ) {

                if (
                    !visited[r][c]
                ) {
                    return false;
                }
            }
        }

        return true;
    },


    getConnections(tile) {

        const base =
            tile.type === "straight"
                ? [1, 3]
                : tile.type === "corner"
                    ? [0, 1]
                    : tile.type === "tee"
                        ? [0, 1, 3]
                        : [0, 1, 2, 3];

        return base.map(
            direction =>
                (
                    direction +
                    tile.rotation
                ) % 4
        );
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#07101f";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 20px sans-serif";

        ctx.fillText(
            `🧩 Connect the Network   •   Moves: ${g.moves}`,
            450,
            42
        );

        for (
            let r = 0;
            r < g.size;
            r++
        ) {

            for (
                let c = 0;
                c < g.size;
                c++
            ) {

                const x =
                    g.offsetX +
                    c * g.tileSize;

                const y =
                    g.offsetY +
                    r * g.tileSize;

                const tile =
                    g.board[r][c];

                ctx.fillStyle =
                    (
                        r === g.selectedRow &&
                        c === g.selectedCol
                    )
                        ? "#25395f"
                        : "#101c31";

                roundedRect(
                    x + 4,
                    y + 4,
                    g.tileSize - 8,
                    g.tileSize - 8,
                    12
                );

                ctx.fill();

                this.drawPipe(
                    tile,
                    x +
                        g.tileSize / 2,
                    y +
                        g.tileSize / 2
                );
            }
        }

        ctx.fillStyle = "#9aa7c1";

        ctx.font =
            "14px sans-serif";

        ctx.fillText(
            "Tap a tile to rotate • Arrow keys to select",
            450,
            560
        );
    },


    drawPipe(tile, cx, cy) {

        const connections =
            this.getConnections(tile);

        ctx.strokeStyle =
            "#5ee7ff";

        ctx.lineWidth = 18;

        ctx.lineCap = "round";

        for (
            const dir of connections
        ) {

            ctx.beginPath();

            ctx.moveTo(
                cx,
                cy
            );

            if (dir === 0) {
                ctx.lineTo(
                    cx,
                    cy - 36
                );
            }

            if (dir === 1) {
                ctx.lineTo(
                    cx + 36,
                    cy
                );
            }

            if (dir === 2) {
                ctx.lineTo(
                    cx,
                    cy + 36
                );
            }

            if (dir === 3) {
                ctx.lineTo(
                    cx - 36,
                    cy
                );
            }

            ctx.stroke();
        }

        ctx.fillStyle =
            "#9ff5ff";

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
};


function startPipeConnect() {

    const g = pipeGame;

    g.board = [];

    g.selectedRow = 0;

    g.selectedCol = 0;

    g.moves = 0;

    g.solved = false;

    const types = [
        "straight",
        "corner",
        "tee",
        "cross"
    ];

    for (
        let r = 0;
        r < g.size;
        r++
    ) {

        const row = [];

        for (
            let c = 0;
            c < g.size;
            c++
        ) {

            row.push({

                type:
                    types[
                        randomInt(
                            0,
                            types.length - 1
                        )
                    ],

                rotation:
                    randomInt(0, 3)
            });
        }

        g.board.push(row);
    }

    return null;
}


/* =========================================================
   10. TRAFFIC ESCAPE
   ========================================================= */

const trafficGame = {

    grid: 6,

    cell: 70,

    offsetX: 240,
    offsetY: 70,

    cars: [],

    selected: 0,

    won: false,

    update(dt) {

        const g = this;

        const speed = 180;

        const car =
            g.cars[g.selected];

        if (!car) {
            return;
        }

        let dx = 0;
        let dy = 0;

        if (keyState.ArrowLeft) {
            dx = -speed * dt;
        }

        if (keyState.ArrowRight) {
            dx = speed * dt;
        }

        if (keyState.ArrowUp) {
            dy = -speed * dt;
        }

        if (keyState.ArrowDown) {
            dy = speed * dt;
        }

        if (
            Math.abs(dx) +
            Math.abs(dy) > 0
        ) {

            const oldX = car.x;
            const oldY = car.y;

            car.x += dx;
            car.y += dy;

            if (
                this.collides(car) ||
                !this.inside(car)
            ) {

                car.x = oldX;
                car.y = oldY;
            }
        }

        if (
            car.red &&
            car.x +
                car.width >
                g.grid * g.cell
        ) {

            g.won = true;

            addScore(200);

            showToast(
                "🚦 You Escaped!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);
        }
    },


    inside(car) {

        return (
            car.x >= 0 &&
            car.y >= 0 &&
            car.x + car.width <=
                this.grid * this.cell &&
            car.y + car.height <=
                this.grid * this.cell
        );
    },


    collides(car) {

        for (
            let i = 0;
            i < this.cars.length;
            i++
        ) {

            if (
                i ===
                this.selected
            ) {
                continue;
            }

            if (
                rectCollision(
                    car,
                    this.cars[i]
                )
            ) {
                return true;
            }
        }

        return false;
    },


    selectAt(x, y) {

        const localX =
            x -
            this.offsetX;

        const localY =
            y -
            this.offsetY;

        for (
            let i = 0;
            i < this.cars.length;
            i++
        ) {

            const car =
                this.cars[i];

            if (
                localX >= car.x &&
                localX <=
                    car.x +
                    car.width &&
                localY >= car.y &&
                localY <=
                    car.y +
                    car.height
            ) {

                this.selected = i;

                return;
            }
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#07101b";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 22px sans-serif";

        ctx.fillText(
            "🚦 Traffic Escape",
            450,
            38
        );

        ctx.font =
            "14px sans-serif";

        ctx.fillStyle = "#9ba8c0";

        ctx.fillText(
            "Move the red car to the exit →",
            450,
            60
        );

        ctx.fillStyle = "#252e3e";

        roundedRect(
            g.offsetX - 10,
            g.offsetY - 10,
            g.grid * g.cell + 20,
            g.grid * g.cell + 20,
            18
        );

        ctx.fill();

        for (
            let i = 0;
            i <= g.grid;
            i++
        ) {

            ctx.strokeStyle =
                "rgba(255,255,255,0.08)";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(
                g.offsetX +
                    i * g.cell,
                g.offsetY
            );

            ctx.lineTo(
                g.offsetX +
                    i * g.cell,
                g.offsetY +
                    g.grid * g.cell
            );

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                g.offsetX,
                g.offsetY +
                    i * g.cell
            );

            ctx.lineTo(
                g.offsetX +
                    g.grid * g.cell,
                g.offsetY +
                    i * g.cell
            );

            ctx.stroke();
        }

        for (
            let i = 0;
            i < g.cars.length;
            i++
        ) {

            const car =
                g.cars[i];

            ctx.fillStyle =
                car.red
                    ? "#ff5368"
                    : car.color;

            roundedRect(
                g.offsetX +
                    car.x + 5,
                g.offsetY +
                    car.y + 5,
                car.width - 10,
                car.height - 10,
                12
            );

            ctx.fill();

            if (
                i === g.selected
            ) {

                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth = 4;

                ctx.stroke();
            }

            ctx.fillStyle =
                "rgba(255,255,255,0.35)";

            if (car.horizontal) {

                ctx.fillRect(
                    g.offsetX +
                        car.x +
                        15,
                    g.offsetY +
                        car.y +
                        car.height / 2 -
                        4,
                    car.width - 30,
                    8
                );

            } else {

                ctx.fillRect(
                    g.offsetX +
                        car.x +
                        car.width / 2 -
                        4,
                    g.offsetY +
                        car.y +
                        15,
                    8,
                    car.height - 30
                );
            }
        }

        ctx.fillStyle = "#4ee28a";

        ctx.fillRect(
            g.offsetX +
                g.grid * g.cell,
            g.offsetY + 2 * g.cell,
            20,
            2 * g.cell
        );
    }
};


function startTrafficEscape() {

    const g = trafficGame;

    g.cars = [];

    g.selected = 0;

    g.won = false;

    const C = g.cell;

    g.cars.push({

        x: 0,

        y: 2 * C,

        width: 2 * C,

        height: C,

        horizontal: true,

        red: true,

        color: "#ff5368"
    });

    g.cars.push({

        x: 2 * C,

        y: 0,

        width: C,

        height: 2 * C,

        horizontal: false,

        color: "#4d9cff"
    });

    g.cars.push({

        x: 4 * C,

        y: 0,

        width: C,

        height: 2 * C,

        horizontal: false,

        color: "#f0a34e"
    });

    g.cars.push({

        x: 1 * C,

        y: 4 * C,

        width: 2 * C,

        height: C,

        horizontal: true,

        color: "#9b6cff"
    });

    g.cars.push({

        x: 4 * C,

        y: 3 * C,

        width: C,

        height: 2 * C,

        horizontal: false,

        color: "#45d6a8"
    });

    return null;
}


/* =========================================================
   11. LIGHTS OUT
   ========================================================= */

const lightsGame = {

    size: 5,

    tile: 78,

    offsetX: 255,

    offsetY: 80,

    board: [],

    moves: 0,

    update() {
        // Input based.
    },


    tap(x, y) {

        if (!gameRunning) {
            return;
        }

        const col =
            Math.floor(
                (
                    x -
                    this.offsetX
                ) /
                this.tile
            );

        const row =
            Math.floor(
                (
                    y -
                    this.offsetY
                ) /
                this.tile
            );

        if (
            row < 0 ||
            row >= this.size ||
            col < 0 ||
            col >= this.size
        ) {
            return;
        }

        this.toggle(row, col);

        this.moves++;

        if (this.isSolved()) {

            addScore(
                Math.max(
                    50,
                    300 -
                    this.moves * 4
                )
            );

            showToast(
                "💡 All Lights Off!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);
        }
    },


    toggle(row, col) {

        const positions = [
            [row, col],
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1]
        ];

        for (
            const [
                r,
                c
            ]
            of positions
        ) {

            if (
                r >= 0 &&
                r < this.size &&
                c >= 0 &&
                c < this.size
            ) {

                this.board[r][c] =
                    !this.board[r][c];
            }
        }
    },


    isSolved() {

        for (
            let r = 0;
            r < this.size;
            r++
        ) {

            for (
                let c = 0;
                c < this.size;
                c++
            ) {

                if (
                    this.board[r][c]
                ) {
                    return false;
                }
            }
        }

        return true;
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#080f1d";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 22px sans-serif";

        ctx.fillText(
            `💡 Lights Out   •   Moves: ${g.moves}`,
            450,
            40
        );

        for (
            let r = 0;
            r < g.size;
            r++
        ) {

            for (
                let c = 0;
                c < g.size;
                c++
            ) {

                const x =
                    g.offsetX +
                    c * g.tile;

                const y =
                    g.offsetY +
                    r * g.tile;

                const on =
                    g.board[r][c];

                ctx.fillStyle =
                    on
                        ? "#ffd84d"
                        : "#172238";

                roundedRect(
                    x + 5,
                    y + 5,
                    g.tile - 10,
                    g.tile - 10,
                    14
                );

                ctx.fill();

                if (on) {

                    ctx.fillStyle =
                        "rgba(255,240,130,0.35)";

                    ctx.beginPath();

                    ctx.arc(
                        x +
                            g.tile / 2,
                        y +
                            g.tile / 2,
                        18,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }
            }
        }

        ctx.fillStyle = "#9aa7bd";

        ctx.font =
            "14px sans-serif";

        ctx.fillText(
            "Turn every light off",
            450,
            550
        );
    }
};


function startLightsOut() {

    const g = lightsGame;

    g.board =
        Array.from(
            {
                length:
                    g.size
            },
            () =>
                Array(
                    g.size
                ).fill(false)
        );

    g.moves = 0;

    /*
       Generate a solvable puzzle by applying
       random valid moves to an empty board.
    */

    for (let i = 0; i < 18; i++) {

        const r =
            randomInt(
                0,
                g.size - 1
            );

        const c =
            randomInt(
                0,
                g.size - 1
            );

        g.toggle(r, c);
    }

    return null;
}


/* =========================================================
   12. STACK TOWER
   ========================================================= */

const stackGame = {

    blocks: [],

    current: null,

    direction: 1,

    speed: 260,

    width: 260,

    height: 32,

    baseY: 550,

    update(dt) {

        const g = this;

        if (!g.current) {
            return;
        }

        g.current.x +=
            g.direction *
            g.speed *
            dt;

        if (
            g.current.x <= 90
        ) {

            g.current.x = 90;

            g.direction = 1;
        }

        if (
            g.current.x +
                g.current.width >=
                810
        ) {

            g.current.x =
                810 -
                g.current.width;

            g.direction = -1;
        }
    },


    drop() {

        if (
            !gameRunning ||
            !this.current
        ) {
            return;
        }

        const current =
            this.current;

        const previous =
            this.blocks[
                this.blocks.length - 1
            ];

        if (previous) {

            const left =
                Math.max(
                    current.x,
                    previous.x
                );

            const right =
                Math.min(
                    current.x +
                        current.width,
                    previous.x +
                        previous.width
                );

            const overlap =
                right - left;

            if (overlap <= 0) {

                gameOver();

                return;
            }

            current.x = left;

            current.width = overlap;
        }

        current.y =
            this.baseY -
            this.blocks.length *
                this.height;

        this.blocks.push(current);

        addScore(
            5 +
            this.blocks.length
        );

        if (
            this.blocks.length >= 18
        ) {

            addScore(100);

            showToast(
                "🏗️ Tower Master!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);

            return;
        }

        this.current = {

            x:
                random(
                    90,
                    810 -
                        current.width
                ),

            y:
                this.baseY -
                (
                    this.blocks.length
                ) *
                this.height,

            width:
                current.width,

            height:
                this.height
        };

        this.direction =
            Math.random() > 0.5
                ? 1
                : -1;

        this.speed =
            Math.min(
                500,
                260 +
                    this.blocks.length *
                    14
            );
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#07101d";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 24px sans-serif";

        ctx.fillText(
            `🏗️ Stack Tower   •   ${g.blocks.length} Floors`,
            450,
            40
        );

        ctx.fillStyle = "#18243a";

        ctx.fillRect(
            70,
            550,
            760,
            20
        );

        for (
            let i = 0;
            i < g.blocks.length;
            i++
        ) {

            const block =
                g.blocks[i];

            ctx.fillStyle =
                i % 2 === 0
                    ? "#6c63ff"
                    : "#45d6a8";

            roundedRect(
                block.x,
                block.y,
                block.width,
                block.height - 3,
                7
            );

            ctx.fill();
        }

        if (g.current) {

            ctx.fillStyle =
                "#ffd34e";

            roundedRect(
                g.current.x,
                g.current.y,
                g.current.width,
                g.current.height - 3,
                7
            );

            ctx.fill();
        }

        ctx.fillStyle = "#8e9ab3";

        ctx.font =
            "14px sans-serif";

        ctx.fillText(
            "Tap DROP or press SPACE",
            450,
            585
        );
    }
};


function startStackTower() {

    stackGame.blocks = [];

    stackGame.direction = 1;

    stackGame.speed = 260;

    stackGame.current = {

        x: 320,

        y: 518,

        width:
            stackGame.width,

        height:
            stackGame.height
    };

    return null;
}


/* =========================================================
   13. GRAVITY MAZE
   ========================================================= */

const gravityGame = {

    player: null,

    walls: [],

    exit: null,

    gravity: {
        x: 0,
        y: 1
    },

    moveTimer: 0,

    update(dt) {

        const g = this;

        if (!g.player) {
            return;
        }

        g.moveTimer += dt;

        if (
            g.moveTimer < 0.016
        ) {
            return;
        }

        g.moveTimer = 0;

        const speed = 150;

        const oldX =
            g.player.x;

        const oldY =
            g.player.y;

        g.player.x +=
            g.gravity.x *
            speed *
            dt;

        g.player.y +=
            g.gravity.y *
            speed *
            dt;

        if (
            g.player.x <
                20 ||
            g.player.x >
                CANVAS_WIDTH - 20
        ) {

            g.player.x =
                clamp(
                    g.player.x,
                    20,
                    CANVAS_WIDTH - 20
                );
        }

        if (
            g.player.y <
                20 ||
            g.player.y >
                CANVAS_HEIGHT - 20
        ) {

            g.player.y =
                clamp(
                    g.player.y,
                    20,
                    CANVAS_HEIGHT - 20
                );
        }

        const playerBox = {

            x:
                g.player.x - 14,

            y:
                g.player.y - 14,

            width: 28,

            height: 28
        };

        for (
            const wall of g.walls
        ) {

            if (
                rectCollision(
                    playerBox,
                    wall
                )
            ) {

                g.player.x = oldX;

                g.player.y = oldY;

                break;
            }
        }

        if (
            distance(
                g.player.x,
                g.player.y,
                g.exit.x,
                g.exit.y
            ) < 28
        ) {

            addScore(
                100 +
                Math.max(
                    0,
                    150 -
                    Math.floor(
                        gameTime * 5
                    )
                )
            );

            showToast(
                "🌀 Maze Complete!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);
        }
    },


    setGravity(x, y) {

        if (!gameRunning) {
            return;
        }

        this.gravity.x = x;
        this.gravity.y = y;

        addScore(1);
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#060d19";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 22px sans-serif";

        ctx.fillText(
            "🌀 Gravity Maze",
            450,
            35
        );

        ctx.font =
            "14px sans-serif";

        ctx.fillStyle = "#9aa8c1";

        ctx.fillText(
            "Change gravity and reach the green portal",
            450,
            58
        );

        ctx.fillStyle = "#26344d";

        for (
            const wall of g.walls
        ) {

            roundedRect(
                wall.x,
                wall.y,
                wall.width,
                wall.height,
                8
            );

            ctx.fill();
        }

        ctx.fillStyle = "#45d6a8";

        ctx.beginPath();

        ctx.arc(
            g.exit.x,
            g.exit.y,
            25,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "rgba(255,255,255,0.5)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            g.exit.x,
            g.exit.y,
            14,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle = "#6c63ff";

        ctx.beginPath();

        ctx.arc(
            g.player.x,
            g.player.y,
            16,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            g.player.x - 5,
            g.player.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            g.player.x + 5,
            g.player.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
};


function startGravityMaze() {

    const g = gravityGame;

    g.player = {

        x: 80,

        y: 80
    };

    g.exit = {

        x: 810,

        y: 520
    };

    g.gravity = {

        x: 0,

        y: 1
    };

    g.moveTimer = 0;

    g.walls = [

        {
            x: 150,
            y: 80,
            width: 30,
            height: 330
        },

        {
            x: 150,
            y: 440,
            width: 350,
            height: 30
        },

        {
            x: 300,
            y: 100,
            width: 30,
            height: 260
        },

        {
            x: 430,
            y: 100,
            width: 30,
            height: 330
        },

        {
            x: 570,
            y: 170,
            width: 30,
            height: 350
        },

        {
            x: 700,
            y: 70,
            width: 30,
            height: 300
        },

        {
            x: 300,
            y: 70,
            width: 160,
            height: 30
        },

        {
            x: 460,
            y: 500,
            width: 170,
            height: 30
        }
    ];

    return null;
}


/* =========================================================
   14. TREASURE HUNT
   ========================================================= */

const treasureGame = {

    cols: 10,

    rows: 7,

    tile: 70,

    offsetX: 100,

    offsetY: 65,

    player: null,

    treasure: null,

    traps: [],

    visited: [],

    moves: 0,

    update(dt) {

        const g = this;

        if (!g.player) {
            return;
        }

        let dx = 0;
        let dy = 0;

        if (keyState.ArrowLeft) {
            dx = -1;
        }

        if (keyState.ArrowRight) {
            dx = 1;
        }

        if (keyState.ArrowUp) {
            dy = -1;
        }

        if (keyState.ArrowDown) {
            dy = 1;
        }

        if (
            dx === 0 &&
            dy === 0
        ) {
            return;
        }

        if (
            g.moveCooldown > 0
        ) {
            return;
        }

        g.moveCooldown = 0.12;

        const nx =
            g.player.col + dx;

        const ny =
            g.player.row + dy;

        if (
            nx < 0 ||
            nx >= g.cols ||
            ny < 0 ||
            ny >= g.rows
        ) {
            return;
        }

        g.player.col = nx;

        g.player.row = ny;

        g.moves++;

        g.visited[ny][nx] = true;

        addScore(1);

        const trap =
            g.traps.find(
                t =>
                    t.col === nx &&
                    t.row === ny
            );

        if (trap) {

            showToast(
                "💥 Trap!"
            );

            g.traps =
                g.traps.filter(
                    t => t !== trap
                );

            addScore(-10);
        }

        if (
            g.treasure.col === nx &&
            g.treasure.row === ny
        ) {

            addScore(
                150 +
                Math.max(
                    0,
                    100 -
                    g.moves
                )
            );

            showToast(
                "💰 Treasure Found!"
            );

            setTimeout(() => {

                if (gameRunning) {
                    gameOver();
                }

            }, 700);
        }
    },


    draw() {

        const g = this;

        clearCanvas();

        ctx.fillStyle = "#07101c";

        ctx.fillRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 22px sans-serif";

        ctx.fillText(
            `🗺️ Treasure Hunt   •   Moves: ${g.moves}`,
            450,
            35
        );

        for (
            let r = 0;
            r < g.rows;
            r++
        ) {

            for (
                let c = 0;
                c < g.cols;
                c++
            ) {

                const x =
                    g.offsetX +
                    c * g.tile;

                const y =
                    g.offsetY +
                    r * g.tile;

                ctx.fillStyle =
                    g.visited[r][c]
                        ? "#18283b"
                        : "#101c2d";

                ctx.fillRect(
                    x + 2,
                    y + 2,
                    g.tile - 4,
                    g.tile - 4
                );

                ctx.strokeStyle =
                    "rgba(255,255,255,0.05)";

                ctx.strokeRect(
                    x,
                    y,
                    g.tile,
                    g.tile
                );
            }
        }

        for (
            const trap of g.traps
        ) {

            const x =
                g.offsetX +
                trap.col * g.tile +
                g.tile / 2;

            const y =
                g.offsetY +
                trap.row * g.tile +
                g.tile / 2;

            if (
                g.visited[
                    trap.row
                ][trap.col]
            ) {

                ctx.fillStyle =
                    "#ff5d73";

                ctx.font =
                    "28px sans-serif";

                ctx.fillText(
                    "⚠️",
                    x,
                    y + 10
                );
            }
        }

        const tx =
            g.offsetX +
            g.treasure.col *
                g.tile +
            g.tile / 2;

        const ty =
            g.offsetY +
            g.treasure.row *
                g.tile +
            g.tile / 2;

        if (
            g.visited[
                g.treasure.row
            ][g.treasure.col]
        ) {

            ctx.font =
                "32px sans-serif";

            ctx.fillText(
                "💰",
                tx,
                ty + 10
            );
        }

        const px =
            g.offsetX +
            g.player.col *
                g.tile +
            g.tile / 2;

        const py =
            g.offsetY +
            g.player.row *
                g.tile +
            g.tile / 2;

        ctx.font =
            "34px sans-serif";

        ctx.fillText(
            "🧭",
            px,
            py + 11
        );

        ctx.fillStyle = "#8f9db5";

        ctx.font =
            "14px sans-serif";

        ctx.fillText(
            "Explore the map and discover the hidden treasure",
            450,
            575
        );
    }
};


function startTreasureHunt() {

    const g = treasureGame;

    g.player = {

        col: 0,

        row: 0
    };

    g.treasure = {

        col:
            randomInt(
                7,
                9
            ),

        row:
            randomInt(
                4,
                6
            )
    };

    g.traps = [];

    g.visited =
        Array.from(
            {
                length:
                    g.rows
            },
            () =>
                Array(
                    g.cols
                ).fill(false)
        );

    g.visited[0][0] = true;

    g.moves = 0;

    g.moveCooldown = 0;

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        let col;
        let row;

        do {

            col =
                randomInt(
                    0,
                    g.cols - 1
                );

            row =
                randomInt(
                    0,
                    g.rows - 1
                );

        } while (
            (
                col ===
                    g.player.col &&
                row ===
                    g.player.row
            ) ||
            (
                col ===
                    g.treasure.col &&
                row ===
                    g.treasure.row
            ) ||
            g.traps.some(
                t =>
                    t.col === col &&
                    t.row === row
            )
        );

        g.traps.push({
            col,
            row
        });
    }

    return null;
}


/* =========================================================
   TREASURE MOVE COOLDOWN
   ========================================================= */

const originalTreasureUpdate =
    treasureGame.update;

treasureGame.update = function(dt) {

    if (
        this.moveCooldown > 0
    ) {
        this.moveCooldown -= dt;
    }

    originalTreasureUpdate.call(
        this,
        dt
    );
};


/* =========================================================
   TRAFFIC POINTER SUPPORT
   ========================================================= */

gameCanvas.addEventListener(
    "pointerdown",
    event => {

        if (
            currentGame ===
            "traffic"
        ) {

            trafficGame.selectAt(
                pointerState.x,
                pointerState.y
            );
        }
    }
);


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

if (
    tg &&
    tg.BackButton
) {

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

addNewGameCards();

setScore(0);

updateBestScore();

drawPreview("racing");


/* =========================================================
   END
   ========================================================= */
