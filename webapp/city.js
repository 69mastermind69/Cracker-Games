// webapp/city.js
(() => {
    "use strict";

    /* =========================================================
       CRACKER CITY V3
       Original 2D open-world mini RPG
       No database
       No localStorage
       No permanent saving
       ========================================================= */

    const canvas = document.getElementById("cityCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Cracker City: canvas not found.");
        return;
    }

    const missionEl = document.getElementById("mission");
    const cashEl = document.getElementById("cash");
    const repEl = document.getElementById("rep");
    const propertyEl = document.getElementById("property");

    const panel = document.getElementById("panel");
    const panelTitle = document.getElementById("panelTitle");
    const panelText = document.getElementById("panelText");
    const panelButtons = document.getElementById("panelButtons");
    const actionBtn = document.getElementById("action");

    /* =========================================================
       CANVAS / WORLD
       ========================================================= */

    const VIEW_W = 960;
    const VIEW_H = 600;

    const WORLD_W = 3600;
    const WORLD_H = 2400;

    canvas.width = VIEW_W;
    canvas.height = VIEW_H;

    /* =========================================================
       GAME STATE
       ========================================================= */

    const state = {
        cash: 500,
        bank: 0,
        rep: 0,
        xp: 0,
        level: 1,

        property: 0,
        carsOwned: 0,

        missionsCompleted: [],
        activeMission: null,

        dayTime: 9,
        weather: "clear",

        shopVisits: 0,

        camera: {
            x: 0,
            y: 0
        },

        paused: false,
        panelOpen: false
    };

    /* =========================================================
       INPUT
       ========================================================= */

    const keys = Object.create(null);

    window.addEventListener("keydown", (e) => {
        keys[e.key] = true;

        if (
            e.key === "ArrowUp" ||
            e.key === "ArrowDown" ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === " "
        ) {
            e.preventDefault();
        }

        if (e.key.toLowerCase() === "e") {
            interact();
        }

        if (e.key === "Escape") {
            closePanel();
        }
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });

    /* =========================================================
       MOBILE CONTROLS
       ========================================================= */

    document.querySelectorAll("[data-key]").forEach((button) => {
        const key = button.dataset.key;

        const start = (e) => {
            e.preventDefault();
            keys[key] = true;
        };

        const stop = (e) => {
            e.preventDefault();
            keys[key] = false;
        };

        button.addEventListener("pointerdown", start);
        button.addEventListener("pointerup", stop);
        button.addEventListener("pointercancel", stop);
        button.addEventListener("pointerleave", stop);
    });

    if (actionBtn) {
        actionBtn.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            interact();
        });
    }

    /* =========================================================
       PLAYER
       ========================================================= */

    /*
       IMPORTANT:
       Player starts on an open road area.
       This prevents spawning inside buildings.
    */

    const player = {
        x: 250,
        y: 300,

        width: 24,
        height: 34,

        speed: 2.8,
        runSpeed: 4.4,

        health: 100,
        energy: 100,

        inVehicle: false,
        vehicle: null,

        direction: "down",

        walkFrame: 0
    };

    /* =========================================================
       HELPERS
       ========================================================= */

    function rect(x, y, w, h) {
        return { x, y, w, h };
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    function centerOf(r) {
        return {
            x: r.x + r.w / 2,
            y: r.y + r.h / 2
        };
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
        return Math.floor(random(min, max + 1));
    }

    /* =========================================================
       ROADS
       ========================================================= */

    const roads = [];

    function addRoad(x, y, w, h, type = "road") {
        roads.push({
            x,
            y,
            w,
            h,
            type
        });
    }

    /*
       Main horizontal roads
    */

    addRoad(0, 250, WORLD_W, 130);
    addRoad(0, 760, WORLD_W, 130);
    addRoad(0, 1270, WORLD_W, 130);
    addRoad(0, 1780, WORLD_W, 130);

    /*
       Main vertical roads
    */

    addRoad(250, 0, 130, WORLD_H);
    addRoad(850, 0, 130, WORLD_H);
    addRoad(1450, 0, 130, WORLD_H);
    addRoad(2050, 0, 130, WORLD_H);
    addRoad(2650, 0, 130, WORLD_H);
    addRoad(3250, 0, 130, WORLD_H);

    /* Side streets */

    addRoad(530, 0, 70, WORLD_H, "small");
    addRoad(1150, 0, 70, WORLD_H, "small");
    addRoad(1750, 0, 70, WORLD_H, "small");
    addRoad(2350, 0, 70, WORLD_H, "small");
    addRoad(2950, 0, 70, WORLD_H, "small");

    addRoad(0, 520, WORLD_W, 70, "small");
    addRoad(0, 1030, WORLD_W, 70, "small");
    addRoad(0, 1540, WORLD_W, 70, "small");
    addRoad(0, 2050, WORLD_W, 70, "small");

    /* =========================================================
       BUILDINGS
       ========================================================= */

    const buildings = [];

    function addBuilding(x, y, w, h, name = "Building", district = "") {
        buildings.push({
            x,
            y,
            w,
            h,
            name,
            district
        });
    }

    /*
       Helper:
       only add buildings if they don't overlap roads.
    */

    function safeAddBuilding(x, y, w, h, name, district) {
        const r = rect(x, y, w, h);

        const hitsRoad = roads.some((road) => {
            return rectanglesOverlap(
                r,
                road,
                6
            );
        });

        if (!hitsRoad) {
            addBuilding(x, y, w, h, name, district);
        }
    }

    function rectanglesOverlap(a, b, padding = 0) {
        return (
            a.x - padding < b.x + b.w &&
            a.x + a.w + padding > b.x &&
            a.y - padding < b.y + b.h &&
            a.y + a.h + padding > b.y
        );
    }

    /*
       Downtown
    */

    safeAddBuilding(30, 40, 170, 150, "Metro Tower", "Downtown");
    safeAddBuilding(410, 50, 170, 150, "City Office", "Downtown");
    safeAddBuilding(1010, 45, 180, 150, "Grand Hotel", "Downtown");
    safeAddBuilding(1220, 45, 170, 150, "Business Center", "Downtown");

    safeAddBuilding(40, 430, 180, 190, "Central Mall", "Downtown");
    safeAddBuilding(410, 430, 180, 190, "Cinema", "Downtown");
    safeAddBuilding(1010, 430, 180, 190, "Arcade Hall", "Downtown");
    safeAddBuilding(1220, 430, 180, 190, "Cafe Block", "Downtown");

    /*
       Neon District
    */

    safeAddBuilding(400, 930, 180, 150, "Neon Club", "Neon District");
    safeAddBuilding(620, 930, 170, 150, "Music Hall", "Neon District");
    safeAddBuilding(1010, 930, 190, 150, "Cyber Cafe", "Neon District");
    safeAddBuilding(1220, 930, 180, 150, "Night Market", "Neon District");

    safeAddBuilding(400, 1120, 180, 100, "Food Court", "Neon District");
    safeAddBuilding(620, 1120, 170, 100, "Game Store", "Neon District");

    /*
       Old Town
    */

    safeAddBuilding(30, 1450, 180, 160, "Old House", "Old Town");
    safeAddBuilding(410, 1450, 160, 160, "Museum", "Old Town");
    safeAddBuilding(1010, 1450, 190, 160, "Old Library", "Old Town");
    safeAddBuilding(1220, 1450, 180, 160, "Town Hall", "Old Town");

    /*
       Suburbs
    */

    safeAddBuilding(30, 1940, 180, 90, "Family House", "Suburbs");
    safeAddBuilding(410, 1940, 180, 90, "Family House", "Suburbs");
    safeAddBuilding(1010, 1940, 180, 90, "Modern House", "Suburbs");
    safeAddBuilding(1220, 1940, 180, 90, "Villa", "Suburbs");

    /*
       Industrial
    */

    safeAddBuilding(2140, 40, 180, 160, "Factory A", "Industrial");
    safeAddBuilding(2380, 40, 180, 160, "Factory B", "Industrial");
    safeAddBuilding(2740, 40, 200, 160, "Warehouse", "Industrial");

    safeAddBuilding(2140, 430, 180, 180, "Workshop", "Industrial");
    safeAddBuilding(2380, 430, 180, 180, "Machine Plant", "Industrial");
    safeAddBuilding(2740, 430, 200, 180, "Cargo Depot", "Industrial");

    /*
       Harbor
    */

    safeAddBuilding(2140, 930, 190, 150, "Harbor Office", "Harbor");
    safeAddBuilding(2390, 930, 190, 150, "Dock Warehouse", "Harbor");
    safeAddBuilding(2740, 930, 200, 150, "Shipping Center", "Harbor");

    /*
       Central City
    */

    safeAddBuilding(2140, 1450, 180, 170, "Central Hospital", "Central City");
    safeAddBuilding(2390, 1450, 180, 170, "Police Station", "Central City");
    safeAddBuilding(2740, 1450, 200, 170, "Bank Building", "Central City");

    /*
       Beach
    */

    safeAddBuilding(2140, 1940, 180, 100, "Beach Cafe", "Beach");
    safeAddBuilding(2390, 1940, 180, 100, "Surf Shop", "Beach");
    safeAddBuilding(2740, 1940, 200, 100, "Beach Hotel", "Beach");

    /*
       Airport
    */

    safeAddBuilding(3050, 450, 170, 130, "Airport Terminal", "Airport");
    safeAddBuilding(3300, 450, 200, 130, "Airport Office", "Airport");

    /* =========================================================
       LANDMARKS
       ========================================================= */

    const landmarks = [
        {
            x: 720,
            y: 310,
            label: "CITY PLAZA",
            icon: "🏙️"
        },
        {
            x: 1700,
            y: 310,
            label: "CENTRAL PARK",
            icon: "🌳"
        },
        {
            x: 3100,
            y: 300,
            label: "AIRPORT",
            icon: "✈️"
        },
        {
            x: 3000,
            y: 1150,
            label: "HARBOR",
            icon: "⚓"
        },
        {
            x: 3100,
            y: 1900,
            label: "BEACH",
            icon: "🏖️"
        }
    ];

    /* =========================================================
       INTERACTION POINTS
       ========================================================= */

    const points = [
        {
            id: "mission",
            x: 720,
            y: 650,
            radius: 70,
            label: "MISSION",
            icon: "📋"
        },
        {
            id: "garage",
            x: 2500,
            y: 1120,
            radius: 70,
            label: "GARAGE",
            icon: "🚗"
        },
        {
            id: "property",
            x: 1710,
            y: 1450,
            radius: 70,
            label: "PROPERTY",
            icon: "🏠"
        },
        {
            id: "shop",
            x: 1150,
            y: 1160,
            radius: 70,
            label: "SHOP",
            icon: "🛒"
        },
        {
            id: "club",
            x: 490,
            y: 850,
            radius: 70,
            label: "CLUB",
            icon: "🎵"
        },
        {
            id: "bank",
            x: 2840,
            y: 1600,
            radius: 70,
            label: "BANK",
            icon: "🏦"
        },
        {
            id: "airport",
            x: 3150,
            y: 650,
            radius: 80,
            label: "AIRPORT",
            icon: "✈️"
        }
    ];

    /* =========================================================
       VEHICLES
       ========================================================= */

    const vehicles = [
        {
            x: 2300,
            y: 1040,
            w: 58,
            h: 32,
            color: "#ff4f81",
            name: "Street Car",
            speed: 5
        },
        {
            x: 1600,
            y: 770,
            w: 58,
            h: 32,
            color: "#44d9ff",
            name: "City Car",
            speed: 5.2
        },
        {
            x: 2880,
            y: 1270,
            w: 62,
            h: 34,
            color: "#ffc34d",
            name: "Taxi",
            speed: 4.8
        },
        {
            x: 620,
            y: 1780,
            w: 64,
            h: 35,
            color: "#8dff67",
            name: "Sport Car",
            speed: 6
        },
        {
            x: 3250,
            y: 1780,
            w: 65,
            h: 36,
            color: "#b56cff",
            name: "Cruiser",
            speed: 5.5
        }
    ];

    /* =========================================================
       NPCs
       ========================================================= */

    const npcs = [];

    const npcNames = [
        "Alex",
        "Sam",
        "Mia",
        "Leo",
        "Nora",
        "Kai",
        "Luna",
        "Max",
        "Rafi",
        "Zara",
        "Noah",
        "Ari",
        "Ryan",
        "Ivy",
        "Adam",
        "Sara",
        "Evan",
        "Maya",
        "Owen",
        "Nina",
        "Ray",
        "Tara",
        "Jay",
        "Liam",
        "Ella",
        "Finn",
        "Ava",
        "Milo",
        "Rina",
        "Theo",
        "Emma",
        "Zayn",
        "Aria",
        "Dylan",
        "Sami",
        "Ruby",
        "Cole",
        "Niko"
    ];

    /*
       NPC positions intentionally placed on open road / plaza
       areas rather than inside buildings.
    */

    const npcSpawns = [
        [300, 300],
        [430, 300],
        [570, 300],
        [720, 300],
        [900, 300],
        [1500, 300],
        [1700, 300],
        [2100, 300],
        [2700, 300],
        [3200, 300],

        [300, 820],
        [500, 820],
        [700, 820],
        [900, 820],
        [1500, 820],
        [1800, 820],
        [2100, 820],
        [2700, 820],
        [3200, 820],

        [300, 1330],
        [700, 1330],
        [1500, 1330],
        [1800, 1330],
        [2100, 1330],
        [2700, 1330],
        [3200, 1330],

        [300, 1840],
        [700, 1840],
        [1500, 1840],
        [1800, 1840],
        [2100, 1840],
        [2700, 1840],
        [3200, 1840],

        [500, 2150],
        [900, 2150],
        [1500, 2150],
        [2300, 2150],
        [2900, 2150]
    ];

    npcSpawns.forEach((pos, index) => {
        npcs.push({
            x: pos[0],
            y: pos[1],

            name: npcNames[index % npcNames.length],

            radius: 12,

            dirX: random(-1, 1),
            dirY: random(-1, 1),

            speed: random(0.25, 0.65),

            timer: randomInt(30, 150),

            talkable: index % 4 === 0
        });
    });

    /* =========================================================
       COLLECTIBLES
       ========================================================= */

    const collectibles = [];

    const collectibleSpawns = [
        [180, 300],
        [470, 300],
        [780, 300],
        [1100, 300],
        [1400, 300],

        [300, 820],
        [620, 820],
        [940, 820],
        [1300, 820],
        [1600, 820],

        [300, 1330],
        [650, 1330],
        [1000, 1330],
        [1400, 1330],
        [1750, 1330],

        [300, 1840],
        [700, 1840],
        [1000, 1840],
        [1450, 1840],
        [1800, 1840],

        [2200, 2150],
        [2500, 2150],
        [2800, 2150],
        [3100, 2150],
        [3400, 2150]
    ];

    collectibleSpawns.forEach((p, i) => {
        collectibles.push({
            x: p[0],
            y: p[1],

            type: i % 5 === 0 ? "star" : "coin",

            collected: false,

            pulse: random(0, Math.PI * 2)
        });
    });

    /* =========================================================
       MISSIONS
       ========================================================= */

    const missions = [
        {
            id: "delivery",
            title: "City Delivery",
            description:
                "Take a delivery from the city plaza to the neon district.",
            start: {
                x: 720,
                y: 650
            },
            target: {
                x: 1150,
                y: 1160
            },
            reward: 180,
            rep: 12,
            xp: 40
        },

        {
            id: "shopping",
            title: "Quick Shopping",
            description:
                "Visit the market and return to the mission point.",
            start: {
                x: 1150,
                y: 1160
            },
            target: {
                x: 720,
                y: 650
            },
            reward: 220,
            rep: 15,
            xp: 50
        },

        {
            id: "airport",
            title: "Airport Run",
            description:
                "Reach the airport terminal.",
            start: {
                x: 720,
                y: 650
            },
            target: {
                x: 3150,
                y: 650
            },
            reward: 350,
            rep: 22,
            xp: 80
        },

        {
            id: "harbor",
            title: "Harbor Job",
            description:
                "Head to the harbor and complete the job.",
            start: {
                x: 2500,
                y: 1120
            },
            target: {
                x: 3000,
                y: 1150
            },
            reward: 420,
            rep: 28,
            xp: 100
        },

        {
            id: "beach",
            title: "Beach Visit",
            description:
                "Take a trip across the city and reach the beach.",
            start: {
                x: 3000,
                y: 1150
            },
            target: {
                x: 3100,
                y: 1900
            },
            reward: 500,
            rep: 35,
            xp: 120
        }
    ];

    /* =========================================================
       SAFE SPAWN
       ========================================================= */

    function isPositionBlocked(x, y, radius = 12) {
        const playerRect = {
            x: x - radius,
            y: y - radius,
            w: radius * 2,
            h: radius * 2
        };

        if (
            x < radius ||
            y < radius ||
            x > WORLD_W - radius ||
            y > WORLD_H - radius
        ) {
            return true;
        }

        return buildings.some((b) => {
            return rectanglesOverlap(
                playerRect,
                b,
                2
            );
        });
    }

    function findSafeSpawn(preferredX, preferredY) {
        if (!isPositionBlocked(preferredX, preferredY)) {
            return {
                x: preferredX,
                y: preferredY
            };
        }

        const attempts = [
            [250, 300],
            [300, 300],
            [350, 300],
            [300, 330],
            [300, 270],
            [400, 300],
            [200, 300]
        ];

        for (const p of attempts) {
            if (!isPositionBlocked(p[0], p[1])) {
                return {
                    x: p[0],
                    y: p[1]
                };
            }
        }

        return {
            x: 250,
            y: 300
        };
    }

    const safeSpawn = findSafeSpawn(250, 300);

    player.x = safeSpawn.x;
    player.y = safeSpawn.y;

    /* =========================================================
       COLLISION
       ========================================================= */

    function playerRectAt(x, y) {
        return {
            x: x - player.width / 2,
            y: y - player.height / 2,
            w: player.width,
            h: player.height
        };
    }

    function collidesWithBuilding(x, y) {
        const p = playerRectAt(x, y);

        return buildings.some((b) => {
            return rectanglesOverlap(
                p,
                b,
                3
            );
        });
    }

    function collidesWithWorld(x, y) {
        const halfW = player.width / 2;
        const halfH = player.height / 2;

        if (x - halfW < 0) {
            return true;
        }

        if (y - halfH < 0) {
            return true;
        }

        if (x + halfW > WORLD_W) {
            return true;
        }

        if (y + halfH > WORLD_H) {
            return true;
        }

        return collidesWithBuilding(x, y);
    }

    /*
       IMPORTANT FIX:
       X and Y movement are tested separately.

       Old style:
          move X + Y together

       Problem:
          character can get stuck against a corner.

       New style:
          test X
          then test Y

       This allows sliding along walls.
    */

    function movePlayer(dx, dy) {
        if (state.paused || state.panelOpen) {
            return;
        }

        if (dx === 0 && dy === 0) {
            return;
        }

        const nextX = player.x + dx;

        if (!collidesWithWorld(nextX, player.y)) {
            player.x = nextX;
        }

        const nextY = player.y + dy;

        if (!collidesWithWorld(player.x, nextY)) {
            player.y = nextY;
        }

        player.x = clamp(
            player.x,
            player.width / 2,
            WORLD_W - player.width / 2
        );

        player.y = clamp(
            player.y,
            player.height / 2,
            WORLD_H - player.height / 2
        );
    }

    /* =========================================================
       INPUT MOVEMENT
       ========================================================= */

    function updatePlayer() {
        if (state.paused || state.panelOpen) {
            return;
        }

        let dx = 0;
        let dy = 0;

        if (keys.ArrowLeft || keys.a || keys.A) {
            dx -= 1;
            player.direction = "left";
        }

        if (keys.ArrowRight || keys.d || keys.D) {
            dx += 1;
            player.direction = "right";
        }

        if (keys.ArrowUp || keys.w || keys.W) {
            dy -= 1;
            player.direction = "up";
        }

        if (keys.ArrowDown || keys.s || keys.S) {
            dy += 1;
            player.direction = "down";
        }

        if (dx === 0 && dy === 0) {
            return;
        }

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        const running =
            keys.Shift &&
            player.energy > 0;

        const speed =
            running
                ? player.runSpeed
                : player.speed;

        if (running) {
            player.energy -= 0.8;

            if (player.energy < 0) {
                player.energy = 0;
            }
        } else {
            player.energy += 0.35;

            if (player.energy > 100) {
                player.energy = 100;
            }
        }

        movePlayer(
            dx * speed,
            dy * speed
        );

        player.walkFrame += 0.2;
    }

    /* =========================================================
       CAMERA
       ========================================================= */

    function updateCamera() {
        const targetX =
            player.x - VIEW_W / 2;

        const targetY =
            player.y - VIEW_H / 2;

        state.camera.x +=
            (targetX - state.camera.x) * 0.1;

        state.camera.y +=
            (targetY - state.camera.y) * 0.1;

        state.camera.x = clamp(
            state.camera.x,
            0,
            WORLD_W - VIEW_W
        );

        state.camera.y = clamp(
            state.camera.y,
            0,
            WORLD_H - VIEW_H
        );
    }

    /* =========================================================
       TIME
       ========================================================= */

    function updateTime() {
        state.dayTime += 0.0025;

        if (state.dayTime >= 24) {
            state.dayTime = 0;
        }
    }

    /* =========================================================
       NPC UPDATE
       ========================================================= */

    function updateNPCs() {
        if (state.paused || state.panelOpen) {
            return;
        }

        npcs.forEach((npc) => {
            npc.timer--;

            if (npc.timer <= 0) {
                npc.dirX = random(-1, 1);
                npc.dirY = random(-1, 1);

                const length =
                    Math.sqrt(
                        npc.dirX * npc.dirX +
                        npc.dirY * npc.dirY
                    );

                if (length > 0) {
                    npc.dirX /= length;
                    npc.dirY /= length;
                }

                npc.timer = randomInt(50, 180);
            }

            const nextX =
                npc.x + npc.dirX * npc.speed;

            const nextY =
                npc.y + npc.dirY * npc.speed;

            if (
                !isPositionBlocked(
                    nextX,
                    nextY,
                    npc.radius
                )
            ) {
                npc.x = nextX;
                npc.y = nextY;
            } else {
                npc.dirX *= -1;
                npc.dirY *= -1;
                npc.timer = 20;
            }
        });
    }

    /* =========================================================
       COLLECTIBLES
       ========================================================= */

    function updateCollectibles() {
        collectibles.forEach((item) => {
            if (item.collected) {
                return;
            }

            item.pulse += 0.05;

            const d = distance(
                {
                    x: player.x,
                    y: player.y
                },
                item
            );

            if (d < 25) {
                item.collected = true;

                if (item.type === "star") {
                    state.cash += 25;
                    state.xp += 10;
                    state.rep += 1;
                } else {
                    state.cash += 10;
                    state.xp += 4;
                }

                updateHUD();
                checkLevel();
            }
        });
    }

    /* =========================================================
       LEVEL SYSTEM
       ========================================================= */

    function checkLevel() {
        const required =
            state.level * 100;

        while (state.xp >= required) {
            state.xp -= required;
            state.level += 1;

            state.cash += 100;
            state.rep += 5;

            showToast(
                `Level Up! You are now level ${state.level}.`
            );
        }
    }

    /* =========================================================
       HUD
       ========================================================= */

    function updateHUD() {
        if (cashEl) {
            cashEl.textContent =
                Math.floor(state.cash);
        }

        if (repEl) {
            repEl.textContent =
                Math.floor(state.rep);
        }

        if (propertyEl) {
            propertyEl.textContent =
                state.property;
        }
    }

    /* =========================================================
       MISSION SYSTEM
       ========================================================= */

    function getNextMission() {
        return missions.find(
            (m) =>
                !state.missionsCompleted.includes(
                    m.id
                )
        );
    }

    function startMission(mission) {
        if (state.activeMission) {
            return;
        }

        state.activeMission = {
            ...mission
        };

        setMissionText(
            `${mission.title}: ${mission.description}`
        );

        showToast(
            `Mission started: ${mission.title}`
        );
    }

    function completeMission() {
        const mission =
            state.activeMission;

        if (!mission) {
            return;
        }

        state.cash += mission.reward;
        state.rep += mission.rep;
        state.xp += mission.xp;

        state.missionsCompleted.push(
            mission.id
        );

        state.activeMission = null;

        checkLevel();
        updateHUD();

        setMissionText(
            `Mission complete! +$${mission.reward}, +${mission.rep} REP`
        );

        showToast(
            `Mission complete! +$${mission.reward}`
        );
    }

    function updateMission() {
        const mission =
            state.activeMission;

        if (!mission) {
            return;
        }

        const d = distance(
            {
                x: player.x,
                y: player.y
            },
            mission.target
        );

        if (d < 70) {
            completeMission();
        }
    }

    function setMissionText(text) {
        if (missionEl) {
            missionEl.textContent = text;
        }
    }

    /* =========================================================
       INTERACTION
       ========================================================= */

    function nearestPoint() {
        let best = null;
        let bestDistance = Infinity;

        points.forEach((point) => {
            const d = distance(
                {
                    x: player.x,
                    y: player.y
                },
                point
            );

            if (
                d < point.radius &&
                d < bestDistance
            ) {
                best = point;
                bestDistance = d;
            }
        });

        return best;
    }

    function nearestNPC() {
        let best = null;
        let bestDistance = 999999;

        npcs.forEach((npc) => {
            if (!npc.talkable) {
                return;
            }

            const d = distance(
                {
                    x: player.x,
                    y: player.y
                },
                npc
            );

            if (d < 55 && d < bestDistance) {
                best = npc;
                bestDistance = d;
            }
        });

        return best;
    }

    function nearestVehicle() {
        let best = null;
        let bestDistance = Infinity;

        vehicles.forEach((vehicle) => {
            const d = distance(
                {
                    x: player.x,
                    y: player.y
                },
                {
                    x: vehicle.x,
                    y: vehicle.y
                }
            );

            if (d < 75 && d < bestDistance) {
                best = vehicle;
                bestDistance = d;
            }
        });

        return best;
    }

    function interact() {
        if (state.panelOpen) {
            return;
        }

        const point = nearestPoint();

        if (point) {
            openPoint(point);
            return;
        }

        const npc = nearestNPC();

        if (npc) {
            talkToNPC(npc);
            return;
        }

        const vehicle = nearestVehicle();

        if (
            vehicle &&
            state.carsOwned > 0
        ) {
            enterVehicle(vehicle);
            return;
        }

        showToast(
            "Nothing nearby to interact with."
        );
    }

    /* =========================================================
       PANEL
       ========================================================= */

    function openPanel(title, text) {
        if (!panel) {
            return;
        }

        state.panelOpen = true;

        panel.classList.remove("hidden");
        panel.setAttribute(
            "aria-hidden",
            "false"
        );

        if (panelTitle) {
            panelTitle.textContent = title;
        }

        if (panelText) {
            panelText.textContent = text;
        }

        if (panelButtons) {
            panelButtons.innerHTML = "";
        }
    }

    function addPanelButton(text, callback) {
        if (!panelButtons) {
            return;
        }

        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = text;

        button.addEventListener(
            "click",
            () => {
                callback();
            }
        );

        panelButtons.appendChild(button);
    }

    function closePanel() {
        if (!panel) {
            return;
        }

        state.panelOpen = false;

        panel.classList.add("hidden");
        panel.setAttribute(
            "aria-hidden",
            "true"
        );

        if (panelButtons) {
            panelButtons.innerHTML = "";
        }
    }

    /* =========================================================
       POINT INTERACTIONS
       ========================================================= */

    function openPoint(point) {
        switch (point.id) {
            case "mission":
                openMissionPoint();
                break;

            case "garage":
                openGarage();
                break;

            case "property":
                openProperty();
                break;

            case "shop":
                openShop();
                break;

            case "club":
                openClub();
                break;

            case "bank":
                openBank();
                break;

            case "airport":
                openAirport();
                break;
        }
    }

    /* =========================================================
       MISSION POINT
       ========================================================= */

    function openMissionPoint() {
        const nextMission =
            getNextMission();

        if (!nextMission) {
            openPanel(
                "Mission Center",
                "You completed every available mission in this V3 build!"
            );

            addPanelButton(
                "Close",
                closePanel
            );

            return;
        }

        if (state.activeMission) {
            openPanel(
                "Mission Active",
                `Current mission:\n${state.activeMission.title}\n\nGo to the target location to complete it.`
            );

            addPanelButton(
                "Close",
                closePanel
            );

            return;
        }

        openPanel(
            nextMission.title,
            `${nextMission.description}\n\nReward: $${nextMission.reward}\nREP: +${nextMission.rep}\nXP: +${nextMission.xp}`
        );

        addPanelButton(
            "Start Mission",
            () => {
                startMission(nextMission);
                closePanel();
            }
        );

        addPanelButton(
            "Cancel",
            closePanel
        );
    }

    /* =========================================================
       GARAGE
       ========================================================= */

    function openGarage() {
        if (state.carsOwned > 0) {
            openPanel(
                "Garage",
                `You own ${state.carsOwned} vehicle(s).\n\nWalk near a car and press Action to enter it.`
            );

            addPanelButton(
                "Close",
                closePanel
            );

            return;
        }

        openPanel(
            "City Garage",
            "Buy your first vehicle.\n\nPrice: $450\n\nVehicles make travelling around Cracker City faster."
        );

        addPanelButton(
            "Buy Car — $450",
            () => {
                if (state.cash < 450) {
                    showToast(
                        "Not enough cash."
                    );
                    return;
                }

                state.cash -= 450;
                state.carsOwned += 1;

                updateHUD();

                showToast(
                    "Vehicle purchased!"
                );

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       VEHICLE
       ========================================================= */

    function enterVehicle(vehicle) {
        if (state.carsOwned <= 0) {
            showToast(
                "You need to buy a car first."
            );
            return;
        }

        player.inVehicle = true;
        player.vehicle = vehicle;

        player.speed =
            vehicle.speed || 5;

        showToast(
            `${vehicle.name} entered.`
        );
    }

    function exitVehicle() {
        player.inVehicle = false;
        player.vehicle = null;
        player.speed = 2.8;

        showToast(
            "You left the vehicle."
        );
    }

    /* =========================================================
       PROPERTY
       ========================================================= */

    function openProperty() {
        const properties = [
            {
                name: "Small Apartment",
                price: 650
            },
            {
                name: "City Apartment",
                price: 1000
            },
            {
                name: "Modern House",
                price: 1500
            },
            {
                name: "Luxury Villa",
                price: 2200
            },
            {
                name: "City Mansion",
                price: 3200
            }
        ];

        const property =
            properties[state.property];

        if (!property) {
            openPanel(
                "Property",
                "You already own every property available in this V3 build."
            );

            addPanelButton(
                "Close",
                closePanel
            );

            return;
        }

        openPanel(
            "Property Office",
            `${property.name}\n\nPrice: $${property.price}\n\nOwned: ${state.property}`
        );

        addPanelButton(
            `Buy — $${property.price}`,
            () => {
                if (
                    state.cash <
                    property.price
                ) {
                    showToast(
                        "Not enough cash."
                    );
                    return;
                }

                state.cash -=
                    property.price;

                state.property += 1;

                state.rep += 5;
                state.xp += 20;

                checkLevel();
                updateHUD();

                showToast(
                    `${property.name} purchased!`
                );

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       SHOP
       ========================================================= */

    function openShop() {
        openPanel(
            "City Shop",
            "Pick something useful for your adventure."
        );

        addPanelButton(
            "Food — $25",
            () => {
                if (state.cash < 25) {
                    showToast(
                        "Not enough cash."
                    );
                    return;
                }

                state.cash -= 25;
                player.energy = 100;
                state.shopVisits += 1;

                updateHUD();

                showToast(
                    "Energy restored!"
                );

                closePanel();
            }
        );

        addPanelButton(
            "Outfit — $80",
            () => {
                if (state.cash < 80) {
                    showToast(
                        "Not enough cash."
                    );
                    return;
                }

                state.cash -= 80;
                state.rep += 3;
                state.shopVisits += 1;

                updateHUD();

                showToast(
                    "New outfit purchased!"
                );

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       CLUB
       ========================================================= */

    function openClub() {
        openPanel(
            "Neon Club",
            "Relax for a moment and meet people around the city."
        );

        addPanelButton(
            "Socialize — $20",
            () => {
                if (state.cash < 20) {
                    showToast(
                        "Not enough cash."
                    );
                    return;
                }

                state.cash -= 20;
                state.rep += 6;
                state.xp += 12;

                checkLevel();
                updateHUD();

                showToast(
                    "Reputation increased!"
                );

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       BANK
       ========================================================= */

    function openBank() {
        openPanel(
            "Cracker City Bank",
            `Cash: $${Math.floor(state.cash)}\nBank: $${Math.floor(state.bank)}`
        );

        addPanelButton(
            "Deposit $100",
            () => {
                if (state.cash < 100) {
                    showToast(
                        "You need at least $100 cash."
                    );
                    return;
                }

                state.cash -= 100;
                state.bank += 100;

                updateHUD();

                closePanel();
            }
        );

        addPanelButton(
            "Withdraw $100",
            () => {
                if (state.bank < 100) {
                    showToast(
                        "Not enough money in bank."
                    );
                    return;
                }

                state.bank -= 100;
                state.cash += 100;

                updateHUD();

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       AIRPORT
       ========================================================= */

    function openAirport() {
        openPanel(
            "Cracker City Airport",
            "The airport is one of the major landmarks of the city.\n\nYou can use it as a travel point while exploring."
        );

        addPanelButton(
            "Travel to Downtown",
            () => {
                teleportPlayer(
                    300,
                    300
                );

                closePanel();
            }
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       NPC TALK
       ========================================================= */

    function talkToNPC(npc) {
        const messages = [
            `Hey! I'm ${npc.name}. Nice city, isn't it?`,
            `${npc.name}: You should check out the neon district.`,
            `${npc.name}: The harbor gets busy at night.`,
            `${npc.name}: Have you visited the beach yet?`,
            `${npc.name}: Try completing some missions!`
        ];

        openPanel(
            npc.name,
            messages[
                randomInt(
                    0,
                    messages.length - 1
                )
            ]
        );

        addPanelButton(
            "Close",
            closePanel
        );
    }

    /* =========================================================
       TELEPORT
       ========================================================= */

    function teleportPlayer(x, y) {
        const safe =
            findSafeSpawn(x, y);

        player.x = safe.x;
        player.y = safe.y;

        updateCamera();

        showToast(
            "Travel complete."
        );
    }

    /* =========================================================
       TOAST
       ========================================================= */

    let toastTimer = null;

    function showToast(message) {
        let toast =
            document.getElementById(
                "cityToast"
            );

        if (!toast) {
            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "cityToast";

            toast.style.position =
                "fixed";

            toast.style.left =
                "50%";

            toast.style.bottom =
                "165px";

            toast.style.transform =
                "translateX(-50%)";

            toast.style.zIndex =
                "500";

            toast.style.padding =
                "10px 16px";

            toast.style.borderRadius =
                "12px";

            toast.style.background =
                "rgba(10,12,25,.94)";

            toast.style.border =
                "1px solid rgba(255,255,255,.14)";

            toast.style.color =
                "#fff";

            toast.style.fontSize =
                "13px";

            toast.style.fontWeight =
                "700";

            toast.style.pointerEvents =
                "none";

            document.body.appendChild(
                toast
            );
        }

        toast.textContent = message;
        toast.style.opacity = "1";

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.style.opacity = "0";
        }, 1800);
    }

    /* =========================================================
       DRAW HELPERS
       ========================================================= */

    function screenX(x) {
        return (
            x - state.camera.x
        );
    }

    function screenY(y) {
        return (
            y - state.camera.y
        );
    }

    function drawRoundedRect(
        x,
        y,
        w,
        h,
        radius
    ) {
        const r =
            Math.min(
                radius,
                w / 2,
                h / 2
            );

        ctx.beginPath();

        ctx.moveTo(
            x + r,
            y
        );

        ctx.arcTo(
            x + w,
            y,
            x + w,
            y + h,
            r
        );

        ctx.arcTo(
            x + w,
            y + h,
            x,
            y + h,
            r
        );

        ctx.arcTo(
            x,
            y + h,
            x,
            y,
            r
        );

        ctx.arcTo(
            x,
            y,
            x + w,
            y,
            r
        );

        ctx.closePath();
    }

    /* =========================================================
       DRAW GROUND
       ========================================================= */

    function drawGround() {
        ctx.fillStyle = "#18231e";

        ctx.fillRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );
    }

    /* =========================================================
       DRAW ROADS
       ========================================================= */

    function drawRoads() {
        roads.forEach((road) => {
            const x =
                screenX(road.x);

            const y =
                screenY(road.y);

            ctx.fillStyle =
                road.type === "small"
                    ? "#303541"
                    : "#252a34";

            ctx.fillRect(
                x,
                y,
                road.w,
                road.h
            );

            /*
               Road center markings
            */

            ctx.strokeStyle =
                "rgba(255,205,80,.65)";

            ctx.lineWidth = 3;

            ctx.setLineDash([
                18,
                18
            ]);

            ctx.beginPath();

            if (road.w > road.h) {
                ctx.moveTo(
                    x,
                    y + road.h / 2
                );

                ctx.lineTo(
                    x + road.w,
                    y + road.h / 2
                );
            } else {
                ctx.moveTo(
                    x + road.w / 2,
                    y
                );

                ctx.lineTo(
                    x + road.w / 2,
                    y + road.h
                );
            }

            ctx.stroke();

            ctx.setLineDash([]);
        });
    }

    /* =========================================================
       DRAW BUILDINGS
       ========================================================= */

    function drawBuildings() {
        buildings.forEach((building) => {
            const x =
                screenX(building.x);

            const y =
                screenY(building.y);

            if (
                x > VIEW_W ||
                y > VIEW_H ||
                x + building.w < 0 ||
                y + building.h < 0
            ) {
                return;
            }

            ctx.fillStyle =
                "#343b4b";

            ctx.fillRect(
                x,
                y,
                building.w,
                building.h
            );

            ctx.fillStyle =
                "rgba(0,0,0,.18)";

            ctx.fillRect(
                x,
                y,
                building.w,
                16
            );

            /*
               Windows
            */

            ctx.fillStyle =
                "#68c9e8";

            const windowSize = 10;

            for (
                let wx = x + 15;
                wx < x + building.w - 10;
                wx += 28
            ) {
                for (
                    let wy = y + 28;
                    wy < y + building.h - 12;
                    wy += 28
                ) {
                    ctx.globalAlpha =
                        0.65;

                    ctx.fillRect(
                        wx,
                        wy,
                        windowSize,
                        windowSize
                    );
                }
            }

            ctx.globalAlpha = 1;

            /*
               Building label
            */

            if (building.w > 150) {
                ctx.fillStyle =
                    "rgba(0,0,0,.6)";

                ctx.font =
                    "bold 10px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    building.name,
                    x + building.w / 2,
                    y + building.h - 8
                );
            }
        });
    }

    /* =========================================================
       DRAW LANDMARKS
       ========================================================= */

    function drawLandmarks() {
        landmarks.forEach((landmark) => {
            const x =
                screenX(landmark.x);

            const y =
                screenY(landmark.y);

            if (
                x < -100 ||
                y < -100 ||
                x > VIEW_W + 100 ||
                y > VIEW_H + 100
            ) {
                return;
            }

            ctx.font =
                "24px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                landmark.icon,
                x,
                y
            );

            ctx.font =
                "bold 10px Arial";

            ctx.fillStyle =
                "rgba(255,255,255,.75)";

            ctx.fillText(
                landmark.label,
                x,
                y + 20
            );
        });
    }

    /* =========================================================
       DRAW POINTS
       ========================================================= */

    function drawPoints() {
        points.forEach((point) => {
            const x =
                screenX(point.x);

            const y =
                screenY(point.y);

            if (
                x < -80 ||
                y < -80 ||
                x > VIEW_W + 80 ||
                y > VIEW_H + 80
            ) {
                return;
            }

            const pulse =
                Math.sin(
                    performance.now() * 0.004
                ) * 3;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                22 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(166,91,255,.16)";

            ctx.fill();

            ctx.font =
                "20px Arial";

            ctx.textAlign =
                "center";

            ctx.fillStyle =
                "#ffffff";

            ctx.fillText(
                point.icon,
                x,
                y + 7
            );

            ctx.font =
                "bold 9px Arial";

            ctx.fillStyle =
                "rgba(255,255,255,.85)";

            ctx.fillText(
                point.label,
                x,
                y + 31
            );
        });
    }

    /* =========================================================
       DRAW VEHICLES
       ========================================================= */

    function drawVehicles() {
        vehicles.forEach((vehicle) => {
            const x =
                screenX(vehicle.x);

            const y =
                screenY(vehicle.y);

            if (
                x < -100 ||
                y < -100 ||
                x > VIEW_W + 100 ||
                y > VIEW_H + 100
            ) {
                return;
            }

            ctx.fillStyle =
                "#11151e";

            drawRoundedRect(
                x - vehicle.w / 2,
                y - vehicle.h / 2,
                vehicle.w,
                vehicle.h,
                8
            );

            ctx.fill();

            ctx.fillStyle =
                vehicle.color;

            drawRoundedRect(
                x - vehicle.w / 2 + 3,
                y - vehicle.h / 2 + 3,
                vehicle.w - 6,
                vehicle.h - 6,
                6
            );

            ctx.fill();

            /*
               Windows
            */

            ctx.fillStyle =
                "rgba(30,40,60,.85)";

            ctx.fillRect(
                x - 15,
                y - 9,
                30,
                10
            );

            /*
               Wheels
            */

            ctx.fillStyle =
                "#080a0e";

            ctx.fillRect(
                x - vehicle.w / 2 + 5,
                y - vehicle.h / 2 - 2,
                10,
                6
            );

            ctx.fillRect(
                x + vehicle.w / 2 - 15,
                y - vehicle.h / 2 - 2,
                10,
                6
            );

            ctx.fillRect(
                x - vehicle.w / 2 + 5,
                y + vehicle.h / 2 - 4,
                10,
                6
            );

            ctx.fillRect(
                x + vehicle.w / 2 - 15,
                y + vehicle.h / 2 - 4,
                10,
                6
            );
        });
    }

    /* =========================================================
       DRAW NPCS
       ========================================================= */

    function drawNPCs() {
        npcs.forEach((npc) => {
            const x =
                screenX(npc.x);

            const y =
                screenY(npc.y);

            if (
                x < -40 ||
                y < -40 ||
                x > VIEW_W + 40 ||
                y > VIEW_H + 40
            ) {
                return;
            }

            /*
               Shadow
            */

            ctx.fillStyle =
                "rgba(0,0,0,.25)";

            ctx.beginPath();

            ctx.ellipse(
                x,
                y + 12,
                10,
                5,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            /*
               Body
            */

            ctx.fillStyle =
                "#5e78ff";

            ctx.fillRect(
                x - 7,
                y,
                14,
                15
            );

            /*
               Head
            */

            ctx.fillStyle =
                "#f1c7a5";

            ctx.beginPath();

            ctx.arc(
                x,
                y - 7,
                7,
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (npc.talkable) {
                ctx.fillStyle =
                    "#ffe66d";

                ctx.font =
                    "bold 12px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    "?",
                    x,
                    y - 20
                );
            }
        });
    }

    /* =========================================================
       DRAW COLLECTIBLES
       ========================================================= */

    function drawCollectibles() {
        collectibles.forEach((item) => {
            if (item.collected) {
                return;
            }

            const x =
                screenX(item.x);

            const y =
                screenY(item.y);

            if (
                x < -30 ||
                y < -30 ||
                x > VIEW_W + 30 ||
                y > VIEW_H + 30
            ) {
                return;
            }

            const scale =
                1 +
                Math.sin(item.pulse) *
                0.12;

            ctx.save();

            ctx.translate(
                x,
                y
            );

            ctx.scale(
                scale,
                scale
            );

            ctx.textAlign =
                "center";

            ctx.font =
                "20px Arial";

            ctx.fillText(
                item.type === "star"
                    ? "⭐"
                    : "🪙",
                0,
                7
            );

            ctx.restore();
        });
    }

    /* =========================================================
       DRAW PLAYER
       ========================================================= */

    function drawPlayer() {
        const x =
            screenX(player.x);

        const y =
            screenY(player.y);

        /*
           Shadow
        */

        ctx.fillStyle =
            "rgba(0,0,0,.3)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 17,
            12,
            6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (player.inVehicle) {
            /*
               Vehicle player
            */

            ctx.fillStyle =
                "#f0447e";

            drawRoundedRect(
                x - 28,
                y - 15,
                56,
                30,
                8
            );

            ctx.fill();

            ctx.fillStyle =
                "#253148";

            ctx.fillRect(
                x - 15,
                y - 9,
                30,
                10
            );

            return;
        }

        /*
           Body
        */

        ctx.fillStyle =
            "#754cff";

        drawRoundedRect(
            x - 9,
            y - 1,
            18,
            22,
            7
        );

        ctx.fill();

        /*
           Head
        */

        ctx.fillStyle =
            "#f2c9aa";

        ctx.beginPath();

        ctx.arc(
            x,
            y - 10,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           Hair
        */

        ctx.fillStyle =
            "#171522";

        ctx.beginPath();

        ctx.arc(
            x,
            y - 14,
            9,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        /*
           Direction indicator
        */

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "9px Arial";

        ctx.textAlign =
            "center";

        if (player.direction === "up") {
            ctx.fillText(
                "▲",
                x,
                y - 25
            );
        }

        if (player.direction === "down") {
            ctx.fillText(
                "▼",
                x,
                y + 31
            );
        }
    }

    /* =========================================================
       DRAW MISSION TARGET
       ========================================================= */

    function drawMissionTarget() {
        const mission =
            state.activeMission;

        if (!mission) {
            return;
        }

        const x =
            screenX(
                mission.target.x
            );

        const y =
            screenY(
                mission.target.y
            );

        const pulse =
            25 +
            Math.sin(
                performance.now() * 0.005
            ) * 5;

        ctx.strokeStyle =
            "rgba(70,220,255,.9)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            "#48ddff";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "TARGET",
            x,
            y - 34
        );
    }

    /* =========================================================
       DAY / NIGHT
       ========================================================= */

    function drawDayNight() {
        let alpha = 0;

        if (
            state.dayTime >= 19 ||
            state.dayTime < 6
        ) {
            alpha = 0.38;
        } else if (
            state.dayTime >= 17
        ) {
            alpha = 0.18;
        }

        if (alpha <= 0) {
            return;
        }

        ctx.fillStyle =
            `rgba(12,16,55,${alpha})`;

        ctx.fillRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );
    }

    /* =========================================================
       MINIMAP
       ========================================================= */

    function drawMinimap() {
        const mapW = 170;
        const mapH = 110;

        const x =
            VIEW_W - mapW - 14;

        const y = 14;

        ctx.fillStyle =
            "rgba(5,7,14,.82)";

        drawRoundedRect(
            x,
            y,
            mapW,
            mapH,
            12
        );

        ctx.fill();

        /*
           Roads
        */

        ctx.strokeStyle =
            "rgba(255,255,255,.15)";

        ctx.lineWidth = 2;

        roads.forEach((road) => {
            ctx.beginPath();

            ctx.rect(
                x +
                    (road.x / WORLD_W) *
                        mapW,
                y +
                    (road.y / WORLD_H) *
                        mapH,
                Math.max(
                    2,
                    (road.w / WORLD_W) *
                        mapW
                ),
                Math.max(
                    2,
                    (road.h / WORLD_H) *
                        mapH
                )
            );

            ctx.stroke();
        });

        /*
           Player
        */

        const px =
            x +
            (player.x / WORLD_W) *
                mapW;

        const py =
            y +
            (player.y / WORLD_H) *
                mapH;

        ctx.fillStyle =
            "#ff4fc3";

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           Mission target
        */

        if (state.activeMission) {
            const tx =
                x +
                (state.activeMission.target.x /
                    WORLD_W) *
                    mapW;

            const ty =
                y +
                (state.activeMission.target.y /
                    WORLD_H) *
                    mapH;

            ctx.fillStyle =
                "#43dfff";

            ctx.beginPath();

            ctx.arc(
                tx,
                ty,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.fillStyle =
            "rgba(255,255,255,.7)";

        ctx.font =
            "bold 9px Arial";

        ctx.textAlign =
            "left";

        ctx.fillText(
            "CRACKER CITY",
            x + 8,
            y + 13
        );
    }

    /* =========================================================
       INTERACTION HINT
       ========================================================= */

    function drawInteractionHint() {
        if (state.panelOpen) {
            return;
        }

        const point =
            nearestPoint();

        const npc =
            nearestNPC();

        const vehicle =
            nearestVehicle();

        if (
            !point &&
            !npc &&
            !vehicle
        ) {
            return;
        }

        let text = "ACTION";

        if (point) {
            text =
                `${point.icon} ${point.label}`;
        } else if (npc) {
            text =
                `💬 Talk to ${npc.name}`;
        } else if (vehicle) {
            text =
                player.inVehicle
                    ? "🚗 Vehicle"
                    : "🚗 Enter vehicle";
        }

        ctx.fillStyle =
            "rgba(7,9,18,.9)";

        const width = 160;
        const height = 32;

        const x =
            VIEW_W / 2 -
            width / 2;

        const y =
            VIEW_H - 55;

        drawRoundedRect(
            x,
            y,
            width,
            height,
            10
        );

        ctx.fill();

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            text,
            VIEW_W / 2,
            y + 21
        );
    }

    /* =========================================================
       FULL DRAW
       ========================================================= */

    function draw() {
        ctx.clearRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );

        drawGround();
        drawRoads();
        drawBuildings();
        drawLandmarks();
        drawPoints();
        drawCollectibles();
        drawVehicles();
        drawNPCs();
        drawMissionTarget();
        drawPlayer();
        drawDayNight();
        drawMinimap();
        drawInteractionHint();
    }

    /* =========================================================
       GAME LOOP
       ========================================================= */

    function gameLoop() {
        updatePlayer();
        updateCamera();
        updateNPCs();
        updateCollectibles();
        updateMission();
        updateTime();

        draw();

        requestAnimationFrame(
            gameLoop
        );
    }

    /* =========================================================
       TELEGRAM WEB APP
       ========================================================= */

    try {
        if (
            window.Telegram &&
            window.Telegram.WebApp
        ) {
            const tg =
                window.Telegram.WebApp;

            tg.ready();

            if (tg.expand) {
                tg.expand();
            }

            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }
        }
    } catch (error) {
        console.warn(
            "Telegram WebApp setup skipped.",
            error
        );
    }

    /* =========================================================
       TOUCH / CANVAS
       ========================================================= */

    canvas.addEventListener(
        "contextmenu",
        (e) => {
            e.preventDefault();
        }
    );

    canvas.addEventListener(
        "pointerdown",
        (e) => {
            e.preventDefault();

            if (!state.panelOpen) {
                interact();
            }
        }
    );

    /* =========================================================
       ESCAPE VEHICLE
       ========================================================= */

    window.addEventListener(
        "keydown",
        (e) => {
            if (
                e.key.toLowerCase() === "q" &&
                player.inVehicle
            ) {
                exitVehicle();
            }
        }
    );

    /* =========================================================
       INITIAL HUD
       ========================================================= */

    updateHUD();

    setMissionText(
        "Welcome to Cracker City! Explore the streets and find the 📋 mission marker."
    );

    /* =========================================================
       START
       ========================================================= */

    gameLoop();

})();
