# bot/games/fantasy_quest.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_quests = {}

HERO_CLASSES = {
    "warrior": {"name": "⚔️ Warrior", "hp": 120, "power": 18},
    "mage": {"name": "🔮 Mage", "hp": 90, "power": 24},
    "ranger": {"name": "🏹 Ranger", "hp": 105, "power": 21},
}

LOCATIONS = [
    ("🌲 Whispering Forest", 1),
    ("🏔️ Frostpeak Pass", 2),
    ("🏰 Ruined Castle", 3),
    ("🌋 Ember Caverns", 4),
]

ENEMIES = [
    ("👹 Goblin Scout", 35, 8),
    ("🐺 Shadow Wolf", 45, 10),
    ("🧟 Ancient Guardian", 60, 12),
    ("🐉 Young Dragon", 85, 16),
]


def main_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⚔️ Adventure", callback_data="fantasy:adventure")],
        [
            InlineKeyboardButton("🎒 Inventory", callback_data="fantasy:inventory"),
            InlineKeyboardButton("📊 Stats", callback_data="fantasy:stats"),
        ],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def class_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("⚔️ Warrior", callback_data="fantasy:class:warrior"),
            InlineKeyboardButton("🔮 Mage", callback_data="fantasy:class:mage"),
        ],
        [InlineKeyboardButton("🏹 Ranger", callback_data="fantasy:class:ranger")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def adventure_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🗺️ Explore", callback_data="fantasy:explore")],
        [InlineKeyboardButton("🧪 Use Potion", callback_data="fantasy:potion")],
        [InlineKeyboardButton("🏠 Return to Camp", callback_data="fantasy:camp")],
    ])


def combat_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("⚔️ Attack", callback_data="fantasy:attack"),
            InlineKeyboardButton("🧪 Potion", callback_data="fantasy:potion"),
        ],
        [InlineKeyboardButton("🏃 Retreat", callback_data="fantasy:retreat")],
    ])


def _user_id(query):
    return query.from_user.id if query.from_user else query.message.chat_id


def _state(query):
    return active_quests.get(_user_id(query))


def _text(state):
    hero = HERO_CLASSES[state["hero"]]
    return (
        f"⚔️ *Fantasy Quest*\n\n"
        f"{hero['name']} • Level {state['level']}\n"
        f"❤️ HP: *{state['hp']}/{state['max_hp']}*\n"
        f"✨ XP: *{state['xp']}*\n"
        f"💰 Gold: *{state['gold']}*\n"
        f"🏆 Quests: *{state['quests']}*"
    )


async def start_fantasy_quest(query) -> None:
    uid = _user_id(query)
    active_quests[uid] = {
        "hero": "warrior",
        "level": 1,
        "hp": 120,
        "max_hp": 120,
        "power": 18,
        "xp": 0,
        "gold": 50,
        "potions": 2,
        "quests": 0,
        "location": "Camp",
        "enemy": None,
    }
    await query.edit_message_text(
        "🧙 *Fantasy Quest*\n\n"
        "Choose your hero and begin an adventure across a magical realm!\n\n"
        "Which class will you play?",
        parse_mode="Markdown",
        reply_markup=class_menu(),
    )


