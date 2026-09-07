import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# WORD DATABASE
# ============================================================

WORDS = [
    "python",
    "telegram",
    "computer",
    "keyboard",
    "internet",
    "programming",
    "developer",
    "robot",
    "gaming",
    "football",
    "cricket",
    "elephant",
    "tiger",
    "rabbit",
    "banana",
    "orange",
    "school",
    "science",
    "planet",
    "galaxy",
    "camera",
    "mobile",
    "website",
    "android",
    "browser",
    "keyboard",
    "monitor",
    "network",
    "server",
    "database",
]


# ============================================================
# HELPERS
# ============================================================

def scramble_word(word: str) -> str:
    """
    Shuffle the letters of a word.

    Makes sure the scrambled version is not identical
    to the original word.
    """

    if len(word) < 2:
        return word

    letters = list(word)

    for _ in range(10):
        random.shuffle(letters)
        scrambled = "".join(letters)

        if scrambled.lower() != word.lower():
            return scrambled

    # Very unlikely fallback.
    return word[::-1]


def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔤 New Word",
                callback_data="game:scramble",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


def answer_keyboard(
    correct_word: str,
    options: list[str],
) -> InlineKeyboardMarkup:

    keyboard = []

    for index, option in enumerate(options):
        keyboard.append([
            InlineKeyboardButton(
                option.capitalize(),
                callback_data=f"scramble:{correct_word}:{index}",
            )
        ])

    keyboard.append([
        InlineKeyboardButton(
            "🎮 All Games",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# START SCRAMBLE
# ============================================================

async def start_scramble(query) -> None:
    """
    Start a new word scramble round.

    No user information is stored.
    The correct answer is carried temporarily
    inside the callback button data.
    """

    correct_word = random.choice(WORDS)
    scrambled = scramble_word(correct_word)

    # --------------------------------------------------------
    # Create 3 wrong answers
    # --------------------------------------------------------

    wrong_words = [
        word
        for word in WORDS
        if word != correct_word
    ]

    wrong_answers = random.sample(wrong_words, 3)

    options = wrong_answers + [correct_word]

    random.shuffle(options)

    # --------------------------------------------------------
    # Show game
    # --------------------------------------------------------

    await query.edit_message_text(
        "🔤 *Word Scramble*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🧩 Scrambled word:\n\n"
        f"👉 *{scrambled.upper()}*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "সঠিক word-টি নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=answer_keyboard(
            correct_word,
            options,
        ),
    )


# ============================================================
# HANDLE ANSWER
# ============================================================

async def handle_scramble(
    query,
    data: str,
) -> None:
    """
    Handle a scramble answer.

    Callback format:
        scramble:<correct_word>:<option_index>
    """

    parts = data.split(":")

    if len(parts) != 3:
        await query.answer(
            "⚠️ Invalid answer!",
            show_alert=True,
        )
        return

    correct_word = parts[1]

    try:
        option_index = int(parts[2])
    except ValueError:
        await query.answer(
            "⚠️ Invalid answer!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Validate word
    # --------------------------------------------------------

    if correct_word not in WORDS:
        await query.answer(
            "⚠️ Invalid game!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Re-create the exact options deterministically is not
    # possible from index alone, so instead we use the selected
    # button text from the callback message.
    # --------------------------------------------------------

    message = query.message

    if message is None or message.reply_markup is None:
        await query.answer(
            "⚠️ Game data unavailable!",
            show_alert=True,
        )
        return

    buttons = []

    for row in message.reply_markup.inline_keyboard:
        for button in row:
            if button.callback_data and button.callback_data.startswith(
                f"scramble:{correct_word}:"
            ):
                buttons.append(button)

    if not 0 <= option_index < len(buttons):
        await query.answer(
            "⚠️ Invalid option!",
            show_alert=True,
        )
        return

    selected_word = buttons[option_index].text.lower()

    # --------------------------------------------------------
    # Check answer
    # --------------------------------------------------------

    if selected_word == correct_word:
        result = (
            "🎉 *Correct!*\n\n"
            f"✅ Answer: *{correct_word.capitalize()}*\n\n"
            "দারুণ! 🔥"
        )
    else:
        result = (
            "❌ *Wrong Answer!*\n\n"
            f"তোমার answer: *{selected_word.capitalize()}*\n"
            f"✅ Correct answer: *{correct_word.capitalize()}*\n\n"
            "আবার চেষ্টা করো! 💪"
        )

    # --------------------------------------------------------
    # Result screen
    # --------------------------------------------------------

    await query.edit_message_text(
        "🔤 *Word Scramble*\n\n"
        f"{result}",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
