from telegram import Update
from telegram.ext import ContextTypes

from bot.handlers import games_menu


# ==================================================
# BACK TO GAMES
# ==================================================

async def show_games_menu(query) -> None:
    await query.edit_message_text(
        "🎮 *Choose a Game*",
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


# ==================================================
# GAME CALLBACK CONTROLLER
# ==================================================

async def button_callback(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    await query.answer()

    data = query.data or ""

    # ------------------------------------------------
    # Main menu
    # ------------------------------------------------

    if data == "menu:games":
        await show_games_menu(query)
        return

    # ------------------------------------------------
    # Dice
    # ------------------------------------------------

    if data == "game:dice":
        from bot.games.dice import start_dice

        await start_dice(query)
        return

    # ------------------------------------------------
    # Coin Flip
    # ------------------------------------------------

    if data == "game:coin":
        from bot.games.coin import start_coin

        await start_coin(query)
        return

    # ------------------------------------------------
    # Rock Paper Scissors
    # ------------------------------------------------

    if data == "game:rps":
        from bot.games.rps import start_rps

        await start_rps(query)
        return

    if data.startswith("rps:"):
        from bot.games.rps import handle_rps

        await handle_rps(query, data)
        return

    # ------------------------------------------------
    # Number Guess
    # ------------------------------------------------

    if data == "game:number":
        from bot.games.number_guess import start_number_guess

        await start_number_guess(query)
        return

    if data.startswith("number:"):
        from bot.games.number_guess import handle_number_guess

        await handle_number_guess(query, data)
        return

    # ------------------------------------------------
    # Quiz
    # ------------------------------------------------

    if data == "game:quiz":
        from bot.games.quiz import start_quiz

        await start_quiz(query)
        return

    if data.startswith("quiz:"):
        from bot.games.quiz import handle_quiz

        await handle_quiz(query, data)
        return

    # ------------------------------------------------
    # Word Scramble
    # ------------------------------------------------

    if data == "game:scramble":
        from bot.games.scramble import start_scramble

        await start_scramble(query)
        return

    if data.startswith("scramble:"):
        from bot.games.scramble import handle_scramble

        await handle_scramble(query, data)
        return

    # ------------------------------------------------
    # Hangman
    # ------------------------------------------------

    if data == "game:hangman":
        from bot.games.hangman import start_hangman

        await start_hangman(query)
        return

    if data.startswith("hangman:"):
        from bot.games.hangman import handle_hangman

        await handle_hangman(query, data)
        return

    # ------------------------------------------------
    # Tic-Tac-Toe
    # ------------------------------------------------

    if data == "game:ttt":
        from bot.games.tictactoe import start_tictactoe

        await start_tictactoe(query)
        return

    if data.startswith("ttt:"):
        from bot.games.tictactoe import handle_tictactoe

        await handle_tictactoe(query, data)
        return

    # ------------------------------------------------
    # Connect Four
    # ------------------------------------------------

    if data == "game:connect4":
        from bot.games.connect4 import start_connect4

        await start_connect4(query)
        return

    if data.startswith("connect4:"):
        from bot.games.connect4 import handle_connect4

        await handle_connect4(query, data)
        return

    # ------------------------------------------------
    # Math Challenge
    # ------------------------------------------------

    if data == "game:math":
        from bot.games.math_challenge import start_math

        await start_math(query)
        return

    if data.startswith("math:"):
        from bot.games.math_challenge import handle_math

        await handle_math(query, data)
        return

    # ------------------------------------------------
    # Memory
    # ------------------------------------------------

    if data == "game:memory":
        from bot.games.memory import start_memory

        await start_memory(query)
        return

    if data.startswith("memory:"):
        from bot.games.memory import handle_memory

        await handle_memory(query, data)
        return

    # ------------------------------------------------
    # Higher / Lower
    # ------------------------------------------------

    if data == "game:higher":
        from bot.games.higher_lower import start_higher_lower

        await start_higher_lower(query)
        return

    if data.startswith("higher:"):
        from bot.games.higher_lower import handle_higher_lower

        await handle_higher_lower(query, data)
        return

    # ------------------------------------------------
    # Unknown callback
    # ------------------------------------------------

    await query.answer(
        "এই game/action এখনো available নয়।",
        show_alert=True,
    )
