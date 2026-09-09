# bot/games/world_conquest.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup


active_worlds = {}

COUNTRIES = [
    ("🇧🇩", "Bangladesh", 18),
    ("🇮🇳", "India", 24),
    ("🇯🇵", "Japan", 16),
    ("🇧🇷", "Brazil", 22),
    ("🇫🇷", "France", 17),
    ("🇪🇬", "Egypt", 15),
    ("🇦🇺", "Australia", 20),
    ("🇨🇦", "Canada", 21),
    ("🇹🇷", "Turkey", 19),
    ("🇿🇦", "South Africa", 16),
    ("🇲🇽", "Mexico", 18),
    ("🇰🇷", "South Korea", 17),
]


def all_games_button():
    return InlineKeyboardButton("🎮 All Games", callback_data="menu:games")


def world_menu(state):
    buttons = []
    for index, country in enumerate(state["countries"]):
        if country["owner"] == "enemy":
            buttons.append(
                InlineKeyboardButton(
                    f"⚔️ {country['flag']} {country['name']} ({country['power']})",
                    callback_data=f"world:attack:{index}",
                )
            )

    rows = [buttons[i:i + 2] for i in range(0, len(buttons), 2)]
    rows.append([
        InlineKeyboardButton("📊 World Map", callback_data="world:map"),
        InlineKeyboardButton("🏆 Status", callback_data="world:status"),
    ])
    rows.append([all_games_button()])
    return InlineKeyboardMarkup(rows)


def map_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⚔️ Choose Target", callback_data="world:board")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def status_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⚔️ Continue Conquest", callback_data="world:board")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def _user_key(query):
    if query.from_user:
        return query.from_user.id
    return query.message.chat_id


def _new_world():
    shuffled = COUNTRIES[:]
    random.shuffle(shuffled)

    countries = []
    for index, (flag, name, power) in enumerate(shuffled):
        countries.append({
            "flag": flag,
            "name": name,
            "power": power,
            "owner": "player" if index == 0 else "enemy",
            "base_power": power,
        })

    player_country = countries[0]
    return {
        "countries": countries,
        "player": player_country["name"],
        "army": 35,
        "gold": 80,
        "turn": 1,
        "conquered": 1,
        "score": 0,
        "streak": 0,
    }


def _player_country(state):
    for country in state["countries"]:
        if country["owner"] == "player":
            return country
    return None


def _enemy_count(state):
    return sum(1 for c in state["countries"] if c["owner"] == "enemy")


async def start_world_conquest(query) -> None:
    key = _user_key(query)
    state = _new_world()
    active_worlds[key] = state

    home = _player_country(state)
    await query.edit_message_text(
        "🌍 *World Conquest*\n\n"
        "তোমার empire শুরু হয়েছে! অন্য দেশগুলো conquer করে পুরো map দখল করো।\n\n"
        f"🏰 Capital: *{home['flag']} {home['name']}*\n"
        f"⚔️ Army: *{state['army']}*\n"
        f"💰 Gold: *{state['gold']}*\n"
        f"🏆 Score: *{state['score']}*\n\n"
        "একটি enemy country বেছে নাও 👇",
        parse_mode="Markdown",
        reply_markup=world_menu(state),
    )


async def _show_board(query, state):
    enemies = _enemy_count(state)
    if enemies == 0:
        await _finish(query, state)
        return

    await query.edit_message_text(
        "🌍 *Choose Your Next Target*\n\n"
        f"⚔️ Army: *{state['army']}*\n"
        f"💰 Gold: *{state['gold']}*\n"
        f"🏆 Score: *{state['score']}*\n\n"
        "⚔️ Attack করার জন্য একটি দেশ বেছে নাও:",
        parse_mode="Markdown",
        reply_markup=world_menu(state),
    )


