/* =========================================================
   CRACKER CITY V6
   Original 2D Open-City Game
   No database • No localStorage • No permanent save
   ========================================================= */

(() => {
    "use strict";

    const canvas = document.getElementById("cityCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Cracker City: canvas not found.");
        return;
    }

    // ---------------------------------------------------------
    // CANVAS / WORLD
    // ---------------------------------------------------------

    const VIEW_W = 960;
    const VIEW_H = 600;

    const WORLD_W = 4200;
    const WORLD_H = 2800;

    canvas.width = VIEW_W;
    canvas.height = VIEW_H;

    const keys = Object.create(null);

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const rand = (min, max) => Math.random() * (max - min) + min;

    const randInt = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    const distance = (a, b) =>
        Math.hypot(a.x - b.x, a.y - b.y);

    const lerp = (a, b, t) => a + (b - a) * t;

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    const cashEl = document.getElementById("cash");
    const repEl = document.getElementById("rep");
    const propertyEl = document.getElementById("property");
    const missionEl = document.getElementById("mission");

    const panel = document.getElementById("panel");
    const panelTitle = document.getElementById("panelTitle");
    const panelText = document.getElementById("panelText");
    const panelButtons = document.getElementById("panelButtons");

    // ---------------------------------------------------------
    // GAME STATE
    // ---------------------------------------------------------

    const state = {
        cash: 500,
        bank: 0,
        rep: 0,
        xp: 0,
        level: 1,

        property: 0,
        carsOwned: 0,

        wanted: 0,
        wantedTimer: 0,

        dayTime: 9,
        weather: "clear",

        paused: false,
        panelOpen: false,

        shopVisits: 0,

        inventory: {
            food: 0,
            package: 0,
            keys: 0,
            medicine: 0,
            parts: 0
        },

        missionsCompleted: [],
        activeMission: null,

        achievements: [],

        traffic: [],
        npcs: [],
        police: [],
        collectibles: [],

        apartments: [],
        shops: [],
        trees: [],
        lamps: [],

        camera: {
            x: 0,
            y: 0
        },

        player: {
            x: 430,
            y: 315,

            w: 24,
            h: 36,

            speed: 2.8,
            runSpeed: 4.4,

            health: 100,
            energy: 100,

            vehicle: null,

            facing: "down",
            moving: false,

            skin: "#c58a65",
            hair: "#171717",
            shirt: "#2e6fd0",
            pants: "#252525",
            shoes: "#101010"
        }
    };

    // ---------------------------------------------------------
    // DISTRICTS
    // ---------------------------------------------------------

    const districts = [
        {
            name: "Downtown",
            x: 0,
            y: 0,
            w: 1200,
            h: 900
        },
        {
            name: "Neon District",
            x: 1200,
            y: 0,
            w: 1100,
            h: 900
        },
        {
            name: "Old Town",
            x: 0,
            y: 900,
            w: 1200,
            h: 950
        },
        {
            name: "Industrial",
            x: 1200,
            y: 900,
            w: 1300,
            h: 950
        },
        {
            name: "Suburbs",
            x: 2500,
            y: 0,
            w: 1700,
            h: 1050
        },
        {
            name: "Harbor",
            x: 2500,
            y: 1050,
            w: 1700,
            h: 950
        },
        {
            name: "Beach",
            x: 0,
            y: 1850,
            w: 1500,
            h: 950
        },
        {
            name: "Airport",
            x: 1500,
            y: 1950,
            w: 1300,
            h: 850
        },
        {
            name: "South City",
            x: 2800,
            y: 2000,
            w: 1400,
            h: 800
        }
    ];

    // ---------------------------------------------------------
    // ROADS
    // ---------------------------------------------------------

    const roads = [];

    const addRoad = (x, y, w, h, type = "main") => {
        roads.push({ x, y, w, h, type });
    };

    // Main horizontal roads
    [
        230,
        760,
        1290,
        1820,
        2350
    ].forEach(y => {
        addRoad(0, y, WORLD_W, 135, "main");
    });

    // Main vertical roads
    [
        280,
        900,
        1520,
        2140,
        2760,
        3380
    ].forEach(x => {
        addRoad(x, 0, 135, WORLD_H, "main");
    });

    // Smaller roads
    [
        [570, 0, 70, WORLD_H],
        [1190, 0, 70, WORLD_H],
        [1820, 0, 70, WORLD_H],
        [2450, 0, 70, WORLD_H],
        [3070, 0, 70, WORLD_H],
        [3690, 0, 70, WORLD_H],

        [0, 510, WORLD_W, 65],
        [0, 1030, WORLD_W, 65],
        [0, 1560, WORLD_W, 65],
        [0, 2090, WORLD_W, 65],
        [0, 2610, WORLD_W, 65]
    ].forEach(r => addRoad(...r, "small"));

    const isOnRoad = (x, y) =>
        roads.some(r =>
            x >= r.x &&
            x <= r.x + r.w &&
            y >= r.y &&
            y <= r.y + r.h
        );

    // ---------------------------------------------------------
    // BUILDINGS
    // ---------------------------------------------------------

    const buildings = [];

    function createBuildings() {
        buildings.length = 0;

        for (let gx = 40; gx < WORLD_W - 100; gx += 170) {
            for (let gy = 40; gy < WORLD_H - 100; gy += 155) {

                const cx = gx + 65;
                const cy = gy + 55;

                if (isOnRoad(cx, cy)) continue;

                if (Math.random() < 0.16) continue;

                const w = randInt(80, 135);
                const h = randInt(75, 125);

                if (
                    gx + w >= WORLD_W ||
                    gy + h >= WORLD_H
                ) continue;

                buildings.push({
                    x: gx,
                    y: gy,
                    w,
                    h,

                    floors: randInt(1, 6),

                    color: [
                        "#5d6068",
                        "#686a72",
                        "#76716c",
                        "#565b63",
                        "#7b736b",
                        "#626b70",
                        "#4f5660"
                    ][randInt(0, 6)],

                    roof: Math.random() > 0.55,
                    sign: Math.random() > 0.7
                });
            }
        }
    }

    createBuildings();

    // ---------------------------------------------------------
    // SPECIAL LOCATIONS
    // ---------------------------------------------------------

    const points = {
        mission: {
            x: 570,
            y: 315,
            icon: "🎯",
            name: "Mission Office"
        },

        garage: {
            x: 930,
            y: 715,
            icon: "🚗",
            name: "Garage"
        },

        property: {
            x: 1590,
            y: 1215,
            icon: "🏠",
            name: "Property Office"
        },

        shop: {
            x: 760,
            y: 930,
            icon: "🛒",
            name: "City Shop"
        },

        club: {
            x: 1840,
            y: 930,
            icon: "🎵",
            name: "Night Club"
        },

        bank: {
            x: 1370,
            y: 700,
            icon: "🏦",
            name: "City Bank"
        },

        airport: {
            x: 1660,
            y: 2210,
            icon: "✈️",
            name: "Airport"
        },

        food: {
            x: 2410,
            y: 920,
            icon: "🍔",
            name: "Food Corner"
        },

        hospital: {
            x: 2760,
            y: 700,
            icon: "🏥",
            name: "Hospital"
        },

        police: {
            x: 1120,
            y: 320,
            icon: "👮",
            name: "Police Station"
        },

        workshop: {
            x: 2450,
            y: 1180,
            icon: "🔧",
            name: "Workshop"
        },

        market: {
            x: 2050,
            y: 1450,
            icon: "🏪",
            name: "Night Market"
        },

        train: {
            x: 3020,
            y: 1280,
            icon: "🚆",
            name: "Central Station"
        },

        apartment: {
            x: 3450,
            y: 650,
            icon: "🏢",
            name: "Skyline Apartments"
        }
    };

    // ---------------------------------------------------------
    // LANDMARKS
    // ---------------------------------------------------------

    const landmarks = [
        {
            name: "City Plaza",
            x: 390,
            y: 110,
            w: 320,
            h: 170
        },

        {
            name: "Central Park",
            x: 950,
            y: 430,
            w: 380,
            h: 250
        },

        {
            name: "Neon Square",
            x: 1500,
            y: 120,
            w: 400,
            h: 220
        },

        {
            name: "Industrial Yard",
            x: 1800,
            y: 1100,
            w: 420,
            h: 300
        },

        {
            name: "Sunset Beach",
            x: 0,
            y: 2200,
            w: 1450,
            h: 600
        },

        {
            name: "Harbor",
            x: 2750,
            y: 1500,
            w: 1200,
            h: 450
        }
    ];

    // ---------------------------------------------------------
    // TREES
    // ---------------------------------------------------------

    function createTrees() {
        state.trees.length = 0;

        for (let i = 0; i < 180; i++) {

            let x = rand(40, WORLD_W - 40);
            let y = rand(40, WORLD_H - 40);

            if (isOnRoad(x, y)) continue;

            state.trees.push({
                x,
                y,
                size: rand(14, 27),
                type: Math.random() > 0.7 ? "palm" : "tree"
            });
        }
    }

    createTrees();

    // ---------------------------------------------------------
    // STREET LIGHTS
    // ---------------------------------------------------------

    function createLamps() {
        state.lamps.length = 0;

        roads.forEach(r => {

            if (r.type !== "main") return;

            if (r.w > r.h) {

                for (
                    let x = r.x + 50;
                    x < r.x + r.w;
                    x += 190
                ) {
                    state.lamps.push({
                        x,
                        y: r.y + 18
                    });

                    state.lamps.push({
                        x,
                        y: r.y + r.h - 18
                    });
                }

            } else {

                for (
                    let y = r.y + 50;
                    y < r.y + r.h;
                    y += 190
                ) {
                    state.lamps.push({
                        x: r.x + 18,
                        y
                    });

                    state.lamps.push({
                        x: r.x + r.w - 18,
                        y
                    });
                }
            }
        });
    }

    createLamps();

    // ---------------------------------------------------------
    // VEHICLES
    // ---------------------------------------------------------

    const vehicleTypes = [
        {
            name: "Street Car",
            price: 450,
            speed: 5.7,
            width: 48,
            height: 27,
            color: "#b9bdc4"
        },
        {
            name: "City Sedan",
            price: 750,
            speed: 6.2,
            width: 50,
            height: 28,
            color: "#376aa8"
        },
        {
            name: "Taxi",
            price: 1100,
            speed: 6.7,
            width: 50,
            height: 28,
            color: "#d5ad32"
        },
        {
            name: "Sport Coupe",
            price: 1800,
            speed: 8.1,
            width: 52,
            height: 27,
            color: "#9d3d46"
        },
        {
            name: "City Cruiser",
            price: 2600,
            speed: 7.1,
            width: 54,
            height: 30,
            color: "#343941"
        },
        {
            name: "Executive",
            price: 3800,
            speed: 7.5,
            width: 56,
            height: 30,
            color: "#222831"
        }
    ];

    function spawnTraffic() {

        state.traffic.length = 0;

        for (let i = 0; i < 28; i++) {

            const horizontal = Math.random() > 0.5;

            if (horizontal) {

                const y =
                    roads[
                        randInt(0, roads.length - 1)
                    ];

                const road = roads.find(r =>
                    r.w > r.h &&
                    Math.abs(
                        (r.y + r.h / 2) -
                        (y ? y.y + y.h / 2 : 0)
                    ) < 10
                );

                if (!road) continue;

                state.traffic.push({
                    x: rand(0, WORLD_W),
                    y: road.y + road.h * 0.35,
                    angle: Math.random() > 0.5 ? 0 : Math.PI,
                    speed: rand(1.5, 3.5),
                    type: vehicleTypes[randInt(0, 5)],
                    ai: true
                });

            } else {

                const road = roads[
                    randInt(0, roads.length - 1)
                ];

                if (road.w > road.h) continue;

                state.traffic.push({
                    x: road.x + road.w * 0.35,
                    y: rand(0, WORLD_H),
                    angle: Math.random() > 0.5
                        ? Math.PI / 2
                        : -Math.PI / 2,
                    speed: rand(1.4, 3.4),
                    type: vehicleTypes[randInt(0, 5)],
                    ai: true
                });
            }
        }
    }

    spawnTraffic();

    // ---------------------------------------------------------
    // NPC DATA
    // ---------------------------------------------------------

    const npcNames = [
        "Arif",
        "Nadia",
        "Rafi",
        "Maya",
        "Hasan",
        "Lina",
        "Samir",
        "Tania",
        "Imran",
        "Sara",
        "Adnan",
        "Mina",
        "Ryan",
        "Ayan",
        "Sami",
        "Nora",
        "Fahim",
        "Riya",
        "Zayan",
        "Mira"
    ];

    const skinTones = [
        "#7b4f32",
        "#915f40",
        "#a96f4d",
        "#bd805d",
        "#c88d68",
        "#d39b76"
    ];

    const shirtColors = [
        "#334e68",
        "#546a7b",
        "#7b3f61",
        "#486b4f",
        "#725d3b",
        "#4e5a75",
        "#803f35",
        "#3e6478"
    ];

    function spawnNPCs() {

        state.npcs.length = 0;

        for (let i = 0; i < 55; i++) {

            let x;
            let y;

            for (let tries = 0; tries < 20; tries++) {

                x = rand(100, WORLD_W - 100);
                y = rand(100, WORLD_H - 100);

                if (isOnRoad(x, y)) break;
            }

            state.npcs.push({
                x,
                y,

                vx: 0,
                vy: 0,

                targetX: x,
                targetY: y,

                speed: rand(0.45, 0.9),

                name: npcNames[
                    randInt(0, npcNames.length - 1)
                ],

                skin: skinTones[
                    randInt(0, skinTones.length - 1)
                ],

                shirt: shirtColors[
                    randInt(0, shirtColors.length - 1)
                ],

                pants: Math.random() > 0.5
                    ? "#242a31"
                    : "#4b4b43",

                hair: Math.random() > 0.5
                    ? "#151515"
                    : "#33261f",

                gender: Math.random() > 0.5
                    ? "m"
                    : "f",

                state: "walking",

                timer: rand(0, 5)
            });
        }
    }

    spawnNPCs();

    // ---------------------------------------------------------
    // POLICE
    // ---------------------------------------------------------

    function spawnPolice() {

        state.police.length = 0;

        for (let i = 0; i < 9; i++) {

            state.police.push({
                x: rand(200, WORLD_W - 200),
                y: rand(200, WORLD_H - 200),

                speed: rand(1.7, 2.3),

                targetX: 0,
                targetY: 0,

                chasing: false
            });
        }
    }

    spawnPolice();

    // ---------------------------------------------------------
    // COLLECTIBLES
    // ---------------------------------------------------------

    function spawnCollectibles() {

        state.collectibles.length = 0;

        for (let i = 0; i < 55; i++) {

            let x = rand(100, WORLD_W - 100);
            let y = rand(100, WORLD_H - 100);

            if (!isOnRoad(x, y)) {

                state.collectibles.push({
                    x,
                    y,
                    type: Math.random() > 0.55
                        ? "coin"
                        : "star",

                    taken: false
                });
            }
        }
    }

    spawnCollectibles();

    // ---------------------------------------------------------
    // APARTMENTS
    // ---------------------------------------------------------

    function createApartments() {

        state.apartments = [
            {
                name: "Small Studio",
                x: 3450,
                y: 650,
                price: 950,
                owned: false
            },
            {
                name: "City Apartment",
                x: 3570,
                y: 650,
                price: 1800,
                owned: false
            },
            {
                name: "Modern Apartment",
                x: 3690,
                y: 650,
                price: 3200,
                owned: false
            },
            {
                name: "Luxury Penthouse",
                x: 3450,
                y: 820,
                price: 6500,
                owned: false
            }
        ];
    }

    createApartments();

    // ---------------------------------------------------------
    // SHOPS
    // ---------------------------------------------------------

    state.shops = [
        {
            name: "Fresh Market",
            x: 760,
            y: 930
        },
        {
            name: "Tech Store",
            x: 1350,
            y: 450
        },
        {
            name: "Clothing Store",
            x: 1620,
            y: 530
        },
        {
            name: "Electronics",
            x: 1900,
            y: 580
        },
        {
            name: "Night Market",
            x: 2050,
            y: 1450
        }
    ];

    // ---------------------------------------------------------
    // MISSIONS
    // ---------------------------------------------------------

    const missions = [
        {
            id: "delivery",
            name: "City Delivery",
            target: { x: 760, y: 930 },
            reward: 120,
            xp: 60,
            rep: 4,
            text: "Take the package to Fresh Market."
        },

        {
            id: "airport",
            name: "Airport Run",
            target: { x: 1660, y: 2210 },
            reward: 220,
            xp: 100,
            rep: 6,
            text: "Reach the airport."
        },

        {
            id: "harbor",
            name: "Harbor Job",
            target: { x: 3100, y: 1650 },
            reward: 300,
            xp: 130,
            rep: 8,
            text: "Meet the contact at the harbor."
        },

        {
            id: "hospital",
            name: "Medical Supply",
            target: { x: 2760, y: 700 },
            reward: 260,
            xp: 120,
            rep: 7,
            text: "Deliver the medical package."
        },

        {
            id: "station",
            name: "Station Meeting",
            target: { x: 3020, y: 1280 },
            reward: 350,
            xp: 160,
            rep: 10,
            text: "Meet your contact at Central Station."
        },

        {
            id: "market",
            name: "Market Run",
            target: { x: 2050, y: 1450 },
            reward: 400,
            xp: 180,
            rep: 12,
            text: "Visit the night market."
        },

        {
            id: "apartment",
            name: "Property Search",
            target: { x: 3450, y: 650 },
            reward: 450,
            xp: 200,
            rep: 14,
            text: "Inspect the Skyline Apartments."
        },

        {
            id: "park",
            name: "Quiet Evening",
            target: { x: 1100, y: 550 },
            reward: 150,
            xp: 80,
            rep: 5,
            text: "Take a walk through Central Park."
        },

        {
            id: "garage",
            name: "Garage Check",
            target: { x: 930, y: 715 },
            reward: 180,
            xp: 90,
            rep: 5,
            text: "Visit the garage."
        },

        {
            id: "bank",
            name: "Bank Visit",
            target: { x: 1370, y: 700 },
            reward: 180,
            xp: 90,
            rep: 5,
            text: "Visit City Bank."
        }
    ];

    // ---------------------------------------------------------
    // MISSION FUNCTIONS
    // ---------------------------------------------------------

    function startMission(mission) {

        if (state.activeMission) {
            toast("Finish your current mission first.");
            return;
        }

        state.activeMission = {
            ...mission
        };

        state.inventory.package += 1;

        closePanel();

        updateMissionText();

        toast(`Mission started: ${mission.name}`);
    }

    function completeMission() {

        const mission = state.activeMission;

        if (!mission) return;

        state.cash += mission.reward;
        state.rep += mission.rep;

        addXP(mission.xp);

        state.missionsCompleted.push(mission.id);

        state.activeMission = null;

        state.inventory.package =
            Math.max(0, state.inventory.package - 1);

        checkAchievements();

        updateMissionText();

        toast(
            `Mission complete! +$${mission.reward} +${mission.xp} XP`
        );
    }

    function cancelMission() {

        if (!state.activeMission) return;

        state.activeMission = null;

        state.inventory.package =
            Math.max(0, state.inventory.package - 1);

        updateMissionText();

        toast("Mission cancelled.");
    }

    function updateMissionText() {

        if (!missionEl) return;

        if (!state.activeMission) {
            missionEl.textContent =
                "Explore Cracker City and find your next mission.";
            return;
        }

        missionEl.textContent =
            `${state.activeMission.name} — ${state.activeMission.text}`;
    }

    // ---------------------------------------------------------
    // XP / LEVEL
    // ---------------------------------------------------------

    function addXP(amount) {

        state.xp += amount;

        while (state.xp >= state.level * 250) {

            state.xp -= state.level * 250;

            state.level++;

            state.cash += 100;

            toast(`LEVEL UP! You are now level ${state.level}`);
        }

        updateHUD();
    }

    // ---------------------------------------------------------
    // MONEY
    // ---------------------------------------------------------

    function spend(amount) {

        if (state.cash < amount) {

            toast("Not enough cash.");

            return false;
        }

        state.cash -= amount;

        updateHUD();

        return true;
    }

    // ---------------------------------------------------------
    // HUD
    // ---------------------------------------------------------

    function updateHUD() {

        if (cashEl)
            cashEl.textContent = Math.floor(state.cash);

        if (repEl)
            repEl.textContent = Math.floor(state.rep);

        if (propertyEl)
            propertyEl.textContent = state.property;
    }

    // ---------------------------------------------------------
    // TOAST
    // ---------------------------------------------------------

    let toastTimer = null;

    function toast(message) {

        let el = document.getElementById("cityToast");

        if (!el) {

            el = document.createElement("div");

            el.id = "cityToast";

            Object.assign(el.style, {
                position: "fixed",
                left: "50%",
                bottom: "110px",
                transform: "translateX(-50%)",
                zIndex: "9999",
                padding: "10px 16px",
                borderRadius: "12px",
                background: "rgba(10,12,20,.92)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.15)",
                fontSize: "14px",
                pointerEvents: "none",
                transition: "opacity .25s"
            });

            document.body.appendChild(el);
        }

        el.textContent = message;
        el.style.opacity = "1";

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            el.style.opacity = "0";
        }, 2400);
    }

    // ---------------------------------------------------------
    // PANEL
    // ---------------------------------------------------------

    function openPanel(title, text, buttons = []) {

        state.panelOpen = true;
        state.paused = true;

        if (!panel) return;

        panel.classList.remove("hidden");
        panel.setAttribute("aria-hidden", "false");

        panelTitle.textContent = title;
        panelText.textContent = text;

        panelButtons.innerHTML = "";

        buttons.forEach(btn => {

            const b = document.createElement("button");

            b.type = "button";
            b.textContent = btn.label;

            b.addEventListener("click", () => {
                btn.action();
            });

            panelButtons.appendChild(b);
        });
    }

    function closePanel() {

        state.panelOpen = false;
        state.paused = false;

        if (!panel) return;

        panel.classList.add("hidden");
        panel.setAttribute("aria-hidden", "true");
    }

    // ---------------------------------------------------------
    // DRAW HELPERS
    // ---------------------------------------------------------

    function roundedRect(x, y, w, h, r) {

        ctx.beginPath();

        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);

        ctx.quadraticCurveTo(
            x + w,
            y,
            x + w,
            y + r
        );

        ctx.lineTo(x + w, y + h - r);

        ctx.quadraticCurveTo(
            x + w,
            y + h,
            x + w - r,
            y + h
        );

        ctx.lineTo(x + r, y + h);

        ctx.quadraticCurveTo(
            x,
            y + h,
            x,
            y + h - r
        );

        ctx.lineTo(x, y + r);

        ctx.quadraticCurveTo(
            x,
            y,
            x + r,
            y
        );

        ctx.closePath();
    }

    function worldToScreen(x, y) {

        return {
            x: x - state.camera.x,
            y: y - state.camera.y
        };
    }

    // ---------------------------------------------------------
    // GROUND
    // ---------------------------------------------------------

    function drawGround() {

        ctx.fillStyle = "#35483b";
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        const tile = 80;

        const startX =
            Math.floor(state.camera.x / tile) * tile;

        const startY =
            Math.floor(state.camera.y / tile) * tile;

        for (
            let x = startX;
            x < state.camera.x + VIEW_W + tile;
            x += tile
        ) {

            for (
                let y = startY;
                y < state.camera.y + VIEW_H + tile;
                y += tile
            ) {

                const sx = x - state.camera.x;
                const sy = y - state.camera.y;

                ctx.fillStyle =
                    ((x / tile + y / tile) % 2 === 0)
                        ? "#3a4d40"
                        : "#36493d";

                ctx.fillRect(
                    sx,
                    sy,
                    tile + 1,
                    tile + 1
                );
            }
        }
    }

    // ---------------------------------------------------------
    // ROADS
    // ---------------------------------------------------------

    function drawRoads() {

        roads.forEach(r => {

            const s = worldToScreen(r.x, r.y);

            ctx.fillStyle =
                r.type === "main"
                    ? "#282c32"
                    : "#30343a";

            ctx.fillRect(
                s.x,
                s.y,
                r.w,
                r.h
            );

            // Road edge
            ctx.strokeStyle = "rgba(255,255,255,.08)";
            ctx.lineWidth = 2;

            ctx.strokeRect(
                s.x,
                s.y,
                r.w,
                r.h
            );

            // Center lines
            ctx.setLineDash([25, 20]);

            ctx.strokeStyle =
                "rgba(224,195,84,.72)";

            ctx.lineWidth = 2;

            ctx.beginPath();

            if (r.w > r.h) {

                ctx.moveTo(
                    s.x,
                    s.y + r.h / 2
                );

                ctx.lineTo(
                    s.x + r.w,
                    s.y + r.h / 2
                );

            } else {

                ctx.moveTo(
                    s.x + r.w / 2,
                    s.y
                );

                ctx.lineTo(
                    s.x + r.w / 2,
                    s.y + r.h
                );
            }

            ctx.stroke();

            ctx.setLineDash([]);
        });
    }

    // ---------------------------------------------------------
    // BUILDINGS
    // ---------------------------------------------------------

    function drawBuilding(b) {

        const s = worldToScreen(b.x, b.y);

        if (
            s.x > VIEW_W + 100 ||
            s.y > VIEW_H + 100 ||
            s.x + b.w < -100 ||
            s.y + b.h < -100
        ) return;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,.28)";

        roundedRect(
            s.x + 7,
            s.y + 8,
            b.w,
            b.h,
            7
        );

        ctx.fill();

        // Building body
        ctx.fillStyle = b.color;

        roundedRect(
            s.x,
            s.y,
            b.w,
            b.h,
            6
        );

        ctx.fill();

        // Side lighting
        const gradient = ctx.createLinearGradient(
            s.x,
            s.y,
            s.x + b.w,
            s.y
        );

        gradient.addColorStop(
            0,
            "rgba(255,255,255,.08)"
        );

        gradient.addColorStop(
            0.5,
            "rgba(255,255,255,0)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,.12)"
        );

        ctx.fillStyle = gradient;

        roundedRect(
            s.x,
            s.y,
            b.w,
            b.h,
            6
        );

        ctx.fill();

        // Roof
        if (b.roof) {

            ctx.fillStyle = "rgba(20,22,26,.65)";

            ctx.fillRect(
                s.x + 4,
                s.y + 4,
                b.w - 8,
                7
            );
        }

        // Windows
        const columns = Math.max(
            2,
            Math.floor(b.w / 25)
        );

        const rows = Math.max(
            2,
            Math.floor(b.h / 28)
        );

        for (let yy = 0; yy < rows; yy++) {

            for (let xx = 0; xx < columns; xx++) {

                const wx =
                    s.x + 10 + xx * 23;

                const wy =
                    s.y + 20 + yy * 25;

                if (
                    wx + 9 > s.x + b.w - 7 ||
                    wy + 12 > s.y + b.h - 7
                ) continue;

                const lit =
                    Math.random() > 0.45;

                ctx.fillStyle =
                    state.dayTime >= 19 ||
                    state.dayTime < 6
                        ? (
                            lit
                                ? "#d6b45d"
                                : "#30343a"
                        )
                        : "#b7c3c8";

                ctx.fillRect(
                    wx,
                    wy,
                    9,
                    12
                );
            }
        }

        if (b.sign) {

            ctx.fillStyle = "#171a20";

            ctx.fillRect(
                s.x + b.w * .2,
                s.y + b.h - 17,
                b.w * .6,
                9
            );

            ctx.fillStyle = "#9fc3df";

            ctx.font = "6px Arial";

            ctx.textAlign = "center";

            ctx.fillText(
                "CITY",
                s.x + b.w / 2,
                s.y + b.h - 10
            );
        }
    }

    function drawBuildings() {

        buildings.forEach(drawBuilding);
    }

    // ---------------------------------------------------------
    // TREES
    // ---------------------------------------------------------

    function drawTree(t) {

        const s = worldToScreen(t.x, t.y);

        if (
            s.x < -50 ||
            s.x > VIEW_W + 50 ||
            s.y < -50 ||
            s.y > VIEW_H + 50
        ) return;

        if (t.type === "palm") {

            ctx.strokeStyle = "#5a402a";
            ctx.lineWidth = 5;

            ctx.beginPath();

            ctx.moveTo(
                s.x,
                s.y + t.size
            );

            ctx.lineTo(
                s.x - 3,
                s.y - t.size
            );

            ctx.stroke();

            for (let i = 0; i < 7; i++) {

                const a =
                    (Math.PI * 2 * i) / 7;

                ctx.strokeStyle = "#3b673d";
                ctx.lineWidth = 3;

                ctx.beginPath();

                ctx.moveTo(
                    s.x - 3,
                    s.y - t.size
                );

                ctx.lineTo(
                    s.x - 3 + Math.cos(a) * t.size * 1.5,
                    s.y - t.size + Math.sin(a) * t.size * .7
                );

                ctx.stroke();
            }

        } else {

            ctx.fillStyle = "#68472e";

            ctx.fillRect(
                s.x - 3,
                s.y,
                6,
                t.size
            );

            const g = ctx.createRadialGradient(
                s.x - t.size * .25,
                s.y - t.size * .6,
                2,
                s.x,
                s.y - t.size * .5,
                t.size * 1.25
            );

            g.addColorStop(0, "#4f7b48");
            g.addColorStop(1, "#24452d");

            ctx.fillStyle = g;

            ctx.beginPath();

            ctx.arc(
                s.x,
                s.y - t.size * .5,
                t.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }

    function drawTrees() {
        state.trees.forEach(drawTree);
    }

    // ---------------------------------------------------------
    // STREET LAMPS
    // ---------------------------------------------------------

    function drawLamps() {

        state.lamps.forEach(l => {

            const s = worldToScreen(l.x, l.y);

            if (
                s.x < -20 ||
                s.x > VIEW_W + 20 ||
                s.y < -50 ||
                s.y > VIEW_H + 50
            ) return;

            ctx.strokeStyle = "#20252a";
            ctx.lineWidth = 3;

            ctx.beginPath();

            ctx.moveTo(
                s.x,
                s.y + 30
            );

            ctx.lineTo(
                s.x,
                s.y
            );

            ctx.lineTo(
                s.x + 7,
                s.y - 5
            );

            ctx.stroke();

            ctx.fillStyle =
                state.dayTime >= 18 ||
                state.dayTime < 6
                    ? "#ffd76a"
                    : "#9b9d99";

            ctx.beginPath();

            ctx.arc(
                s.x + 7,
                s.y - 5,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });
    }

    // ---------------------------------------------------------
    // LANDMARKS
    // ---------------------------------------------------------

    function drawLandmarks() {

        landmarks.forEach(l => {

            const s = worldToScreen(l.x, l.y);

            if (
                s.x > VIEW_W ||
                s.y > VIEW_H ||
                s.x + l.w < 0 ||
                s.y + l.h < 0
            ) return;

            if (l.name === "Central Park") {

                ctx.fillStyle = "#294f32";

                ctx.fillRect(
                    s.x,
                    s.y,
                    l.w,
                    l.h
                );

                ctx.strokeStyle =
                    "rgba(255,255,255,.1)";

                ctx.strokeRect(
                    s.x,
                    s.y,
                    l.w,
                    l.h
                );

                // pond
                ctx.fillStyle = "#356b83";

                ctx.beginPath();

                ctx.ellipse(
                    s.x + l.w * .55,
                    s.y + l.h * .5,
                    l.w * .28,
                    l.h * .18,
                    0,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            } else if (l.name === "Sunset Beach") {

                ctx.fillStyle = "#c8b078";

                ctx.fillRect(
                    s.x,
                    s.y,
                    l.w,
                    l.h
                );

                ctx.fillStyle = "#2c7184";

                ctx.fillRect(
                    s.x,
                    s.y + l.h * .55,
                    l.w,
                    l.h * .45
                );

                ctx.strokeStyle =
                    "rgba(255,255,255,.16)";

                ctx.lineWidth = 2;

                for (let y = 0; y < 8; y++) {

                    ctx.beginPath();

                    ctx.moveTo(
                        s.x,
                        s.y + l.h * .58 + y * 22
                    );

                    ctx.lineTo(
                        s.x + l.w,
                        s.y + l.h * .58 + y * 22
                    );

                    ctx.stroke();
                }

            } else if (l.name === "Harbor") {

                ctx.fillStyle = "#245462";

                ctx.fillRect(
                    s.x,
                    s.y,
                    l.w,
                    l.h
                );

                ctx.fillStyle = "#805b39";

                for (let x = 0; x < l.w; x += 95) {

                    ctx.fillRect(
                        s.x + x,
                        s.y + 40,
                        55,
                        l.h - 70
                    );
                }

            } else {

                ctx.fillStyle = "#59606a";

                ctx.fillRect(
                    s.x,
                    s.y,
                    l.w,
                    l.h
                );
            }

            ctx.fillStyle = "rgba(255,255,255,.65)";

            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                l.name,
                s.x + l.w / 2,
                s.y + 18
            );
        });
    }

    // ---------------------------------------------------------
    // REALISTIC CHARACTER DRAWING
    // ---------------------------------------------------------

    function drawHuman(x, y, options = {}) {

        const skin =
            options.skin || "#bd805d";

        const shirt =
            options.shirt || "#334e68";

        const pants =
            options.pants || "#252525";

        const hair =
            options.hair || "#171717";

        const facing =
            options.facing || "down";

        const scale =
            options.scale || 1;

        const moving =
            options.moving || false;

        const sx = x;
        const sy = y;

        ctx.save();

        ctx.translate(sx, sy);
        ctx.scale(scale, scale);

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,.30)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            18,
            11,
            4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // legs
        ctx.strokeStyle = pants;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        const walk =
            moving
                ? Math.sin(performance.now() / 100) * 3
                : 0;

        ctx.beginPath();

        ctx.moveTo(-4, 7);
        ctx.lineTo(-5 + walk, 17);

        ctx.moveTo(4, 7);
        ctx.lineTo(5 - walk, 17);

        ctx.stroke();

        // shoes
        ctx.strokeStyle = "#111";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(-6 + walk, 17);
        ctx.lineTo(-2 + walk, 18);

        ctx.moveTo(4 - walk, 17);
        ctx.lineTo(8 - walk, 18);

        ctx.stroke();

        // body
        const bodyGrad =
            ctx.createLinearGradient(
                -9,
                -7,
                9,
                9
            );

        bodyGrad.addColorStop(
            0,
            "#ffffff22"
        );

        bodyGrad.addColorStop(
            .3,
            shirt
        );

        bodyGrad.addColorStop(
            1,
            "#111111"
        );

        ctx.fillStyle = bodyGrad;

        roundedRect(
            -9,
            -8,
            18,
            19,
            5
        );

        ctx.fill();

        // arms
        ctx.strokeStyle = skin;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        ctx.beginPath();

        if (facing === "left") {

            ctx.moveTo(-7, -4);
            ctx.lineTo(-12, 5);

            ctx.moveTo(7, -4);
            ctx.lineTo(4, 5);

        } else if (facing === "right") {

            ctx.moveTo(-7, -4);
            ctx.lineTo(-4, 5);

            ctx.moveTo(7, -4);
            ctx.lineTo(12, 5);

        } else {

            ctx.moveTo(-7, -4);
            ctx.lineTo(-10, 5);

            ctx.moveTo(7, -4);
            ctx.lineTo(10, 5);
        }

        ctx.stroke();

        // neck
        ctx.fillStyle = skin;

        ctx.fillRect(
            -3,
            -12,
            6,
            6
        );

        // head
        const headGrad =
            ctx.createRadialGradient(
                -2,
                -17,
                2,
                0,
                -15,
                10
            );

        headGrad.addColorStop(
            0,
            "#f0c19b"
        );

        headGrad.addColorStop(
            .45,
            skin
        );

        headGrad.addColorStop(
            1,
            "#6d422c"
        );

        ctx.fillStyle = headGrad;

        ctx.beginPath();

        ctx.ellipse(
            0,
            -16,
            8,
            9,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // hair
        ctx.fillStyle = hair;

        ctx.beginPath();

        ctx.arc(
            0,
            -20,
            8,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillRect(
            -7,
            -20,
            14,
            4
        );

        // face details when facing down
        if (facing === "down") {

            ctx.fillStyle = "#171717";

            ctx.beginPath();

            ctx.arc(
                -3,
                -16,
                1,
                0,
                Math.PI * 2
            );

            ctx.arc(
                3,
                -16,
                1,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "rgba(60,20,15,.6)";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(-2, -12);
            ctx.quadraticCurveTo(
                0,
                -11,
                2,
                -12
            );

            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPlayer() {

        const s = worldToScreen(
            state.player.x,
            state.player.y
        );

        if (state.player.vehicle) return;

        drawHuman(
            s.x,
            s.y,
            {
                skin: state.player.skin,
                shirt: state.player.shirt,
                pants: state.player.pants,
                hair: state.player.hair,
                facing: state.player.facing,
                moving: state.player.moving,
                scale: 1.15
            }
        );
    }

    function drawNPCs() {

        state.npcs.forEach(n => {

            const s = worldToScreen(n.x, n.y);

            if (
                s.x < -40 ||
                s.x > VIEW_W + 40 ||
                s.y < -50 ||
                s.y > VIEW_H + 50
            ) return;

            drawHuman(
                s.x,
                s.y,
                {
                    skin: n.skin,
                    shirt: n.shirt,
                    pants: n.pants,
                    hair: n.hair,
                    moving: n.state === "walking",
                    scale: .95
                }
            );
        });
    }

    // ---------------------------------------------------------
    // VEHICLE DRAWING
    // ---------------------------------------------------------

    function drawVehicle(v) {

        const s = worldToScreen(v.x, v.y);

        if (
            s.x < -70 ||
            s.x > VIEW_W + 70 ||
            s.y < -70 ||
            s.y > VIEW_H + 70
        ) return;

        const type = v.type || vehicleTypes[0];

        ctx.save();

        ctx.translate(s.x, s.y);
        ctx.rotate(v.angle || 0);

        const w = type.width;
        const h = type.height;

        // shadow
        ctx.fillStyle = "rgba(0,0,0,.35)";

        roundedRect(
            -w / 2 + 4,
            -h / 2 + 5,
            w,
            h,
            7
        );

        ctx.fill();

        // body gradient
        const g = ctx.createLinearGradient(
            0,
            -h / 2,
            0,
            h / 2
        );

        g.addColorStop(
            0,
            "rgba(255,255,255,.32)"
        );

        g.addColorStop(
            .2,
            type.color
        );

        g.addColorStop(
            1,
            "#15171a"
        );

        ctx.fillStyle = g;

        roundedRect(
            -w / 2,
            -h / 2,
            w,
            h,
            6
        );

        ctx.fill();

        // windows
        ctx.fillStyle = "#1d2a35";

        roundedRect(
            -w * .22,
            -h * .36,
            w * .44,
            h * .72,
            4
        );

        ctx.fill();

        // window reflection
        ctx.fillStyle =
            "rgba(180,220,240,.18)";

        ctx.fillRect(
            -w * .16,
            -h * .30,
            w * .15,
            h * .5
        );

        // wheels
        ctx.fillStyle = "#0d0e10";

        [
            [-w * .32, -h / 2 - 1],
            [w * .32, -h / 2 - 1],
            [-w * .32, h / 2 - 1],
            [w * .32, h / 2 - 1]
        ].forEach(([wx, wy]) => {

            ctx.beginPath();

            ctx.ellipse(
                wx,
                wy,
                5,
                3,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });

        // headlights
        ctx.fillStyle = "#fff1bf";

        ctx.fillRect(
            w / 2 - 5,
            -h / 2 + 5,
            3,
            5
        );

        ctx.fillRect(
            w / 2 - 5,
            h / 2 - 10,
            3,
            5
        );

        // rear lights
        ctx.fillStyle = "#a72f32";

        ctx.fillRect(
            -w / 2 + 2,
            -h / 2 + 5,
            3,
            5
        );

        ctx.fillRect(
            -w / 2 + 2,
            h / 2 - 10,
            3,
            5
        );

        // taxi sign
        if (type.name === "Taxi") {

            ctx.fillStyle = "#e6c75a";

            ctx.fillRect(
                -6,
                -h / 2 - 5,
                12,
                4
            );
        }

        ctx.restore();
    }

    function drawTraffic() {

        state.traffic.forEach(drawVehicle);

        if (state.player.vehicle) {
            drawVehicle({
                x: state.player.x,
                y: state.player.y,
                angle:
                    state.player.facing === "up"
                        ? -Math.PI / 2
                        : state.player.facing === "down"
                            ? Math.PI / 2
                            : state.player.facing === "left"
                                ? Math.PI
                                : 0,
                type: state.player.vehicle
            });
        }
    }

    // ---------------------------------------------------------
    // POLICE DRAWING
    // ---------------------------------------------------------

    function drawPolice() {

        state.police.forEach(p => {

            if (!p.chasing) return;

            const s = worldToScreen(p.x, p.y);

            ctx.save();

            ctx.translate(s.x, s.y);

            // body
            ctx.fillStyle = "#263a5b";

            roundedRect(
                -8,
                -5,
                16,
                18,
                4
            );

            ctx.fill();

            // head
            ctx.fillStyle = "#bd805d";

            ctx.beginPath();

            ctx.arc(
                0,
                -10,
                7,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // cap
            ctx.fillStyle = "#17233a";

            ctx.fillRect(
                -7,
                -16,
                14,
                4
            );

            // badge
            ctx.fillStyle = "#e4c55c";

            ctx.fillRect(
                -2,
                0,
                4,
                4
            );

            ctx.restore();
        });
    }

    // ---------------------------------------------------------
    // COLLECTIBLES
    // ---------------------------------------------------------

    function drawCollectibles() {

        state.collectibles.forEach(c => {

            if (c.taken) return;

            const s = worldToScreen(c.x, c.y);

            if (
                s.x < -30 ||
                s.x > VIEW_W + 30 ||
                s.y < -30 ||
                s.y > VIEW_H + 30
            ) return;

            const pulse =
                1 + Math.sin(
                    performance.now() / 250
                ) * .12;

            ctx.save();

            ctx.translate(s.x, s.y);
            ctx.scale(pulse, pulse);

            if (c.type === "coin") {

                ctx.fillStyle = "#e6bd3c";

                ctx.beginPath();

                ctx.arc(
                    0,
                    0,
                    7,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.fillStyle = "#fff0a2";

                ctx.font = "bold 9px Arial";
                ctx.textAlign = "center";

                ctx.fillText("$", 0, 3);

            } else {

                ctx.fillStyle = "#f2cf57";

                ctx.beginPath();

                for (let i = 0; i < 10; i++) {

                    const a =
                        -Math.PI / 2 +
                        i * Math.PI / 5;

                    const r =
                        i % 2 === 0 ? 8 : 3;

                    const px =
                        Math.cos(a) * r;

                    const py =
                        Math.sin(a) * r;

                    if (i === 0)
                        ctx.moveTo(px, py);
                    else
                        ctx.lineTo(px, py);
                }

                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        });
    }

    // ---------------------------------------------------------
    // INTERACTION POINTS
    // ---------------------------------------------------------

    function drawPoints() {

        Object.values(points).forEach(p => {

            const s = worldToScreen(p.x, p.y);

            if (
                s.x < -60 ||
                s.x > VIEW_W + 60 ||
                s.y < -60 ||
                s.y > VIEW_H + 60
            ) return;

            ctx.fillStyle =
                "rgba(10,15,25,.72)";

            roundedRect(
                s.x - 22,
                s.y - 25,
                44,
                32,
                9
            );

            ctx.fill();

            ctx.font = "20px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                p.icon,
                s.x,
                s.y
            );
        });
    }

    // ---------------------------------------------------------
    // TRAFFIC LIGHTS
    // ---------------------------------------------------------

    function drawTrafficLights() {

        const intersections = [
            [347, 297],
            [967, 297],
            [1587, 297],
            [2207, 297],
            [2827, 297],
            [3447, 297],

            [347, 827],
            [967, 827],
            [1587, 827],
            [2207, 827],
            [2827, 827],
            [3447, 827],

            [347, 1357],
            [967, 1357],
            [1587, 1357],
            [2207, 1357],
            [2827, 1357],
            [3447, 1357]
        ];

        intersections.forEach(([x, y], i) => {

            const s = worldToScreen(x, y);

            if (
                s.x < -30 ||
                s.x > VIEW_W + 30 ||
                s.y < -30 ||
                s.y > VIEW_H + 30
            ) return;

            const cycle =
                Math.floor(
                    (performance.now() / 4000) + i
                ) % 2;

            ctx.fillStyle = "#15181c";

            roundedRect(
                s.x - 5,
                s.y - 20,
                10,
                28,
                4
            );

            ctx.fill();

            ctx.fillStyle =
                cycle === 0
                    ? "#52d36e"
                    : "#d64b4b";

            ctx.beginPath();

            ctx.arc(
                s.x,
                s.y - 10,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });
    }

    // ---------------------------------------------------------
    // MISSION TARGET
    // ---------------------------------------------------------

    function drawMissionTarget() {

        if (!state.activeMission) return;

        const t =
            state.activeMission.target;

        const s =
            worldToScreen(t.x, t.y);

        const pulse =
            18 +
            Math.sin(
                performance.now() / 250
            ) * 4;

        ctx.strokeStyle =
            "rgba(255,210,70,.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle = "#ffd75a";

        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "MISSION",
            s.x,
            s.y - 28
        );
    }

    // ---------------------------------------------------------
    // WEATHER
    // ---------------------------------------------------------

    function drawRain() {

        if (state.weather !== "rain") return;

        ctx.strokeStyle =
            "rgba(150,190,220,.32)";

        ctx.lineWidth = 1;

        for (let i = 0; i < 130; i++) {

            const x = Math.random() * VIEW_W;
            const y = Math.random() * VIEW_H;

            ctx.beginPath();

            ctx.moveTo(x, y);

            ctx.lineTo(
                x - 4,
                y + 14
            );

            ctx.stroke();
        }
    }

    // ---------------------------------------------------------
    // NIGHT OVERLAY
    // ---------------------------------------------------------

    function drawNight() {

        let alpha = 0;

        if (state.dayTime >= 18) {

            alpha =
                Math.min(
                    0.58,
                    (state.dayTime - 18) * .09
                );

        } else if (state.dayTime < 6) {

            alpha = .55;

        } else if (state.dayTime < 8) {

            alpha =
                .55 -
                (state.dayTime - 6) * .27;
        }

        if (alpha <= 0) return;

        ctx.fillStyle =
            `rgba(8,13,30,${alpha})`;

        ctx.fillRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );

        // City glow
        if (alpha > .2) {

            ctx.globalCompositeOperation =
                "lighter";

            state.lamps.forEach(l => {

                const s =
                    worldToScreen(
                        l.x + 7,
                        l.y - 5
                    );

                if (
                    s.x < -50 ||
                    s.x > VIEW_W + 50 ||
                    s.y < -50 ||
                    s.y > VIEW_H + 50
                ) return;

                const glow =
                    ctx.createRadialGradient(
                        s.x,
                        s.y,
                        2,
                        s.x,
                        s.y,
                        35
                    );

                glow.addColorStop(
                    0,
                    "rgba(255,211,96,.28)"
                );

                glow.addColorStop(
                    1,
                    "rgba(255,211,96,0)"
                );

                ctx.fillStyle = glow;

                ctx.beginPath();

                ctx.arc(
                    s.x,
                    s.y,
                    35,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            });

            ctx.globalCompositeOperation =
                "source-over";
        }
    }

    // ---------------------------------------------------------
    // MINIMAP
    // ---------------------------------------------------------

    function drawMinimap() {

        const mw = 170;
        const mh = 115;

        const mx = VIEW_W - mw - 16;
        const my = 75;

        ctx.fillStyle =
            "rgba(5,8,15,.78)";

        roundedRect(
            mx,
            my,
            mw,
            mh,
            10
        );

        ctx.fill();

        ctx.save();

        ctx.beginPath();

        roundedRect(
            mx,
            my,
            mw,
            mh,
            10
        );

        ctx.clip();

        // map ground
        ctx.fillStyle = "#39483e";

        ctx.fillRect(
            mx,
            my,
            mw,
            mh
        );

        // roads
        roads.forEach(r => {

            ctx.fillStyle = "#252a30";

            ctx.fillRect(
                mx + r.x / WORLD_W * mw,
                my + r.y / WORLD_H * mh,
                r.w / WORLD_W * mw,
                r.h / WORLD_H * mh
            );
        });

        // mission
        if (state.activeMission) {

            ctx.fillStyle = "#ffcf4a";

            ctx.beginPath();

            ctx.arc(
                mx +
                    state.activeMission.target.x /
                    WORLD_W * mw,

                my +
                    state.activeMission.target.y /
                    WORLD_H * mh,

                3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        // player
        ctx.fillStyle = "#4dd7ff";

        ctx.beginPath();

        ctx.arc(
            mx +
                state.player.x /
                WORLD_W * mw,

            my +
                state.player.y /
                WORLD_H * mh,

            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

        ctx.strokeStyle =
            "rgba(255,255,255,.15)";

        ctx.stroke();

        ctx.fillStyle = "#fff";

        ctx.font = "bold 9px Arial";
        ctx.textAlign = "left";

        ctx.fillText(
            "CRACKER CITY",
            mx + 8,
            my + 13
        );
    }

    // ---------------------------------------------------------
    // HUD ON CANVAS
    // ---------------------------------------------------------

    function drawGameHUD() {

        ctx.fillStyle =
            "rgba(5,8,15,.72)";

        roundedRect(
            14,
            72,
            190,
            95,
            12
        );

        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";

        ctx.fillText(
            `LEVEL ${state.level}`,
            27,
            94
        );

        // HP
        ctx.fillStyle =
            "rgba(255,255,255,.12)";

        ctx.fillRect(
            27,
            103,
            145,
            8
        );

        ctx.fillStyle = "#df5c5c";

        ctx.fillRect(
            27,
            103,
            145 *
                clamp(
                    state.player.health / 100,
                    0,
                    1
                ),
            8
        );

        // Energy
        ctx.fillStyle =
            "rgba(255,255,255,.12)";

        ctx.fillRect(
            27,
            119,
            145,
            8
        );

        ctx.fillStyle = "#55b5df";

        ctx.fillRect(
            27,
            119,
            145 *
                clamp(
                    state.player.energy / 100,
                    0,
                    1
                ),
            8
        );

        ctx.fillStyle = "#fff";

        ctx.font = "11px Arial";

        ctx.fillText(
            `XP ${state.xp}/${state.level * 250}`,
            27,
            145
        );

        ctx.fillText(
            `${Math.floor(state.dayTime)}:00 • ${state.weather}`,
            27,
            158
        );

        // wanted
        if (state.wanted > 0) {

            ctx.fillStyle = "#ff6969";

            ctx.font = "bold 15px Arial";

            ctx.fillText(
                "WANTED " +
                    "★".repeat(state.wanted),
                225,
                95
            );
        }
    }

    // ---------------------------------------------------------
    // COLLISION
    // ---------------------------------------------------------

    function circleRectCollision(
        cx,
        cy,
        radius,
        r
    ) {

        const nearestX =
            clamp(
                cx,
                r.x,
                r.x + r.w
            );

        const nearestY =
            clamp(
                cy,
                r.y,
                r.y + r.h
            );

        const dx = cx - nearestX;
        const dy = cy - nearestY;

        return dx * dx + dy * dy <
            radius * radius;
    }

    function blocked(x, y) {

        const radius =
            state.player.vehicle
                ? 18
                : 11;

        return buildings.some(b =>
            circleRectCollision(
                x,
                y,
                radius,
                b
            )
        );
    }

    // ---------------------------------------------------------
    // MOVEMENT
    // ---------------------------------------------------------

    function getMovement() {

        let dx = 0;
        let dy = 0;

        if (
            keys.ArrowLeft ||
            keys.a ||
            keys.A
        ) dx -= 1;

        if (
            keys.ArrowRight ||
            keys.d ||
            keys.D
        ) dx += 1;

        if (
            keys.ArrowUp ||
            keys.w ||
            keys.W
        ) dy -= 1;

        if (
            keys.ArrowDown ||
            keys.s ||
            keys.S
        ) dy += 1;

        if (dx !== 0 && dy !== 0) {

            const length =
                Math.hypot(dx, dy);

            dx /= length;
            dy /= length;
        }

        return { dx, dy };
    }

    function movePlayer() {

        if (state.paused) return;

        const { dx, dy } =
            getMovement();

        state.player.moving =
            dx !== 0 || dy !== 0;

        if (!state.player.moving) {

            if (state.player.energy < 100) {

                state.player.energy =
                    Math.min(
                        100,
                        state.player.energy + .035
                    );
            }

            return;
        }

        const running =
            keys.Shift &&
            !state.player.vehicle &&
            state.player.energy > 1;

        let speed =
            state.player.vehicle
                ? state.player.vehicle.speed
                : running
                    ? state.player.runSpeed
                    : state.player.speed;

        if (running) {

            state.player.energy =
                Math.max(
                    0,
                    state.player.energy - .12
                );
        }

        if (state.player.vehicle) {
            speed *= 1.05;
        }

        const nx =
            state.player.x +
            dx * speed;

        const ny =
            state.player.y +
            dy * speed;

        if (!blocked(nx, state.player.y)) {
            state.player.x = nx;
        }

        if (!blocked(state.player.x, ny)) {
            state.player.y = ny;
        }

        state.player.x =
            clamp(
                state.player.x,
                20,
                WORLD_W - 20
            );

        state.player.y =
            clamp(
                state.player.y,
                20,
                WORLD_H - 20
            );

        if (dx < 0)
            state.player.facing = "left";
        else if (dx > 0)
            state.player.facing = "right";
        else if (dy < 0)
            state.player.facing = "up";
        else if (dy > 0)
            state.player.facing = "down";
    }

    // ---------------------------------------------------------
    // TRAFFIC AI
    // ---------------------------------------------------------

    function updateTraffic() {

        state.traffic.forEach(v => {

            const speed = v.speed;

            v.x +=
                Math.cos(v.angle) *
                speed;

            v.y +=
                Math.sin(v.angle) *
                speed;

            if (v.x < -100)
                v.x = WORLD_W + 100;

            if (v.x > WORLD_W + 100)
                v.x = -100;

            if (v.y < -100)
                v.y = WORLD_H + 100;

            if (v.y > WORLD_H + 100)
                v.y = -100;
        });
    }

    // ---------------------------------------------------------
    // NPC AI
    // ---------------------------------------------------------

    function updateNPCs() {

        state.npcs.forEach(n => {

            n.timer -= .016;

            if (n.timer <= 0) {

                n.timer = rand(2, 6);

                n.targetX =
                    clamp(
                        n.x + rand(-180, 180),
                        50,
                        WORLD_W - 50
                    );

                n.targetY =
                    clamp(
                        n.y + rand(-180, 180),
                        50,
                        WORLD_H - 50
                    );
            }

            const dx =
                n.targetX - n.x;

            const dy =
                n.targetY - n.y;

            const d =
                Math.hypot(dx, dy);

            if (d > 5) {

                n.x +=
                    dx / d *
                    n.speed;

                n.y +=
                    dy / d *
                    n.speed;

                n.state = "walking";
            } else {

                n.state = "idle";
            }

            if (isOnRoad(n.x, n.y)) {

                n.x -= dx / Math.max(d, 1) * 0.4;
                n.y -= dy / Math.max(d, 1) * 0.4;
            }
        });
    }

    // ---------------------------------------------------------
    // POLICE AI
    // ---------------------------------------------------------

    function updatePolice() {

        state.police.forEach(p => {

            const d =
                Math.hypot(
                    state.player.x - p.x,
                    state.player.y - p.y
                );

            p.chasing =
                state.wanted > 0 &&
                d < 650;

            if (p.chasing) {

                p.targetX =
                    state.player.x;

                p.targetY =
                    state.player.y;

                const dx =
                    p.targetX - p.x;

                const dy =
                    p.targetY - p.y;

                const len =
                    Math.hypot(dx, dy);

                p.x +=
                    dx / Math.max(len, 1) *
                    p.speed;

                p.y +=
                    dy / Math.max(len, 1) *
                    p.speed;

                if (d < 35) {

                    state.player.health =
                        Math.max(
                            0,
                            state.player.health - .12
                        );

                    state.health =
                        state.player.health;

                    if (
                        state.player.health <= 0
                    ) {

                        state.player.health = 60;

                        state.player.x = 1120;
                        state.player.y = 360;

                        state.wanted = 0;

                        toast(
                            "Police caught you. You were returned to the station."
                        );
                    }
                }
            }
        });

        if (state.wanted > 0) {

            state.wantedTimer += .016;

            if (
                state.wantedTimer > 12
            ) {

                const nearest =
                    Math.min(
                        ...state.police.map(
                            p =>
                                Math.hypot(
                                    p.x - state.player.x,
                                    p.y - state.player.y
                                )
                        )
                    );

                if (nearest > 500) {

                    state.wanted =
                        Math.max(
                            0,
                            state.wanted - 1
                        );

                    state.wantedTimer = 0;
                }
            }
        }
    }

    // ---------------------------------------------------------
    // COLLECTIBLES UPDATE
    // ---------------------------------------------------------

    function updateCollectibles() {

        state.collectibles.forEach(c => {

            if (c.taken) return;

            const d =
                Math.hypot(
                    state.player.x - c.x,
                    state.player.y - c.y
                );

            if (d < 25) {

                c.taken = true;

                if (c.type === "coin") {

                    state.cash += 15;

                    addXP(8);

                    toast("+$15");
                } else {

                    state.rep += 2;

                    addXP(12);

                    toast("+2 Reputation");
                }

                checkAchievements();

                updateHUD();
            }
        });
    }

    // ---------------------------------------------------------
    // MISSION UPDATE
    // ---------------------------------------------------------

    function updateMission() {

        if (!state.activeMission)
            return;

        const target =
            state.activeMission.target;

        const d =
            Math.hypot(
                state.player.x - target.x,
                state.player.y - target.y
            );

        if (d < 45) {

            completeMission();
        }
    }

    // ---------------------------------------------------------
    // VEHICLE ENTER / EXIT
    // ---------------------------------------------------------

    function nearestTrafficVehicle() {

        let nearest = null;
        let best = 55;

        state.traffic.forEach(v => {

            const d =
                Math.hypot(
                    state.player.x - v.x,
                    state.player.y - v.y
                );

            if (d < best) {

                best = d;
                nearest = v;
            }
        });

        return nearest;
    }

    function enterVehicle() {

        if (state.player.vehicle) {

            exitVehicle();

            return;
        }

        const v =
            nearestTrafficVehicle();

        if (!v) {

            toast("No car nearby.");

            return;
        }

        state.player.vehicle = {
            ...v.type
        };

        state.cash =
            Math.max(
                0,
                state.cash
            );

        v.x = -100;
        v.y = -100;

        toast(
            `${state.player.vehicle.name} entered`
        );

        checkAchievements();
    }

    function exitVehicle() {

        if (!state.player.vehicle)
            return;

        state.player.vehicle = null;

        toast("You left the vehicle.");
    }

    // ---------------------------------------------------------
    // WANTED
    // ---------------------------------------------------------

    function addWanted(amount = 1) {

        state.wanted =
            clamp(
                state.wanted + amount,
                0,
                5
            );

        state.wantedTimer = 0;

        toast(
            `Wanted level ${state.wanted}`
        );
    }

    // ---------------------------------------------------------
    // ACTION SYSTEM
    // ---------------------------------------------------------

    function nearestPoint() {

        let closest = null;
        let best = 65;

        Object.entries(points).forEach(
            ([id, p]) => {

                const d =
                    Math.hypot(
                        state.player.x - p.x,
                        state.player.y - p.y
                    );

                if (d < best) {

                    best = d;

                    closest = {
                        id,
                        ...p
                    };
                }
            }
        );

        return closest;
    }

    function action() {

        if (state.panelOpen) return;

        if (state.player.vehicle) {

            exitVehicle();

            return;
        }

        const p = nearestPoint();

        if (p) {

            interactPoint(p.id);

            return;
        }

        const npc =
            state.npcs.find(n =>
                Math.hypot(
                    n.x - state.player.x,
                    n.y - state.player.y
                ) < 48
            );

        if (npc) {

            openNPC(npc);

            return;
        }

        const apartment =
            state.apartments.find(a =>
                Math.hypot(
                    a.x - state.player.x,
                    a.y - state.player.y
                ) < 60
            );

        if (apartment) {

            openApartment(apartment);

            return;
        }

        enterVehicle();
    }

    // ---------------------------------------------------------
    // INTERACTION POINTS
    // ---------------------------------------------------------

    function interactPoint(id) {

        switch (id) {

            case "mission":
                openMissionOffice();
                break;

            case "garage":
                openGarage();
                break;

            case "property":
                openPropertyOffice();
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

            case "food":
                openFood();
                break;

            case "hospital":
                openHospital();
                break;

            case "police":
                openPolice();
                break;

            case "workshop":
                openWorkshop();
                break;

            case "market":
                openMarket();
                break;

            case "train":
                openTrainStation();
                break;

            case "apartment":
                openApartment(
                    state.apartments[0]
                );
                break;
        }
    }

    // ---------------------------------------------------------
    // MISSION OFFICE
    // ---------------------------------------------------------

    function openMissionOffice() {

        const available =
            missions.filter(
                m =>
                    !state.missionsCompleted.includes(
                        m.id
                    )
            );

        const buttons = [];

        if (state.activeMission) {

            buttons.push({
                label: "Cancel Mission",
                action: cancelMission
            });

        } else {

            available
                .slice(0, 4)
                .forEach(m => {

                    buttons.push({
                        label:
                            `${m.name} • $${m.reward}`,
                        action: () =>
                            startMission(m)
                    });
                });
        }

        buttons.push({
            label: "Close",
            action: closePanel
        });

        openPanel(
            "🎯 Mission Office",
            state.activeMission
                ? "You already have an active mission."
                : "Choose a job around Cracker City.",
            buttons
        );
    }

    // ---------------------------------------------------------
    // GARAGE
    // ---------------------------------------------------------

    function openGarage() {

        const buttons = [];

        vehicleTypes.forEach(v => {

            buttons.push({
                label:
                    `${v.name} — $${v.price}`,
                action: () => {

                    if (!spend(v.price))
                        return;

                    state.carsOwned++;

                    state.player.vehicle = {
                        ...v
                    };

                    closePanel();

                    toast(
                        `${v.name} purchased!`
                    );

                    checkAchievements();
                }
            });
        });

        buttons.push({
            label: "Close",
            action: closePanel
        });

        openPanel(
            "🚗 City Garage",
            "Buy a vehicle. Your purchase lasts only until refresh.",
            buttons
        );
    }

    // ---------------------------------------------------------
    // PROPERTY
    // ---------------------------------------------------------

    function openPropertyOffice() {

        const properties = [
            {
                name: "Starter House",
                price: 650
            },
            {
                name: "Downtown Flat",
                price: 1000
            },
            {
                name: "City Apartment",
                price: 1500
            },
            {
                name: "Modern House",
                price: 2200
            },
            {
                name: "Large Villa",
                price: 3200
            },
            {
                name: "Harbor Residence",
                price: 4500
            },
            {
                name: "City Penthouse",
                price: 6000
            }
        ];

        const buttons =
            properties.map(p => ({
                label:
                    `${p.name} — $${p.price}`,

                action: () => {

                    if (!spend(p.price))
                        return;

                    state.property++;

                    closePanel();

                    toast(
                        `${p.name} purchased!`
                    );

                    checkAchievements();
                    updateHUD();
                }
            }));

        buttons.push({
            label: "Close",
            action: closePanel
        });

        openPanel(
            "🏠 Property Office",
            "Buy property around the city.",
            buttons
        );
    }

    // ---------------------------------------------------------
    // SHOP
    // ---------------------------------------------------------

    function openShop() {

        const buttons = [

            {
                label: "Food — $25",

                action: () => {

                    if (!spend(25))
                        return;

                    state.inventory.food++;

                    state.shopVisits++;

                    toast(
                        "Food added to inventory."
                    );
                }
            },

            {
                label: "3 Food — $60",

                action: () => {

                    if (!spend(60))
                        return;

                    state.inventory.food += 3;

                    state.shopVisits++;

                    toast(
                        "3 food added."
                    );
                }
            },

            {
                label: "Medicine — $45",

                action: () => {

                    if (!spend(45))
                        return;

                    state.inventory.medicine++;

                    toast(
                        "Medicine added."
                    );
                }
            },

            {
                label: "Outfit — $80",

                action: () => {

                    if (!spend(80))
                        return;

                    customizeCharacter();

                    state.shopVisits++;

                    toast(
                        "New outfit selected."
                    );
                }
            },

            {
                label: "Close",
                action: closePanel
            }
        ];

        openPanel(
            "🛒 City Shop",
            "Buy supplies and customize your character.",
            buttons
        );
    }

    // ---------------------------------------------------------
    // CHARACTER CUSTOMIZATION
    // ---------------------------------------------------------

    function customizeCharacter() {

        const skins = [
            "#7b4f32",
            "#915f40",
            "#a96f4d",
            "#bd805d",
            "#c88d68",
            "#d39b76"
        ];

        const shirts = [
            "#334e68",
            "#546a7b",
            "#7b3f61",
            "#486b4f",
            "#725d3b",
            "#4e5a75",
            "#803f35",
            "#3e6478"
        ];

        state.player.skin =
            skins[
                randInt(0, skins.length - 1)
            ];

        state.player.shirt =
            shirts[
                randInt(0, shirts.length - 1)
            ];
    }

    // ---------------------------------------------------------
    // CLUB
    // ---------------------------------------------------------

    function openClub() {

        openPanel(
            "🎵 Neon Club",
            "Take a break and socialize with the city crowd.",
            [
                {
                    label: "Socialize — $20",

                    action: () => {

                        if (!spend(20))
                            return;

                        state.rep += 3;

                        addXP(20);

                        closePanel();

                        toast(
                            "+3 Reputation"
                        );
                    }
                },

                {
                    label: "Dance Challenge",

                    action: () => {

                        const success =
                            Math.random() > .35;

                        if (success) {

                            state.rep += 5;

                            state.cash += 50;

                            addXP(30);

                            toast(
                                "Challenge won! +$50"
                            );

                        } else {

                            toast(
                                "You missed the challenge."
                            );
                        }
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // BANK
    // ---------------------------------------------------------

    function openBank() {

        openPanel(
            "🏦 City Bank",
            `Cash: $${state.cash} • Bank: $${state.bank}`,
            [
                {
                    label: "Deposit $100",

                    action: () => {

                        if (state.cash < 100) {

                            toast(
                                "Not enough cash."
                            );

                            return;
                        }

                        state.cash -= 100;
                        state.bank += 100;

                        updateHUD();

                        openBank();
                    }
                },

                {
                    label: "Withdraw $100",

                    action: () => {

                        if (state.bank < 100) {

                            toast(
                                "Not enough bank balance."
                            );

                            return;
                        }

                        state.bank -= 100;
                        state.cash += 100;

                        updateHUD();

                        openBank();
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // AIRPORT
    // ---------------------------------------------------------

    function openAirport() {

        openPanel(
            "✈️ Cracker City Airport",
            "Travel to Downtown for $50.",
            [
                {
                    label: "Fly to Downtown — $50",

                    action: () => {

                        if (!spend(50))
                            return;

                        state.player.x = 430;
                        state.player.y = 315;

                        closePanel();

                        toast(
                            "You arrived in Downtown."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // FOOD
    // ---------------------------------------------------------

    function openFood() {

        openPanel(
            "🍔 Food Corner",
            "A quick meal restores energy and health.",
            [
                {
                    label: "Meal — $20",

                    action: () => {

                        if (!spend(20))
                            return;

                        state.player.health =
                            Math.min(
                                100,
                                state.player.health + 20
                            );

                        state.player.energy =
                            Math.min(
                                100,
                                state.player.energy + 35
                            );

                        closePanel();

                        toast(
                            "You feel refreshed."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // HOSPITAL
    // ---------------------------------------------------------

    function openHospital() {

        openPanel(
            "🏥 City Hospital",
            "Recover your health.",
            [
                {
                    label: "Full Treatment — $40",

                    action: () => {

                        if (!spend(40))
                            return;

                        state.player.health = 100;

                        closePanel();

                        toast(
                            "Health fully restored."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // POLICE
    // ---------------------------------------------------------

    function openPolice() {

        openPanel(
            "👮 Police Station",
            `Wanted Level: ${state.wanted}`,
            [
                {
                    label: "Pay Fine — $100",

                    action: () => {

                        if (
                            state.wanted <= 0
                        ) {

                            toast(
                                "You have no wanted level."
                            );

                            return;
                        }

                        if (!spend(100))
                            return;

                        state.wanted = 0;

                        closePanel();

                        toast(
                            "Wanted level cleared."
                        );
                    }
                },

                {
                    label: "Check Record",

                    action: () => {

                        openPanel(
                            "Police Record",
                            `Missions completed: ${state.missionsCompleted.length}\nReputation: ${state.rep}\nWanted: ${state.wanted}`,
                            [
                                {
                                    label: "Close",
                                    action: closePanel
                                }
                            ]
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // WORKSHOP
    // ---------------------------------------------------------

    function openWorkshop() {

        if (!state.player.vehicle) {

            openPanel(
                "🔧 Workshop",
                "Bring a vehicle here first.",
                [
                    {
                        label: "Close",
                        action: closePanel
                    }
                ]
            );

            return;
        }

        openPanel(
            "🔧 Vehicle Workshop",
            `${state.player.vehicle.name} • Speed ${state.player.vehicle.speed.toFixed(1)}`,
            [
                {
                    label: "Engine Upgrade — $250",

                    action: () => {

                        if (!spend(250))
                            return;

                        state.player.vehicle.speed += .7;

                        closePanel();

                        toast(
                            "Engine upgraded."
                        );
                    }
                },

                {
                    label: "Repair — $80",

                    action: () => {

                        if (!spend(80))
                            return;

                        closePanel();

                        toast(
                            "Vehicle repaired."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // MARKET
    // ---------------------------------------------------------

    function openMarket() {

        openPanel(
            "🏪 Night Market",
            "Special city supplies.",
            [
                {
                    label: "Food — $18",

                    action: () => {

                        if (!spend(18))
                            return;

                        state.inventory.food++;

                        toast(
                            "Food purchased."
                        );
                    }
                },

                {
                    label: "Parts — $70",

                    action: () => {

                        if (!spend(70))
                            return;

                        state.inventory.parts++;

                        toast(
                            "Vehicle part purchased."
                        );
                    }
                },

                {
                    label: "Reputation Token — $100",

                    action: () => {

                        if (!spend(100))
                            return;

                        state.rep += 5;

                        addXP(20);

                        toast(
                            "+5 Reputation"
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // TRAIN
    // ---------------------------------------------------------

    function openTrainStation() {

        openPanel(
            "🚆 Central Station",
            "Take the city train to another district.",
            [
                {
                    label: "Downtown — $25",

                    action: () => {

                        if (!spend(25))
                            return;

                        state.player.x = 430;
                        state.player.y = 315;

                        closePanel();

                        toast(
                            "Train arrived Downtown."
                        );
                    }
                },

                {
                    label: "Harbor — $25",

                    action: () => {

                        if (!spend(25))
                            return;

                        state.player.x = 3100;
                        state.player.y = 1650;

                        closePanel();

                        toast(
                            "Train arrived at Harbor."
                        );
                    }
                },

                {
                    label: "Airport — $25",

                    action: () => {

                        if (!spend(25))
                            return;

                        state.player.x = 1660;
                        state.player.y = 2210;

                        closePanel();

                        toast(
                            "Train arrived at Airport."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // APARTMENT INTERIOR
    // ---------------------------------------------------------

    function openApartment(apartment) {

        openPanel(
            `🏢 ${apartment.name}`,
            apartment.owned
                ? "Welcome home. You can rest here."
                : `Purchase this apartment for $${apartment.price}.`,
            [
                apartment.owned
                    ? {
                        label: "Rest",

                        action: () => {

                            state.player.health = 100;
                            state.player.energy = 100;

                            closePanel();

                            toast(
                                "You rested at home."
                            );
                        }
                    }
                    : {
                        label:
                            `Buy — $${apartment.price}`,

                        action: () => {

                            if (
                                !spend(
                                    apartment.price
                                )
                            ) return;

                            apartment.owned = true;

                            state.property++;

                            closePanel();

                            toast(
                                `${apartment.name} purchased!`
                            );

                            updateHUD();

                            checkAchievements();
                        }
                    },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // NPC INTERACTION
    // ---------------------------------------------------------

    function openNPC(npc) {

        openPanel(
            npc.name,
            "A city resident is standing nearby.",
            [
                {
                    label: "Talk",

                    action: () => {

                        state.rep += 1;

                        addXP(8);

                        closePanel();

                        toast(
                            `${npc.name}: Nice to meet you.`
                        );
                    }
                },

                {
                    label: "Ask for Help — $20",

                    action: () => {

                        if (!spend(20))
                            return;

                        state.rep += 2;

                        addXP(12);

                        closePanel();

                        toast(
                            `${npc.name} helped you.`
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // INVENTORY
    // ---------------------------------------------------------

    function openInventory() {

        openPanel(
            "🎒 Inventory",
            `Food: ${state.inventory.food}
Packages: ${state.inventory.package}
Keys: ${state.inventory.keys}
Medicine: ${state.inventory.medicine}
Parts: ${state.inventory.parts}`,
            [
                {
                    label: "Eat Food",

                    action: () => {

                        if (
                            state.inventory.food <= 0
                        ) {

                            toast(
                                "No food."
                            );

                            return;
                        }

                        state.inventory.food--;

                        state.player.energy =
                            Math.min(
                                100,
                                state.player.energy + 30
                            );

                        state.player.health =
                            Math.min(
                                100,
                                state.player.health + 10
                            );

                        closePanel();

                        toast(
                            "Food used."
                        );
                    }
                },

                {
                    label: "Use Medicine",

                    action: () => {

                        if (
                            state.inventory.medicine <= 0
                        ) {

                            toast(
                                "No medicine."
                            );

                            return;
                        }

                        state.inventory.medicine--;

                        state.player.health =
                            Math.min(
                                100,
                                state.player.health + 45
                            );

                        closePanel();

                        toast(
                            "Medicine used."
                        );
                    }
                },

                {
                    label: "Close",
                    action: closePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // ACHIEVEMENTS
    // ---------------------------------------------------------

    const achievementList = [
        {
            id: "cash",
            name: "First Cash",
            reward: 50,
            test: () =>
                state.cash >= 550
        },

        {
            id: "hustler",
            name: "City Hustler",
            reward: 100,
            test: () =>
                state.missionsCompleted.length >= 2
        },

        {
            id: "known",
            name: "Known Around Town",
            reward: 150,
            test: () =>
                state.rep >= 20
        },

        {
            id: "legend",
            name: "City Legend",
            reward: 500,
            test: () =>
                state.rep >= 80
        },

        {
            id: "busy",
            name: "Busy Citizen",
            reward: 100,
            test: () =>
                state.missionsCompleted.length >= 5
        },

        {
            id: "master",
            name: "Mission Master",
            reward: 250,
            test: () =>
                state.missionsCompleted.length >= 8
        },

        {
            id: "property",
            name: "Property Owner",
            reward: 200,
            test: () =>
                state.property >= 1
        },

        {
            id: "driver",
            name: "Driver",
            reward: 100,
            test: () =>
                state.carsOwned >= 1
        },

        {
            id: "star",
            name: "Rising Star",
            reward: 150,
            test: () =>
                state.xp >= 200
        },

        {
            id: "collector",
            name: "Collector",
            reward: 200,
            test: () =>
                state.collectibles.filter(
                    c => c.taken
                ).length >= 10
        }
    ];

    function checkAchievements() {

        achievementList.forEach(a => {

            if (
                state.achievements.includes(
                    a.id
                )
            ) return;

            if (!a.test()) return;

            state.achievements.push(a.id);

            state.cash += a.reward;

            toast(
                `🏆 ${a.name}! +$${a.reward}`
            );
        });

        updateHUD();
    }

    function openAchievements() {

        const unlocked =
            state.achievements.length;

        const text =
            `Unlocked: ${unlocked}/${achievementList.length}`;

        const buttons =
            achievementList
                .slice(0, 8)
                .map(a => ({
                    label:
                        `${state.achievements.includes(a.id) ? "✓" : "○"} ${a.name}`,

                    action: () => {}
                }));

        buttons.push({
            label: "Close",
            action: closePanel
        });

        openPanel(
            "🏆 Achievements",
            text,
            buttons
        );
    }

    // ---------------------------------------------------------
    // DAY / NIGHT / WEATHER
    // ---------------------------------------------------------

    function updateWorldTime() {

        state.dayTime += .0025;

        if (state.dayTime >= 24)
            state.dayTime = 0;

        if (
            Math.random() < .00005
        ) {

            const weatherTypes = [
                "clear",
                "clear",
                "clear",
                "cloudy",
                "rain"
            ];

            state.weather =
                weatherTypes[
                    randInt(
                        0,
                        weatherTypes.length - 1
                    )
                ];
        }
    }

    // ---------------------------------------------------------
    // CAMERA
    // ---------------------------------------------------------

    function updateCamera() {

        const targetX =
            state.player.x -
            VIEW_W / 2;

        const targetY =
            state.player.y -
            VIEW_H / 2;

        state.camera.x =
            lerp(
                state.camera.x,
                targetX,
                .09
            );

        state.camera.y =
            lerp(
                state.camera.y,
                targetY,
                .09
            );

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

    // ---------------------------------------------------------
    // INTERACTION HINT
    // ---------------------------------------------------------

    function drawInteractionHint() {

        if (state.panelOpen) return;

        const p = nearestPoint();

        if (!p) return;

        ctx.fillStyle =
            "rgba(7,10,18,.82)";

        roundedRect(
            VIEW_W / 2 - 150,
            VIEW_H - 55,
            300,
            36,
            12
        );

        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.font = "bold 13px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            `E / ACTION • ${p.name}`,
            VIEW_W / 2,
            VIEW_H - 32
        );
    }

    // ---------------------------------------------------------
    // FULL DRAW
    // ---------------------------------------------------------

    function draw() {

        ctx.clearRect(
            0,
            0,
            VIEW_W,
            VIEW_H
        );

        drawGround();

        drawRoads();

        drawLandmarks();

        drawBuildings();

        drawTrees();

        drawLamps();

        drawTrafficLights();

        drawCollectibles();

        drawTraffic();

        drawNPCs();

        drawPolice();

        drawPoints();

        drawMissionTarget();

        drawPlayer();

        drawNight();

        drawRain();

        drawGameHUD();

        drawMinimap();

        drawInteractionHint();
    }

    // ---------------------------------------------------------
    // KEYBOARD
    // ---------------------------------------------------------

    window.addEventListener(
        "keydown",
        e => {

            keys[e.key] = true;

            if (
                [
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    " "
                ].includes(e.key)
            ) {
                e.preventDefault();
            }

            if (e.key === "Escape") {

                if (state.panelOpen)
                    closePanel();
            }

            if (
                e.key === "e" ||
                e.key === "E"
            ) {
                action();
            }

            if (
                e.key === "q" ||
                e.key === "Q"
            ) {
                exitVehicle();
            }

            if (
                e.key === "f" ||
                e.key === "F"
            ) {

                if (
                    state.inventory.food > 0
                ) {

                    state.inventory.food--;

                    state.player.energy =
                        Math.min(
                            100,
                            state.player.energy + 30
                        );

                    state.player.health =
                        Math.min(
                            100,
                            state.player.health + 10
                        );

                    toast(
                        "Food used."
                    );
                }
            }

            if (
                e.key === "i" ||
                e.key === "I"
            ) {
                openInventory();
            }

            if (
                e.key === "m" ||
                e.key === "M" ||
                e.key === "1"
            ) {
                interactPoint("mission");
            }

            if (e.key === "2") {
                interactPoint("garage");
            }

            if (e.key === "3") {
                interactPoint("shop");
            }

            if (
                e.key === "p" ||
                e.key === "P" ||
                e.key === "4"
            ) {
                interactPoint("property");
            }

            if (
                e.key === "b" ||
                e.key === "B"
            ) {
                interactPoint("bank");
            }

            if (
                e.key === "u" ||
                e.key === "U"
            ) {
                openAchievements();
            }
        }
    );

    window.addEventListener(
        "keyup",
        e => {
            keys[e.key] = false;
        }
    );

    // ---------------------------------------------------------
    // MOBILE CONTROLS
    // ---------------------------------------------------------

    document
        .querySelectorAll(
            "[data-key]"
        )
        .forEach(button => {

            const key =
                button.dataset.key;

            const start = e => {

                e.preventDefault();

                keys[key] = true;
            };

            const stop = e => {

                e.preventDefault();

                keys[key] = false;
            };

            button.addEventListener(
                "pointerdown",
                start
            );

            button.addEventListener(
                "pointerup",
                stop
            );

            button.addEventListener(
                "pointercancel",
                stop
            );

            button.addEventListener(
                "pointerleave",
                stop
            );
        });

    const actionBtn =
        document.getElementById("action");

    if (actionBtn) {

        actionBtn.addEventListener(
            "click",
            action
        );
    }

    // ---------------------------------------------------------
    // TELEGRAM WEB APP
    // ---------------------------------------------------------

    if (
        window.Telegram &&
        window.Telegram.WebApp
    ) {

        const tg =
            window.Telegram.WebApp;

        try {

            tg.ready();
            tg.expand();

            if (
                typeof tg.disableVerticalSwipes ===
                "function"
            ) {
                tg.disableVerticalSwipes();
            }

        } catch (err) {

            console.warn(
                "Telegram WebApp init failed",
                err
            );
        }
    }

    // ---------------------------------------------------------
    // VISIBILITY
    // ---------------------------------------------------------

    document.addEventListener(
        "visibilitychange",
        () => {

            state.paused =
                document.hidden ||
                state.panelOpen;
        }
    );

    // ---------------------------------------------------------
    // RESIZE
    // ---------------------------------------------------------

    function resizeCanvas() {

        const ratio =
            Math.min(
                window.innerWidth / VIEW_W,
                window.innerHeight / VIEW_H
            );

        canvas.style.width =
            `${Math.floor(VIEW_W * ratio)}px`;

        canvas.style.height =
            `${Math.floor(VIEW_H * ratio)}px`;
    }

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();

    // ---------------------------------------------------------
    // SAFE START
    // ---------------------------------------------------------

    function safeStart() {

        state.player.x = 430;
        state.player.y = 315;

        state.camera.x = 0;
        state.camera.y = 0;

        state.player.health = 100;
        state.player.energy = 100;

        state.wanted = 0;

        updateHUD();
        updateMissionText();

        toast(
            "Welcome to Cracker City V6!"
        );
    }

    // ---------------------------------------------------------
    // GAME LOOP
    // ---------------------------------------------------------

    let lastTime =
        performance.now();

    function loop(now) {

        const delta =
            Math.min(
                0.05,
                (now - lastTime) / 1000
            );

        lastTime = now;

        if (!state.paused) {

            movePlayer();

            updateTraffic();

            updateNPCs();

            updatePolice();

            updateCollectibles();

            updateMission();

            updateWorldTime();

            updateCamera();

            checkAchievements();
        }

        draw();

        requestAnimationFrame(loop);
    }

    safeStart();

    requestAnimationFrame(loop);

})();
