# bot/games/space_empire.py
"""Space Empire - standalone Telegram mini-game.

RAM-only state; no database required.
"""

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_empires = {}

PLANETS = [
    ("Luna", 18, 10),
    ("Astra", 28, 15),
    ("Nova", 42, 24),
    ("Orion", 60, 35),
]


def _uid(query):
    return query.from_user.id if query.from_user else query.message.chat_id


def _new_empire():
    return {
        "credits": 120,
        "energy": 80,
        "ore": 35,
        "ships": 1,
        "planets": 0,
        "research": 0,
        "turn": 1,
    }


def _menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("⛏️ Mine Ore", callback_data="space:mine"),
            InlineKeyboardButton("⚡ Generate Energy", callback_data="space:energy"),
        ],
        [
            InlineKeyboardButton("🔬 Research", callback_data="space:research"),
            InlineKeyboardButton("🚀 Build Ship", callback_data="space:ship"),
        ],
        [InlineKeyboardButton("🪐 Conquer Planet", callback_data="space:planet")],
        [InlineKeyboardButton("📊 Empire Stats", callback_data="space:stats")],
        [
            InlineKeyboardButton("🔄 New Empire", callback_data="game:space"),
            InlineKeyboardButton("🎮 All Games", callback_data="menu:games"),
        ],
    ])


def _stats(state):
    return (
        "🚀 *Space Empire*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"💰 Credits: *{state['credits']}*\n"
        f"⛏️ Ore: *{state['ore']}*\n"
        f"⚡ Energy: *{state['energy']}*\n"
        f"🚀 Ships: *{state['ships']}*\n"
        f"🪐 Planets: *{state['planets']}*\n"
        f"🔬 Research: *{state['research']}*\n"
        f"📅 Turn: *{state['turn']}*\n"
        "━━━━━━━━━━━━━━━━━━"
    )


async def start_space_empire(query) -> None:
    uid = _uid(query)
    active_empires[uid] = _new_empire()
    state = active_empires[uid]
    await query.edit_message_text(
        "🚀 *Space Empire*\n\n"
        "তোমার নিজের space empire তৈরি করো!\n"
        "Ore সংগ্রহ করো, research করো, ships বানাও এবং নতুন planet দখল করো।\n\n"
        + _stats(state),
        parse_mode="Markdown",
        reply_markup=_menu(),
    )


async def handle_space_empire(query, data: str) -> None:
    uid = _uid(query)
    if uid not in active_empires:
        active_empires[uid] = _new_empire()
    state = active_empires[uid]
    action = data.split(":", 1)[1] if ":" in data else "stats"
    message = ""

    if action == "mine":
        if state["energy"] < 8:
            message = "⚠️ Mine চালানোর জন্য অন্তত 8 energy দরকার।"
        else:
            amount = random.randint(8, 16)
            state["energy"] -= 8
            state["ore"] += amount
            state["turn"] += 1
            message = f"⛏️ Mining complete! *+{amount} ore* পাওয়া গেছে।"

    elif action == "energy":
        amount = random.randint(12, 22)
        state["energy"] += amount
        state["turn"] += 1
        message = f"⚡ Solar generators চালু! *+{amount} energy*।"

    elif action == "research":
        cost = 15
        if state["credits"] < cost or state["energy"] < 10:
            message = "❌ Research-এর জন্য 15 credits এবং 10 energy দরকার।"
        else:
            gain = random.randint(5, 11)
            state["credits"] -= cost
            state["energy"] -= 10
            state["research"] += gain
            state["turn"] += 1
            message = f"🔬 Breakthrough! *+{gain} research* points।"

    elif action == "ship":
        cost_ore = 25
        cost_credit = 35
        if state["ore"] < cost_ore or state["credits"] < cost_credit:
            message = "❌ Ship বানাতে 25 ore + 35 credits দরকার।"
        else:
            state["ore"] -= cost_ore
            state["credits"] -= cost_credit
            state["ships"] += 1
            state["turn"] += 1
            message = "🚀 নতুন exploration ship তৈরি হয়েছে!"

    elif action == "planet":
        if state["ships"] < 2 or state["energy"] < 20:
            message = "🪐 Planet expedition-এর জন্য কমপক্ষে 2 ships এবং 20 energy দরকার।"
        else:
            name, reward, required_research = random.choice(PLANETS)
            state["energy"] -= 20
            state["turn"] += 1
            if state["research"] >= required_research and random.random() < 0.8:
                state["planets"] += 1
                state["credits"] += reward
                message = f"🪐 *{name}* সফলভাবে empire-এ যোগ হয়েছে!\n💰 Reward: +{reward} credits"
            else:
                message = f"🌌 *{name}* expedition ব্যর্থ হয়েছে। আরও research করো।"

    elif action == "stats":
        message = _stats(state)

    else:
        message = "❌ Unknown space action."

    if action != "stats":
        text = f"{message}\n\n{_stats(state)}"
    else:
        text = message

    await query.edit_message_text(
        text,
        parse_mode="Markdown",
        reply_markup=_menu(),
    )
