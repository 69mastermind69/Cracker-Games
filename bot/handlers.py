
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes


# ==================================================
# MAIN GAME MENU
# ==================================================

def games_menu() -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton("🎲 Dice", callback_data="game:dice"),
            InlineKeyboardButton("🪙 Coin Flip", callback_data="game:coin"),
        ],
        [
            InlineKeyboardButton(
                "✊ Rock Paper Scissors",
                callback_data="game:rps"
            ),
        ],
        [
            InlineKeyboardButton(
                "🔢 Number Guess",
                callback_data="game:number"
            ),
            InlineKeyboardButton(
                "🧠 Quiz",
                callback_data="game:quiz"
            ),
        ],
        [
            InlineKeyboardButton(
                "🔤 Word Scramble",
                callback_data="game:scramble"
            ),
            InlineKeyboardButton(
                "😈 Hangman",
                callback_data="game:hangman"
            ),
        ],
        [
            InlineKeyboardButton(
                "❌ Tic-Tac-Toe",
                callback_data="game:ttt"
            ),
            InlineKeyboardButton(
                "🔴 Connect Four",
                callback_data="game:connect4"
            ),
        ],
        [
            InlineKeyboardButton(
                "🧮 Math Challenge",
                callback_data="game:math"
            ),
            InlineKeyboardButton(
                "🧠 Memory",
                callback_data="game:memory"
            ),
        ],
        [
            InlineKeyboardButton(
                "🎯 Higher / Lower",
                callback_data="game:higher"
            ),
        ],
    ]

    return InlineKeyboardMarkup(keyboard)


# ==================================================
# /start
# ==================================================

async def start_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    if not update.message:
        return

    text = (
        "🎮 *FREE GAMING HUB* 🎮\n\n"
        "Welcome!\n\n"
        "এই bot-এ বিভিন্ন ধরনের free mini-game "
        "খেলা যাবে।\n\n"

        "━━━━━━━━━━━━━━━━━━\n"
        "🎮 Games\n"
        "━━━━━━━━━━━━━━━━━━\n\n"

        "কোনো paid API নেই।\n"
        "কোনো database নেই।\n"
        "কোনো permanent profile/data storage নেই।\n\n"

        "━━━━━━━━━━━━━━━━━━\n"
        "👨‍💻 *Developer*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"

        "Name: *MASTERMIND*\n"
        "Telegram: [@Do_x_Die](https://t.me/Do_x_Die)\n\n"

        "👇 একটি game নির্বাচন করো:"
    )

    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


# ==================================================
# /games
# ==================================================

async def games_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    if not update.message:
        return

    text = (
        "🎮 *Choose a Game*\n\n"

        "━━━━━━━━━━━━━━━━━━\n"
        "👨‍💻 *Developer*\n"
        "━━━━━━━━━━━━━━━━━━\n\n"

        "Name: *MASTERMIND*\n"
        "Telegram: [@Do_x_Die](https://t.me/Do_x_Die)"
    )

    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


এখানে তোমার **existing game menu/callback data অপরিবর্তিত** রাখা হয়েছে—শুধু `/start` এবং `/games`-এর message-এ Developer section যোগ হয়েছে। Repository-র `app.py`-ও `start_command` এবং `games_command`-কেই command handler হিসেবে ব্যবহার করছে, তাই `app.py` পরিবর্তন করার প্রয়োজন নেই।

**Output হবে:**

text
🎮 FREE GAMING HUB 🎮

Welcome!

এই bot-এ বিভিন্ন ধরনের free mini-game
খেলা যাবে।

━━━━━━━━━━━━━━━━━━
🎮 Games
━━━━━━━━━━━━━━━━━━

কোনো paid API নেই।
কোনো database নেই।
কোনো permanent profile/data storage নেই।

━━━━━━━━━━━━━━━━━━
👨‍💻 Developer
━━━━━━━━━━━━━━━━━━

Name: MASTERMIND
Telegram: @Do_x_Die

👇 একটি game নির্বাচন করো:


@Do_x_Die`-তে click করলে Telegram profile-এ যাওয়ার জন্য link-ও দেওয়া আছে।
