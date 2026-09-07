# bot/callbacks.py

from telegram import Update
from telegram.ext import ContextTypes

from bot.handlers import games_menu


async def show_games_menu(query):
    await query.edit_message_text(
        "🎮 *Choose a Game*",
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


async def button_callback(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    query = update.callback_query
    data = query.data

    await query.answer()

    # ========================================================
    # MAIN GAMES
    # ========================================================

    if data == "game:dice":
        from bot.games.dice import start_dice
        await start_dice(query)
        return

    if data == "game:coin":
        from bot.games.coin import start_coin
        await start_coin(query)
        return

    if data == "game:rps":
        from bot.games.rps import start_rps
        await start_rps(query)
        return

    if data.startswith("rps:"):
        from bot.games.rps import handle_rps
        await handle_rps(query, data)
        return

    if data == "game:number":
        from bot.games.number import start_number
        await start_number(query)
        return

    if data.startswith("number:"):
        from bot.games.number import handle_number
        await handle_number(query, data)
        return

    if data == "game:quiz":
        from bot.games.quiz import start_quiz
        await start_quiz(query)
        return

    if data == "quiz:next":
        from bot.games.quiz import start_quiz
        await start_quiz(query)
        return

    if data.startswith("quiz:answer:"):
        from bot.games.quiz import handle_quiz_answer
        await handle_quiz_answer(query, data)
        return

    if data == "game:scramble":
        from bot.games.scramble import start_scramble
        await start_scramble(query)
        return

    if data.startswith("scramble:"):
        from bot.games.scramble import handle_scramble
        await handle_scramble(query, data)
        return

    if data == "game:hangman":
        from bot.games.hangman import start_hangman
        await start_hangman(query)
        return

    if data.startswith("hangman:"):
        from bot.games.hangman import handle_hangman
        await handle_hangman(query, data)
        return

    if data == "game:ttt":
        from bot.games.tictactoe import start_ttt
        await start_ttt(query)
        return

    if data.startswith("ttt:"):
        from bot.games.tictactoe import handle_ttt
        await handle_ttt(query, data)
        return

    if data == "game:connect4":
        from bot.games.connect4 import start_connect4
        await start_connect4(query)
        return

    if data.startswith("connect4:"):
        from bot.games.connect4 import handle_connect4
        await handle_connect4(query, data)
        return

    if data == "game:math":
        from bot.games.math_challenge import start_math
        await start_math(query)
        return

    if data.startswith("math:"):
        from bot.games.math_challenge import handle_math
        await handle_math(query, data)
        return

    if data == "game:memory":
        from bot.games.memory import start_memory
        await start_memory(query)
        return

    if data.startswith("memory:"):
        from bot.games.memory import handle_memory
        await handle_memory(query, data)
        return

    if data == "game:higher":
        from bot.games.higher_lower import start_higher
        await start_higher(query)
        return

    if data.startswith("higher:"):
        from bot.games.higher_lower import handle_higher
        await handle_higher(query, data)
        return

    # ========================================================
    # EXTRA GAMES
    # ========================================================

    if data == "extra:menu":
        from bot.games.extra_games import handle_extra_game
        await handle_extra_game(query, data)
        return

    if data.startswith("extra:"):
        from bot.games.extra_games import handle_extra_game
        await handle_extra_game(query, data)
        return

    # ========================================================
    # ALL GAMES MENU
    # ========================================================

    if data == "menu:games":
        await show_games_menu(query)
        return

    # ========================================================
    # UNKNOWN CALLBACK
    # ========================================================

    await query.answer(
        "❌ This game/action is not available.",
        show_alert=True,
    )
