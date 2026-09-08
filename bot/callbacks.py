
# bot/callbacks.py

from telegram import Update
from telegram.ext import ContextTypes

from bot.handlers import games_menu


# ============================================================
# SHOW ALL GAMES MENU
# ============================================================

async def show_games_menu(query):
    await query.edit_message_text(
        "🎮 *Choose a Game*\n\n"
        "একটি game নির্বাচন করো 👇",
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


# ============================================================
# MAIN CALLBACK ROUTER
# ============================================================

async def button_callback(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    query = update.callback_query

    if query is None:
        return

    data = query.data or ""

    # Answer callback once
    await query.answer()

    # ========================================================
    # ALL GAMES MENU
    # ========================================================

    if data == "menu:games":
        await show_games_menu(query)
        return


    # ========================================================
    # DICE
    # ========================================================

    if data == "game:dice":
        from bot.games.dice import start_dice

        await start_dice(query)
        return


    # ========================================================
    # COIN
    # ========================================================

    if data == "game:coin":
        from bot.games.coin import start_coin

        await start_coin(query)
        return


    # ========================================================
    # ROCK PAPER SCISSORS
    # ========================================================

    if data == "game:rps":
        from bot.games.rps import start_rps

        await start_rps(query)
        return

    if data.startswith("rps:"):
        from bot.games.rps import handle_rps

        await handle_rps(query, data)
        return


    # ========================================================
    # NUMBER GUESS
    # ========================================================

    # IMPORTANT:
    # File = number_guess.py
    # Function = start_number_guess()

    if data == "game:number":
        from bot.games.number_guess import start_number_guess

        await start_number_guess(query)
        return

    if data.startswith("number:"):
        from bot.games.number_guess import handle_number_guess

        await handle_number_guess(query, data)
        return


    # ========================================================
    # QUIZ
    # ========================================================

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


    # ========================================================
    # WORD SCRAMBLE
    # ========================================================

    if data == "game:scramble":
        from bot.games.scramble import start_scramble

        await start_scramble(query)
        return

    if data.startswith("scramble:"):
        from bot.games.scramble import handle_scramble

        await handle_scramble(query, data)
        return


    # ========================================================
    # HANGMAN
    # ========================================================

    if data == "game:hangman":
        from bot.games.hangman import start_hangman

        await start_hangman(query)
        return

    if data.startswith("hangman:"):
        from bot.games.hangman import handle_hangman

        await handle_hangman(query, data)
        return


    # ========================================================
    # TIC TAC TOE
    # ========================================================

    # IMPORTANT:
    # File = tictactoe.py
    # Function = start_tictactoe()

    if data == "game:ttt":
        from bot.games.tictactoe import start_tictactoe

        await start_tictactoe(query)
        return

    if data.startswith("ttt:"):
        from bot.games.tictactoe import handle_tictactoe

        await handle_tictactoe(query, data)
        return


    # ========================================================
    # CONNECT FOUR
    # ========================================================

    if data == "game:connect4":
        from bot.games.connect4 import start_connect4

        await start_connect4(query)
        return

    if data.startswith("connect4:"):
        from bot.games.connect4 import handle_connect4

        await handle_connect4(query, data)
        return


    # ========================================================
    # MATH CHALLENGE
    # ========================================================

    if data == "game:math":
        from bot.games.math_challenge import start_math

        await start_math(query)
        return

    if data.startswith("math:"):
        from bot.games.math_challenge import handle_math

        await handle_math(query, data)
        return


    # ========================================================
    # MEMORY
    # ========================================================

    if data == "game:memory":
        from bot.games.memory import start_memory

        await start_memory(query)
        return

    if data.startswith("memory:"):
        from bot.games.memory import handle_memory

        await handle_memory(query, data)
        return


    # ========================================================
    # HIGHER / LOWER
    # ========================================================

    # IMPORTANT:
    # File = higher_lower.py
    # Function = start_higher_lower()

    if data == "game:higher":
        from bot.games.higher_lower import start_higher_lower

        await start_higher_lower(query)
        return

    if data.startswith("higher:"):
        from bot.games.higher_lower import handle_higher_lower

        await handle_higher_lower(query, data)
        return


    # ========================================================
    # EXTRA GAMES
    # ========================================================

    if data.startswith("extra:"):
        from bot.games.extra_games import handle_extra_game

        await handle_extra_game(query, data)
        return


    # ========================================================
    # UNKNOWN CALLBACK
    # ========================================================

    await query.edit_message_text(
        "❌ *Game পাওয়া যায়নি!*\n\n"
        "Games menu-তে ফিরে যাও 👇",
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )

