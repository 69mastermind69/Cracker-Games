
# bot/handlers.py

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)
from telegram.ext import ContextTypes


# ============================================================
# START / HELP
# ============================================================

async def start_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    keyboard = [
        [
            InlineKeyboardButton(
                "🎮 Play Games",
                callback_data="menu:games",
            )
        ],
    ]

    await update.message.reply_text(
        "🎮 *Welcome to Cracker Games!*\n\n"
        "এখানে অনেকগুলো free mini game খেলতে পারবে।\n\n"
        "✨ No database\n"
        "✨ No permanent profile\n"
        "✨ No coins / XP system\n"
        "✨ Game state temporary RAM-এ থাকে\n\n"
        "👇 নিচের button থেকে শুরু করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    keyboard = [
        [
            InlineKeyboardButton(
                "🎮 Games",
                callback_data="menu:games",
            )
        ],
    ]

    await update.message.reply_text(
        "ℹ️ *Cracker Games Help*\n\n"
        "🎮 Games — সব available games দেখাবে\n"
        "🆕 More Free Games — নতুন mini games\n"
        "👨‍💻 Developer — developer information\n\n"
        "কোনো permanent user profile বা game history "
        "সংরক্ষণ করা হয় না।",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# GAMES MENU
# ============================================================

def games_menu():
    keyboard = [

        # ----------------------------------------------------
        # ORIGINAL GAMES
        # ----------------------------------------------------

        [
            InlineKeyboardButton(
                "🎲 Dice",
                callback_data="game:dice",
            ),
            InlineKeyboardButton(
                "🪙 Coin Flip",
                callback_data="game:coin",
            ),
        ],

        [
            InlineKeyboardButton(
                "✊ Rock Paper Scissors",
                callback_data="game:rps",
            ),
        ],

        [
            InlineKeyboardButton(
                "🔢 Number Guess",
                callback_data="game:number",
            ),
            InlineKeyboardButton(
                "❓ Quiz",
                callback_data="game:quiz",
            ),
        ],

        [
            InlineKeyboardButton(
                "🔤 Word Scramble",
                callback_data="game:scramble",
            ),
            InlineKeyboardButton(
                "🎯 Hangman",
                callback_data="game:hangman",
            ),
        ],

        [
            InlineKeyboardButton(
                "⭕ Tic-Tac-Toe",
                callback_data="game:ttt",
            ),
            InlineKeyboardButton(
                "🔴 Connect Four",
                callback_data="game:connect4",
            ),
        ],

        [
            InlineKeyboardButton(
                "➗ Math Challenge",
                callback_data="game:math",
            ),
            InlineKeyboardButton(
                "🧠 Memory",
                callback_data="game:memory",
            ),
        ],

        [
            InlineKeyboardButton(
                "⬆️ Higher / Lower",
                callback_data="game:higher",
            ),
        ],

        # ----------------------------------------------------
        # DEVELOPER
        # ----------------------------------------------------

        [
            InlineKeyboardButton(
                "👨‍💻 Developer",
                callback_data="developer",
            ),
        ],

        # ----------------------------------------------------
        # EXTRA GAMES
        # ----------------------------------------------------

        [
            InlineKeyboardButton(
                "🆕 More Free Games",
                callback_data="extra:menu",
            ),
        ],
    ]

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# GAMES COMMAND
# ============================================================

async def games_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    await update.message.reply_text(
        "🎮 *Choose a Game*",
        parse_mode="Markdown",
        reply_markup=games_menu(),
    )


# ============================================================
# ABOUT
# ============================================================

async def about_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    keyboard = [
        [
            InlineKeyboardButton(
                "🎮 Play Games",
                callback_data="menu:games",
            )
        ],
    ]

    await update.message.reply_text(
        "🎮 *Cracker Games*\n\n"
        "A collection of free Telegram mini games.\n\n"
        "💾 No permanent game database\n"
        "🎯 Temporary game state only\n"
        "🆓 Free to play\n\n"
        "Developer: *MASTERMIND*\n"
        "Telegram: *@Do_x_Die*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

