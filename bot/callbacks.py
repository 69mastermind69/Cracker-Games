# bot/callbacks.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from bot.handlers import games_menu

async def show_games_menu(query):
    await query.edit_message_text(
        "🎮 *Choose a Game*\n\nএকটি game নির্বাচন করো 👇",
        parse_mode="Markdown", reply_markup=games_menu(),
    )

async def show_developer(query):
    keyboard = [
        [InlineKeyboardButton("📱 Telegram", url="https://t.me/Do_x_Die")],
        [InlineKeyboardButton("🔙 Back to Games", callback_data="menu:games")],
    ]
    await query.edit_message_text(
        "👨‍💻 *Developer*\n\n━━━━━━━━━━━━━━━━━━\n"
        "👤 *Name:* MASTERMIND\n📱 *Telegram:* @Do_x_Die\n"
        "━━━━━━━━━━━━━━━━━━\n\n🎮 Cracker Games Developer",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query is None:
        return
    data = query.data or ""
    await query.answer()

    if data == "menu:games":
        await show_games_menu(query); return
    if data == "developer":
        await show_developer(query); return

    # Original games
    if data == "game:dice":
        from bot.games.dice import start_dice
        await start_dice(query); return
    if data == "game:coin":
        from bot.games.coin import start_coin
        await start_coin(query); return
    if data == "game:rps":
        from bot.games.rps import start_rps
        await start_rps(query); return
    if data.startswith("rps:"):
        from bot.games.rps import handle_rps
        await handle_rps(query, data); return
    if data == "game:number":
        from bot.games.number_guess import start_number_guess
        await start_number_guess(query); return
    if data.startswith("number:"):
        from bot.games.number_guess import handle_number_guess
        await handle_number_guess(query, data); return
    if data == "game:quiz":
        from bot.games.quiz import start_quiz
        await start_quiz(query); return
    if data == "quiz:next":
        from bot.games.quiz import continue_quiz
        await continue_quiz(query); return
    if data.startswith("quiz:answer:"):
        from bot.games.quiz import handle_quiz
        await handle_quiz(query, data); return
    if data == "game:scramble":
        from bot.games.scramble import start_scramble
        await start_scramble(query); return
    if data.startswith("scramble:"):
        from bot.games.scramble import handle_scramble
        await handle_scramble(query, data); return
    if data == "game:hangman":
        from bot.games.hangman import start_hangman
        await start_hangman(query); return
    if data.startswith("hangman:"):
        from bot.games.hangman import handle_hangman
        await handle_hangman(query, data); return
    if data == "game:ttt":
        from bot.games.tictactoe import start_tictactoe
        await start_tictactoe(query); return
    if data.startswith("ttt:"):
        from bot.games.tictactoe import handle_tictactoe
        await handle_tictactoe(query, data); return
    if data == "game:connect4":
        from bot.games.connect4 import start_connect4
        await start_connect4(query); return
    if data.startswith("connect4:"):
        from bot.games.connect4 import handle_connect4
        await handle_connect4(query, data); return
    if data == "game:math":
        from bot.games.math_challenge import start_math
        await start_math(query); return
    if data.startswith("math:"):
        from bot.games.math_challenge import handle_math
        await handle_math(query, data); return
    if data == "game:memory":
        from bot.games.memory import start_memory
        await start_memory(query); return
    if data.startswith("memory:"):
        from bot.games.memory import handle_memory
        await handle_memory(query, data); return
    if data == "game:higher":
        from bot.games.higher_lower import start_higher_lower
        await start_higher_lower(query); return
    if data.startswith("higher:"):
        from bot.games.higher_lower import handle_higher_lower
        await handle_higher_lower(query, data); return

    # New games
    if data == "game:dungeon" or data.startswith("dungeon:"):
        from bot.games.dungeon_rpg import start_dungeon, handle_dungeon
        if data == "game:dungeon":
            await start_dungeon(query)
        else:
            await handle_dungeon(query, data)
        return

    if data == "game:detective" or data.startswith("detective:"):
        from bot.games.detective_case import start_detective, handle_detective
        if data == "game:detective":
            await start_detective(query)
        else:
            await handle_detective(query, data)
        return

    if data == "game:world" or data.startswith("world:"):
        from bot.games.world_conquest import start_world_conquest, handle_world_conquest
        if data == "game:world":
            await start_world_conquest(query)
        else:
            await handle_world_conquest(query, data)
        return

    if data == "game:railway" or data.startswith("railway:"):
        from bot.games.railway_tycoon import start_railway_tycoon, handle_railway_tycoon
        if data == "game:railway":
            await start_railway_tycoon(query)
        else:
            await handle_railway_tycoon(query, data)
        return

    if data == "game:survival" or data.startswith("survival:"):
        from bot.games.survival_island import start_survival, handle_survival
        if data == "game:survival":
            await start_survival(query)
        else:
            await handle_survival(query, data)
        return

    if data == "game:space" or data.startswith("space:"):
        from bot.games.space_empire import start_space_empire, handle_space_empire
        if data == "game:space":
            await start_space_empire(query)
        else:
            await handle_space_empire(query, data)
        return

    if data == "game:civilization" or data.startswith("civ:"):
        from bot.games.civilization_builder import start_civilization, handle_civilization
        if data == "game:civilization":
            await start_civilization(query)
        else:
            await handle_civilization(query, data)
        return

    if data == "game:hospital" or data.startswith("hospital:"):
        from bot.games.hospital_manager import start_hospital, handle_hospital
        if data == "game:hospital":
            await start_hospital(query)
        else:
            await handle_hospital(query, data)
        return

    if data == "game:fantasy" or data.startswith("fantasy:"):
        from bot.games.fantasy_quest import start_fantasy_quest, handle_fantasy_quest
        if data == "game:fantasy":
            await start_fantasy_quest(query)
        else:
            await handle_fantasy_quest(query, data)
        return

    if data == "game:escape" or data.startswith("escape:"):
        from bot.games.escape_room import start_escape_room, handle_escape_room
        if data == "game:escape":
            await start_escape_room(query)
        else:
            await handle_escape_room(query, data)
        return

    if data.startswith("extra:"):
        from bot.games.extra_games import handle_extra_game
        await handle_extra_game(query, data)
        return

    await query.edit_message_text(
        "❌ *Game পাওয়া যায়নি!*\n\nGames menu-তে ফিরে যাও 👇",
        parse_mode="Markdown", reply_markup=games_menu(),
    )
