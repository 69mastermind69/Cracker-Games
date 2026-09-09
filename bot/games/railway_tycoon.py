# bot/games/railway_tycoon.py
"""Railway Tycoon - standalone Telegram game module.

Uses in-memory state only. Add routing in callbacks.py with:
    game:railway -> start_railway_tycoon
    railway:*    -> handle_railway_tycoon
"""

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_railways = {}

CITIES = [
    "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Gazipur",
    "Cumilla", "Mymensingh", "Rangpur", "Barishal",
]

UPGRADES = {
    "engine": ("🚂 Engine", 120, 25),
    "coach": ("🪑 Passenger Coach", 180, 40),
    "cargo": ("📦 Cargo Wagon", 220, 55),
    "station": ("🏢 Station", 300, 80),
}


def _uid(query):
    return query.from_user.id if query.from_user else 0


def _new_state():
    start = random.choice(CITIES)
    destinations = [c for c in CITIES if c != start]
    destination = random.choice(destinations)
    return {
        "cash": 650,
        "day": 1,
        "reputation": 50,
        "start": start,
        "destination": destination,
        "engine": 1,
        "coach": 1,
        "cargo": 1,
        "station": 1,
        "runs": 0,
    }


def _menu(state):
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🚆 Run Train", callback_data="railway:run"),
            InlineKeyboardButton("💰 Upgrade", callback_data="railway:upgrade"),
        ],
        [
            InlineKeyboardButton("🗺️ New Route", callback_data="railway:route"),
            InlineKeyboardButton("📊 Company", callback_data="railway:stats"),
        ],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def _upgrade_menu(state):
    rows = []
    for key, (name, base_cost, _) in UPGRADES.items():
        level = state[key]
        cost = base_cost * level
        rows.append([
            InlineKeyboardButton(
                f"{name} Lv.{level} — ${cost}",
                callback_data=f"railway:buy:{key}",
            )
        ])
    rows.append([InlineKeyboardButton("🔙 Back", callback_data="railway:menu")])
    return InlineKeyboardMarkup(rows)


async def start_railway_tycoon(query) -> None:
    state = _new_state()
    active_railways[_uid(query)] = state
    await _show_menu(query, state, new_game=True)


async def _show_menu(query, state, new_game=False):
    title = "🚂 *Railway Tycoon*"
    intro = (
        f"\n\nতোমার railway company শুরু হয়েছে!\n"
        f"📍 Route: *{state['start']} → {state['destination']}*\n"
        f"💵 Cash: *${state['cash']}*"
    ) if new_game else (
        f"\n\n📍 Route: *{state['start']} → {state['destination']}*\n"
        f"💵 Cash: *${state['cash']}*"
    )
    await query.edit_message_text(
        title + intro +
        f"\n⭐ Reputation: *{state['reputation']}*"
        f"\n📅 Day: *{state['day']}*\n\n"
        "তোমার train চালাও, route বদলাও এবং company upgrade করো!",
        parse_mode="Markdown",
        reply_markup=_menu(state),
    )


async def _run_train(query, state):
    passengers = random.randint(12, 30) + state["coach"] * 5
    cargo = random.randint(4, 15) + state["cargo"] * 3
    revenue = passengers * 7 + cargo * 11 + state["station"] * 8
    fuel = max(15, 65 - state["engine"] * 8)
    maintenance = 20 + state["engine"] * 6
    profit = revenue - fuel - maintenance

    event = random.choice([
        ("☀️ Smooth journey!", 2),
        ("🌧️ Rain slowed the train.", -1),
        ("🎟️ A busy day increased ticket sales!", 3),
        ("📦 A cargo contract paid extra.", 4),
    ])

    state["cash"] += profit
    state["reputation"] = max(0, min(100, state["reputation"] + event[1]))
    state["day"] += 1
    state["runs"] += 1

    if state["cash"] < 0:
        state["cash"] = 0

    await query.edit_message_text(
        "🚆 *Train Run Complete!*\n\n"
        f"👥 Passengers: *{passengers}*\n"
        f"📦 Cargo: *{cargo} units*\n"
        f"💵 Revenue: *${revenue}*\n"
        f"🛠️ Costs: *${fuel + maintenance}*\n"
        f"📈 Profit: *${profit}*\n\n"
        f"{event[0]}\n\n"
        f"💰 Cash: *${state['cash']}*\n"
        f"⭐ Reputation: *{state['reputation']}*",
        parse_mode="Markdown",
        reply_markup=_menu(state),
    )


