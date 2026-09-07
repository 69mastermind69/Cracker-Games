import random
import operator

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# GAME MENU
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🧮 New Challenge",
                callback_data="game:math",
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
# OPERATORS
# ============================================================

OPERATORS = {
    "+": operator.add,
    "-": operator.sub,
    "×": operator.mul,
}


# ============================================================
# CREATE QUESTION
# ============================================================

def create_question():
    symbol = random.choice(
        ["+", "-", "×"]
    )

    if symbol == "+":
        first = random.randint(5, 50)
        second = random.randint(5, 50)

    elif symbol == "-":
        first = random.randint(10, 60)
        second = random.randint(1, first)

    else:
        first = random.randint(2, 12)
        second = random.randint(2, 12)

    answer = OPERATORS[symbol](
        first,
        second,
    )

    return first, symbol, second, answer


# ============================================================
# CREATE OPTIONS
# ============================================================

def create_options(answer: int):
    options = {answer}

    while len(options) < 4:
        difference = random.randint(-15, 15)

        if difference == 0:
            continue

        wrong_answer = answer + difference

        if wrong_answer >= 0:
            options.add(wrong_answer)

    options = list(options)
    random.shuffle(options)

    return options


# ============================================================
# ANSWER KEYBOARD
# ============================================================

def answer_keyboard(
    options,
) -> InlineKeyboardMarkup:

    keyboard = []

    for index, option in enumerate(options):
        keyboard.append([
            InlineKeyboardButton(
                str(option),
                callback_data=f"math:answer:{index}",
            )
        ])

    keyboard.append([
        InlineKeyboardButton(
            "🚪 Quit",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# START MATH CHALLENGE
# ============================================================

async def start_math(query) -> None:

    user_id = query.from_user.id

    first, symbol, second, answer = create_question()

    options = create_options(answer)

    active_games[user_id] = {
        "answer": answer,
        "options": options,
    }

    await query.edit_message_text(
        "🧮 *Math Challenge*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"❓ *{first} {symbol} {second} = ?*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "সঠিক answer নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=answer_keyboard(options),
    )


# ============================================================
# HANDLE MATH ANSWER
# ============================================================

async def handle_math(
    query,
    data: str,
) -> None:

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Math Challenge আর active নেই।\n\n"
            "নতুন challenge শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    parts = data.split(":")

    if len(parts) != 3 or parts[1] != "answer":
        await query.answer(
            "⚠️ Invalid answer!",
            show_alert=True,
        )
        return

    try:
        selected_index = int(parts[2])
    except ValueError:
        await query.answer(
            "⚠️ Invalid answer!",
            show_alert=True,
        )
        return

    options = game["options"]

    if not 0 <= selected_index < len(options):
        await query.answer(
            "⚠️ Invalid option!",
            show_alert=True,
        )
        return

    selected_answer = options[selected_index]
    correct_answer = game["answer"]

    # --------------------------------------------------------
    # Remove temporary game state
    # --------------------------------------------------------

    active_games.pop(user_id, None)

    # --------------------------------------------------------
    # Check answer
    # --------------------------------------------------------

    if selected_answer == correct_answer:
        await query.edit_message_text(
            "🧮 *Math Challenge*\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "🎉 *Correct!*\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            f"✅ Answer: *{correct_answer}*\n\n"
            "🔥 Excellent!",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    await query.edit_message_text(
        "🧮 *Math Challenge*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "❌ *Wrong Answer!*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"তোমার answer: *{selected_answer}*\n"
        f"✅ Correct answer: *{correct_answer}*\n\n"
        "আবার চেষ্টা করো! 💪",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
