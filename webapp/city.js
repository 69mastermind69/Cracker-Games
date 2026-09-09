(() => {
    "use strict";

    // =========================================================
    // CRACKER CITY V5
    // ---------------------------------------------------------
    // No database
    // No localStorage
    // No permanent save
    // Refresh / re-enter = complete reset
    // =========================================================

    const canvas = document.getElementById("cityCanvas");
    const ctx = canvas.getContext("2d");

    const cashEl = document.getElementById("cash");
    const repEl = document.getElementById("rep");
    const propertyEl = document.getElementById("property");
    const missionEl = document.getElementById("mission");

    const panel = document.getElementById("panel");
    const panelTitle = document.getElementById("panelTitle");
    const panelText = document.getElementById("panelText");
    const panelButtons = document.getElementById("panelButtons");
    const actionBtn = document.getElementById("action");

    const WORLD_W = 3600;
    const WORLD_H = 2400;

    const VIEW_W = 960;
    const VIEW_H = 600;

    const ROAD_W = 130;

    canvas.width = VIEW_W;
    canvas.height = VIEW_H;

    // =========================================================
    // HELPERS
    // =========================================================

    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    const rand = (min, max) =>
        Math.random() * (max - min) + min;

    const randInt = (min, max) =>
        Math.floor(rand(min, max + 1));

    const distance = (a, b) =>
        Math.hypot(a.x - b.x, a.y - b.y);

    const rectsOverlap = (a, b) =>
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;

    function showToast(message) {
        let toast = document.getElementById("cityToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cityToast";

            Object.assign(toast.style, {
                position: "fixed",
                left: "50%",
                bottom: "110px",
                transform: "translateX(-50%)",
                zIndex: "9999",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "rgba(10,12,24,.95)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.15)",
                boxShadow: "0 10px 30px rgba(0,0,0,.4)",
                fontSize: "14px",
                fontWeight: "700",
                pointerEvents: "none",
                opacity: "0",
                transition: "opacity .2s ease",
                maxWidth: "85vw",
                textAlign: "center"
            });

            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = "1";

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.style.opacity = "0";
        }, 1900);
    }

    function addXP(amount) {
        state.xp += amount;

        while (state.xp >= state.level * 100) {
            state.xp -= state.level * 100;
            state.level += 1;

            state.player.health = 100;
            state.player.energy = 100;

            state.cash += 100 + state.level * 20;

            showToast(
                `⭐ LEVEL ${state.level}! +$${100 + state.level * 20}`
            );
        }

        updateHUD();
        checkAchievements();
    }

    function updateHUD() {
        if (cashEl) {
            cashEl.textContent = Math.floor(state.cash);
        }

        if (repEl) {
            repEl.textContent =
                `${Math.floor(state.rep)}${state.wanted > 0 ? ` 🚨${state.wanted}` : ""}`;
        }

        if (propertyEl) {
            propertyEl.textContent = state.property;
        }

        if (missionEl) {
            if (state.activeMission) {
                missionEl.textContent =
                    `🎯 ${state.activeMission.name} • ${state.activeMission.description}`;
            } else {
                missionEl.textContent =
                    "Explore Cracker City and find your next mission.";
            }
        }
    }

    function makeButton(text, fn, disabled = false) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = text;
        button.disabled = disabled;

        Object.assign(button.style, {
            margin: "5px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,.12)",
            background: disabled
                ? "rgba(255,255,255,.06)"
                : "rgba(100,80,255,.25)",
            color: "#fff",
            fontWeight: "700",
            cursor: disabled ? "not-allowed" : "pointer"
        });

        if (!disabled) {
            button.addEventListener("click", fn);
        }

        return button;
    }

    function openPanel(title, text, buttons = []) {
        panelTitle.textContent = title;
        panelText.textContent = text;
        panelButtons.innerHTML = "";

        buttons.forEach(button => {
            panelButtons.appendChild(button);
        });

        panel.classList.remove("hidden");
        panel.setAttribute("aria-hidden", "false");

        state.panelOpen = true;
        state.paused = true;
    }

    function closePanel() {
        panel.classList.add("hidden");
        panel.setAttribute("aria-hidden", "true");

        panelButtons.innerHTML = "";

        state.panelOpen = false;
        state.paused = false;
    }

    // =========================================================
    // STATE
    // =========================================================

    const state = {
        cash: 500,
        bank: 0,

        rep: 0,
        xp: 0,
        level: 1,

        property: 0,
        carsOwned: 0,

        health: 100,
        energy: 100,

        wanted: 0,
        policeTimer: 0,

        paused: false,
        panelOpen: false,

        dayTime: 9,
        weather: "clear",

        shopVisits: 0,

        missionsCompleted: [],
        activeMission: null,

        inventory: {
            food: 0,
            package: 0,
            keys: 0,
            medicine: 0,
            parts: 0
        },

        achievements: [],

        player: {
            x: 250,
            y: 300,
            w: 24,
            h: 34,

            speed: 2.8,
            runSpeed: 4.4,

            health: 100,
            energy: 100,

            vehicle: null,

            facing: "down",
            moving: false
        },

        camera: {
            x: 0,
            y: 0
        }
    };

    // =========================================================
    // ROADS
    // =========================================================

    const roads = {
        horizontal: [
            { x: 0, y: 250, w: WORLD_W, h: ROAD_W },
            { x: 0, y: 760, w: WORLD_W, h: ROAD_W },
            { x: 0, y: 1270, w: WORLD_W, h: ROAD_W },
            { x: 0, y: 1780, w: WORLD_W, h: ROAD_W }
        ],

        vertical: [
            { x: 250, y: 0, w: ROAD_W, h: WORLD_H },
            { x: 850, y: 0, w: ROAD_W, h: WORLD_H },
            { x: 1450, y: 0, w: ROAD_W, h: WORLD_H },
            { x: 2050, y: 0, w: ROAD_W, h: WORLD_H },
            { x: 2650, y: 0, w: ROAD_W, h: WORLD_H },
            { x: 3250, y: 0, w: ROAD_W, h: WORLD_H }
        ]
    };

    const smallRoads = [
        { x: 530, y: 0, w: 70, h: WORLD_H },
        { x: 1150, y: 0, w: 70, h: WORLD_H },
        { x: 1750, y: 0, w: 70, h: WORLD_H },
        { x: 2350, y: 0, w: 70, h: WORLD_H },
        { x: 2950, y: 0, w: 70, h: WORLD_H },

        { x: 0, y: 520, w: WORLD_W, h: 70 },
        { x: 0, y: 1030, w: WORLD_W, h: 70 },
        { x: 0, y: 1540, w: WORLD_W, h: 70 },
        { x: 0, y: 2050, w: WORLD_W, h: 70 }
    ];

    const allRoads = [
        ...roads.horizontal,
        ...roads.vertical,
        ...smallRoads
    ];

    function isOnRoad(x, y) {
        return allRoads.some(r =>
            x >= r.x &&
            x <= r.x + r.w &&
            y >= r.y &&
            y <= r.y + r.h
        );
    }

    function findRoadSpawn() {
        const road =
            allRoads[randInt(0, allRoads.length - 1)];

        return {
            x: clamp(
                rand(road.x + 25, road.x + road.w - 25),
                30,
                WORLD_W - 30
            ),
            y: clamp(
                rand(road.y + 25, road.y + road.h - 25),
                30,
                WORLD_H - 30
            )
        };
    }

    // =========================================================
    // DISTRICTS
    // =========================================================

    const districts = [
        {
            name: "Downtown",
            x: 0,
            y: 0,
            w: 1200,
            h: 800
        },
        {
            name: "Neon District",
            x: 1200,
            y: 0,
            w: 1200,
            h: 800
        },
        {
            name: "Old Town",
            x: 0,
            y: 800,
            w: 1200,
            h: 800
        },
        {
            name: "Suburbs",
            x: 1200,
            y: 800,
            w: 1200,
            h: 800
        },
        {
            name: "Industrial",
            x: 2400,
            y: 800,
            w: 1200,
            h: 800
        },
        {
            name: "Harbor",
            x: 2400,
            y: 1600,
            w: 1200,
            h: 800
        },
        {
            name: "Central City",
            x: 1200,
            y: 1600,
            w: 1200,
            h: 800
        }
    ];

    function currentDistrict() {
        return (
            districts.find(d =>
                state.player.x >= d.x &&
                state.player.x <= d.x + d.w &&
                state.player.y >= d.y &&
                state.player.y <= d.y + d.h
            ) || districts[0]
        );
    }

    // =========================================================
    // BUILDINGS
    // =========================================================

    const buildings = [];

    function safeAddBuilding(x, y, w, h, type = "building") {
        const rect = {
            x,
            y,
            w,
            h,
            type
        };

        const nearRoad = allRoads.some(r => {
            const expanded = {
                x: r.x - 25,
                y: r.y - 25,
                w: r.w + 50,
                h: r.h + 50
            };

            return rectsOverlap(rect, expanded);
        });

        if (nearRoad) return false;

        const overlap = buildings.some(b =>
            rectsOverlap(rect, {
                x: b.x - 18,
                y: b.y - 18,
                w: b.w + 36,
                h: b.h + 36
            })
        );

        if (overlap) return false;

        buildings.push(rect);

        return true;
    }

    function generateBuildings() {
        buildings.length = 0;

        let attempts = 0;

        while (
            buildings.length < 145 &&
            attempts < 6000
        ) {
            attempts++;

            const w = randInt(90, 190);
            const h = randInt(80, 180);

            const x =
                randInt(30, WORLD_W - w - 30);

            const y =
                randInt(30, WORLD_H - h - 30);

            const types = [
                "building",
                "office",
                "house",
                "shop",
                "warehouse",
                "tower"
            ];

            safeAddBuilding(
                x,
                y,
                w,
                h,
                types[
                    randInt(0, types.length - 1)
                ]
            );
        }
    }

    generateBuildings();

    // =========================================================
    // LANDMARKS
    // =========================================================

    const landmarks = [
        {
            id: "plaza",
            name: "City Plaza",
            x: 115,
            y: 80,
            w: 230,
            h: 120,
            blocked: false,
            color: "#4c5cff"
        },
        {
            id: "park",
            name: "Central Park",
            x: 620,
            y: 820,
            w: 300,
            h: 210,
            blocked: false,
            color: "#28a745"
        },
        {
            id: "airport",
            name: "Cracker City Airport",
            x: 3050,
            y: 70,
            w: 470,
            h: 300,
            blocked: true,
            color: "#667085"
        },
        {
            id: "harbor",
            name: "Harbor",
            x: 2850,
            y: 1770,
            w: 500,
            h: 300,
            blocked: false,
            color: "#247ba0"
        },
        {
            id: "beach",
            name: "Sunset Beach",
            x: 2500,
            y: 2130,
            w: 850,
            h: 180,
            blocked: false,
            color: "#e7c46a"
        }
    ];

    // =========================================================
    // INTERACTION POINTS
    // =========================================================

    const points = [
        {
            id: "mission",
            name: "Mission HQ",
            icon: "📋",
            x: 530,
            y: 315
        },
        {
            id: "garage",
            name: "Garage",
            icon: "🚗",
            x: 930,
            y: 720
        },
        {
            id: "property",
            name: "Property Office",
            icon: "🏠",
            x: 1550,
            y: 1210
        },
        {
            id: "shop",
            name: "City Shop",
            icon: "🛒",
            x: 760,
            y: 930
        },
        {
            id: "club",
            name: "Neon Club",
            icon: "🎵",
            x: 1840,
            y: 930
        },
        {
            id: "bank",
            name: "City Bank",
            icon: "🏦",
            x: 1370,
            y: 700
        },
        {
            id: "airport",
            name: "Airport Terminal",
            icon: "✈️",
            x: 3150,
            y: 440
        },
        {
            id: "food",
            name: "Food Corner",
            icon: "🍔",
            x: 2400,
            y: 920
        },
        {
            id: "hospital",
            name: "City Hospital",
            icon: "🏥",
            x: 2720,
            y: 700
        },
        {
            id: "police",
            name: "Police Station",
            icon: "👮",
            x: 1120,
            y: 320
        },
        {
            id: "workshop",
            name: "Auto Workshop",
            icon: "🔧",
            x: 2450,
            y: 1180
        },
        {
            id: "market",
            name: "Night Market",
            icon: "🏪",
            x: 2050,
            y: 1450
        }
    ];

    // =========================================================
    // VEHICLES
    // =========================================================

    const vehicleTypes = [
        {
            id: "street",
            name: "Street Car",
            price: 450,
            speed: 6,
            color: "#f5f5f5",
            handling: 1
        },
        {
            id: "city",
            name: "City Car",
            price: 750,
            speed: 6.4,
            color: "#5c7cff",
            handling: 1.05
        },
        {
            id: "taxi",
            name: "Taxi",
            price: 1100,
            speed: 6.8,
            color: "#f5c542",
            handling: 1.08
        },
        {
            id: "sport",
            name: "Sport Car",
            price: 1800,
            speed: 8.2,
            color: "#ff4d6d",
            handling: 1.2
        },
        {
            id: "cruiser",
            name: "Cruiser",
            price: 2600,
            speed: 7.2,
            color: "#6ee7b7",
            handling: 1.12
        }
    ];

    const vehicles = [];

    function spawnVehicles() {
        vehicles.length = 0;

        for (let i = 0; i < 18; i++) {
            const spawn = findRoadSpawn();

            const type =
                vehicleTypes[
                    randInt(0, vehicleTypes.length - 1)
                ];

            vehicles.push({
                id: `vehicle-${i}`,
                x: spawn.x,
                y: spawn.y,
                w: 54,
                h: 30,
                type,
                occupied: false,
                owned: false,
                angle: Math.random() > .5 ? 0 : Math.PI / 2,
                traffic: true,
                dx: 0,
                dy: 0
            });
        }
    }

    spawnVehicles();

    // =========================================================
    // NPCS
    // =========================================================

    const npcNames = [
        "Alex",
        "Rafi",
        "Maya",
        "Nora",
        "Sam",
        "Rayan",
        "Tina",
        "Leo",
        "Arif",
        "Mira",
        "Niko",
        "Sara",
        "Ryan",
        "Lina",
        "Dani",
        "Ayan",
        "Kira",
        "Zed",
        "Omar",
        "Jade",
        "Mina",
        "Kai",
        "Nila",
        "Evan",
        "Rin",
        "Tariq",
        "Noah",
        "Lara",
        "Sami",
        "Riya",
        "Jax",
        "Navi",
        "Zara",
        "Eli",
        "Miko",
        "Ari",
        "Nova",
        "Rex",
        "Luca",
        "Nia",
        "Milo"
    ];

    const npcLines = [
        "The city is huge. Keep exploring.",
        "I heard there is good money around the harbor.",
        "The airport is busy tonight.",
        "You should check the mission office.",
        "Watch the weather. It changes fast.",
        "The old town has some interesting places.",
        "Need a car? Try the garage.",
        "The bank is near the center.",
        "The beach looks great at sunset.",
        "I like the Neon District.",
        "The workshop can make your car faster.",
        "Police patrol the main roads.",
        "The night market gets busy after dark.",
        "The park is a good place to relax."
    ];

    const npcs = [];

    function spawnNPCs() {
        npcs.length = 0;

        npcNames.forEach((name, index) => {
            const spawn = findRoadSpawn();

            npcs.push({
                id: `npc-${index}`,
                name,
                x: spawn.x,
                y: spawn.y,
                w: 20,
                h: 30,
                speed: rand(.25, .7),
                dx: rand(-1, 1),
                dy: rand(-1, 1),
                timer: rand(20, 100),
                line:
                    npcLines[
                        randInt(
                            0,
                            npcLines.length - 1
                        )
                    ],
                friendly: Math.random() > .2
            });
        });
    }

    spawnNPCs();

    // =========================================================
    // POLICE
    // =========================================================

    const police = [];

    function spawnPolice() {
        police.length = 0;

        for (let i = 0; i < 7; i++) {
            const spawn = findRoadSpawn();

            police.push({
                id: `police-${i}`,
                x: spawn.x,
                y: spawn.y,
                w: 22,
                h: 30,
                speed: rand(.55, .9),
                patrol: true,
                timer: rand(2, 8),
                dx: 0,
                dy: 0
            });
        }
    }

    spawnPolice();

    function increaseWanted(amount = 1) {
        state.wanted = clamp(
            state.wanted + amount,
            0,
            5
        );

        state.policeTimer = 0;

        showToast(
            `🚨 Wanted Level ${state.wanted}!`
        );

        updateHUD();
    }

    function decreaseWanted() {
        if (state.wanted <= 0) return;

        state.wanted = Math.max(
            0,
            state.wanted - 1
        );

        state.policeTimer = 0;

        showToast(
            state.wanted > 0
                ? `🚨 Wanted level reduced to ${state.wanted}.`
                : "✅ Police have stopped searching."
        );

        updateHUD();
    }

    function nearestPolice() {
        let nearest = null;
        let best = Infinity;

        police.forEach(officer => {
            const d = distance(
                state.player,
                officer
            );

            if (d < best) {
                best = d;
                nearest = officer;
            }
        });

        return nearest;
    }

    function updatePolice(delta) {
        police.forEach(officer => {
            officer.timer -= delta / 1000;

            if (officer.timer <= 0) {
                officer.timer = rand(2, 6);

                const angle =
                    rand(0, Math.PI * 2);

                officer.dx = Math.cos(angle);
                officer.dy = Math.sin(angle);
            }

            if (
                state.wanted > 0 &&
                distance(
                    officer,
                    state.player
                ) < 520
            ) {
                const dx =
                    state.player.x - officer.x;

                const dy =
                    state.player.y - officer.y;

                const length =
                    Math.hypot(dx, dy) || 1;

                officer.dx = dx / length;
                officer.dy = dy / length;

                officer.speed =
                    .55 + state.wanted * .18;
            }

            const next = {
                x: officer.x +
                    officer.dx *
                    officer.speed,

                y: officer.y +
                    officer.dy *
                    officer.speed,

                w: officer.w,
                h: officer.h
            };

            if (
                !collidesWithWorld(next) &&
                next.x > 20 &&
                next.y > 20 &&
                next.x < WORLD_W - 30 &&
                next.y < WORLD_H - 30
            ) {
                officer.x = next.x;
                officer.y = next.y;
            } else {
                officer.timer = 0;
            }

            if (
                state.wanted > 0 &&
                distance(
                    officer,
                    state.player
                ) < 42
            ) {
                state.health = Math.max(
                    0,
                    state.health - .03 * state.wanted
                );

                state.player.health =
                    state.health;

                if (state.health <= 0) {
                    policeCaught();
                }
            }
        });

        if (state.wanted > 0) {
            const nearest = nearestPolice();

            if (
                nearest &&
                distance(
                    nearest,
                    state.player
                ) > 650
            ) {
                state.policeTimer += delta;

                if (
                    state.policeTimer >
                    12000
                ) {
                    decreaseWanted();
                }
            } else {
                state.policeTimer = 0;
            }
        }
    }

    function policeCaught() {
        state.cash =
            Math.max(
                0,
                state.cash -
                Math.min(
                    300,
                    60 * state.wanted
                )
            );

        state.health = 100;
        state.player.health = 100;

        state.energy = 100;
        state.player.energy = 100;

        state.wanted = 0;

        const spawn = findSafeSpawn(
            1120,
            400
        );

        state.player.x = spawn.x;
        state.player.y = spawn.y;

        if (state.player.vehicle) {
            state.player.vehicle.occupied = false;
            state.player.vehicle = null;
        }

        showToast(
            "👮 You were taken back to the station. Some cash was lost."
        );

        updateHUD();
    }

    // =========================================================
    // COLLECTIBLES
    // =========================================================

    const collectibles = [];

    function spawnCollectibles() {
        collectibles.length = 0;

        for (let i = 0; i < 45; i++) {
            const spawn = findRoadSpawn();

            collectibles.push({
                id: `collectible-${i}`,
                x: spawn.x,
                y: spawn.y,
                type:
                    Math.random() > .55
                        ? "star"
                        : "coin",
                collected: false,
                spin: rand(
                    0,
                    Math.PI * 2
                )
            });
        }
    }

    spawnCollectibles();

    // =========================================================
    // MISSIONS
    // =========================================================

    const missionList = [
        {
            id: "delivery",
            name: "City Delivery",
            description: "Deliver a package to City Plaza.",
            target: {
                x: 230,
                y: 140
            },
            reward: 180,
            rep: 12,
            xp: 40
        },
        {
            id: "shopping",
            name: "Quick Shopping",
            description: "Visit the City Shop.",
            target: {
                x: 760,
                y: 930
            },
            reward: 220,
            rep: 15,
            xp: 50
        },
        {
            id: "airport-run",
            name: "Airport Run",
            description: "Reach the airport terminal.",
            target: {
                x: 3150,
                y: 440
            },
            reward: 350,
            rep: 22,
            xp: 80
        },
        {
            id: "harbor-job",
            name: "Harbor Job",
            description: "Reach the harbor.",
            target: {
                x: 3100,
                y: 1920
            },
            reward: 420,
            rep: 28,
            xp: 100
        },
        {
            id: "beach",
            name: "Beach Visit",
            description: "Visit Sunset Beach.",
            target: {
                x: 2900,
                y: 2220
            },
            reward: 500,
            rep: 35,
            xp: 120
        },
        {
            id: "hospital",
            name: "Hospital Check",
            description: "Reach City Hospital.",
            target: {
                x: 2720,
                y: 700
            },
            reward: 300,
            rep: 20,
            xp: 70
        },
        {
            id: "night",
            name: "Night Out",
            description: "Visit the Neon Club after sunset.",
            target: {
                x: 1840,
                y: 930
            },
            reward: 280,
            rep: 18,
            xp: 65
        },
        {
            id: "police",
            name: "Station Visit",
            description: "Visit the Police Station.",
            target: {
                x: 1120,
                y: 320
            },
            reward: 250,
            rep: 10,
            xp: 60
        },
        {
            id: "workshop",
            name: "Workshop Check",
            description: "Visit the Auto Workshop.",
            target: {
                x: 2450,
                y: 1180
            },
            reward: 330,
            rep: 18,
            xp: 75
        },
        {
            id: "market",
            name: "Market Run",
            description: "Visit the Night Market.",
            target: {
                x: 2050,
                y: 1450
            },
            reward: 390,
            rep: 20,
            xp: 85
        },
        {
            id: "park",
            name: "Park Walk",
            description: "Relax in Central Park.",
            target: {
                x: 770,
                y: 920
            },
            reward: 150,
            rep: 8,
            xp: 35
        },
        {
            id: "long-drive",
            name: "Long Drive",
            description: "Reach the far east side of the city.",
            target: {
                x: 3400,
                y: 1500
            },
            reward: 650,
            rep: 40,
            xp: 140
        }
    ];

    function startMission(mission) {
        if (state.activeMission) {
            showToast(
                "Finish your current mission first."
            );

            return;
        }

        state.activeMission = {
            ...mission
        };

        state.inventory.package += 1;

        closePanel();

        showToast(
            `🎯 Mission started: ${mission.name}`
        );

        updateHUD();
    }

    function completeMission() {
        const mission =
            state.activeMission;

        if (!mission) return;

        state.cash += mission.reward;
        state.rep += mission.rep;

        state.missionsCompleted.push(
            mission.id
        );

        state.inventory.package =
            Math.max(
                0,
                state.inventory.package - 1
            );

        addXP(mission.xp);

        state.activeMission = null;

        showToast(
            `✅ Mission complete! +$${mission.reward} +${mission.rep} REP`
        );

        updateHUD();
    }

    function checkMission() {
        const mission =
            state.activeMission;

        if (!mission) return;

        if (
            distance(
                state.player,
                mission.target
            ) < 70
        ) {
            if (
                mission.id === "night" &&
                !isNight()
            ) {
                return;
            }

            completeMission();
        }
    }

    // =========================================================
    // COLLISION
    // =========================================================

    function collidesWithBuilding(rect) {
        return buildings.some(
            building =>
                rectsOverlap(
                    rect,
                    building
                )
        );
    }

    function collidesWithWorld(rect) {
        if (
            rect.x < 10 ||
            rect.y < 10 ||
            rect.x + rect.w >
                WORLD_W - 10 ||
            rect.y + rect.h >
                WORLD_H - 10
        ) {
            return true;
        }

        if (collidesWithBuilding(rect)) {
            return true;
        }

        for (const landmark of landmarks) {
            if (!landmark.blocked) continue;

            if (
                rectsOverlap(
                    rect,
                    landmark
                )
            ) {
                return true;
            }
        }

        return false;
    }

    function findSafeSpawn(x, y) {
        const rect = {
            x:
                x -
                state.player.w / 2,

            y:
                y -
                state.player.h / 2,

            w: state.player.w,
            h: state.player.h
        };

        if (!collidesWithWorld(rect)) {
            return {
                x,
                y
            };
        }

        for (let i = 0; i < 100; i++) {
            const spawn =
                findRoadSpawn();

            const test = {
                x:
                    spawn.x -
                    state.player.w / 2,

                y:
                    spawn.y -
                    state.player.h / 2,

                w: state.player.w,
                h: state.player.h
            };

            if (
                !collidesWithWorld(test)
            ) {
                return spawn;
            }
        }

        return {
            x: 300,
            y: 300
        };
    }

    // =========================================================
    // PLAYER
    // =========================================================

    function movePlayer(dx, dy) {
        if (state.paused) return;

        let speed =
            state.player.vehicle
                ? state.player.vehicle.type.speed *
                  state.player.vehicle.type.handling
                : state.player.speed;

        const running =
            keys.Shift &&
            !state.player.vehicle;

        if (
            running &&
            state.player.energy > 0
        ) {
            speed = state.player.runSpeed;

            state.player.energy =
                clamp(
                    state.player.energy - .12,
                    0,
                    100
                );
        }

        const length =
            Math.hypot(dx, dy);

        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        const moveX = dx * speed;
        const moveY = dy * speed;

        if (Math.abs(dx) > Math.abs(dy)) {
            state.player.facing =
                dx > 0
                    ? "right"
                    : "left";
        } else if (Math.abs(dy) > 0) {
            state.player.facing =
                dy > 0
                    ? "down"
                    : "up";
        }

        const current =
            state.player;

        const nextX = {
            x: current.x + moveX,
            y: current.y,
            w: current.w,
            h: current.h
        };

        if (
            !collidesWithWorld(nextX)
        ) {
            current.x += moveX;
        }

        const nextY = {
            x: current.x,
            y: current.y + moveY,
            w: current.w,
            h: current.h
        };

        if (
            !collidesWithWorld(nextY)
        ) {
            current.y += moveY;
        }

        current.x = clamp(
            current.x,
            15,
            WORLD_W -
                current.w -
                15
        );

        current.y = clamp(
            current.y,
            15,
            WORLD_H -
                current.h -
                15
        );

        current.moving =
            Math.abs(moveX) +
                Math.abs(moveY) >
            0;

        if (
            !running &&
            state.player.energy < 100
        ) {
            state.player.energy =
                clamp(
                    state.player.energy + .035,
                    0,
                    100
                );
        }

        if (
            state.player.vehicle &&
            current.moving
        ) {
            state.player.vehicle.x =
                current.x +
                current.w / 2;

            state.player.vehicle.y =
                current.y +
                current.h / 2;

            state.player.vehicle.angle =
                Math.abs(dx) >
                Math.abs(dy)
                    ? dx >= 0
                        ? 0
                        : Math.PI
                    : dy >= 0
                        ? Math.PI / 2
                        : -Math.PI / 2;
        }
    }

    // =========================================================
    // VEHICLES
    // =========================================================

    function nearestVehicle() {
        let nearest = null;
        let best = Infinity;

        vehicles.forEach(vehicle => {
            const d =
                distance(
                    state.player,
                    vehicle
                );

            if (
                d < best &&
                d < 75
            ) {
                best = d;
                nearest = vehicle;
            }
        });

        return nearest;
    }

    function enterVehicle(vehicle) {
        if (!vehicle) return;

        if (
            state.player.vehicle &&
            state.player.vehicle.id ===
                vehicle.id
        ) {
            return;
        }

        state.player.vehicle =
            vehicle;

        vehicle.occupied = true;

        state.player.x =
            vehicle.x -
            state.player.w / 2;

        state.player.y =
            vehicle.y -
            state.player.h / 2;

        showToast(
            `🚗 Entered ${vehicle.type.name}.`
        );
    }

    function exitVehicle() {
        const vehicle =
            state.player.vehicle;

        if (!vehicle) return;

        vehicle.occupied = false;

        const exits = [
            {
                x: vehicle.x + 45,
                y: vehicle.y
            },
            {
                x: vehicle.x - 45,
                y: vehicle.y
            },
            {
                x: vehicle.x,
                y: vehicle.y + 40
            },
            {
                x: vehicle.x,
                y: vehicle.y - 40
            }
        ];

        for (const pos of exits) {
            const spawn =
                findSafeSpawn(
                    pos.x,
                    pos.y
                );

            state.player.x =
                spawn.x;

            state.player.y =
                spawn.y;

            break;
        }

        state.player.vehicle = null;

        showToast(
            "🚶 You left the vehicle."
        );
    }

    function openGarageVehicleMenu() {
        const near =
            nearestVehicle();

        if (near) {
            openPanel(
                near.type.name,
                near.owned
                    ? "This vehicle belongs to you."
                    : "This vehicle is available to drive.",
                [
                    makeButton(
                        "🚗 Enter Vehicle",
                        () => {
                            closePanel();
                            enterVehicle(near);
                        }
                    ),
                    makeButton(
                        "Close",
                        closePanel
                    )
                ]
            );

            return;
        }

        openGarage();
    }

    function openGarage() {
        const buttons = [];

        vehicleTypes.forEach(type => {
            const owned =
                vehicles.some(
                    vehicle =>
                        vehicle.type.id ===
                            type.id &&
                        vehicle.owned
                );

            buttons.push(
                makeButton(
                    `${type.name} • $${type.price}`,
                    () =>
                        buyVehicle(type),
                    owned ||
                        state.cash <
                            type.price
                )
            );
        });

        buttons.push(
            makeButton(
                "Close",
                closePanel
            )
        );

        openPanel(
            "🚗 Garage",
            `Vehicles owned: ${state.carsOwned}\nBuy a vehicle and explore the city faster.`,
            buttons
        );
    }

    function buyVehicle(type) {
        if (
            state.cash <
            type.price
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= type.price;
        state.carsOwned += 1;

        const spawn =
            findRoadSpawn();

        const vehicle = {
            id:
                `owned-${Date.now()}-${Math.random()}`,

            x: spawn.x,
            y: spawn.y,

            w: 54,
            h: 30,

            type,

            occupied: false,
            owned: true,

            angle: 0,

            traffic: false
        };

        vehicles.push(vehicle);

        showToast(
            `🚗 ${type.name} purchased!`
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // WORKSHOP / VEHICLE UPGRADE
    // =========================================================

    function openWorkshop() {
        if (!state.player.vehicle) {
            openPanel(
                "🔧 Auto Workshop",
                "Bring a vehicle here to upgrade it.",
                [
                    makeButton(
                        "Close",
                        closePanel
                    )
                ]
            );

            return;
        }

        const vehicle =
            state.player.vehicle;

        const upgradePrice =
            300 +
            vehicle.type.speed * 80;

        openPanel(
            "🔧 Auto Workshop",
            `${vehicle.type.name}\nSpeed: ${vehicle.type.speed.toFixed(1)}\nUpgrade cost: $${Math.floor(upgradePrice)}`,
            [
                makeButton(
                    "⚡ Speed Upgrade",
                    () =>
                        upgradeVehicle(
                            vehicle,
                            upgradePrice
                        ),
                    state.cash <
                        upgradePrice
                ),
                makeButton(
                    "🔧 Repair",
                    repairVehicle,
                    state.cash < 50
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function upgradeVehicle(
        vehicle,
        price
    ) {
        if (
            state.cash <
            price
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= price;

        vehicle.type.speed =
            Math.min(
                13,
                vehicle.type.speed + .8
            );

        vehicle.type.handling =
            Math.min(
                1.45,
                vehicle.type.handling + .04
            );

        state.inventory.parts += 1;

        addXP(30);

        showToast(
            "⚡ Vehicle upgraded!"
        );

        updateHUD();

        closePanel();
    }

    function repairVehicle() {
        if (
            state.cash < 50
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 50;

        state.player.health =
            Math.min(
                100,
                state.player.health + 20
            );

        showToast(
            "🔧 Vehicle checked and repaired."
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // PROPERTY
    // =========================================================

    const propertyPrices = [
        650,
        1000,
        1500,
        2200,
        3200,
        4500,
        6000
    ];

    function openPropertyOffice() {
        const nextPrice =
            propertyPrices[
                state.property
            ];

        if (!nextPrice) {
            openPanel(
                "🏠 Properties",
                "You already own every available property.",
                [
                    makeButton(
                        "Close",
                        closePanel
                    )
                ]
            );

            return;
        }

        openPanel(
            "🏠 Property Office",
            `Your properties: ${state.property}\nNext property: $${nextPrice}\n\nEach property gives you a small reputation bonus.`,
            [
                makeButton(
                    `Buy Property • $${nextPrice}`,
                    () =>
                        buyProperty(
                            nextPrice
                        ),
                    state.cash <
                        nextPrice
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function buyProperty(price) {
        if (
            state.cash <
            price
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= price;
        state.property += 1;

        state.rep += 5;

        addXP(30);

        showToast(
            `🏠 Property purchased! Total: ${state.property}`
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // SHOP
    // =========================================================

    function openShop() {
        openPanel(
            "🛒 City Shop",
            "Buy food, medicine or upgrade your outfit.",
            [
                makeButton(
                    "🍔 Food • $25",
                    buyFood,
                    state.cash < 25
                ),
                makeButton(
                    "👕 New Outfit • $80",
                    buyOutfit,
                    state.cash < 80
                ),
                makeButton(
                    "🍔 Buy 3 Food • $60",
                    buyThreeFood,
                    state.cash < 60
                ),
                makeButton(
                    "💊 Medicine • $45",
                    buyMedicine,
                    state.cash < 45
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function buyFood() {
        if (
            state.cash < 25
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 25;
        state.inventory.food += 1;
        state.shopVisits += 1;

        showToast(
            "🍔 Food added to inventory."
        );

        updateHUD();
    }

    function buyThreeFood() {
        if (
            state.cash < 60
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 60;
        state.inventory.food += 3;
        state.shopVisits += 1;

        showToast(
            "🍔 3 food items added."
        );

        updateHUD();
    }

    function buyOutfit() {
        if (
            state.cash < 80
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 80;
        state.rep += 5;
        state.shopVisits += 1;

        addXP(15);

        showToast(
            "👕 New outfit! +5 reputation."
        );

        updateHUD();
    }

    function buyMedicine() {
        if (
            state.cash < 45
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 45;
        state.inventory.medicine += 1;

        showToast(
            "💊 Medicine added."
        );

        updateHUD();
    }

    function useFood() {
        if (
            state.inventory.food <= 0
        ) {
            showToast(
                "You don't have any food."
            );

            return;
        }

        if (
            state.player.energy >= 100
        ) {
            showToast(
                "Energy is already full."
            );

            return;
        }

        state.inventory.food -= 1;

        state.player.energy =
            clamp(
                state.player.energy + 35,
                0,
                100
            );

        showToast(
            "🍔 Food used. Energy restored."
        );

        updateHUD();
    }

    function useMedicine() {
        if (
            state.inventory.medicine <= 0
        ) {
            showToast(
                "You don't have medicine."
            );

            return;
        }

        if (
            state.player.health >= 100
        ) {
            showToast(
                "Health is already full."
            );

            return;
        }

        state.inventory.medicine -= 1;

        state.player.health =
            clamp(
                state.player.health + 40,
                0,
                100
            );

        showToast(
            "💊 Medicine used. Health restored."
        );

        updateHUD();
    }

    // =========================================================
    // FOOD CORNER
    // =========================================================

    function openFoodCorner() {
        openPanel(
            "🍔 Food Corner",
            "Grab a quick meal and restore your energy.",
            [
                makeButton(
                    "Buy Meal • $20",
                    buyMeal,
                    state.cash < 20
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function buyMeal() {
        if (
            state.cash < 20
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 20;

        state.player.energy =
            clamp(
                state.player.energy + 45,
                0,
                100
            );

        addXP(8);

        showToast(
            "🍔 Meal complete. Energy restored."
        );

        updateHUD();
    }

    // =========================================================
    // CLUB
    // =========================================================

    function openClub() {
        openPanel(
            "🎵 Neon Club",
            "Relax, socialize and earn reputation.",
            [
                makeButton(
                    "💬 Socialize • $20",
                    socialize,
                    state.cash < 20
                ),
                makeButton(
                    "🎮 Dance Challenge",
                    danceChallenge
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function socialize() {
        if (
            state.cash < 20
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 20;
        state.rep += 4;

        addXP(12);

        showToast(
            "🎵 Nice evening! +4 reputation."
        );

        updateHUD();
    }

    function danceChallenge() {
        const success =
            Math.random() > .35;

        if (success) {
            state.cash += 75;
            state.rep += 6;

            addXP(20);

            showToast(
                "🎮 Great performance! +$75 +6 REP"
            );
        } else {
            state.rep =
                Math.max(
                    0,
                    state.rep - 1
                );

            showToast(
                "😅 The crowd wasn't impressed."
            );
        }

        updateHUD();
    }

    // =========================================================
    // BANK
    // =========================================================

    function openBank() {
        openPanel(
            "🏦 City Bank",
            `Cash: $${Math.floor(state.cash)}\nBank: $${Math.floor(state.bank)}`,
            [
                makeButton(
                    "Deposit $100",
                    depositMoney,
                    state.cash < 100
                ),
                makeButton(
                    "Withdraw $100",
                    withdrawMoney,
                    state.bank < 100
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function depositMoney() {
        if (
            state.cash < 100
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 100;
        state.bank += 100;

        showToast(
            "🏦 $100 deposited."
        );

        updateHUD();
    }

    function withdrawMoney() {
        if (
            state.bank < 100
        ) {
            showToast(
                "Not enough bank balance."
            );

            return;
        }

        state.bank -= 100;
        state.cash += 100;

        showToast(
            "🏦 $100 withdrawn."
        );

        updateHUD();
    }

    // =========================================================
    // AIRPORT
    // =========================================================

    function openAirport() {
        openPanel(
            "✈️ Airport",
            "Travel to Downtown instantly for $50.",
            [
                makeButton(
                    "✈️ Fly to Downtown • $50",
                    flyToDowntown,
                    state.cash < 50
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function flyToDowntown() {
        if (
            state.cash < 50
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 50;

        const spawn =
            findSafeSpawn(
                400,
                350
            );

        state.player.x =
            spawn.x;

        state.player.y =
            spawn.y;

        showToast(
            "✈️ Welcome back to Downtown."
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // HOSPITAL
    // =========================================================

    function openHospital() {
        openPanel(
            "🏥 City Hospital",
            `Health: ${Math.floor(state.player.health)}%\nTreatment costs $40.`,
            [
                makeButton(
                    "❤️ Heal • $40",
                    healPlayer,
                    state.cash < 40 ||
                    state.player.health >= 100
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function healPlayer() {
        if (
            state.cash < 40
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        if (
            state.player.health >= 100
        ) {
            showToast(
                "Health is already full."
            );

            return;
        }

        state.cash -= 40;

        state.player.health = 100;

        showToast(
            "❤️ Health fully restored."
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // POLICE STATION
    // =========================================================

    function openPoliceStation() {
        openPanel(
            "👮 Police Station",
            `Wanted Level: ${state.wanted}\n\nStay out of trouble and your wanted level will eventually disappear.`,
            [
                makeButton(
                    "💵 Pay Fine • $100",
                    payFine,
                    state.cash < 100 ||
                    state.wanted <= 0
                ),
                makeButton(
                    "📋 Check Record",
                    checkPoliceRecord
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function payFine() {
        if (
            state.wanted <= 0
        ) {
            showToast(
                "You are not wanted."
            );

            return;
        }

        if (
            state.cash < 100
        ) {
            showToast(
                "Not enough cash."
            );

            return;
        }

        state.cash -= 100;
        state.wanted = 0;

        showToast(
            "👮 Fine paid. Wanted level cleared."
        );

        updateHUD();

        closePanel();
    }

    function checkPoliceRecord() {
        openPanel(
            "📋 Police Record",
            `Wanted Level: ${state.wanted}\nReputation: ${Math.floor(state.rep)}\nCompleted Missions: ${state.missionsCompleted.length}`,
            [
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    // =========================================================
    // NIGHT MARKET
    // =========================================================

    function openMarket() {
        openPanel(
            "🏪 Night Market",
            "Special city items are available here.",
            [
                makeButton(
                    "🍔 Food • $18",
                    buyMarketFood,
                    state.cash < 18
                ),
                makeButton(
                    "🔧 Parts • $70",
                    buyParts,
                    state.cash < 70
                ),
                makeButton(
                    "⭐ Reputation Token • $100",
                    buyRepToken,
                    state.cash < 100
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    function buyMarketFood() {
        if (
            state.cash < 18
        ) return;

        state.cash -= 18;
        state.inventory.food += 1;

        showToast(
            "🍔 Market food purchased."
        );

        updateHUD();
    }

    function buyParts() {
        if (
            state.cash < 70
        ) return;

        state.cash -= 70;
        state.inventory.parts += 1;

        showToast(
            "🔧 Vehicle parts added."
        );

        updateHUD();
    }

    function buyRepToken() {
        if (
            state.cash < 100
        ) return;

        state.cash -= 100;
        state.rep += 10;

        addXP(15);

        showToast(
            "⭐ +10 reputation."
        );

        updateHUD();
    }

    // =========================================================
    // NPC INTERACTION
    // =========================================================

    function nearestNPC() {
        let nearest = null;
        let best = Infinity;

        npcs.forEach(npc => {
            const d =
                distance(
                    state.player,
                    npc
                );

            if (
                d < best &&
                d < 70
            ) {
                best = d;
                nearest = npc;
            }
        });

        return nearest;
    }

    function talkToNPC(npc) {
        if (!npc) return;

        openPanel(
            `👤 ${npc.name}`,
            npc.line,
            [
                makeButton(
                    "💬 Chat",
                    () => {
                        state.rep += 1;

                        addXP(8);

                        showToast(
                            `💬 Good conversation with ${npc.name}.`
                        );

                        closePanel();
                    }
                ),
                makeButton(
                    "🤝 Ask for Help • $20",
                    () => {
                        if (
                            state.cash < 20
                        ) {
                            showToast(
                                "Not enough cash."
                            );

                            return;
                        }

                        state.cash -= 20;

                        state.rep +=
                            state.rep >= 30
                                ? 5
                                : 2;

                        addXP(12);

                        showToast(
                            "🤝 Someone gave you useful information."
                        );

                        updateHUD();

                        closePanel();
                    },
                    state.cash < 20
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    // =========================================================
    // MISSION HUB
    // =========================================================

    function openMissionHub() {
        if (
            state.activeMission
        ) {
            openPanel(
                "📋 Mission HQ",
                `Current mission: ${state.activeMission.name}\n\n${state.activeMission.description}`,
                [
                    makeButton(
                        "Cancel Mission",
                        cancelMission
                    ),
                    makeButton(
                        "Close",
                        closePanel
                    )
                ]
            );

            return;
        }

        const available =
            missionList.filter(
                mission =>
                    !state.missionsCompleted.includes(
                        mission.id
                    )
            );

        const buttons =
            available
                .slice(0, 7)
                .map(
                    mission =>
                        makeButton(
                            `🎯 ${mission.name} • $${mission.reward}`,
                            () =>
                                startMission(
                                    mission
                                )
                        )
                );

        buttons.push(
            makeButton(
                "Close",
                closePanel
            )
        );

        openPanel(
            "📋 Mission HQ",
            available.length
                ? "Choose your next mission."
                : "You completed every mission available right now.",
            buttons
        );
    }

    function cancelMission() {
        if (
            !state.activeMission
        ) return;

        state.inventory.package =
            Math.max(
                0,
                state.inventory.package - 1
            );

        state.activeMission = null;

        showToast(
            "❌ Mission cancelled."
        );

        updateHUD();

        closePanel();
    }

    // =========================================================
    // INVENTORY
    // =========================================================

    function openInventory() {
        openPanel(
            "🎒 Inventory",
            `🍔 Food: ${state.inventory.food}\n💊 Medicine: ${state.inventory.medicine}\n📦 Packages: ${state.inventory.package}\n🔧 Parts: ${state.inventory.parts}\n🔑 Keys: ${state.inventory.keys}`,
            [
                makeButton(
                    "🍔 Use Food",
                    () => {
                        useFood();
                        closePanel();
                    },
                    state.inventory.food <= 0
                ),
                makeButton(
                    "💊 Use Medicine",
                    () => {
                        useMedicine();
                        closePanel();
                    },
                    state.inventory.medicine <= 0
                ),
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    // =========================================================
    // ACHIEVEMENTS
    // =========================================================

    const achievements = [
        {
            id: "first-money",
            name: "First Cash",
            description: "Collect more than $750.",
            check: () =>
                state.cash >= 750,
            reward: 50
        },
        {
            id: "rich",
            name: "City Hustler",
            description: "Collect more than $3000.",
            check: () =>
                state.cash >= 3000,
            reward: 200
        },
        {
            id: "rep-50",
            name: "Known Around Town",
            description: "Reach 50 reputation.",
            check: () =>
                state.rep >= 50,
            reward: 150
        },
        {
            id: "rep-100",
            name: "City Legend",
            description: "Reach 100 reputation.",
            check: () =>
                state.rep >= 100,
            reward: 300
        },
        {
            id: "mission-3",
            name: "Busy Citizen",
            description: "Complete 3 missions.",
            check: () =>
                state.missionsCompleted.length >= 3,
            reward: 250
        },
        {
            id: "mission-7",
            name: "Mission Master",
            description: "Complete 7 missions.",
            check: () =>
                state.missionsCompleted.length >= 7,
            reward: 500
        },
        {
            id: "property-3",
            name: "Property Owner",
            description: "Own 3 properties.",
            check: () =>
                state.property >= 3,
            reward: 300
        },
        {
            id: "car",
            name: "Driver",
            description: "Own your first car.",
            check: () =>
                state.carsOwned >= 1,
            reward: 100
        },
        {
            id: "level-5",
            name: "Rising Star",
            description: "Reach level 5.",
            check: () =>
                state.level >= 5,
            reward: 350
        }
    ];

    function checkAchievements() {
        achievements.forEach(achievement => {
            if (
                state.achievements.includes(
                    achievement.id
                )
            ) {
                return;
            }

            if (
                achievement.check()
            ) {
                state.achievements.push(
                    achievement.id
                );

                state.cash +=
                    achievement.reward;

                showToast(
                    `🏆 Achievement: ${achievement.name}! +$${achievement.reward}`
                );
            }
        });
    }

    function openAchievements() {
        const completed =
            achievements.filter(
                achievement =>
                    state.achievements.includes(
                        achievement.id
                    )
            );

        const text =
            completed.length === 0
                ? "No achievements unlocked yet."
                : completed
                      .map(
                          achievement =>
                              `🏆 ${achievement.name}`
                      )
                      .join("\n");

        openPanel(
            "🏆 Achievements",
            text,
            [
                makeButton(
                    "Close",
                    closePanel
                )
            ]
        );
    }

    // =========================================================
    // GENERIC INTERACTION
    // =========================================================

    function nearestPoint() {
        let nearest = null;
        let best = Infinity;

        points.forEach(point => {
            const d =
                distance(
                    state.player,
                    point
                );

            if (
                d < best &&
                d < 85
            ) {
                best = d;
                nearest = point;
            }
        });

        return nearest;
    }

    function interact() {
        if (
            state.panelOpen
        ) {
            closePanel();
            return;
        }

        const vehicle =
            nearestVehicle();

        if (vehicle) {
            openGarageVehicleMenu();
            return;
        }

        const point =
            nearestPoint();

        if (point) {
            switch (point.id) {
                case "mission":
                    openMissionHub();
                    return;

                case "garage":
                    openGarage();
                    return;

                case "property":
                    openPropertyOffice();
                    return;

                case "shop":
                    openShop();
                    return;

                case "club":
                    openClub();
                    return;

                case "bank":
                    openBank();
                    return;

                case "airport":
                    openAirport();
                    return;

                case "food":
                    openFoodCorner();
                    return;

                case "hospital":
                    openHospital();
                    return;

                case "police":
                    openPoliceStation();
                    return;

                case "workshop":
                    openWorkshop();
                    return;

                case "market":
                    openMarket();
                    return;
            }
        }

        const npc =
            nearestNPC();

        if (npc) {
            talkToNPC(npc);
            return;
        }

        showToast(
            "Nothing interesting nearby."
        );
    }

    // =========================================================
    // COLLECTIBLES
    // =========================================================

    function updateCollectibles() {
        collectibles.forEach(item => {
            if (item.collected) {
                return;
            }

            const d =
                Math.hypot(
                    state.player.x -
                        item.x,
                    state.player.y -
                        item.y
                );

            if (d < 30) {
                item.collected = true;

                if (
                    item.type === "coin"
                ) {
                    state.cash += 15;

                    showToast(
                        "🪙 +$15"
                    );
                } else {
                    state.rep += 2;

                    addXP(10);

                    showToast(
                        "⭐ +2 reputation"
                    );
                }

                updateHUD();
            }

            item.spin += .05;
        });
    }

    // =========================================================
    // NPC WANDERING
    // =========================================================

    function updateNPCs() {
        npcs.forEach(npc => {
            npc.timer -= .016;

            if (
                npc.timer <= 0
            ) {
                npc.timer = rand(2, 7);

                const angle =
                    rand(
                        0,
                        Math.PI * 2
                    );

                npc.dx =
                    Math.cos(angle);

                npc.dy =
                    Math.sin(angle);
            }

            const next = {
                x:
                    npc.x +
                    npc.dx *
                    npc.speed,

                y:
                    npc.y +
                    npc.dy *
                    npc.speed,

                w: npc.w,
                h: npc.h
            };

            if (
                !collidesWithWorld(next) &&
                next.x > 20 &&
                next.y > 20 &&
                next.x <
                    WORLD_W - 30 &&
                next.y <
                    WORLD_H - 30
            ) {
                npc.x = next.x;
                npc.y = next.y;
            } else {
                npc.timer = 0;
            }
        });
    }

    // =========================================================
    // TRAFFIC
    // =========================================================

    function updateTraffic(delta) {
        vehicles.forEach(vehicle => {
            if (
                !vehicle.traffic ||
                vehicle.occupied
            ) {
                return;
            }

            const speed =
                vehicle.type.speed *
                .35;

            if (
                Math.abs(
                    vehicle.angle
                ) < .2 ||
                Math.abs(
                    vehicle.angle -
                        Math.PI
                ) < .2
            ) {
                vehicle.x +=
                    vehicle.angle ===
                    Math.PI
                        ? -speed
                        : speed;

                vehicle.dx =
                    vehicle.angle ===
                    Math.PI
                        ? -1
                        : 1;

                vehicle.dy = 0;
            } else {
                vehicle.y +=
                    vehicle.angle >
                    0
                        ? speed
                        : -speed;

                vehicle.dx = 0;

                vehicle.dy =
                    vehicle.angle > 0
                        ? 1
                        : -1;
            }

            if (
                vehicle.x < -80
            ) {
                vehicle.x =
                    WORLD_W + 80;
            }

            if (
                vehicle.x >
                WORLD_W + 80
            ) {
                vehicle.x = -80;
            }

            if (
                vehicle.y < -80
            ) {
                vehicle.y =
                    WORLD_H + 80;
            }

            if (
                vehicle.y >
                WORLD_H + 80
            ) {
                vehicle.y = -80;
            }
        });
    }

    // =========================================================
    // TIME + WEATHER
    // =========================================================

    let weatherTimer = 0;

    function updateWorldTime(delta) {
        state.dayTime +=
            delta * .003;

        if (
            state.dayTime >= 24
        ) {
            state.dayTime -= 24;
        }

        weatherTimer += delta;

        if (
            weatherTimer > 35000
        ) {
            weatherTimer = 0;

            const options = [
                "clear",
                "clear",
                "rain",
                "rain",
                "clear"
            ];

            state.weather =
                options[
                    randInt(
                        0,
                        options.length - 1
                    )
                ];

            showToast(
                state.weather ===
                    "rain"
                    ? "🌧️ Rain is moving into the city."
                    : "☀️ The weather is clearing up."
            );
        }
    }

    function isNight() {
        return (
            state.dayTime >= 18 ||
            state.dayTime < 6
        );
    }

    // =========================================================
    // CAMERA
    // =========================================================

    function updateCamera() {
        const targetX =
            state.player.x -
            VIEW_W / 2;

        const targetY =
            state.player.y -
            VIEW_H / 2;

        state.camera.x +=
            (targetX -
                state.camera.x) *
            .12;

        state.camera.y +=
            (targetY -
                state.camera.y) *
            .12;

        state.camera.x =
            clamp(
                state.camera.x,
                0,
                WORLD_W - VIEW_W
            );

        state.camera.y =
            clamp(
                state.camera.y,
                0,
                WORLD_H - VIEW_H
            );
    }

    // =========================================================
    // DRAW GROUND
    // =========================================================

    function drawGround() {
        const tile = 80;

        const startX =
            Math.floor(
                state.camera.x /
                    tile
            ) * tile;

        const startY =
            Math.floor(
                state.camera.y /
                    tile
            ) * tile;

        for (
            let y = startY;
            y <
            state.camera.y +
                VIEW_H +
                tile;
            y += tile
        ) {
            for (
                let x = startX;
                x <
                state.camera.x +
                    VIEW_W +
                    tile;
                x += tile
            ) {
                const sx =
                    x -
                    state.camera.x;

                const sy =
                    y -
                    state.camera.y;

                const checker =
                    (
                        Math.floor(
                            x / tile
                        ) +
                        Math.floor(
                            y / tile
                        )
                    ) % 2;

                ctx.fillStyle =
                    checker === 0
                        ? "#10182a"
                        : "#0d1424";

                ctx.fillRect(
                    sx,
                    sy,
                    tile + 1,
                    tile + 1
                );
            }
        }
    }

    // =========================================================
    // DRAW ROADS
    // =========================================================

    function drawRoads() {
        ctx.save();

        allRoads.forEach(road => {
            ctx.fillStyle =
                "#252a36";

            ctx.fillRect(
                road.x -
                    state.camera.x,

                road.y -
                    state.camera.y,

                road.w,
                road.h
            );

            ctx.strokeStyle =
                "rgba(255,255,255,.12)";

            ctx.lineWidth = 2;

            ctx.setLineDash([
                22,
                18
            ]);

            if (
                road.w > road.h
            ) {
                ctx.beginPath();

                ctx.moveTo(
                    road.x -
                        state.camera.x,

                    road.y +
                        road.h / 2 -
                        state.camera.y
                );

                ctx.lineTo(
                    road.x +
                        road.w -
                        state.camera.x,

                    road.y +
                        road.h / 2 -
                        state.camera.y
                );

                ctx.stroke();
            } else {
                ctx.beginPath();

                ctx.moveTo(
                    road.x +
                        road.w / 2 -
                        state.camera.x,

                    road.y -
                        state.camera.y
                );

                ctx.lineTo(
                    road.x +
                        road.w / 2 -
                        state.camera.x,

                    road.y +
                        road.h -
                        state.camera.y
                );

                ctx.stroke();
            }
        });

        ctx.setLineDash([]);

        ctx.restore();
    }

    // =========================================================
    // BUILDINGS
    // =========================================================

    function drawBuildings() {
        buildings.forEach(building => {
            const sx =
                building.x -
                state.camera.x;

            const sy =
                building.y -
                state.camera.y;

            if (
                sx + building.w <
                    0 ||
                sy + building.h <
                    0 ||
                sx > VIEW_W ||
                sy > VIEW_H
            ) {
                return;
            }

            ctx.fillStyle =
                building.type ===
                    "office"
                    ? "#343b59"
                    : building.type ===
                      "house"
                        ? "#39452f"
                        : building.type ===
                          "shop"
                            ? "#523d63"
                            : building.type ===
                              "warehouse"
                                ? "#3c4148"
                                : building.type ===
                                  "tower"
                                    ? "#41496b"
                                    : "#30384b";

            ctx.fillRect(
                sx,
                sy,
                building.w,
                building.h
            );

            ctx.strokeStyle =
                "rgba(255,255,255,.12)";

            ctx.strokeRect(
                sx,
                sy,
                building.w,
                building.h
            );

            const columns =
                Math.max(
                    1,
                    Math.floor(
                        building.w /
                            45
                    )
                );

            const rows =
                Math.max(
                    1,
                    Math.floor(
                        building.h /
                            45
                    )
                );

            for (
                let row = 0;
                row < rows;
                row++
            ) {
                for (
                    let col = 0;
                    col < columns;
                    col++
                ) {
                    const wx =
                        sx +
                        10 +
                        col * 45;

                    const wy =
                        sy +
                        10 +
                        row * 45;

                    ctx.fillStyle =
                        isNight()
                            ? "#8ad8ff"
                            : "#8aa0b8";

                    ctx.fillRect(
                        wx,
                        wy,
                        16,
                        12
                    );
                }
            }

            if (
                building.type ===
                "tower"
            ) {
                ctx.fillStyle =
                    "rgba(120,90,255,.3)";

                ctx.fillRect(
                    sx +
                        building.w / 2 -
                        3,

                    sy - 18,

                    6,
                    18
                );
            }
        });
    }

    // =========================================================
    // LANDMARKS
    // =========================================================

    function drawLandmarks() {
        landmarks.forEach(
            landmark => {
                const sx =
                    landmark.x -
                    state.camera.x;

                const sy =
                    landmark.y -
                    state.camera.y;

                ctx.fillStyle =
                    landmark.color;

                ctx.globalAlpha = .75;

                ctx.fillRect(
                    sx,
                    sy,
                    landmark.w,
                    landmark.h
                );

                ctx.globalAlpha = 1;

                ctx.strokeStyle =
                    "rgba(255,255,255,.3)";

                ctx.strokeRect(
                    sx,
                    sy,
                    landmark.w,
                    landmark.h
                );

                ctx.fillStyle = "#fff";
                ctx.font =
                    "bold 15px Arial";
                ctx.textAlign =
                    "center";

                ctx.fillText(
                    landmark.name,
                    sx +
                        landmark.w /
                            2,
                    sy +
                        landmark.h /
                            2
                );

                ctx.textAlign = "left";
            }
        );
    }

    // =========================================================
    // INTERACTION POINTS
    // =========================================================

    function drawInteractionPoints() {
        points.forEach(point => {
            const sx =
                point.x -
                state.camera.x;

            const sy =
                point.y -
                state.camera.y;

            const pulse =
                3 +
                Math.sin(
                    Date.now() /
                        300
                ) *
                    2;

            ctx.beginPath();

            ctx.arc(
                sx,
                sy,
                16 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(120,90,255,.14)";

            ctx.fill();

            ctx.font =
                "20px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                point.icon,
                sx,
                sy + 7
            );

            ctx.textAlign =
                "left";
        });
    }

    // =========================================================
    // VEHICLES
    // =========================================================

    function drawVehicles() {
        vehicles.forEach(vehicle => {
            const sx =
                vehicle.x -
                state.camera.x;

            const sy =
                vehicle.y -
                state.camera.y;

            if (
                sx + vehicle.w <
                    0 ||
                sy + vehicle.h <
                    0 ||
                sx > VIEW_W ||
                sy > VIEW_H
            ) {
                return;
            }

            ctx.save();

            ctx.translate(
                sx +
                    vehicle.w / 2,
                sy +
                    vehicle.h / 2
            );

            ctx.rotate(
                vehicle.angle
            );

            ctx.fillStyle =
                vehicle.type.color;

            ctx.fillRect(
                -vehicle.w / 2,
                -vehicle.h / 2,
                vehicle.w,
                vehicle.h
            );

            ctx.fillStyle =
                "#171a24";

            ctx.fillRect(
                -15,
                -10,
                30,
                20
            );

            ctx.fillStyle =
                "#090b10";

            ctx.fillRect(
                -22,
                -15,
                10,
                5
            );

            ctx.fillRect(
                12,
                -15,
                10,
                5
            );

            ctx.fillRect(
                -22,
                10,
                10,
                5
            );

            ctx.fillRect(
                12,
                10,
                10,
                5
            );

            if (
                vehicle.type.id ===
                "taxi"
            ) {
                ctx.fillStyle =
                    "#fff";

                ctx.fillRect(
                    -8,
                    -14,
                    16,
                    5
                );
            }

            if (
                vehicle.occupied
            ) {
                ctx.strokeStyle =
                    "#fff";

                ctx.lineWidth = 2;

                ctx.strokeRect(
                    -vehicle.w / 2 -
                        2,

                    -vehicle.h / 2 -
                        2,

                    vehicle.w + 4,
                    vehicle.h + 4
                );
            }

            ctx.restore();
        });
    }

    // =========================================================
    // NPCS
    // =========================================================

    function drawNPCs() {
        npcs.forEach(npc => {
            const sx =
                npc.x -
                state.camera.x;

            const sy =
                npc.y -
                state.camera.y;

            ctx.fillStyle =
                "#f0c7a4";

            ctx.beginPath();

            ctx.arc(
                sx + 10,
                sy + 7,
                7,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                npc.friendly
                    ? "#7c4dff"
                    : "#d94d72";

            ctx.fillRect(
                sx + 3,
                sy + 14,
                14,
                15
            );

            ctx.fillStyle =
                "#fff";

            ctx.font =
                "10px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                npc.name,
                sx + 10,
                sy - 4
            );

            ctx.textAlign =
                "left";
        });
    }

    // =========================================================
    // POLICE DRAW
    // =========================================================

    function drawPolice() {
        police.forEach(officer => {
            const sx =
                officer.x -
                state.camera.x;

            const sy =
                officer.y -
                state.camera.y;

            if (
                sx < -40 ||
                sy < -40 ||
                sx > VIEW_W + 40 ||
                sy > VIEW_H + 40
            ) {
                return;
            }

            ctx.fillStyle =
                "#b9c4d8";

            ctx.fillRect(
                sx + 4,
                sy + 12,
                14,
                17
            );

            ctx.fillStyle =
                "#263c70";

            ctx.fillRect(
                sx + 3,
                sy + 4,
                16,
                10
            );

            ctx.fillStyle =
                "#f0c7a4";

            ctx.beginPath();

            ctx.arc(
                sx + 11,
                sy + 5,
                6,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                "#ff4d6d";

            ctx.fillRect(
                sx + 5,
                sy + 2,
                5,
                3
            );

            ctx.fillStyle =
                "#4d8cff";

            ctx.fillRect(
                sx + 12,
                sy + 2,
                5,
                3
            );

            if (
                state.wanted > 0 &&
                distance(
                    officer,
                    state.player
                ) < 520
            ) {
                ctx.strokeStyle =
                    "rgba(255,70,100,.18)";

                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.arc(
                    sx + 11,
                    sy + 14,
                    25,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }
        });
    }

    // =========================================================
    // COLLECTIBLES DRAW
    // =========================================================

    function drawCollectibles() {
        collectibles.forEach(item => {
            if (
                item.collected
            ) return;

            const sx =
                item.x -
                state.camera.x;

            const sy =
                item.y -
                state.camera.y;

            const bob =
                Math.sin(
                    item.spin
                ) * 3;

            ctx.save();

            ctx.translate(
                sx,
                sy + bob
            );

            if (
                item.type ===
                "coin"
            ) {
                ctx.fillStyle =
                    "#ffd43b";

                ctx.beginPath();

                ctx.arc(
                    0,
                    0,
                    8,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.fillStyle =
                    "#7c5d00";

                ctx.font =
                    "bold 8px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    "$",
                    0,
                    3
                );

                ctx.textAlign =
                    "left";
            } else {
                ctx.fillStyle =
                    "#ffe66d";

                ctx.beginPath();

                for (
                    let i = 0;
                    i < 10;
                    i++
                ) {
                    const angle =
                        -Math.PI / 2 +
                        i *
                            Math.PI /
                            5;

                    const radius =
                        i % 2 === 0
                            ? 10
                            : 4;

                    const x =
                        Math.cos(
                            angle
                        ) *
                        radius;

                    const y =
                        Math.sin(
                            angle
                        ) *
                        radius;

                    if (
                        i === 0
                    ) {
                        ctx.moveTo(
                            x,
                            y
                        );
                    } else {
                        ctx.lineTo(
                            x,
                            y
                        );
                    }
                }

                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        });
    }

    // =========================================================
    // PLAYER DRAW
    // =========================================================

    function drawPlayer() {
        const p =
            state.player;

        if (p.vehicle) {
            return;
        }

        const sx =
            p.x -
            state.camera.x;

        const sy =
            p.y -
            state.camera.y;

        ctx.fillStyle =
            "#f0c7a4";

        ctx.beginPath();

        ctx.arc(
            sx +
                p.w / 2,
            sy + 8,
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#4c6fff";

        ctx.fillRect(
            sx + 3,
            sy + 16,
            p.w - 6,
            14
        );

        ctx.fillStyle =
            "#171923";

        ctx.fillRect(
            sx + 3,
            sy + 29,
            7,
            5
        );

        ctx.fillRect(
            sx + 14,
            sy + 29,
            7,
            5
        );

        if (
            p.moving
        ) {
            ctx.globalAlpha =
                .25;

            ctx.beginPath();

            ctx.arc(
                sx +
                    p.w / 2,
                sy +
                    p.h / 2,
                23,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#6f7cff";

            ctx.fill();

            ctx.globalAlpha =
                1;
        }
    }

    // =========================================================
    // MISSION TARGET
    // =========================================================

    function drawMissionTarget() {
        const mission =
            state.activeMission;

        if (!mission) return;

        const sx =
            mission.target.x -
            state.camera.x;

        const sy =
            mission.target.y -
            state.camera.y;

        const pulse =
            18 +
            Math.sin(
                Date.now() /
                    250
            ) *
                4;

        ctx.strokeStyle =
            "#ff4d6d";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            "#ff4d6d";

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "MISSION",
            sx,
            sy - 25
        );

        ctx.textAlign =
            "left";
    }

    // =========================================================
    // WEATHER
    // =========================================================

    function drawWeather() {
        if (
            state.weather !==
            "rain"
        ) {
            return;
        }

        ctx.save();

        ctx.strokeStyle =
            "rgba(150,190,255,.25)";

        ctx.lineWidth = 1;

        for (
            let i = 0;
            i < 110;
            i++
        ) {
            const x =
                (
                    i * 83 +
                    Date.now() * .08
                ) %
                VIEW_W;

            const y =
                (
                    i * 47 +
                    Date.now() * .16
                ) %
                VIEW_H;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x - 4,
                y + 13
            );

            ctx.stroke();
        }

        ctx.restore();
    }

    // =========================================================
    // NIGHT
    // =========================================================

    function drawNightOverlay() {
        let alpha = 0;

        if (
            state.dayTime >= 18
        ) {
            alpha =
                clamp(
                    (
                        state.dayTime -
                        18
                    ) / 3,
                    0,
                    .55
                );
        } else if (
            state.dayTime < 6
        ) {
            alpha = .55;
        } else if (
            state.dayTime < 8
        ) {
            alpha =
                clamp(
                    (
                        8 -
                        state.dayTime
                    ) / 2,
                    0,
                    .55
                );
        }

        if (
            alpha <= 0
        ) return;

        ctx.fillStyle =
            `rgba(8,12,35,${alpha})`;

        ctx.fillRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );
    }

    // =========================================================
    // MINIMAP
    // =========================================================

    function drawMinimap() {
        const size = 155;
        const pad = 14;

        const x =
            VIEW_W -
            size -
            pad;

        const y = pad;

        ctx.save();

        ctx.fillStyle =
            "rgba(5,8,18,.88)";

        ctx.fillRect(
            x,
            y,
            size,
            size
        );

        ctx.strokeStyle =
            "rgba(255,255,255,.15)";

        ctx.strokeRect(
            x,
            y,
            size,
            size
        );

        const sx =
            size / WORLD_W;

        const sy =
            size / WORLD_H;

        ctx.fillStyle =
            "rgba(100,100,120,.7)";

        allRoads.forEach(
            road => {
                ctx.fillRect(
                    x +
                        road.x *
                            sx,

                    y +
                        road.y *
                            sy,

                    Math.max(
                        1,
                        road.w *
                            sx
                    ),

                    Math.max(
                        1,
                        road.h *
                            sy
                    )
                );
            }
        );

        // Mission marker
        if (
            state.activeMission
        ) {
            ctx.fillStyle =
                "#ff4d6d";

            ctx.beginPath();

            ctx.arc(
                x +
                    state.activeMission
                        .target.x *
                        sx,

                y +
                    state.activeMission
                        .target.y *
                        sy,

                4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        // Important locations
        points.forEach(point => {
            ctx.fillStyle =
                point.id ===
                    "police"
                    ? "#60a5fa"
                    : point.id ===
                      "hospital"
                        ? "#ff6b81"
                        : "#c084fc";

            ctx.fillRect(
                x +
                    point.x *
                        sx -
                    1,

                y +
                    point.y *
                        sy -
                    1,

                3,
                3
            );
        });

        // Player
        ctx.fillStyle =
            "#fff";

        ctx.beginPath();

        ctx.arc(
            x +
                state.player.x *
                    sx,

            y +
                state.player.y *
                    sy,

            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    // =========================================================
    // CANVAS HUD
    // =========================================================

    function drawCanvasHUD() {
        ctx.save();

        ctx.fillStyle =
            "rgba(5,8,18,.78)";

        ctx.fillRect(
            14,
            14,
            280,
            105
        );

        ctx.fillStyle =
            "#fff";

        ctx.font =
            "bold 13px Arial";

        ctx.fillText(
            currentDistrict().name,
            26,
            35
        );

        ctx.font =
            "12px Arial";

        ctx.fillText(
            `HP ${Math.floor(
                state.player.health
            )}%`,
            26,
            56
        );

        ctx.fillText(
            `Energy ${Math.floor(
                state.player.energy
            )}%`,
            110,
            56
        );

        ctx.fillText(
            `Level ${state.level}`,
            210,
            56
        );

        const hour =
            Math.floor(
                state.dayTime
            );

        const minute =
            Math.floor(
                (
                    state.dayTime -
                    hour
                ) *
                    60
            );

        const timeText =
            `${String(hour).padStart(
                2,
                "0"
            )}:${String(
                minute
            ).padStart(2, "0")}`;

        ctx.fillText(
            `🕒 ${timeText}`,
            26,
            78
        );

        ctx.fillText(
            `🌦️ ${state.weather}`,
            110,
            78
        );

        ctx.fillText(
            `⭐ XP ${Math.floor(
                state.xp
            )}/${state.level * 100}`,
            26,
            99
        );

        if (
            state.wanted > 0
        ) {
            ctx.fillStyle =
                "#ff4d6d";

            ctx.font =
                "bold 12px Arial";

            ctx.fillText(
                `🚨 WANTED ${state.wanted}/5`,
                170,
                99
            );
        }

        ctx.restore();
    }

    // =========================================================
    // INTERACTION HINT
    // =========================================================

    function drawInteractionHint() {
        if (
            state.panelOpen
        ) return;

        const vehicle =
            nearestVehicle();

        const point =
            nearestPoint();

        const npc =
            nearestNPC();

        let text = "";

        if (vehicle) {
            text =
                "✨ ACTION • Enter vehicle";
        } else if (point) {
            text =
                `✨ ACTION • ${point.name}`;
        } else if (npc) {
            text =
                `✨ ACTION • Talk to ${npc.name}`;
        }

        if (!text) return;

        ctx.save();

        ctx.fillStyle =
            "rgba(5,8,18,.86)";

        ctx.fillRect(
            VIEW_W / 2 -
                165,
            VIEW_H - 52,
            330,
            34
        );

        ctx.fillStyle =
            "#fff";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            text,
            VIEW_W / 2,
            VIEW_H - 30
        );

        ctx.textAlign =
            "left";

        ctx.restore();
    }

    // =========================================================
    // DRAW EVERYTHING
    // =========================================================

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
        drawInteractionPoints();

        drawVehicles();
        drawNPCs();
        drawPolice();
        drawCollectibles();

        drawMissionTarget();
        drawPlayer();

        drawNightOverlay();
        drawWeather();

        drawMinimap();
        drawCanvasHUD();
        drawInteractionHint();
    }

    // =========================================================
    // KEYBOARD
    // =========================================================

    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,

        w: false,
        a: false,
        s: false,
        d: false,

        Shift: false
    };

    window.addEventListener(
        "keydown",
        event => {
            const key =
                event.key;

            if (
                key in keys
            ) {
                keys[key] = true;
                event.preventDefault();
            }

            if (
                key === "e" ||
                key === "E"
            ) {
                interact();
            }

            if (
                key === "Escape"
            ) {
                closePanel();
            }

            if (
                key === "q" ||
                key === "Q"
            ) {
                if (
                    state.player.vehicle
                ) {
                    exitVehicle();
                }
            }

            if (
                key === "f" ||
                key === "F"
            ) {
                useFood();
            }

            if (
                key === "m" ||
                key === "M"
            ) {
                openMissionHub();
            }

            if (
                key === "i" ||
                key === "I"
            ) {
                openInventory();
            }

            if (
                key === "b" ||
                key === "B"
            ) {
                openBank();
            }

            if (
                key === "g" ||
                key === "G"
            ) {
                openGarage();
            }

            if (
                key === "p" ||
                key === "P"
            ) {
                openPropertyOffice();
            }

            if (
                key === "u" ||
                key === "U"
            ) {
                openAchievements();
            }

            if (key === "1") {
                openMissionHub();
            }

            if (key === "2") {
                openGarage();
            }

            if (key === "3") {
                openShop();
            }

            if (key === "4") {
                openPropertyOffice();
            }

            if (key === "5") {
                openInventory();
            }
        }
    );

    window.addEventListener(
        "keyup",
        event => {
            const key =
                event.key;

            if (
                key in keys
            ) {
                keys[key] = false;
                event.preventDefault();
            }
        }
    );

    // =========================================================
    // MOBILE CONTROLS
    // =========================================================

    document
        .querySelectorAll(
            "[data-key]"
        )
        .forEach(button => {
            const key =
                button.dataset.key;

            const press = event => {
                event.preventDefault();
                keys[key] = true;
            };

            const release = event => {
                event.preventDefault();
                keys[key] = false;
            };

            button.addEventListener(
                "pointerdown",
                press
            );

            button.addEventListener(
                "pointerup",
                release
            );

            button.addEventListener(
                "pointercancel",
                release
            );

            button.addEventListener(
                "pointerleave",
                release
            );
        });

    if (actionBtn) {
        actionBtn.addEventListener(
            "click",
            interact
        );
    }

    // Canvas touch interaction
    canvas.addEventListener(
        "pointerdown",
        event => {
            if (
                state.panelOpen
            ) return;

            const rect =
                canvas.getBoundingClientRect();

            const x =
                (
                    event.clientX -
                    rect.left
                ) *
                (
                    VIEW_W /
                    rect.width
                );

            const y =
                (
                    event.clientY -
                    rect.top
                ) *
                (
                    VIEW_H /
                    rect.height
                );

            const worldX =
                x +
                state.camera.x;

            const worldY =
                y +
                state.camera.y;

            const dx =
                worldX -
                state.player.x;

            const dy =
                worldY -
                state.player.y;

            if (
                Math.hypot(
                    dx,
                    dy
                ) < 100
            ) {
                interact();
            }
        }
    );

    // =========================================================
    // MAIN LOOP
    // =========================================================

    let lastTime =
        performance.now();

    function gameLoop(now) {
        const delta =
            Math.min(
                50,
                now - lastTime
            );

        lastTime = now;

        if (
            !state.paused
        ) {
            let dx = 0;
            let dy = 0;

            if (
                keys.ArrowLeft ||
                keys.a
            ) {
                dx -= 1;
            }

            if (
                keys.ArrowRight ||
                keys.d
            ) {
                dx += 1;
            }

            if (
                keys.ArrowUp ||
                keys.w
            ) {
                dy -= 1;
            }

            if (
                keys.ArrowDown ||
                keys.s
            ) {
                dy += 1;
            }

            movePlayer(
                dx,
                dy
            );

            updateNPCs();

            updatePolice(
                delta
            );

            updateTraffic(
                delta
            );

            updateCollectibles();

            updateWorldTime(
                delta
            );

            checkMission();

            checkAchievements();

            updateCamera();

            state.player.health =
                state.player.health;

            state.health =
                state.player.health;
        }

        draw();

        requestAnimationFrame(
            gameLoop
        );
    }

    // =========================================================
    // TELEGRAM WEB APP
    // =========================================================

    try {
        if (
            window.Telegram &&
            window.Telegram.WebApp
        ) {
            const tg =
                window.Telegram.WebApp;

            tg.ready();

            if (
                tg.expand
            ) {
                tg.expand();
            }

            if (
                tg.disableVerticalSwipes
            ) {
                tg.disableVerticalSwipes();
            }
        }
    } catch (error) {
        console.warn(
            "Telegram WebApp integration unavailable.",
            error
        );
    }

    // =========================================================
    // VISIBILITY
    // =========================================================

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.hidden
            ) {
                state.paused = true;
            } else if (
                !state.panelOpen
            ) {
                state.paused = false;
                lastTime =
                    performance.now();
            }
        }
    );

    // =========================================================
    // RESIZE
    // =========================================================

    function resizeCanvas() {
        const ratio =
            VIEW_W / VIEW_H;

        let width =
            window.innerWidth;

        let height =
            window.innerHeight;

        if (
            width / height >
            ratio
        ) {
            width =
                height * ratio;
        } else {
            height =
                width / ratio;
        }

        canvas.style.width =
            `${Math.floor(
                width
            )}px`;

        canvas.style.height =
            `${Math.floor(
                height
            )}px`;
    }

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();

    // =========================================================
    // INITIAL SPAWN
    // =========================================================

    const initialSpawn =
        findSafeSpawn(
            state.player.x,
            state.player.y
        );

    state.player.x =
        initialSpawn.x;

    state.player.y =
        initialSpawn.y;

    state.camera.x =
        clamp(
            state.player.x -
                VIEW_W / 2,
            0,
            WORLD_W -
                VIEW_W
        );

    state.camera.y =
        clamp(
            state.player.y -
                VIEW_H / 2,
            0,
            WORLD_H -
                VIEW_H
        );

    updateHUD();

    showToast(
        "🏙️ Welcome to Cracker City V5!"
    );

    requestAnimationFrame(
        gameLoop
    );
})();
