# bot/games/survival_island.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup


active_survival = {}


def _key(query):
    return query.from_user.id


def _state(uid):
    return active_survival.get(uid)


def _menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🌴 Explore", callback_data="survival:explore")],
        [
            InlineKeyboardButton("🪵 Gather", callback_data="survival:gather"),
            InlineKeyboardButton("🍖 Hunt", callback_data="survival:hunt"),
        ],
        [
            InlineKeyboardButton("💧 Rest", callback_data="survival:rest"),
            InlineKeyboardButton("🏕️ Camp", callback_data="survival:camp"),
        ],
        [InlineKeyboardButton("🏆 Island Stats", callback_data="survival:stats")],
        [InlineKeyboardButton("🔄 New Island", callback_data="game:survival")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def _text(s):
    return (
        "🏝️ *Survival Island*\n\n"
        f"❤️ Health: *{s['health']}*   💧 Water: *{s['water']}*\n"
        f"🍖 Food: *{s['food']}*   🪵 Wood: *{s['wood']}*\n"
        f"🏕️ Shelter: *{s['shelter']}*   📅 Day: *{s['day']}*\n\n"
        f"📜 {s['message']}"
    )


def _new_state():
    return {
        "health": 100,
        "water": 70,
        "food": 60,
        "wood": 5,
        "shelter": 0,
        "day": 1,
        "message": "তুমি একটি নির্জন দ্বীপে পৌঁছেছ। বাঁচতে হলে resources সংগ্রহ করো!",
    }


def _finish_if_needed(s):
    if s["health"] <= 0 or s["water"] <= 0:
        s["health"] = max(0, s["health"])
        s["water"] = max(0, s["water"])
        s["message"] = "🌊 Survival failed! Resources শেষ হয়ে গেছে। নতুন island শুরু করো।"
        return True
    return False


async def start_survival(query) -> None:
    uid = _key(query)
    active_survival[uid] = _new_state()
    s = active_survival[uid]
    await query.edit_message_text(_text(s), parse_mode="Markdown", reply_markup=_menu())


async def handle_survival(query, data: str) -> None:
    uid = _key(query)

    if data == "game:survival":
        await start_survival(query)
        return

    s = _state(uid)
    if not s:
        await start_survival(query)
        return

    action = data.split(":", 1)[1] if ":" in data else ""

    if action == "gather":
        amount = random.randint(2, 5)
        s["wood"] += amount
        s["water"] -= 5
        s["food"] -= 2
        s["message"] = f"🪵 তুমি {amount} wood সংগ্রহ করেছ।"

    elif action == "hunt":
        if random.random() < 0.72:
            amount = random.randint(8, 18)
            s["food"] += amount
            s["message"] = f"🍖 Hunting সফল! +{amount} food পেয়েছ।"
        else:
            s["health"] -= random.randint(5, 12)
            s["message"] = "🐾 Hunting ব্যর্থ হয়েছে এবং তুমি সামান্য আহত হয়েছ।"
        s["water"] -= 7
        s["food"] -= 3

    elif action == "rest":
        if s["food"] >= 5 and s["water"] >= 8:
            heal = 12 + s["shelter"] * 4
            s["food"] -= 5
            s["water"] -= 8
            s["health"] = min(100, s["health"] + heal)
            s["message"] = f"💧 তুমি বিশ্রাম নিয়েছ। +{heal} health ফিরে পেয়েছ।"
        else:
            s["message"] = "❌ Rest করার মতো যথেষ্ট food/water নেই।"

    elif action == "camp":
        cost = 6 + s["shelter"] * 4
        if s["wood"] >= cost:
            s["wood"] -= cost
            s["shelter"] += 1
            s["message"] = f"🏕️ Shelter উন্নত হয়েছে! Level {s['shelter']}."
        else:
            s["message"] = f"❌ Shelter upgrade করতে {cost} wood দরকার।"

    elif action == "explore":
        s["day"] += 1
        s["water"] -= random.randint(7, 12)
        s["food"] -= random.randint(3, 7)

        roll = random.randint(1, 5)
        if roll == 1:
            bonus = random.randint(5, 12)
            s["wood"] += bonus
            s["message"] = f"🪵 জঙ্গলে নতুন resource পেয়েছ: +{bonus} wood!"
        elif roll == 2:
            bonus = random.randint(6, 15)
            s["food"] += bonus
            s["message"] = f"🍓 খাবারের source পেয়েছ: +{bonus} food!"
        elif roll == 3:
            s["water"] += 15
            s["message"] = "💧 একটি freshwater spring খুঁজে পেয়েছ! +15 water."
        elif roll == 4:
            s["health"] -= random.randint(4, 10)
            s["message"] = "🌧️ ঝড়ের মধ্যে পড়েছ। কিছু health হারিয়েছ।"
        else:
            s["message"] = "🗺️ দ্বীপের নতুন একটি অংশ আবিষ্কার করেছ!"

    elif action == "stats":
        await query.edit_message_text(
            "🏆 *Island Stats*\n\n"
            f"📅 Days survived: *{s['day']}*\n"
            f"❤️ Health: *{s['health']}*\n"
            f"💧 Water: *{s['water']}*\n"
            f"🍖 Food: *{s['food']}*\n"
            f"🪵 Wood: *{s['wood']}*\n"
            f"🏕️ Shelter level: *{s['shelter']}*\n\n"
            "আরও resource সংগ্রহ করে island-এ টিকে থাকো!",
            parse_mode="Markdown",
            reply_markup=_menu(),
        )
        return

    s["health"] = max(0, min(100, s["health"]))
    s["water"] = max(0, min(100, s["water"]))
    s["food"] = max(0, s["food"])
    s["wood"] = max(0, s["wood"])

    if _finish_if_needed(s):
        await query.edit_message_text(_text(s), parse_mode="Markdown", reply_markup=_menu())
        return

    await query.edit_message_text(_text(s), parse_mode="Markdown", reply_markup=_menu())
