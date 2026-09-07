import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# WORD LIST
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
    "monitor",
    "network",
    "server",
    "database",
]


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# GAME SETTINGS
# ============================================================

MAX_WRONG_GUESSES = 6

ALPHABET = "abcdefghijklmnopqrstuvwxyz"


# ============================================================
# KEYBOARDS
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "😈 New Game",
                callback_data="game:hangman",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


def letter_keyboard(
    used_letters: set[str],
) -> InlineKeyboardMarkup:

    keyboard = []

    row = []

    for letter in ALPHABET:
        if letter in used_letters:
            continue

        row.append(
            InlineKeyboardButton(
                letter.upper(),
                callback_data=f"hangman:letter:{letter}",
            )
        )

        if len(row) == 6:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)

    keyboard.append([
        InlineKeyboardButton(
            "🚪 Quit",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# DISPLAY WORD
# ============================================================

def masked_word(
    word: str,
    guessed_letters: set[str],
) -> str:

    return " ".join(
        letter.upper() if letter in guessed_letters else "_"
        for letter in word
    )


# ============================================================
# START HANGMAN
# ============================================================

async def start_hangman(query) -> None:
    """
    Start a new Hangman game.

    Game state exists only in RAM.
    Nothing is saved permanently.
    """

    user_id = query.from_user.id

    word = random.choice(WORDS)

    active_games[user_id] = {
        "word": word,
        "guessed": set(),
        "wrong": 0,
    }

    await show_hangman(query, user_id)


# ============================================================
# SHOW GAME
# ============================================================

async def show_hangman(
    query,
    user_id: int,
) -> None:

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Hangman game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    word = game["word"]
    guessed = game["guessed"]
    wrong = game["wrong"]

    display = masked_word(word, guessed)

    remaining = MAX_WRONG_GUESSES - wrong

    await query.edit_message_text(
        "😈 *Hangman*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🔤 Word:\n\n"
        f"*{display}*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"❌ Wrong guesses: *{wrong}/{MAX_WRONG_GUESSES}*\n"
        f"❤️ Chances left: *{remaining}*\n\n"
        "একটি letter নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=letter_keyboard(guessed),
    )


# ============================================================
# HANDLE HANGMAN
# ============================================================

async def handle_hangman(
    query,
    data: str,
) -> None:
    """
    Callback format:

        hangman:letter:a
    """

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Hangman game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    parts = data.split(":")

    if len(parts) != 3 or parts[1] != "letter":
        await query.answer(
            "⚠️ Invalid move!",
            show_alert=True,
        )
        return

    letter = parts[2].lower()

    # --------------------------------------------------------
    # Validate letter
    # --------------------------------------------------------

    if len(letter) != 1 or letter not in ALPHABET:
        await query.answer(
            "⚠️ Invalid letter!",
            show_alert=True,
        )
        return

    guessed = game["guessed"]

    # --------------------------------------------------------
    # Already guessed
    # --------------------------------------------------------

    if letter in guessed:
        await query.answer(
            "এই letter আগে থেকেই দেওয়া হয়েছে!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Add guess
    # --------------------------------------------------------

    guessed.add(letter)

    word = game["word"]

    # --------------------------------------------------------
    # Correct guess
    # --------------------------------------------------------

    if letter in word:

        # Check whether the entire word is revealed.
        if all(char in guessed for char in word):
            active_games.pop(user_id, None)

            await query.edit_message_text(
                "🎉 *You Won!*\n\n"
                f"🔤 Word ছিল: *{word.capitalize()}*\n\n"
                "🔥 অসাধারণ!",
                parse_mode="Markdown",
                reply_markup=game_menu(),
            )
            return

        await query.answer(
            "✅ Correct letter!",
            show_alert=False,
        )

        await show_hangman(query, user_id)
        return

    # --------------------------------------------------------
    # Wrong guess
    # --------------------------------------------------------

    game["wrong"] += 1

    wrong = game["wrong"]

    if wrong >= MAX_WRONG_GUESSES:
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "😈 *Game Over!*\n\n"
            f"🔤 Word ছিল: *{word.capitalize()}*\n"
            f"❌ Wrong guesses: *{wrong}/{MAX_WRONG_GUESSES}*\n\n"
            "আবার চেষ্টা করো! 💪",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    await query.answer(
        "❌ Wrong letter!",
        show_alert=False,
    )

    await show_hangman(query, user_id)
