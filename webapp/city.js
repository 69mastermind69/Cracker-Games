// webapp/city.js
(() => {
  "use strict";

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

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const WORLD = {
    width: 2400,
    height: 1600
  };

  const player = {
    x: 420,
    y: 820,
    speed: 3.2,
    size: 18,
    direction: "down"
  };

  const state = {
    cash: 500,
    rep: 0,
    property: 0,
    mission: 0,
    deliveries: 0,
    car: false,
    energy: 100
  };

  const keys = {};
  let camera = { x: 0, y: 0 };
  let lastTime = performance.now();

  const buildings = [
    { x: 120, y: 120, w: 300, h: 220, name: "Sunset Apartments" },
    { x: 560, y: 100, w: 260, h: 260, name: "Palm Hotel" },
    { x: 980, y: 120, w: 330, h: 210, name: "Ocean Mall" },
    { x: 1500, y: 100, w: 300, h: 280, name: "Downtown Tower" },

    { x: 130, y: 570, w: 280, h: 250, name: "Retro Arcade" },
    { x: 600, y: 520, w: 340, h: 250, name: "Neon Club" },
    { x: 1120, y: 520, w: 300, h: 250, name: "Auto Garage" },
    { x: 1620, y: 520, w: 360, h: 240, name: "City Bank" },

    { x: 100, y: 1100, w: 330, h: 250, name: "Harbor Warehouse" },
    { x: 560, y: 1080, w: 300, h: 280, name: "Music Studio" },
    { x: 1050, y: 1090, w: 330, h: 250, name: "Beach Hotel" },
    { x: 1560, y: 1080, w: 360, h: 270, name: "Luxury Estate" }
  ];

  const roads = [
    { x: 0, y: 390, w: WORLD.width, h: 120 },
    { x: 0, y: 850, w: WORLD.width, h: 120 },
    { x: 430, y: 0, w: 110, h: WORLD.height },
    { x: 960, y: 0, w: 120, h: WORLD.height },
    { x: 1440, y: 0, w: 120, h: WORLD.height },
    { x: 1980, y: 0, w: 120, h: WORLD.height }
  ];

  const markers = [
    {
      x: 500,
      y: 450,
      type: "mission",
      label: "Delivery"
    },
    {
      x: 1030,
      y: 920,
      type: "garage",
      label: "Garage"
    },
    {
      x: 1760,
      y: 900,
      type: "property",
      label: "Property"
    },
    {
      x: 740,
      y: 920,
      type: "club",
      label: "Club"
    }
  ];

  function updateHUD() {
    cashEl.textContent = state.cash;
    repEl.textContent = state.rep;
    propertyEl.textContent = state.property;
  }

  function setMission(text) {
    missionEl.textContent = text;
  }

  function showPanel(title, text, buttons = []) {
    panelTitle.textContent = title;
    panelText.textContent = text;
    panelButtons.innerHTML = "";

    buttons.forEach((button) => {
      const el = document.createElement("button");
      el.textContent = button.text;
      el.className = button.className || "";

      el.addEventListener("click", () => {
        button.action();
      });

      panelButtons.appendChild(el);
    });

    panel.classList.remove("hidden");
  }

  function hidePanel() {
    panel.classList.add("hidden");
    panelButtons.innerHTML = "";
  }

  function addCash(amount) {
    state.cash = Math.max(0, state.cash + amount);
    updateHUD();
  }

  function addRep(amount) {
    state.rep = Math.max(0, state.rep + amount);
    updateHUD();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nearestMarker() {
    let best = null;
    let bestDistance = Infinity;

    for (const marker of markers) {
      const d = distance(player, marker);

      if (d < bestDistance) {
        best = marker;
        bestDistance = d;
      }
    }

    return {
      marker: best,
      distance: bestDistance
    };
  }

  function isBlocked(x, y) {
    const half = player.size / 2;

    if (
      x - half < 20 ||
      y - half < 20 ||
      x + half > WORLD.width - 20 ||
      y + half > WORLD.height - 20
    ) {
      return true;
    }

    for (const building of buildings) {
      if (
        x + half > building.x &&
        x - half < building.x + building.w &&
        y + half > building.y &&
        y - half < building.y + building.h
      ) {
        return true;
      }
    }

    return false;
  }

  function movePlayer(dx, dy) {
    if (dx === 0 && dy === 0) return;

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

  function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    camera.x = Math.max(0, Math.min(camera.x, WORLD.width - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD.height - canvas.height));
  }

  function drawBackground() {
    ctx.fillStyle = "#10151f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Grass / city ground
    ctx.fillStyle = "#18251f";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Water
    ctx.fillStyle = "#102d45";
    ctx.fillRect(0, 1400, WORLD.width, 200);

    // Roads
    roads.forEach((road) => {
      ctx.fillStyle = "#252833";
      ctx.fillRect(road.x, road.y, road.w, road.h);

      ctx.strokeStyle = "#555b6b";
      ctx.lineWidth = 2;
      ctx.setLineDash([22, 20]);

      if (road.w > road.h) {
        ctx.beginPath();
        ctx.moveTo(road.x, road.y + road.h / 2);
        ctx.lineTo(road.x + road.w, road.y + road.h / 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(road.x + road.w / 2, road.y);
        ctx.lineTo(road.x + road.w / 2, road.y + road.h);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    });

    // Buildings
    buildings.forEach((building, index) => {
      ctx.fillStyle = index % 2 === 0 ? "#3c2c4d" : "#263f55";
      ctx.fillRect(
        building.x,
        building.y,
        building.w,
        building.h
      );

      ctx.strokeStyle = "#8c5ca8";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        building.x,
        building.y,
        building.w,
        building.h
      );

      // Windows
      ctx.fillStyle = "#f6d77a";

      for (
        let wx = building.x + 25;
        wx < building.x + building.w - 20;
        wx += 45
      ) {
        for (
          let wy = building.y + 25;
          wy < building.y + building.h - 20;
          wy += 45
        ) {
          ctx.fillRect(wx, wy, 14, 18);
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        building.name,
        building.x + building.w / 2,
        building.y + building.h + 22
      );
    });

    // Palm trees
    drawPalm(80, 460);
    drawPalm(2180, 460);
    drawPalm(2100, 1280);
    drawPalm(450, 1450);

    // Markers
    markers.forEach((marker) => {
      const pulse = 5 + Math.sin(performance.now() / 250) * 3;

      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 19 + pulse, 0, Math.PI * 2);

      if (marker.type === "mission") {
        ctx.fillStyle = "rgba(0, 170, 255, .25)";
        ctx.strokeStyle = "#00aaff";
      } else if (marker.type === "garage") {
        ctx.fillStyle = "rgba(255, 170, 0, .25)";
        ctx.strokeStyle = "#ffaa00";
      } else if (marker.type === "property") {
        ctx.fillStyle = "rgba(80, 255, 150, .25)";
        ctx.strokeStyle = "#50ff96";
      } else {
        ctx.fillStyle = "rgba(255, 70, 190, .25)";
        ctx.strokeStyle = "#ff46be";
      }

      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(marker.label, marker.x, marker.y - 28);
    });

    drawPlayer();

    ctx.restore();
  }

  function drawPalm(x, y) {
    ctx.strokeStyle = "#795548";
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.moveTo(x, y + 45);
    ctx.lineTo(x + 4, y - 5);
    ctx.stroke();

    ctx.strokeStyle = "#31b46b";
    ctx.lineWidth = 6;

    const leaves = [
      [-35, -25],
      [-20, -35],
      [0, -42],
      [20, -35],
      [35, -25]
    ];

    leaves.forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 5);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    });
  }

  function drawPlayer() {
    ctx.save();

    ctx.translate(player.x, player.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#e95cff";
    ctx.fillRect(-10, -4, 20, 22);

    // Head
    ctx.fillStyle = "#f0b083";
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#21152a";
    ctx.beginPath();
    ctx.arc(0, -19, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = "#ffffff";

    if (player.direction === "up") {
      ctx.fillRect(-3, -31, 6, 5);
    } else if (player.direction === "down") {
      ctx.fillRect(-3, 24, 6, 5);
    } else if (player.direction === "left") {
      ctx.fillRect(-17, -3, 5, 6);
    } else {
      ctx.fillRect(12, -3, 5, 6);
    }

    ctx.restore();
  }

  function startDelivery() {
    if (state.mission !== 0) {
      setMission("Finish your current mission before starting another one.");
      return;
    }

    state.mission = 1;

    setMission(
      "📦 Delivery started! Reach the glowing pink marker at the Neon Club."
    );

    markers[0].x = 740;
    markers[0].y = 920;
    markers[0].label = "Delivery";

    addRep(1);
  }

  function finishDelivery() {
    if (state.mission !== 1) return;

    state.mission = 2;
    state.deliveries += 1;

    addCash(250);
    addRep(5);

    setMission(
      "🎉 Delivery complete! You earned $250. Visit the garage or property marker."
    );

    showPanel(
      "📦 Mission Complete",
      "Nice work! Your reputation increased and you earned $250.",
      [
        {
          text: "Continue",
          action: hidePanel
        }
      ]
    );
  }

  function openGarage() {
    showPanel(
      "🚗 Neon Garage",
      state.car
        ? "Your car is ready. You can use it to travel around the city."
        : "Buy your first city car for $350.",
      state.car
        ? [
            {
              text: "Close",
              action: hidePanel
            }
          ]
        : [
            {
              text: "Buy Car — $350",
              action: () => {
                if (state.cash < 350) {
                  showPanel(
                    "Not enough cash",
                    "Complete more missions to earn enough money.",
                    [
                      {
                        text: "Close",
                        action: hidePanel
                      }
                    ]
                  );
                  return;
                }

                addCash(-350);
                state.car = true;

                showPanel(
                  "🚗 Car Purchased",
                  "Your first car is now yours!",
                  [
                    {
                      text: "Great!",
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

  function buyProperty() {
    if (state.property >= 3) {
      showPanel(
        "🏠 Properties",
        "You already own all available starter properties.",
        [
          {
            text: "Close",
            action: hidePanel
          }
        ]
      );
      return;
    }

    const price = 600 + state.property * 400;

    showPanel(
      "🏠 Property",
      `Buy this property for $${price}. It generates reputation and passive income.`,
      [
        {
          text: `Buy — $${price}`,
          action: () => {
            if (state.cash < price) {
              showPanel(
                "Not enough cash",
                "Complete missions and activities to earn more money.",
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
            addRep(10);

            showPanel(
              "🏠 Property Purchased",
              "Your city business network is growing!",
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

  function visitClub() {
    showPanel(
      "🎵 Neon Club",
      "Relax, meet people and build your reputation.",
      [
        {
          text: "Socialize — $50",
          action: () => {
            if (state.cash < 50) {
              showPanel(
                "Need more cash",
                "You need $50 to spend an evening at the club.",
                [
                  {
                    text: "Close",
                    action: hidePanel
                  }
                ]
              );
              return;
            }

            addCash(-50);
            addRep(4);

            showPanel(
              "⭐ Reputation Up",
              "You made some new contacts around the city.",
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

  function interact() {
    const nearby = nearestMarker();

    if (!nearby.marker || nearby.distance > 75) {
      showPanel(
        "🌴 Neon City",
        "Explore the city and walk toward a glowing marker to interact.",
        [
          {
            text: "Close",
            action: hidePanel
          }
        ]
      );
      return;
    }

    switch (nearby.marker.type) {
      case "mission":
        if (state.mission === 0) {
          startDelivery();
          hidePanel();
        } else if (state.mission === 1) {
          finishDelivery();
        } else {
          showPanel(
            "📦 Delivery",
            "You have completed today's starter delivery.",
            [
              {
                text: "Close",
                action: hidePanel
              }
            ]
          );
        }
        break;

      case "garage":
        openGarage();
        break;

      case "property":
        buyProperty();
        break;

      case "club":
        visitClub();
        break;

      default:
        break;
    }
  }

  function update(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);

      dx /= length;
      dy /= length;

      movePlayer(
        dx * player.speed * dt,
        dy * player.speed * dt
      );
    }

    updateCamera();

    // Mission completion when close to target
    if (
      state.mission === 1 &&
      distance(player, markers[0]) < 60
    ) {
      finishDelivery();
    }
  }

  function draw() {
    drawBackground();
  }

  function gameLoop(now) {
    const delta = Math.min((now - lastTime) / 16.67, 2);
    lastTime = now;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener("keydown", (event) => {
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

    if (event.key === "e" || event.key === "E" || event.key === " ") {
      interact();
    }

    if (event.key === "Escape") {
      hidePanel();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
  });

  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;

    const start = (event) => {
      event.preventDefault();
      keys[key] = true;
    };

    const stop = (event) => {
      event.preventDefault();
      keys[key] = false;
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });

  actionBtn.addEventListener("click", interact);

  canvas.addEventListener("click", interact);

  updateHUD();
  setMission(
    "Explore the city. Walk to the blue marker to begin your first delivery."
  );

  requestAnimationFrame(gameLoop);
})();
