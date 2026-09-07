import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


MIN_NUMBER = 1
MAX_NUMBER = 20

# Temporary RAM-only state.
# Nothing is written to a database.
active_games = {}


def game_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔢 New Game",
                callback_data="game:number",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


def guess_keyboard():
    buttons = []

    for start in range(MIN_NUMBER, MAX_NUMBER + 1, 5):
        row = []

        for number in range(start, min(start + 5, MAX_NUMBER + 1)):
            row.append(
                InlineKeyboardButton(
                    str(number),
                    callback_data=f"number:{number}",
                )
            )

        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "🎮 All Games",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(buttons)


async def start_number_guess(query) -> None:
    user_id = query.from_user.id

    active_games[user_id] = {
        "secret": random.randint(MIN_NUMBER, MAX_NUMBER),
        "attempts": 0,
    }

    await query.edit_message_text(
        "🔢 *Number Guess*\n\n"
        f"আমি {MIN_NUMBER} থেকে {MAX_NUMBER}-এর মধ্যে "
        "একটি number বেছে নিয়েছি।\n\n"
        "তোমার guess নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=guess_keyboard(),
    )


async def handle_number_guess(query, data: str) -> None:
    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    try:
        guess = int(data.split(":", 1)[1])
    except (ValueError, IndexError):
        await query.answer(
            "Invalid guess!",
            show_alert=True,
        )
        return

    if not MIN_NUMBER <= guess <= MAX_NUMBER:
        await query.answer(
            "Invalid number!",
            show_alert=True,
        )
        return

    game["attempts"] += 1

    secret = game["secret"]
    attempts = game["attempts"]

    # Correct answer
    if guess == secret:
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "🎉 *Correct!*\n\n"
            f"🎯 Number ছিল: *{secret}*\n"
            f"🔢 Attempts: *{attempts}*\n\n"
            "দারুণ খেলেছো! 😎",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # Hint
    if guess < secret:
        hint = "⬆️ আরও *বড়* number চেষ্টা করো।"
    else:
        hint = "⬇️ আরও *ছোট* number চেষ্টা করো।"

    await query.edit_message_text(
        "🔢 *Number Guess*\n\n"
        f"তোমার guess: *{guess}*\n"
        f"{hint}\n\n"
        f"🔁 Attempts: *{attempts}*\n\n"
        "আবার চেষ্টা করো:",
        parse_mode="Markdown",
        reply_markup=guess_keyboard(),
    )