async def _attack(query, state, index):
    if index < 0 or index >= len(state["countries"]):
        await _show_board(query, state)
        return

    target = state["countries"][index]
    if target["owner"] != "enemy":
        await _show_board(query, state)
        return

    army = state["army"]
    attack_power = random.randint(max(5, army - 8), army + 8)
    defense_power = target["power"] + random.randint(-4, 6)

    if attack_power >= defense_power:
        target["owner"] = "player"
        target["power"] = max(8, target["power"] - random.randint(1, 4))
        state["army"] = max(8, army - random.randint(3, 9))
        reward = random.randint(18, 35)
        state["gold"] += reward
        state["score"] += target["base_power"] * 5
        state["conquered"] += 1
        state["streak"] += 1

        if _enemy_count(state) == 0:
            await _finish(query, state)
            return

        enemy_counter = random.randint(0, 1)
        if enemy_counter and state["army"] > 10:
            loss = random.randint(2, 6)
            state["army"] = max(5, state["army"] - loss)
            counter_text = f"\n🛡️ Enemy counter-attack: -{loss} army"
        else:
            counter_text = ""

        state["turn"] += 1
        await query.edit_message_text(
            "🎉 *Victory!*\n\n"
            f"🏴 তুমি *{target['flag']} {target['name']}* দখল করেছো!\n"
            f"⚔️ Attack Power: *{attack_power}*\n"
            f"🛡️ Defense: *{defense_power}*\n"
            f"💰 Reward: +*{reward}* gold{counter_text}\n\n"
            f"⚔️ Army: *{state['army']}*\n"
            f"🏆 Score: *{state['score']}*\n"
            f"🌎 Countries controlled: *{state['conquered']}/{len(state['countries'])}*",
            parse_mode="Markdown",
            reply_markup=world_menu(state),
        )
    else:
        loss = random.randint(5, 11)
        state["army"] = max(3, army - loss)
        state["gold"] = max(0, state["gold"] - random.randint(3, 10))
        state["streak"] = 0
        state["turn"] += 1

        if state["army"] <= 3:
            await query.edit_message_text(
                "💥 *Defeat!*\n\n"
                f"তোমার army *{target['flag']} {target['name']}* জয় করতে পারেনি।\n\n"
                f"⚔️ Remaining Army: *{state['army']}*\n"
                f"🏆 Score: *{state['score']}*\n\n"
                "নতুন empire দিয়ে আবার শুরু করো!",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔄 New Empire", callback_data="game:world")],
                    [all_games_button()],
                ]),
            )
            active_worlds.pop(_user_key(query), None)
            return

        await query.edit_message_text(
            "❌ *Attack Failed*\n\n"
            f"{target['flag']} {target['name']} তোমার attack ঠেকিয়ে দিয়েছে।\n"
            f"⚔️ Your Power: *{attack_power}*\n"
            f"🛡️ Enemy Power: *{defense_power}*\n\n"
            f"📉 Army lost: *{loss}*\n"
            f"⚔️ Army: *{state['army']}*\n"
            f"💰 Gold: *{state['gold']}*\n\n"
            "আরেকটি strategy try করো।",
            parse_mode="Markdown",
            reply_markup=world_menu(state),
        )


async def _show_map(query, state):
    lines = []
    for country in state["countries"]:
        icon = "🟢" if country["owner"] == "player" else "🔴"
        lines.append(f"{icon} {country['flag']} {country['name']} — Power {country['power']}")

    await query.edit_message_text(
        "🗺️ *World Map*\n\n" + "\n".join(lines) +
        f"\n\n🏆 Score: *{state['score']}*",
        parse_mode="Markdown",
        reply_markup=map_menu(),
    )


async def _show_status(query, state):
    home = _player_country(state)
    await query.edit_message_text(
        "📊 *Empire Status*\n\n"
        f"🏰 Capital: *{home['flag']} {home['name']}*\n"
        f"⚔️ Army: *{state['army']}*\n"
        f"💰 Gold: *{state['gold']}*\n"
        f"🏆 Score: *{state['score']}*\n"
        f"🌍 Controlled: *{state['conquered']}/{len(state['countries'])}*\n"
        f"🔥 Win streak: *{state['streak']}*\n"
        f"📅 Turn: *{state['turn']}*",
        parse_mode="Markdown",
        reply_markup=status_menu(),
    )


async def _finish(query, state):
    bonus = 100 + state["gold"]
    state["score"] += bonus
    await query.edit_message_text(
        "👑 *WORLD CONQUERED!*\n\n"
        "🌎 তোমার empire পুরো world map দখল করেছে!\n\n"
        f"🏆 Final Score: *{state['score']}*\n"
        f"💰 Final Gold: *{state['gold']}*\n"
        f"⚔️ Remaining Army: *{state['army']}*\n"
        f"🔥 Best Streak: *{state['streak']}*\n\n"
        "তুমি এখন World Conqueror! 👑",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔄 New Empire", callback_data="game:world")],
            [all_games_button()],
        ]),
    )
    active_worlds.pop(_user_key(query), None)


async def handle_world_conquest(query, data: str) -> None:
    key = _user_key(query)

    if data == "game:world":
        await start_world_conquest(query)
        return

    state = active_worlds.get(key)
    if state is None:
        await start_world_conquest(query)
        return

    if data == "world:board":
        await _show_board(query, state)
        return

    if data == "world:map":
        await _show_map(query, state)
        return

    if data == "world:status":
        await _show_status(query, state)
        return

    if data.startswith("world:attack:"):
        try:
            index = int(data.rsplit(":", 1)[1])
        except ValueError:
            await _show_board(query, state)
            return
        await _attack(query, state, index)
        return

    await _show_board(query, state)
