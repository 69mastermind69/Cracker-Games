// webapp/city.js
(() => {
    "use strict";

    // =========================================================
    // CRACKER CITY V3
    // Original 2D Open-World Mini RPG
    // No database / No permanent save
    // =========================================================

    const canvas = document.getElementById("cityCanvas");

    if (!canvas) {
        console.error("Cracker City: #cityCanvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    // ---------------------------------------------------------
    // Telegram Mini App
    // ---------------------------------------------------------

    const tg = window.Telegram?.WebApp;

    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.("#090b16");
        tg.setBackgroundColor?.("#090b16");
    }

    // ---------------------------------------------------------
    // HUD
    // ---------------------------------------------------------

    const cashEl = document.getElementById("cash");
    const repEl = document.getElementById("rep");
    const propertyEl = document.getElementById("property");
    const missionEl = document.getElementById("mission");

    const panel = document.getElementById("panel");
    const panelTitle = document.getElementById("panelTitle");
    const panelText = document.getElementById("panelText");
    const panelButtons = document.getElementById("panelButtons");

    const actionBtn = document.getElementById("action");

    // ---------------------------------------------------------
    // WORLD
    // ---------------------------------------------------------

    const WORLD = {
        width: 3600,
        height: 2400
    };

    const VIEW = {
        width: canvas.width,
        height: canvas.height
    };

    // ---------------------------------------------------------
    // PLAYER
    // ---------------------------------------------------------

    const player = {
        x: 1780,
        y: 1190,

        radius: 15,

        walkSpeed: 3.2,
        runSpeed: 5.2,

        direction: "down",

        health: 100,
        energy: 100,

        inVehicle: false,
        vehicleId: null
    };

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

        mission: null,
        missionProgress: 0,

        completedMissions: 0,

        carsOwned: 0,

        dayTime: 8,

        weather: "clear",

        shopVisits: 0,

        gameStarted: true
    };

    // ---------------------------------------------------------
    // CAMERA
    // ---------------------------------------------------------

    const camera = {
        x: 0,
        y: 0
    };

    // ---------------------------------------------------------
    // INPUT
    // ---------------------------------------------------------

    const keys = {};

    let lastTime = performance.now();

    // ---------------------------------------------------------
    // DISTRICTS
    // ---------------------------------------------------------

    const districts = [
        {
            name: "Downtown",
            x: 120,
            y: 100,
            w: 1050,
            h: 650
        },

        {
            name: "Neon District",
            x: 1220,
            y: 100,
            w: 1050,
            h: 650
        },

        {
            name: "Old Town",
            x: 2380,
            y: 100,
            w: 1050,
            h: 650
        },

        {
            name: "Suburbs",
            x: 120,
            y: 820,
            w: 1050,
            h: 620
        },

        {
            name: "Central City",
            x: 1220,
            y: 820,
            w: 1050,
            h: 620
        },

        {
            name: "Industrial Zone",
            x: 2380,
            y: 820,
            w: 1050,
            h: 620
        },

        {
            name: "Harbor",
            x: 120,
            y: 1510,
            w: 1050,
            h: 760
        },

        {
            name: "Beach",
            x: 1220,
            y: 1510,
            w: 1050,
            h: 760
        },

        {
            name: "Airport",
            x: 2380,
            y: 1510,
            w: 1050,
            h: 760
        }
    ];

    // ---------------------------------------------------------
    // ROADS
    // ---------------------------------------------------------

    const roads = [
        // horizontal
        { x: 0, y: 720, w: WORLD.width, h: 100 },
        { x: 0, y: 1430, w: WORLD.width, h: 100 },

        // vertical
        { x: 1120, y: 0, w: 100, h: WORLD.height },
        { x: 2270, y: 0, w: 100, h: WORLD.height }
    ];

    // Extra smaller roads
    for (let y = 250; y < WORLD.height; y += 430) {
        roads.push({
            x: 0,
            y,
            w: WORLD.width,
            h: 52
        });
    }

    for (let x = 300; x < WORLD.width; x += 560) {
        roads.push({
            x,
            y: 0,
            w: 52,
            h: WORLD.height
        });
    }

    // ---------------------------------------------------------
    // BUILDINGS
    // ---------------------------------------------------------

    const buildings = [];

    function addBuilding(x, y, w, h, name, type = "building") {
        buildings.push({
            x,
            y,
            w,
            h,
            name,
            type
        });
    }

    // Downtown
    addBuilding(150, 150, 260, 220, "City Apartments");
    addBuilding(470, 140, 280, 260, "Grand Hotel");
    addBuilding(800, 160, 240, 220, "City Mall");

    addBuilding(160, 430, 260, 220, "Downtown Office");
    addBuilding(480, 450, 250, 190, "City Bank");
    addBuilding(800, 450, 240, 200, "Arcade Center");

    // Neon District
    addBuilding(1280, 150, 270, 230, "Neon Club");
    addBuilding(1600, 130, 290, 250, "Luxury Hotel");
    addBuilding(1950, 150, 250, 230, "Music Hall");

    addBuilding(1280, 450, 260, 200, "Night Market");
    addBuilding(1600, 450, 300, 200, "Fashion Store");
    addBuilding(1960, 450, 240, 200, "Cinema");

    // Old Town
    addBuilding(2450, 150, 280, 230, "Old Apartments");
    addBuilding(2780, 130, 270, 250, "Museum");
    addBuilding(3100, 160, 260, 220, "Town Hall");

    addBuilding(2450, 450, 280, 190, "Cafe");
    addBuilding(2780, 450, 260, 200, "Book Shop");
    addBuilding(3100, 450, 260, 190, "Old Hotel");

    // Suburbs
    addBuilding(150, 880, 250, 190, "Family House");
    addBuilding(470, 860, 270, 200, "Green Apartments");
    addBuilding(820, 900, 240, 180, "Corner Store");

    addBuilding(150, 1160, 280, 180, "Suburban Home");
    addBuilding(500, 1150, 250, 190, "Community Center");
    addBuilding(820, 1160, 250, 180, "Mini Market");

    // Central
    addBuilding(1280, 870, 270, 220, "Central Hotel");
    addBuilding(1600, 860, 290, 230, "Business Tower");
    addBuilding(1950, 880, 250, 200, "Restaurant");

    addBuilding(1280, 1160, 260, 190, "Police Station");
    addBuilding(1600, 1150, 300, 200, "Hospital");
    addBuilding(1960, 1160, 240, 190, "Sports Center");

    // Industrial
    addBuilding(2450, 880, 300, 210, "Factory A");
    addBuilding(2800, 860, 300, 240, "Factory B");
    addBuilding(3150, 880, 210, 200, "Warehouse");

    addBuilding(2450, 1160, 300, 190, "Auto Workshop");
    addBuilding(2800, 1160, 280, 200, "Storage Depot");
    addBuilding(3130, 1160, 230, 190, "Power Station");

    // Harbor
    addBuilding(150, 1580, 280, 220, "Harbor Office");
    addBuilding(480, 1600, 300, 200, "Cargo Warehouse");
    addBuilding(830, 1580, 250, 220, "Fish Market");

    addBuilding(150, 1880, 300, 230, "Port Hotel");
    addBuilding(500, 1880, 280, 220, "Boat Club");
    addBuilding(820, 1880, 260, 230, "Harbor Cafe");

    // Beach
    addBuilding(1280, 1580, 270, 210, "Beach Hotel");
    addBuilding(1600, 1580, 300, 210, "Sunset Resort");
    addBuilding(1960, 1580, 230, 200, "Beach Shop");

    addBuilding(1280, 1880, 250, 190, "Surf Club");
    addBuilding(1600, 1870, 280, 210, "Beach Restaurant");
    addBuilding(1940, 1880, 250, 190, "Ice Cream Shop");

    // Airport
    addBuilding(2450, 1580, 320, 220, "Airport Terminal");
    addBuilding(2830, 1580, 250, 200, "Airport Hotel");
    addBuilding(3140, 1580, 220, 200, "Travel Office");

    addBuilding(2450, 1880, 280, 200, "Hangar");
    addBuilding(2800, 1880, 280, 200, "Airport Garage");
    addBuilding(3150, 1880, 210, 200, "Control Center");

    // ---------------------------------------------------------
    // LANDMARKS
    // ---------------------------------------------------------

    const landmarks = [
        {
            x: 600,
            y: 760,
            name: "Downtown Plaza",
            icon: "🏙️"
        },

        {
            x: 1750,
            y: 760,
            name: "Neon Square",
            icon: "✨"
        },

        {
            x: 2920,
            y: 760,
            name: "Old Town Gate",
            icon: "🏛️"
        },

        {
            x: 650,
            y: 1470,
            name: "Harbor Gate",
            icon: "⚓"
        },

        {
            x: 1750,
            y: 1470,
            name: "Beach Entrance",
            icon: "🌴"
        },

        {
            x: 2920,
            y: 1470,
            name: "Airport Road",
            icon: "✈️"
        }
    ];

    // ---------------------------------------------------------
    // INTERACTION POINTS
    // ---------------------------------------------------------

    const points = [
        {
            id: "mission",
            x: 1050,
            y: 760,
            label: "MISSION",
            icon: "🎯"
        },

        {
            id: "garage",
            x: 2500,
            y: 1120,
            label: "GARAGE",
            icon: "🚗"
        },

        {
            id: "property",
            x: 900,
            y: 1240,
            label: "PROPERTY",
            icon: "🏠"
        },

        {
            id: "shop",
            x: 1740,
            y: 560,
            label: "SHOP",
            icon: "🛍️"
        },

        {
            id: "club",
            x: 1410,
            y: 260,
            label: "CLUB",
            icon: "🎵"
        },

        {
            id: "bank",
            x: 605,
            y: 545,
            label: "BANK",
            icon: "🏦"
        },

        {
            id: "airport",
            x: 2700,
            y: 1720,
            label: "AIRPORT",
            icon: "✈️"
        }
    ];

    // ---------------------------------------------------------
    // VEHICLES
    // ---------------------------------------------------------

    const vehicles = [
        {
            id: 1,
            x: 1180,
            y: 760,
            color: "#e84d7d",
            speed: 2.4,
            angle: 0,
            owned: false
        },

        {
            id: 2,
            x: 2300,
            y: 1040,
            color: "#35a7ff",
            speed: 2.2,
            angle: Math.PI / 2,
            owned: false
        },

        {
            id: 3,
            x: 1540,
            y: 1480,
            color: "#ffb23e",
            speed: 2.0,
            angle: 0,
            owned: false
        },

        {
            id: 4,
            x: 2910,
            y: 1450,
            color: "#62e69b",
            speed: 2.3,
            angle: Math.PI / 2,
            owned: false
        },

        {
            id: 5,
            x: 360,
            y: 1480,
            color: "#b47cff",
            speed: 2.1,
            angle: 0,
            owned: false
        }
    ];

    // ---------------------------------------------------------
    // NPC
    // ---------------------------------------------------------

    const npcs = [];

    const npcNames = [
        "Alex",
        "Sam",
        "Jamie",
        "Taylor",
        "Jordan",
        "Chris",
        "Morgan",
        "Riley",
        "Casey",
        "Avery",
        "Drew",
        "Robin",
        "Sky",
        "Cameron",
        "Blake",
        "Mason",
        "Harper",
        "Quinn"
    ];

    for (let i = 0; i < 38; i++) {
        npcs.push({
            x: 200 + Math.random() * (WORLD.width - 400),
            y: 200 + Math.random() * (WORLD.height - 400),

            speed: 0.35 + Math.random() * 0.65,

            direction: Math.random() * Math.PI * 2,

            changeTimer: Math.random() * 180,

            name: npcNames[i % npcNames.length],

            shirt: i % 2 === 0 ? "#35d6c2" : "#ff6cae"
        });
    }

    // ---------------------------------------------------------
    // COLLECTIBLES
    // ---------------------------------------------------------

    const collectibles = [];

    for (let i = 0; i < 25; i++) {
        collectibles.push({
            x: 150 + Math.random() * (WORLD.width - 300),
            y: 150 + Math.random() * (WORLD.height - 300),
            collected: false,
            type: i % 3 === 0 ? "coin" : "star"
        });
    }

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function updateHUD() {
        if (cashEl) {
            cashEl.textContent = Math.floor(state.cash);
        }

        if (repEl) {
            repEl.textContent = Math.floor(state.rep);
        }

        if (propertyEl) {
            propertyEl.textContent = state.property;
        }
    }

    function setMissionText(text) {
        if (missionEl) {
            missionEl.textContent = text;
        }
    }

    function addCash(amount) {
        state.cash = Math.max(0, state.cash + amount);
        updateHUD();
    }

    function addRep(amount) {
        state.rep = Math.max(0, state.rep + amount);

        checkLevel();

        updateHUD();
    }

    function addXP(amount) {
        state.xp += amount;

        checkLevel();

        updateHUD();
    }

    function checkLevel() {
        const newLevel = Math.floor(state.xp / 100) + 1;

        if (newLevel > state.level) {
            state.level = newLevel;

            showPanel(
                "⭐ LEVEL UP!",
                `Congratulations! You reached Level ${state.level}.`,
                [
                    {
                        text: "Continue",
                        action: hidePanel
                    }
                ]
            );
        }
    }

    // ---------------------------------------------------------
    // PANEL
    // ---------------------------------------------------------

    function showPanel(title, text, buttons = []) {
        if (!panel) {
            return;
        }

        panelTitle.textContent = title;
        panelText.textContent = text;

        panelButtons.innerHTML = "";

        buttons.forEach((button) => {
            const element = document.createElement("button");

            element.type = "button";
            element.textContent = button.text;

            element.addEventListener("click", () => {
                button.action();
            });

            panelButtons.appendChild(element);
        });

        panel.classList.remove("hidden");
    }

    function hidePanel() {
        if (!panel) {
            return;
        }

        panel.classList.add("hidden");
        panelButtons.innerHTML = "";
    }

    // ---------------------------------------------------------
    // COLLISION
    // ---------------------------------------------------------

    function circleRectCollision(cx, cy, radius, rect) {
        const nearestX = clamp(cx, rect.x, rect.x + rect.w);
        const nearestY = clamp(cy, rect.y, rect.y + rect.h);

        const dx = cx - nearestX;
        const dy = cy - nearestY;

        return dx * dx + dy * dy < radius * radius;
    }

    function isBlocked(x, y) {
        const radius = player.radius;

        if (
            x - radius < 25 ||
            y - radius < 25 ||
            x + radius > WORLD.width - 25 ||
            y + radius > WORLD.height - 25
        ) {
            return true;
        }

        for (const building of buildings) {
            if (circleRectCollision(x, y, radius, building)) {
                return true;
            }
        }

        return false;
    }

    // ---------------------------------------------------------
    // PLAYER MOVEMENT
    // ---------------------------------------------------------

    function movePlayer(dx, dy) {
        if (dx === 0 && dy === 0) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            player.direction = dx > 0 ? "right" : "left";
        } else {
            player.direction = dy > 0 ? "down" : "up";
        }

        const nextX = player.x + dx;
        const nextY = player.y + dy;

        if (!isBlocked(nextX, player.y)) {
            player.x = nextX;
        }

        if (!isBlocked(player.x, nextY)) {
            player.y = nextY;
        }
    }

    // ---------------------------------------------------------
    // CAMERA
    // ---------------------------------------------------------

    function updateCamera() {
        camera.x = player.x - VIEW.width / 2;
        camera.y = player.y - VIEW.height / 2;

        camera.x = clamp(
            camera.x,
            0,
            WORLD.width - VIEW.width
        );

        camera.y = clamp(
            camera.y,
            0,
            WORLD.height - VIEW.height
        );
    }

    // ---------------------------------------------------------
    // MISSIONS
    // ---------------------------------------------------------

    const missionList = [
        {
            id: "delivery",
            title: "📦 City Delivery",
            description: "Deliver a package to Neon Square.",
            reward: 250,
            xp: 35,
            rep: 5
        },

        {
            id: "shopping",
            title: "🛍️ Quick Shopping",
            description: "Visit the Neon District shop.",
            reward: 180,
            xp: 25,
            rep: 4
        },

        {
            id: "airport",
            title: "✈️ Airport Run",
            description: "Reach the airport.",
            reward: 350,
            xp: 45,
            rep: 7
        },

        {
            id: "harbor",
            title: "⚓ Harbor Job",
            description: "Reach the harbor.",
            reward: 300,
            xp: 40,
            rep: 6
        },

        {
            id: "beach",
            title: "🌴 Beach Visit",
            description: "Meet the contact at the beach.",
            reward: 220,
            xp: 30,
            rep: 5
        }
    ];

    function startMission() {
        if (state.mission) {
            showPanel(
                "🎯 Mission Active",
                "Finish your current mission before starting another.",
                [
                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        const available = missionList[
            state.completedMissions % missionList.length
        ];

        state.mission = available;
        state.missionProgress = 0;

        setMission(
            `${available.title}: ${available.description}`
        );

        addRep(1);

        hidePanel();
    }

    function missionTarget() {
        if (!state.mission) {
            return null;
        }

        switch (state.mission.id) {
            case "delivery":
                return {
                    x: 1750,
                    y: 760
                };

            case "shopping":
                return {
                    x: 1740,
                    y: 560
                };

            case "airport":
                return {
                    x: 2700,
                    y: 1720
                };

            case "harbor":
                return {
                    x: 650,
                    y: 1470
                };

            case "beach":
                return {
                    x: 1750,
                    y: 1470
                };

            default:
                return null;
        }
    }

    function updateMission() {
        if (!state.mission) {
            return;
        }

        const target = missionTarget();

        if (!target) {
            return;
        }

        if (distance(player, target) < 75) {
            completeMission();
        }
    }

    function completeMission() {
        if (!state.mission) {
            return;
        }

        const mission = state.mission;

        state.mission = null;
        state.missionProgress = 0;

        state.completedMissions += 1;

        addCash(mission.reward);
        addXP(mission.xp);
        addRep(mission.rep);

        setMission(
            "✅ Mission complete! Visit the 🎯 marker for another job."
        );

        showPanel(
            "🏆 Mission Complete",
            `${mission.title}\n\n+$${mission.reward} cash\n+${mission.xp} XP\n+${mission.rep} reputation`,
            [
                {
                    text: "Continue",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // GARAGE
    // ---------------------------------------------------------

    function openGarage() {
        const carPrice = 450;

        if (player.inVehicle) {
            showPanel(
                "🚗 Garage",
                "You are already driving a vehicle.",
                [
                    {
                        text: "Exit Vehicle",
                        action: () => {
                            exitVehicle();
                            hidePanel();
                        }
                    },

                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        showPanel(
            "🚗 Cracker Garage",
            `Buy a personal car for $${carPrice}.\n\nOwned cars: ${state.carsOwned}`,
            [
                {
                    text: `Buy Car — $${carPrice}`,

                    action: () => {
                        if (state.cash < carPrice) {
                            showPanel(
                                "❌ Not Enough Cash",
                                "Complete missions to earn more money.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-carPrice);

                        state.carsOwned += 1;

                        showPanel(
                            "🚗 Car Purchased",
                            "Your new car is ready. Find a vehicle and press Action to enter.",
                            [
                                {
                                    text: "Nice!",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Close",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // VEHICLE
    // ---------------------------------------------------------

    function nearestVehicle() {
        let best = null;
        let bestDistance = Infinity;

        for (const vehicle of vehicles) {
            const d = distance(player, vehicle);

            if (d < bestDistance) {
                best = vehicle;
                bestDistance = d;
            }
        }

        return {
            vehicle: best,
            distance: bestDistance
        };
    }

    function enterVehicle() {
        if (state.carsOwned <= 0) {
            showPanel(
                "🚗 Vehicle",
                "You don't own a car yet. Visit the garage first.",
                [
                    {
                        text: "Go to Garage Info",
                        action: () => {
                            hidePanel();
                            openGarage();
                        }
                    },

                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        const nearest = nearestVehicle();

        if (!nearest.vehicle || nearest.distance > 85) {
            showPanel(
                "🚗 Vehicle",
                "Move closer to a car first.",
                [
                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        player.inVehicle = true;
        player.vehicleId = nearest.vehicle.id;

        nearest.vehicle.owned = true;

        showPanel(
            "🚗 Driving",
            "You are now driving. Use the movement controls to explore Cracker City.",
            [
                {
                    text: "Drive!",
                    action: hidePanel
                }
            ]
        );
    }

    function exitVehicle() {
        player.inVehicle = false;
        player.vehicleId = null;
    }

    function updateVehicle() {
        if (!player.inVehicle) {
            return;
        }

        const vehicle = vehicles.find(
            (item) => item.id === player.vehicleId
        );

        if (!vehicle) {
            exitVehicle();
            return;
        }

        vehicle.x = player.x;
        vehicle.y = player.y;
    }

    // ---------------------------------------------------------
    // PROPERTY
    // ---------------------------------------------------------

    function buyProperty() {
        const propertyPrices = [
            650,
            1000,
            1500,
            2200,
            3200
        ];

        if (state.property >= propertyPrices.length) {
            showPanel(
                "🏠 Properties",
                "You own all available Cracker City properties.",
                [
                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        const price = propertyPrices[state.property];

        showPanel(
            "🏠 Property",
            `Buy property #${state.property + 1} for $${price}.\n\nOwning properties increases your reputation.`,
            [
                {
                    text: `Buy — $${price}`,

                    action: () => {
                        if (state.cash < price) {
                            showPanel(
                                "❌ Not Enough Cash",
                                "Complete more missions first.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-price);

                        state.property += 1;

                        addRep(12);
                        addXP(20);

                        showPanel(
                            "🏠 Property Purchased",
                            `You now own ${state.property} property.`,
                            [
                                {
                                    text: "Continue",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Cancel",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // SHOP
    // ---------------------------------------------------------

    function openShop() {
        showPanel(
            "🛍️ City Shop",
            "Choose something to spend your temporary cash on.",
            [
                {
                    text: "🍔 Food — $25",

                    action: () => {
                        if (state.cash < 25) {
                            showPanel(
                                "Not enough cash",
                                "You need $25.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-25);

                        player.energy = Math.min(
                            100,
                            player.energy + 25
                        );

                        state.shopVisits += 1;

                        showPanel(
                            "🍔 Energy Restored",
                            "Your energy increased.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "👕 Outfit — $100",

                    action: () => {
                        if (state.cash < 100) {
                            showPanel(
                                "Not enough cash",
                                "You need $100.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-100);
                        addRep(3);

                        showPanel(
                            "👕 New Outfit",
                            "Your reputation increased.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Close",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // CLUB
    // ---------------------------------------------------------

    function visitClub() {
        showPanel(
            "🎵 Neon Club",
            "Spend an evening at the city's most popular club.",
            [
                {
                    text: "Socialize — $60",

                    action: () => {
                        if (state.cash < 60) {
                            showPanel(
                                "Not enough cash",
                                "You need $60.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-60);
                        addRep(8);
                        addXP(10);

                        showPanel(
                            "⭐ New Contacts",
                            "You met some new people around Cracker City.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Leave",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // BANK
    // ---------------------------------------------------------

    function openBank() {
        showPanel(
            "🏦 Cracker Bank",
            `Cash: $${Math.floor(state.cash)}\nBank: $${Math.floor(state.bank)}`,
            [
                {
                    text: "Deposit $100",

                    action: () => {
                        if (state.cash < 100) {
                            showPanel(
                                "Not enough cash",
                                "You need $100 cash.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        addCash(-100);

                        state.bank += 100;

                        showPanel(
                            "🏦 Deposit Complete",
                            "Your temporary bank balance increased by $100.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Withdraw $100",

                    action: () => {
                        if (state.bank < 100) {
                            showPanel(
                                "Bank balance",
                                "You don't have $100 in the bank.",
                                [
                                    {
                                        text: "Close",
                                        action: hidePanel
                                    }
                                ]
                            );

                            return;
                        }

                        state.bank -= 100;

                        addCash(100);

                        showPanel(
                            "🏦 Withdrawal Complete",
                            "You withdrew $100.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Close",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // AIRPORT
    // ---------------------------------------------------------

    function visitAirport() {
        showPanel(
            "✈️ Cracker City Airport",
            "The airport is one of the largest locations in the city.",
            [
                {
                    text: "Explore",
                    action: () => {
                        addXP(5);
                        addRep(1);

                        showPanel(
                            "✈️ Airport",
                            "You explored the airport.",
                            [
                                {
                                    text: "Close",
                                    action: hidePanel
                                }
                            ]
                        );
                    }
                },

                {
                    text: "Close",
                    action: hidePanel
                }
            ]
        );
    }

    // ---------------------------------------------------------
    // INTERACTION
    // ---------------------------------------------------------

    function nearestPoint() {
        let best = null;
        let bestDistance = Infinity;

        for (const point of points) {
            const d = distance(player, point);

            if (d < bestDistance) {
                best = point;
                bestDistance = d;
            }
        }

        return {
            point: best,
            distance: bestDistance
        };
    }

    function interact() {
        if (player.inVehicle) {
            exitVehicle();

            showPanel(
                "🚗 Vehicle",
                "You left the vehicle.",
                [
                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        const nearbyVehicle = nearestVehicle();

        if (
            nearbyVehicle.vehicle &&
            nearbyVehicle.distance < 75 &&
            state.carsOwned > 0
        ) {
            enterVehicle();
            return;
        }

        const nearby = nearestPoint();

        if (!nearby.point || nearby.distance > 85) {
            showPanel(
                "🏙️ Cracker City",
                "Explore the city and move toward a glowing marker to interact.",
                [
                    {
                        text: "Close",
                        action: hidePanel
                    }
                ]
            );

            return;
        }

        switch (nearby.point.id) {
            case "mission":
                startMission();
                break;

            case "garage":
                openGarage();
                break;

            case "property":
                buyProperty();
                break;

            case "shop":
                openShop();
                break;

            case "club":
                visitClub();
                break;

            case "bank":
                openBank();
                break;

            case "airport":
                visitAirport();
                break;

            default:
                break;
        }
    }

    // ---------------------------------------------------------
    // NPC UPDATE
    // ---------------------------------------------------------

    function updateNPCs(dt) {
        for (const npc of npcs) {
            npc.changeTimer -= dt;

            if (npc.changeTimer <= 0) {
                npc.direction =
                    Math.random() * Math.PI * 2;

                npc.changeTimer =
                    60 + Math.random() * 180;
            }

            const dx =
                Math.cos(npc.direction) *
                npc.speed *
                dt;

            const dy =
                Math.sin(npc.direction) *
                npc.speed *
                dt;

            const nextX = npc.x + dx;
            const nextY = npc.y + dy;

            if (
                nextX > 30 &&
                nextX < WORLD.width - 30 &&
                nextY > 30 &&
                nextY < WORLD.height - 30
            ) {
                npc.x = nextX;
                npc.y = nextY;
            } else {
                npc.direction += Math.PI;
            }
        }
    }

    // ---------------------------------------------------------
    // COLLECTIBLES
    // ---------------------------------------------------------

    function updateCollectibles() {
        for (const item of collectibles) {
            if (item.collected) {
                continue;
            }

            if (distance(player, item) < 30) {
                item.collected = true;

                if (item.type === "coin") {
                    addCash(25);
                    addXP(3);
                } else {
                    addRep(2);
                    addXP(5);
                }
            }
        }
    }

    // ---------------------------------------------------------
    // DAY / NIGHT
    // ---------------------------------------------------------

    function updateTime(dt) {
        state.dayTime += dt * 0.003;

        if (state.dayTime >= 24) {
            state.dayTime = 0;
        }
    }

    function isNight() {
        return (
            state.dayTime >= 19 ||
            state.dayTime < 6
        );
    }

    // ---------------------------------------------------------
    // DRAW BACKGROUND
    // ---------------------------------------------------------

    function drawBackground() {
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.save();

        ctx.translate(
            -camera.x,
            -camera.y
        );

        // Ground
        ctx.fillStyle = "#182b24";

        ctx.fillRect(
            0,
            0,
            WORLD.width,
            WORLD.height
        );

        // Beach
        ctx.fillStyle = "#d6c27a";

        ctx.fillRect(
            1200,
            1500,
            1150,
            900
        );

        // Water
        ctx.fillStyle = "#0b4b6d";

        ctx.fillRect(
            0,
            2100,
            1200,
            300
        );

        // Airport runway
        ctx.fillStyle = "#343943";

        ctx.fillRect(
            2370,
            1740,
            1100,
            230
        );

        ctx.fillStyle = "#c8c8c8";

        ctx.setLineDash([35, 30]);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.moveTo(
            2400,
            1855
        );

        ctx.lineTo(
            3450,
            1855
        );

        ctx.stroke();

        ctx.setLineDash([]);

        // Roads
        roads.forEach((road) => {
            ctx.fillStyle = "#272b34";

            ctx.fillRect(
                road.x,
                road.y,
                road.w,
                road.h
            );

            ctx.strokeStyle = "#5a5f6c";
            ctx.lineWidth = 2;

            ctx.setLineDash([25, 25]);

            if (road.w > road.h) {
                ctx.beginPath();

                ctx.moveTo(
                    road.x,
                    road.y + road.h / 2
                );

                ctx.lineTo(
                    road.x + road.w,
                    road.y + road.h / 2
                );

                ctx.stroke();
            } else {
                ctx.beginPath();

                ctx.moveTo(
                    road.x + road.w / 2,
                    road.y
                );

                ctx.lineTo(
                    road.x + road.w / 2,
                    road.y + road.h
                );

                ctx.stroke();
            }

            ctx.setLineDash([]);
        });

        // District labels
        ctx.textAlign = "center";
        ctx.font = "bold 28px Arial";

        districts.forEach((district) => {
            ctx.fillStyle = "rgba(255,255,255,.12)";

            ctx.fillText(
                district.name,
                district.x + district.w / 2,
                district.y + 55
            );
        });

        // Buildings
        buildings.forEach((building, index) => {
            const buildingColor =
                index % 3 === 0
                    ? "#3c3150"
                    : index % 3 === 1
                        ? "#29465a"
                        : "#414149";

            ctx.fillStyle = buildingColor;

            ctx.fillRect(
                building.x,
                building.y,
                building.w,
                building.h
            );

            ctx.strokeStyle = "#7c6b9a";
            ctx.lineWidth = 3;

            ctx.strokeRect(
                building.x,
                building.y,
                building.w,
                building.h
            );

            // Windows
            for (
                let wx = building.x + 22;
                wx < building.x + building.w - 18;
                wx += 42
            ) {
                for (
                    let wy = building.y + 25;
                    wy < building.y + building.h - 18;
                    wy += 42
                ) {
                    ctx.fillStyle = isNight()
                        ? "#ffd76a"
                        : "#9bd8ff";

                    ctx.fillRect(
                        wx,
                        wy,
                        13,
                        17
                    );
                }
            }

            // Building name
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Arial";

            ctx.fillText(
                building.name,
                building.x + building.w / 2,
                building.y + building.h + 18
            );
        });

        // Landmarks
        landmarks.forEach((landmark) => {
            ctx.textAlign = "center";

            ctx.font = "26px Arial";

            ctx.fillText(
                landmark.icon,
                landmark.x,
                landmark.y
            );

            ctx.font = "bold 13px Arial";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                landmark.name,
                landmark.x,
                landmark.y + 25
            );
        });

        drawPalm(110, 450);
        drawPalm(3500, 430);
        drawPalm(1050, 2150);
        drawPalm(2250, 2170);
        drawPalm(3000, 2200);
        drawPalm(1250, 1650);
        drawPalm(2200, 1650);

        // Collectibles
        collectibles.forEach((item) => {
            if (item.collected) {
                return;
            }

            const pulse =
                Math.sin(
                    performance.now() / 180 +
                    item.x
                ) * 3;

            ctx.beginPath();

            ctx.arc(
                item.x,
                item.y,
                9 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                item.type === "coin"
                    ? "#ffd54f"
                    : "#9b7cff";

            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;

            ctx.stroke();
        });

        // Interaction markers
        points.forEach((point) => {
            const pulse =
                Math.sin(
                    performance.now() / 220 +
                    point.x
                ) * 4;

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                21 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(0, 220, 255, .18)";

            ctx.strokeStyle =
                "#00d9ff";

            ctx.lineWidth = 3;

            ctx.fill();
            ctx.stroke();

            ctx.font = "22px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                point.icon,
                point.x,
                point.y + 7
            );

            ctx.font = "bold 12px Arial";
            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                point.label,
                point.x,
                point.y - 30
            );
        });

        // Mission target
        const target = missionTarget();

        if (target) {
            const pulse =
                28 +
                Math.sin(
                    performance.now() / 180
                ) * 7;

            ctx.beginPath();

            ctx.arc(
                target.x,
                target.y,
                pulse,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = "#ff4fc3";
            ctx.lineWidth = 4;

            ctx.stroke();

            ctx.fillStyle = "#ff4fc3";
            ctx.font = "bold 13px Arial";

            ctx.fillText(
                "MISSION",
                target.x,
                target.y - 38
            );
        }

        // Vehicles
        vehicles.forEach((vehicle) => {
            drawVehicle(vehicle);
        });

        // NPC
        npcs.forEach((npc) => {
            drawNPC(npc);
        });

        // Player
        drawPlayer();

        ctx.restore();

        // Night overlay
        if (isNight()) {
            ctx.fillStyle = "rgba(10, 8, 35, .38)";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }
    }

    // ---------------------------------------------------------
    // PALM
    // ---------------------------------------------------------

    function drawPalm(x, y) {
        ctx.strokeStyle = "#76513c";
        ctx.lineWidth = 9;

        ctx.beginPath();

        ctx.moveTo(
            x,
            y + 50
        );

        ctx.lineTo(
            x + 5,
            y
        );

        ctx.stroke();

        ctx.strokeStyle = "#2ecb78";
        ctx.lineWidth = 6;

        const leaves = [
            [-38, -24],
            [-22, -35],
            [0, -42],
            [22, -35],
            [38, -24]
        ];

        leaves.forEach(([dx, dy]) => {
            ctx.beginPath();

            ctx.moveTo(
                x + 5,
                y
            );

            ctx.lineTo(
                x + dx,
                y + dy
            );

            ctx.stroke();
        });
    }

    // ---------------------------------------------------------
    // VEHICLE DRAW
    // ---------------------------------------------------------

    function drawVehicle(vehicle) {
        ctx.save();

        ctx.translate(
            vehicle.x,
            vehicle.y
        );

        ctx.rotate(vehicle.angle);

        ctx.fillStyle = "rgba(0,0,0,.3)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            10,
            27,
            11,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = vehicle.color;

        ctx.fillRect(
            -27,
            -13,
            54,
            28
        );

        ctx.fillStyle = "#151923";

        ctx.fillRect(
            -15,
            -9,
            30,
            16
        );

        ctx.fillStyle = "#f4f4f4";

        ctx.fillRect(
            -25,
            -9,
            5,
            8
        );

        ctx.fillRect(
            20,
            -9,
            5,
            8
        );

        ctx.restore();
    }

    // ---------------------------------------------------------
    // NPC DRAW
    // ---------------------------------------------------------

    function drawNPC(npc) {
        ctx.save();

        ctx.translate(
            npc.x,
            npc.y
        );

        ctx.fillStyle = "rgba(0,0,0,.25)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            12,
            11,
            6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = npc.shirt;

        ctx.fillRect(
            -8,
            -3,
            16,
            18
        );

        ctx.fillStyle = "#e8b18a";

        ctx.beginPath();

        ctx.arc(
            0,
            -12,
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#25202c";

        ctx.beginPath();

        ctx.arc(
            0,
            -15,
            8,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    // ---------------------------------------------------------
    // PLAYER DRAW
    // ---------------------------------------------------------

    function drawPlayer() {
        if (player.inVehicle) {
            return;
        }

        ctx.save();

        ctx.translate(
            player.x,
            player.y
        );

        ctx.fillStyle = "rgba(0,0,0,.35)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            15,
            16,
            7,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Body
        ctx.fillStyle = "#e85cff";

        ctx.fillRect(
            -11,
            -3,
            22,
            25
        );

        // Head
        ctx.fillStyle = "#efb184";

        ctx.beginPath();

        ctx.arc(
            0,
            -15,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Hair
        ctx.fillStyle = "#211528";

        ctx.beginPath();

        ctx.arc(
            0,
            -19,
            10,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        // Direction indicator
        ctx.fillStyle = "#ffffff";

        if (player.direction === "up") {
            ctx.fillRect(
                -3,
                -31,
                6,
                5
            );
        }

        if (player.direction === "down") {
            ctx.fillRect(
                -3,
                25,
                6,
                5
            );
        }

        if (player.direction === "left") {
            ctx.fillRect(
                -18,
                -3,
                5,
                6
            );
        }

        if (player.direction === "right") {
            ctx.fillRect(
                13,
                -3,
                5,
                6
            );
        }

        ctx.restore();
    }

    // ---------------------------------------------------------
    // MINIMAP
    // ---------------------------------------------------------

    function drawMinimap() {
        const size = 135;
        const padding = 10;

        const x =
            canvas.width -
            size -
            padding;

        const y = padding;

        ctx.save();

        ctx.fillStyle = "rgba(5,7,15,.78)";

        ctx.fillRect(
            x,
            y,
            size,
            size
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            x,
            y,
            size,
            size
        );

        // Roads
        ctx.fillStyle = "#444a56";

        roads.forEach((road) => {
            ctx.fillRect(
                x + (road.x / WORLD.width) * size,
                y + (road.y / WORLD.height) * size,
                Math.max(
                    2,
                    (road.w / WORLD.width) * size
                ),
                Math.max(
                    2,
                    (road.h / WORLD.height) * size
                )
            );
        });

        // Buildings
        ctx.fillStyle = "#6c527f";

        buildings.forEach((building) => {
            ctx.fillRect(
                x + (building.x / WORLD.width) * size,
                y + (building.y / WORLD.height) * size,
                Math.max(
                    2,
                    (building.w / WORLD.width) * size
                ),
                Math.max(
                    2,
                    (building.h / WORLD.height) * size
                )
            );
        });

        // Player
        ctx.fillStyle = "#ff4fc3";

        ctx.beginPath();

        ctx.arc(
            x + (player.x / WORLD.width) * size,
            y + (player.y / WORLD.height) * size,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    // ---------------------------------------------------------
    // GAME UPDATE
    // ---------------------------------------------------------

    function update(dt) {
        let dx = 0;
        let dy = 0;

        if (keys.ArrowLeft || keys.a) {
            dx -= 1;
        }

        if (keys.ArrowRight || keys.d) {
            dx += 1;
        }

        if (keys.ArrowUp || keys.w) {
            dy -= 1;
        }

        if (keys.ArrowDown || keys.s) {
            dy += 1;
        }

        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy);

            dx /= length;
            dy /= length;

            const running =
                keys.Shift ||
                keys.shift;

            let speed = running
                ? player.runSpeed
                : player.walkSpeed;

            if (player.inVehicle) {
                speed = 7;
            }

            movePlayer(
                dx * speed * dt,
                dy * speed * dt
            );
        }

        if (player.inVehicle) {
            updateVehicle();
        }

        updateNPCs(dt);
        updateCollectibles();
        updateMission();
        updateCamera();
        updateTime(dt);

        player.energy = clamp(
            player.energy +
            (dx === 0 && dy === 0 ? 0.025 : -0.04) * dt,
            0,
            100
        );
    }

    // ---------------------------------------------------------
    // DRAW
    // ---------------------------------------------------------

    function draw() {
        drawBackground();
        drawMinimap();
    }

    // ---------------------------------------------------------
    // GAME LOOP
    // ---------------------------------------------------------

    function gameLoop(now) {
        const delta =
            Math.min(
                (now - lastTime) / 16.67,
                2
            );

        lastTime = now;

        update(delta);
        draw();

        requestAnimationFrame(gameLoop);
    }

    // ---------------------------------------------------------
    // KEYBOARD
    // ---------------------------------------------------------

    window.addEventListener(
        "keydown",
        (event) => {
            keys[event.key] = true;

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
                event.key === "e" ||
                event.key === "E" ||
                event.key === " "
            ) {
                interact();
            }

            if (event.key === "Escape") {
                hidePanel();
            }
        }
    );

    window.addEventListener(
        "keyup",
        (event) => {
            keys[event.key] = false;
        }
    );

    // ---------------------------------------------------------
    // MOBILE CONTROLS
    // ---------------------------------------------------------

    document
        .querySelectorAll("[data-key]")
        .forEach((button) => {
            const key = button.dataset.key;

            const start = (event) => {
                event.preventDefault();
                keys[key] = true;
            };

            const stop = (event) => {
                event.preventDefault();
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

    if (actionBtn) {
        actionBtn.addEventListener(
            "click",
            interact
        );
    }

    canvas.addEventListener(
        "click",
        () => {
            interact();
        }
    );

    // ---------------------------------------------------------
    // INITIAL MESSAGE
    // ---------------------------------------------------------

    updateHUD();

    setMissionText(
        "🏙️ Welcome to Cracker City! Walk to the 🎯 marker to get your first mission."
    );

    // ---------------------------------------------------------
    // START
    // ---------------------------------------------------------

    requestAnimationFrame(gameLoop);

})();
