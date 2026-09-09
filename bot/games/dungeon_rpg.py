# bot/games/dungeon_rpg.py

import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# Temporary RAM state only. Existing games are not modified.
active_dungeons = {}

MONSTERS = [
    {"name": "Goblin", "emoji": "👹", "hp": 30, "damage": (5, 9), "xp": 15, "gold": (8, 16)},
    {"name": "Dire Wolf", "emoji": "🐺", "hp": 38, "damage": (6, 11), "xp": 20, "gold": (10, 20)},
    {"name": "Skeleton", "emoji": "💀", "hp": 45, "damage": (7, 12), "xp": 25, "gold": (12, 24)},
    {"name": "Orc", "emoji": "👺", "hp": 55, "damage": (8, 14), "xp": 32, "gold": (15, 28)},
]

BOSSES = [
    {"name": "Dark Guardian", "emoji": "🛡️", "hp": 85, "damage": (10, 17), "xp": 60, "gold": (35, 55)},
    {"name": "Dungeon Dragon", "emoji": "🐉", "hp": 120, "damage": (12, 22), "xp": 100, "gold": (60, 100)},
]


def _user_id(query):
    return query.from_user.id if query.from_user else None


def _new_player():
    return {
        "hp": 100,
        "max_hp": 100,
        "potions": 3,
        "gold": 0,
        "xp": 0,
        "floor": 1,
        "kills": 0,
        "monster": None,
        "monster_hp": 0,
    }


def _bar(value, maximum, size=10):
    if maximum <= 0:
        return "░" * size
    filled = max(0, min(size, int(value / maximum * size)))
    return "█" * filled + "░" * (size - filled)


def _status(player):
    return (
        f"❤️ HP: {player['hp']}/{player['max_hp']} {_bar(player['hp'], player['max_hp'])}\n"
        f"🧪 Potions: {player['potions']}\n"
        f"💰 Gold: {player['gold']}\n"
        f"⭐ XP: {player['xp']}\n"
        f"🏆 Kills: {player['kills']}"
    )


def _games_button():
    return InlineKeyboardButton("🎮 All Games", callback_data="menu:games")


def _battle_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("⚔️ Attack", callback_data="dungeon:attack"),
            InlineKeyboardButton("🧪 Potion", callback_data="dungeon:potion"),
        ],
        [InlineKeyboardButton("🏃 Run", callback_data="dungeon:run")],
    ])


def _end_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔄 Play Again", callback_data="game:dungeon")],
        [_games_button()],
    ])


def _next_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🚪 Next Floor", callback_data="dungeon:next")],
        [_games_button()],
    ])


def _new_monster(floor):
    monster = random.choice(BOSSES if floor % 5 == 0 else MONSTERS).copy()
    scale = 1 + min(floor - 1, 10) * 0.08
    monster["hp"] = int(monster["hp"] * scale)
    monster["damage"] = (
        max(1, int(monster["damage"][0] * scale)),
        max(1, int(monster["damage"][1] * scale)),
    )
    monster["xp"] = int(monster["xp"] * scale)
    monster["gold"] = (
        int(monster["gold"][0] * scale),
        int(monster["gold"][1] * scale),
    )
    return monster


def _battle_text(player):
    monster = player["monster"]
    boss = "\n👑 *BOSS FLOOR!*" if player["floor"] % 5 == 0 else ""
    return (
        "🏰 *Dungeon RPG*\n\n"
        f"📍 Floor: *{player['floor']}*{boss}\n\n"
        f"{monster['emoji']} *{monster['name']}*\n"
        f"❤️ Monster HP: {player['monster_hp']}/{monster['hp']} "
        f"{_bar(player['monster_hp'], monster['hp'])}\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"{_status(player)}\n\n"
        "⚔️ Choose your action:"
    )


async def _spawn_floor(query, player):
    monster = _new_monster(player["floor"])
    player["monster"] = monster
    player["monster_hp"] = monster["hp"]
    await query.edit_message_text(
        _battle_text(player),
        parse_mode="Markdown",
        reply_markup=_battle_keyboard(),
    )


async def start_dungeon(query):
    """Start a fresh Dungeon RPG run. Callback: game:dungeon"""
    user_id = _user_id(query)
    if user_id is None:
        return

    active_dungeons[user_id] = _new_player()
    await query.edit_message_text(
        "🏰 *Dungeon RPG*\n\n"
        "তোমার adventure শুরু হয়েছে!\n\n"
        "⚔️ Monster defeat করো\n"
        "🧪 Potion ব্যবহার করো\n"
        "💰 Gold ও ⭐ XP সংগ্রহ করো\n"
        "👑 প্রতি ৫th floor-এ boss আছে!\n\n"
        "Ready?",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🚪 Enter Dungeon", callback_data="dungeon:next")],
            [_games_button()],
        ]),
    )


