# bot/games/civilization_builder.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_civilizations = {}

ERAS = [
    ("🌾 Ancient Age", 100, 80, 60),
    ("🏰 Medieval Age", 180, 150, 120),
    ("⚙️ Industrial Age", 300, 260, 220),
    ("🚀 Modern Age", 500, 450, 400),
]


def _user_key(query):
    return query.from_user.id if query.from_user else query.message.chat_id


def _new_state():
    return {
        "name": "My Civilization",
        "gold": 150,
        "food": 120,
        "wood": 100,
        "stone": 80,
        "population": 10,
        "science": 0,
        "culture": 0,
        "happiness": 70,
        "level": 0,
        "buildings": {"farm": 0, "house": 0, "workshop": 0, "library": 0},
        "turn": 1,
    }


def _buttons(state):
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🌾 Gather Food", callback_data="civ:gather:food"),
            InlineKeyboardButton("🪵 Gather Wood", callback_data="civ:gather:wood"),
        ],
        [
            InlineKeyboardButton("🪨 Gather Stone", callback_data="civ:gather:stone"),
            InlineKeyboardButton("💰 Collect Tax", callback_data="civ:tax"),
        ],
        [
            InlineKeyboardButton("🏗️ Build", callback_data="civ:build"),
            InlineKeyboardButton("🔬 Research", callback_data="civ:research"),
        ],
        [InlineKeyboardButton("📜 Advance Era", callback_data="civ:era")],
        [InlineKeyboardButton("📊 Civilization Stats", callback_data="civ:stats")],
        [InlineKeyboardButton("🔄 New Civilization", callback_data="game:civilization")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def _text(state, message=""):
    era = ERAS[state["level"]][0]
    buildings = state["buildings"]
    return (
        "🏛️ *Civilization Builder*\n\n"
        f"🏳️ {state['name']}\n"
        f"📜 Era: *{era}*\n"
        f"📅 Turn: {state['turn']}\n\n"
        f"👥 Population: *{state['population']}*\n"
        f"💰 Gold: *{state['gold']}*\n"
        f"🍞 Food: *{state['food']}*\n"
        f"🪵 Wood: *{state['wood']}*\n"
        f"🪨 Stone: *{state['stone']}*\n"
        f"🔬 Science: *{state['science']}*\n"
        f"🎭 Culture: *{state['culture']}*\n"
        f"😊 Happiness: *{state['happiness']}%*\n\n"
        f"🏠 Buildings: Farm {buildings['farm']} | House {buildings['house']} | "
        f"Workshop {buildings['workshop']} | Library {buildings['library']}"
        + (f"\n\n💬 {message}" if message else "")
    )


async def start_civilization(query) -> None:
    key = _user_key(query)
    active_civilizations[key] = _new_state()
    await query.edit_message_text(
        _text(active_civilizations[key], "Build a civilization from a small settlement into a powerful empire!"),
        parse_mode="Markdown",
        reply_markup=_buttons(active_civilizations[key]),
    )


async def handle_civilization(query, data: str) -> None:
    key = _user_key(query)
    state = active_civilizations.setdefault(key, _new_state())

    if data == "game:civilization":
        await start_civilization(query)
        return

    message = ""

    if data.startswith("civ:gather:"):
        resource = data.split(":")[-1]
        gains = {"food": (18, 32), "wood": (14, 28), "stone": (10, 24)}
        gain = random.randint(*gains[resource])
        state[resource] += gain
        state["turn"] += 1
        state["happiness"] = max(0, state["happiness"] - 1)
        message = f"You gathered *{gain} {resource}*."

    elif data == "civ:tax":
        income = state["population"] * (4 + state["buildings"]["workshop"])
        state["gold"] += income
        state["turn"] += 1
        state["happiness"] = max(0, state["happiness"] - 2)
        message = f"🏦 Your treasury gained *{income} gold*."

    elif data == "civ:build":
        options = [
            ("farm", "🌾 Farm", 35, 20, "food", 30),
            ("house", "🏠 House", 45, 30, "population", 5),
            ("workshop", "⚒️ Workshop", 60, 45, "gold", 15),
            ("library", "📚 Library", 55, 35, "science", 12),
        ]
        # Rotate building type so the game remains one-click friendly.
        kind, label, wood_cost, stone_cost, stat, gain = options[state["turn"] % len(options)]
        if state["wood"] >= wood_cost and state["stone"] >= stone_cost:
            state["wood"] -= wood_cost
            state["stone"] -= stone_cost
            state["buildings"][kind] += 1
            if stat == "population":
                state[stat] += gain
            elif stat == "science":
                state[stat] += gain
            else:
                state[stat] += gain
            state["culture"] += 4
            state["turn"] += 1
            message = f"🏗️ Built *{label}*."
        else:
            message = f"❌ Need *{wood_cost} wood* and *{stone_cost} stone* to build {label}."

    elif data == "civ:research":
        cost = 35 + state["level"] * 25
        if state["gold"] >= cost:
            gain = random.randint(18, 30)
            state["gold"] -= cost
            state["science"] += gain
            state["culture"] += 5
            state["turn"] += 1
            message = f"🔬 Research complete! +*{gain} science*."
        else:
            message = f"❌ Research costs *{cost} gold*."

    elif data == "civ:era":
        if state["level"] >= len(ERAS) - 1:
            message = "🏆 You have reached the final era! Your civilization is highly advanced."
        else:
            _, gold, food, stone = ERAS[state["level"] + 1]
            if state["gold"] >= gold and state["food"] >= food and state["stone"] >= stone and state["science"] >= 50:
                state["gold"] -= gold
                state["food"] -= food
                state["stone"] -= stone
                state["science"] -= 50
                state["level"] += 1
                state["population"] += 8
                state["culture"] += 15
                state["happiness"] = min(100, state["happiness"] + 8)
                state["turn"] += 1
                message = f"🎉 Your civilization entered *{ERAS[state['level']][0]}*!"
            else:
                message = f"❌ To advance, you need *{gold} gold, {food} food, {stone} stone and 50 science*."

    elif data == "civ:stats":
        score = (
            state["population"] * 5
            + state["gold"]
            + state["science"] * 3
            + state["culture"] * 3
            + sum(state["buildings"].values()) * 20
            + state["level"] * 150
        )
        message = f"🏆 Civilization Score: *{score}*"

    await query.edit_message_text(
        _text(state, message),
        parse_mode="Markdown",
        reply_markup=_buttons(state),
    )
