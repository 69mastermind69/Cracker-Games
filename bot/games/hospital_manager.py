# bot/games/hospital_manager.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_hospitals = {}

UPGRADES = {
    "beds": ("🛏️ Beds", 3, 120),
    "staff": ("👩‍⚕️ Staff", 2, 150),
    "equipment": ("🩺 Equipment", 2, 180),
    "pharmacy": ("💊 Pharmacy", 1, 220),
}

CASES = [
    ("🤒 Fever", 18, 8, 24),
    ("🩹 Minor Injury", 24, 10, 30),
    ("🤧 Infection", 30, 12, 38),
    ("🫁 Breathing Problem", 42, 16, 52),
    ("🧠 Neurological Case", 55, 22, 70),
]


def _uid(query):
    return query.from_user.id if query.from_user else query.message.chat_id


def _state(query):
    return active_hospitals.get(_uid(query))


def _keyboard(state):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🏥 Admit Patient", callback_data="hospital:admit")],
        [
            InlineKeyboardButton("💊 Treat", callback_data="hospital:treat"),
            InlineKeyboardButton("💰 Earn", callback_data="hospital:earn"),
        ],
        [InlineKeyboardButton("🛠️ Upgrade", callback_data="hospital:upgrade")],
        [InlineKeyboardButton("📊 Hospital Stats", callback_data="hospital:stats")],
        [InlineKeyboardButton("🔄 New Hospital", callback_data="game:hospital")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def _upgrade_keyboard():
    rows = []
    for key, (name, _, cost) in UPGRADES.items():
        rows.append([InlineKeyboardButton(f"{name}  •  ${cost}", callback_data=f"hospital:upgrade:{key}")])
    rows.append([InlineKeyboardButton("🔙 Back", callback_data="hospital:back")])
    return InlineKeyboardMarkup(rows)


def _text(state):
    return (
        "🏥 *Hospital Manager*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"💰 Budget: *${state['money']}*\n"
        f"👥 Patients: *{state['patients']}*\n"
        f"❤️ Treated: *{state['treated']}*\n"
        f"⭐ Reputation: *{state['reputation']}*\n"
        f"🏆 Score: *{state['score']}*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"🛏️ Beds: *{state['beds']}*\n"
        f"👩‍⚕️ Staff: *{state['staff']}*\n"
        f"🩺 Equipment: *{state['equipment']}*\n"
        f"💊 Pharmacy: *{state['pharmacy']}*\n\n"
        "Run your hospital and keep patients healthy!"
    )


async def start_hospital(query) -> None:
    uid = _uid(query)
    active_hospitals[uid] = {
        "money": 500,
        "patients": 0,
        "treated": 0,
        "reputation": 50,
        "score": 0,
        "beds": 5,
        "staff": 2,
        "equipment": 1,
        "pharmacy": 1,
        "current_case": None,
    }
    state = active_hospitals[uid]
    await query.edit_message_text(_text(state), parse_mode="Markdown", reply_markup=_keyboard(state))


async def _admit(query, state):
    capacity = state["beds"]
    if state["patients"] >= capacity:
        await query.edit_message_text(
            "🏥 *No Empty Beds*\n\nUpgrade your beds or treat current patients first.",
            parse_mode="Markdown",
            reply_markup=_keyboard(state),
        )
        return

    case = random.choice(CASES)
    state["patients"] += 1
    state["current_case"] = case
    name, reward, cost, _ = case
    await query.edit_message_text(
        "🧑‍⚕️ *New Patient*\n\n"
        f"🩺 Case: *{name}*\n"
        f"💵 Treatment cost: *${cost}*\n"
        f"💰 Potential revenue: *${reward}*\n\n"
        "Press *Treat* to care for the patient.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💊 Treat Patient", callback_data="hospital:treat")],
            [InlineKeyboardButton("🔙 Back", callback_data="hospital:back")],
        ]),
    )