async def _show_upgrades(query, state):
    lines = ["🛠️ *Company Upgrades*\n"]
    for key, (name, base_cost, benefit) in UPGRADES.items():
        level = state[key]
        cost = base_cost * level
        lines.append(f"{name}: Lv.{level} — Next: *${cost}* (+{benefit})")
    lines.append(f"\n💰 Cash: *${state['cash']}*")
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode="Markdown",
        reply_markup=_upgrade_menu(state),
    )


async def _buy_upgrade(query, state, key):
    if key not in UPGRADES:
        return
    name, base_cost, benefit = UPGRADES[key]
    level = state[key]
    cost = base_cost * level
    if state["cash"] < cost:
        await query.edit_message_text(
            f"❌ *Not enough cash!*\n\n"
            f"{name} upgrade costs *${cost}*.\n"
            f"Your cash: *${state['cash']}*",
            parse_mode="Markdown",
            reply_markup=_upgrade_menu(state),
        )
        return

    state["cash"] -= cost
    state[key] += 1
    if key == "station":
        state["reputation"] = min(100, state["reputation"] + 3)

    await query.edit_message_text(
        f"✅ *Upgrade Complete!*\n\n"
        f"{name} is now *Level {state[key]}*.\n"
        f"💵 Spent: *${cost}*\n"
        f"💰 Cash left: *${state['cash']}*",
        parse_mode="Markdown",
        reply_markup=_upgrade_menu(state),
    )


async def _new_route(query, state):
    choices = [c for c in CITIES if c not in (state["start"], state["destination"])]
    new_destination = random.choice(choices)
    old = state["destination"]
    state["destination"] = new_destination
    state["reputation"] = max(0, state["reputation"] - 1)
    await query.edit_message_text(
        "🗺️ *Route Changed!*\n\n"
        f"Old destination: *{old}*\n"
        f"New route: *{state['start']} → {new_destination}*\n\n"
        "নতুন route-এ train চালাতে পারো।",
        parse_mode="Markdown",
        reply_markup=_menu(state),
    )


async def _stats(query, state):
    total_upgrades = sum(state[k] - 1 for k in UPGRADES)
    await query.edit_message_text(
        "📊 *Railway Company*\n\n"
        f"💰 Cash: *${state['cash']}*\n"
        f"⭐ Reputation: *{state['reputation']}/100*\n"
        f"📅 Days operated: *{state['day']}*\n"
        f"🚆 Train runs: *{state['runs']}*\n"
        f"🛠️ Total upgrades: *{total_upgrades}*\n\n"
        f"📍 Main route: *{state['start']} → {state['destination']}*",
        parse_mode="Markdown",
        reply_markup=_menu(state),
    )


async def handle_railway_tycoon(query, data: str) -> None:
    uid = _uid(query)
    state = active_railways.get(uid)
    if state is None:
        state = _new_state()
        active_railways[uid] = state

    if data == "railway:menu":
        await _show_menu(query, state)
        return
    if data == "railway:run":
        await _run_train(query, state)
        return
    if data == "railway:upgrade":
        await _show_upgrades(query, state)
        return
    if data == "railway:route":
        await _new_route(query, state)
        return
    if data == "railway:stats":
        await _stats(query, state)
        return
    if data.startswith("railway:buy:"):
        await _buy_upgrade(query, state, data.split(":", 2)[2])
        return

    await _show_menu(query, state)
