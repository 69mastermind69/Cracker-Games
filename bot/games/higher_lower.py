import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# GAME SETTINGS
# ============================================================

MIN_NUMBER = 1
MAX_NUMBER = 100


# ============================================================
# GAME MENU
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🎯 New Game",
                callback_data="game:higher",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


# ============================================================
# GAME KEYBOARD
# ============================================================

def game_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "⬆️ Higher",
                callback_data="higher:higher",
            ),
            InlineKeyboardButton(
                "⬇️ Lower",
                callback_data="higher:lower",
            ),
        ],
        [
            InlineKeyboardButton(
                "🚪 Quit",
                callback_data="menu:games",
            )
        ],
    ])


# ============================================================
# START GAME
# ============================================================

async def start_higher_lower(query) -> None:
    """
    Start a new Higher / Lower game.

    No persistent user information is stored.
    """

    user_id = query.from_user.id

    current_number = random.randint(
        MIN_NUMBER,
        MAX_NUMBER,
    )

    active_games[user_id] = {
        "current": current_number,
        "rounds": 0,
    }

    await query.edit_message_text(
        "🎯 *Higher / Lower*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🔢 Current number: *{current_number}*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "পরের number কি আগেরটার চেয়ে বড় হবে,\n"
        "নাকি ছোট হবে?\n\n"
        "তোমার prediction নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=game_keyboard(),
    )


# ============================================================
# HANDLE GAME
# ============================================================

async def handle_higher_lower(
    query,
    data: str,
) -> None:

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Higher / Lower game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Validate callback
    # --------------------------------------------------------

    parts = data.split(":")

    if len(parts) != 2:
        await query.answer(
            "⚠️ Invalid move!",
            show_alert=True,
        )
        return

    prediction = parts[1].lower()

    if prediction not in {
        "higher",
        "lower",
    }:
        await query.answer(
            "⚠️ Invalid prediction!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Generate next number
    # --------------------------------------------------------

    current_number = game["current"]

    next_number = random.randint(
        MIN_NUMBER,
        MAX_NUMBER,
    )

    game["rounds"] += 1

    rounds = game["rounds"]

    # --------------------------------------------------------
    # Same number
    # --------------------------------------------------------

    if next_number == current_number:

        game["current"] = next_number

        await query.edit_message_text(
            "🎯 *Higher / Lower*\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            f"Previous: *{current_number}*\n"
            f"Next: *{next_number}*\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            "🤝 *Same Number!*\n\n"
            "এই round-এ higher/lower কোনোটাই হয়নি।\n\n"
            f"🔥 Rounds: *{rounds}*\n\n"
            "আবার prediction দাও:",
            parse_mode="Markdown",
            reply_markup=game_keyboard(),
        )

        return

    # --------------------------------------------------------
    # Determine actual result
    # --------------------------------------------------------

    if next_number > current_number:
        actual = "higher"
        result_text = "⬆️ The number was *Higher*!"
    else:
        actual = "lower"
        result_text = "⬇️ The number was *Lower*!"

    # --------------------------------------------------------
    # Check prediction
    # --------------------------------------------------------

    if prediction == actual:

        game["current"] = next_number

        await query.edit_message_text(
            "🎯 *Higher / Lower*\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            f"Previous: *{current_number}*\n"
            f"Next: *{next_number}*\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            f"🎉 *Correct!*\n"
            f"{result_text}\n\n"
            f"🔥 Rounds: *{rounds}*\n\n"
            "আবার prediction দাও:",
            parse_mode="Markdown",
            reply_markup=game_keyboard(),
        )

        return

    # --------------------------------------------------------
    # Wrong prediction
    # --------------------------------------------------------

    active_games.pop(user_id, None)

    await query.edit_message_text(
        "🎯 *Higher / Lower*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"Previous: *{current_number}*\n"
        f"Next: *{next_number}*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "❌ *Wrong Prediction!*\n"
        f"{result_text}\n\n"
        f"🔥 You survived *{rounds - 1}* round(s).\n\n"
        "আবার খেলতে পারো!",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