async def _treat(query, state):
    if state["patients"] <= 0 or not state["current_case"]:
        await query.edit_message_text(
            "🏥 *No Patient Waiting*\n\nAdmit a patient first.",
            parse_mode="Markdown",
            reply_markup=_keyboard(state),
        )
        return

    name, reward, cost, difficulty = state["current_case"]
    success_chance = min(95, 55 + state["staff"] * 7 + state["equipment"] * 8 + state["pharmacy"] * 4)
    success = random.randint(1, 100) <= success_chance
    state["patients"] -= 1
    state["current_case"] = None

    if success:
        income = reward + random.randint(0, 8)
        state["money"] += income
        state["treated"] += 1
        state["reputation"] = min(100, state["reputation"] + 3)
        state["score"] += difficulty + 10
        result = (
            "✅ *Treatment Successful!*\n\n"
            f"🩺 {name}\n"
            f"💰 Earned: *${income}*\n"
            "⭐ Reputation +3"
        )
    else:
        state["money"] = max(0, state["money"] - max(5, cost // 2))
        state["reputation"] = max(0, state["reputation"] - 2)
        state["score"] = max(0, state["score"] + difficulty // 3)
        result = (
            "⚠️ *Treatment Failed*\n\n"
            f"🩺 {name}\n"
            "💸 Extra resources were used.\n"
            "⭐ Reputation -2"
        )

    await query.edit_message_text(
        result + "\n\n" + _text(state),
        parse_mode="Markdown",
        reply_markup=_keyboard(state),
    )


async def _earn(query, state):
    if state["patients"] > 0:
        await query.edit_message_text(
            "🏥 *Patients Need Attention*\n\nTreat the waiting patient before collecting an operating bonus.",
            parse_mode="Markdown",
            reply_markup=_keyboard(state),
        )
        return
    bonus = 25 + state["reputation"] // 5 + state["staff"] * 4
    state["money"] += bonus
    state["score"] += 5
    await query.edit_message_text(
        f"💼 *Daily Hospital Income*\n\nYou earned *${bonus}* from hospital operations.\n\n" + _text(state),
        parse_mode="Markdown",
        reply_markup=_keyboard(state),
    )


async def _upgrade_menu(query):
    await query.edit_message_text(
        "🛠️ *Hospital Upgrades*\n\nChoose an upgrade:",
        parse_mode="Markdown",
        reply_markup=_upgrade_keyboard(),
    )


async def _upgrade(query, state, key):
    if key not in UPGRADES:
        return
    name, amount, cost = UPGRADES[key]
    if state["money"] < cost:
        await query.edit_message_text(
            f"❌ *Not Enough Budget*\n\n{name} needs *${cost}*.\nYou have *${state['money']}*.",
            parse_mode="Markdown",
            reply_markup=_upgrade_keyboard(),
        )
        return

    state["money"] -= cost
    state[key] += amount
    state["score"] += 15
    await query.edit_message_text(
        f"✅ *Upgrade Complete!*\n\n{name} increased by *+{amount}*.\n\n" + _text(state),
        parse_mode="Markdown",
        reply_markup=_keyboard(state),
    )


async def _stats(query, state):
    await query.edit_message_text(
        "📊 *Hospital Statistics*\n\n"
        f"💰 Budget: *${state['money']}*\n"
        f"🧑‍⚕️ Patients Treated: *{state['treated']}*\n"
        f"⭐ Reputation: *{state['reputation']}/100*\n"
        f"🏆 Hospital Score: *{state['score']}*\n"
        f"🛏️ Bed Capacity: *{state['beds']}*\n"
        f"👩‍⚕️ Staff Level: *{state['staff']}*\n"
        f"🩺 Equipment Level: *{state['equipment']}*\n"
        f"💊 Pharmacy Level: *{state['pharmacy']}*",
        parse_mode="Markdown",
        reply_markup=_keyboard(state),
    )


async def handle_hospital(query, data) -> None:
    state = _state(query)
    if data == "game:hospital":
        await start_hospital(query)
        return
    if not state:
        await start_hospital(query)
        return
    if data == "hospital:admit":
        await _admit(query, state)
    elif data == "hospital:treat":
        await _treat(query, state)
    elif data == "hospital:earn":
        await _earn(query, state)
    elif data == "hospital:upgrade":
        await _upgrade_menu(query)
    elif data.startswith("hospital:upgrade:"):
        await _upgrade(query, state, data.split(":", 2)[2])
    elif data == "hospital:stats":
        await _stats(query, state)
    elif data == "hospital:back":
        await query.edit_message_text(_text(state), parse_mode="Markdown", reply_markup=_keyboard(state))