async def handle_fantasy_quest(query, data: str) -> None:
    state = _state(query)
    if state is None:
        await start_fantasy_quest(query)
        return

    if data.startswith("fantasy:class:"):
        hero_key = data.split(":", 2)[2]
        hero = HERO_CLASSES.get(hero_key)
        if hero:
            state["hero"] = hero_key
            state["max_hp"] = hero["hp"]
            state["hp"] = hero["hp"]
            state["power"] = hero["power"]
        await query.edit_message_text(
            f"🧙 *{hero['name']} Selected!*\n\n"
            f"Your journey begins now.\n\n{_text(state)}",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )
        return

    if data == "fantasy:adventure":
        await query.edit_message_text(
            "🗺️ *Choose Your Adventure*\n\n"
            "Explore the realm and face whatever awaits you.",
            parse_mode="Markdown",
            reply_markup=adventure_menu(),
        )
        return

    if data == "fantasy:explore":
        location, difficulty = random.choice(LOCATIONS)
        enemy_name, base_hp, base_attack = random.choice(ENEMIES)
        enemy_hp = base_hp + (state["level"] - 1) * 8 + difficulty * 4
        enemy_attack = base_attack + (state["level"] - 1) * 2
        state["location"] = location
        state["enemy"] = {
            "name": enemy_name,
            "hp": enemy_hp,
            "max_hp": enemy_hp,
            "attack": enemy_attack,
        }
        await query.edit_message_text(
            f"📍 *{location}*\n\n"
            f"A wild {enemy_name} appears!\n\n"
            f"❤️ Enemy HP: *{enemy_hp}*\n"
            f"⚔️ Enemy Power: *{enemy_attack}*\n\n"
            "What will you do?",
            parse_mode="Markdown",
            reply_markup=combat_menu(),
        )
        return

    if data == "fantasy:attack":
        enemy = state.get("enemy")
        if not enemy:
            await query.edit_message_text(_text(state), parse_mode="Markdown", reply_markup=main_menu())
            return

        damage = random.randint(max(6, state["power"] - 5), state["power"] + 6)
        enemy["hp"] -= damage
        if enemy["hp"] <= 0:
            reward_xp = random.randint(18, 30) + state["level"] * 4
            reward_gold = random.randint(10, 25)
            state["xp"] += reward_xp
            state["gold"] += reward_gold
            state["quests"] += 1
            state["enemy"] = None
            leveled = False
            if state["xp"] >= state["level"] * 60:
                state["xp"] -= state["level"] * 60
                state["level"] += 1
                state["max_hp"] += 12
                state["hp"] = state["max_hp"]
                state["power"] += 4
                leveled = True
            level_text = f"\n🎉 *Level Up! You are now Level {state['level']}.*" if leveled else ""
            await query.edit_message_text(
                f"🏆 *Victory!*\n\n"
                f"You defeated {enemy['name']}.\n"
                f"✨ +{reward_xp} XP\n"
                f"💰 +{reward_gold} Gold\n"
                f"{level_text}\n"
                f"\n{_text(state)}",
                parse_mode="Markdown",
                reply_markup=main_menu(),
            )
            return

        enemy_damage = random.randint(max(3, enemy["attack"] - 4), enemy["attack"] + 3)
        state["hp"] -= enemy_damage
        if state["hp"] <= 0:
            state["hp"] = max(1, state["max_hp"] // 2)
            state["enemy"] = None
            await query.edit_message_text(
                "💫 *You were knocked out!*\n\n"
                "Your companions carried you safely back to camp.\n"
                f"\n{_text(state)}",
                parse_mode="Markdown",
                reply_markup=main_menu(),
            )
            return

        await query.edit_message_text(
            f"⚔️ *Battle Continues*\n\n"
            f"You dealt *{damage}* damage.\n"
            f"The enemy dealt *{enemy_damage}* damage.\n\n"
            f"❤️ Your HP: *{state['hp']}/{state['max_hp']}*\n"
            f"👹 Enemy HP: *{enemy['hp']}/{enemy['max_hp']}*",
            parse_mode="Markdown",
            reply_markup=combat_menu(),
        )
        return

    if data == "fantasy:potion":
        if state["potions"] <= 0:
            await query.edit_message_text(
                "🧪 *No Potions Left*\n\n"
                "You can return to camp and continue your adventure.",
                parse_mode="Markdown",
                reply_markup=adventure_menu(),
            )
            return
        state["potions"] -= 1
        heal = min(35, state["max_hp"] - state["hp"])
        state["hp"] += heal
        enemy = state.get("enemy")
        keyboard = combat_menu() if enemy else adventure_menu()
        await query.edit_message_text(
            f"🧪 *Potion Used!*\n\n"
            f"❤️ Restored *{heal} HP*.\n"
            f"Potions remaining: *{state['potions']}*\n\n"
            f"{_text(state)}",
            parse_mode="Markdown",
            reply_markup=keyboard,
        )
        return

    if data == "fantasy:retreat":
        state["enemy"] = None
        await query.edit_message_text(
            "🏃 *You Retreated Safely*\n\n"
            "The road is still waiting for you.",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )
        return

    if data == "fantasy:camp":
        state["hp"] = state["max_hp"]
        state["enemy"] = None
        await query.edit_message_text(
            "🏠 *Camp*\n\n"
            "You rested, recovered your HP, and prepared for the next adventure.\n\n"
            f"{_text(state)}",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )
        return

    if data == "fantasy:inventory":
        await query.edit_message_text(
            "🎒 *Inventory*\n\n"
            f"🧪 Health Potions: *{state['potions']}*\n"
            f"💰 Gold: *{state['gold']}*\n"
            f"⚔️ Power: *{state['power']}*",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )
        return

    if data == "fantasy:stats":
        await query.edit_message_text(
            "📊 *Hero Stats*\n\n"
            f"🧙 Class: *{HERO_CLASSES[state['hero']]['name']}*\n"
            f"⭐ Level: *{state['level']}*\n"
            f"❤️ HP: *{state['hp']}/{state['max_hp']}*\n"
            f"⚔️ Power: *{state['power']}*\n"
            f"✨ XP: *{state['xp']}*\n"
            f"🏆 Victories: *{state['quests']}*\n"
            f"💰 Gold: *{state['gold']}*",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )
        return