async def _attack(query, player):
    monster = player["monster"]
    damage = random.randint(9, 17)
    player["monster_hp"] = max(0, player["monster_hp"] - damage)

    if player["monster_hp"] == 0:
        xp_gain = monster["xp"]
        gold_gain = random.randint(*monster["gold"])
        heal = random.randint(5, 12)
        player["xp"] += xp_gain
        player["gold"] += gold_gain
        player["kills"] += 1
        player["hp"] = min(player["max_hp"], player["hp"] + heal)
        await query.edit_message_text(
            "⚔️ *Victory!*\n\n"
            f"You defeated {monster['emoji']} *{monster['name']}*!\n\n"
            f"💥 Damage: *{damage}*\n⭐ XP: *+{xp_gain}*\n"
            f"💰 Gold: *+{gold_gain}*\n💚 Recovery: *+{heal} HP*\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            f"{_status(player)}\n\n"
            "🚪 Continue to the next floor?",
            parse_mode="Markdown",
            reply_markup=_next_keyboard(),
        )
        return

    monster_damage = random.randint(*monster["damage"])
    player["hp"] = max(0, player["hp"] - monster_damage)

    if player["hp"] == 0:
        active_dungeons.pop(_user_id(query), None)
        await query.edit_message_text(
            "💀 *Dungeon Over*\n\n"
            f"You dealt *{damage} damage*.\n"
            f"{monster['emoji']} {monster['name']} countered for *{monster_damage} damage*.\n\n"
            "❤️ Your HP reached 0.",
            parse_mode="Markdown",
            reply_markup=_end_keyboard(),
        )
        return

    await query.edit_message_text(
        "⚔️ *Battle!*\n\n"
        f"💥 You dealt *{damage} damage*.\n"
        f"💢 Monster dealt *{monster_damage} damage*.\n\n"
        f"{_battle_text(player)}",
        parse_mode="Markdown",
        reply_markup=_battle_keyboard(),
    )


async def _potion(query, player):
    if player["potions"] <= 0:
        await query.answer("🧪 No potions left!", show_alert=True)
        return

    if player["hp"] >= player["max_hp"]:
        await query.answer("❤️ Your HP is already full!", show_alert=True)
        return

    monster = player["monster"]
    old_hp = player["hp"]
    player["hp"] = min(player["max_hp"], player["hp"] + random.randint(18, 30))
    healed = player["hp"] - old_hp
    player["potions"] -= 1

    monster_damage = random.randint(*monster["damage"])
    player["hp"] = max(0, player["hp"] - monster_damage)

    if player["hp"] == 0:
        active_dungeons.pop(_user_id(query), None)
        await query.edit_message_text(
            "💀 *Dungeon Over*\n\n"
            f"🧪 Potion healed *{healed} HP*.\n"
            f"{monster['emoji']} {monster['name']} attacked for *{monster_damage} damage*.\n\n"
            "❤️ Your HP reached 0.",
            parse_mode="Markdown",
            reply_markup=_end_keyboard(),
        )
        return

    await query.edit_message_text(
        "🧪 *Potion Used!*\n\n"
        f"💚 Healed: *+{healed} HP*\n"
        f"💢 Counterattack: *-{monster_damage} HP*\n\n"
        f"{_battle_text(player)}",
        parse_mode="Markdown",
        reply_markup=_battle_keyboard(),
    )


async def _run(query, player):
    user_id = _user_id(query)
    if random.random() < 0.65:
        active_dungeons.pop(user_id, None)
        await query.edit_message_text(
            "🏃 *Escaped!*\n\n"
            "তুমি dungeon থেকে নিরাপদে বের হয়ে এসেছো।\n\n"
            f"🏆 Floors cleared: *{player['floor'] - 1}*\n"
            f"💰 Gold collected: *{player['gold']}*\n"
            f"⭐ XP earned: *{player['xp']}*",
            parse_mode="Markdown",
            reply_markup=_end_keyboard(),
        )
        return

    monster = player["monster"]
    damage = random.randint(*monster["damage"])
    player["hp"] = max(0, player["hp"] - damage)

    if player["hp"] == 0:
        active_dungeons.pop(user_id, None)
        await query.edit_message_text(
            "💀 *Escape Failed!*\n\n"
            f"{monster['emoji']} {monster['name']} caught you and dealt *{damage} damage*.\n\n"
            "Your adventure has ended.",
            parse_mode="Markdown",
            reply_markup=_end_keyboard(),
        )
        return

    await query.edit_message_text(
        "🏃 *Escape Failed!*\n\n"
        f"{monster['emoji']} {monster['name']} caught you.\n"
        f"💢 Damage taken: *{damage} HP*\n\n"
        f"{_battle_text(player)}",
        parse_mode="Markdown",
        reply_markup=_battle_keyboard(),
    )


async def _next_floor(query, player):
    player["floor"] += 1
    if player["floor"] % 3 == 0:
        player["potions"] += 1
    if player["floor"] > 1 and (player["floor"] - 1) % 5 == 0:
        player["hp"] = player["max_hp"]
    await _spawn_floor(query, player)


async def handle_dungeon(query, data):
    """Handle dungeon:* callbacks."""
    user_id = _user_id(query)
    if user_id is None:
        return

    player = active_dungeons.get(user_id)
    if player is None:
        await query.edit_message_text(
            "🏰 *Dungeon session not found.*\n\nনতুন adventure শুরু করো।",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🏰 Start Dungeon", callback_data="game:dungeon")],
                [_games_button()],
            ]),
        )
        return

    if data == "dungeon:next":
        await _next_floor(query, player)
    elif data == "dungeon:attack":
        await _attack(query, player)
    elif data == "dungeon:potion":
        await _potion(query, player)
    elif data == "dungeon:run":
        await _run(query, player)
    else:
        await query.answer("Unknown dungeon action.", show_alert=True)
'''
Path('/mnt/data/dungeon_rpg.py').write_text(code, encoding='utf-8')
print('created', len(code.splitlines()), 'lines')
