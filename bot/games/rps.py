import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


CHOICES = {
    "rock": "✊ Rock",
    "paper": "📄 Paper",
    "scissors": "✂️ Scissors",
}


def game_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "✊ Rock",
                callback_data="rps:rock",
            ),
            InlineKeyboardButton(
                "📄 Paper",
                callback_data="rps:paper",
            ),
            InlineKeyboardButton(
                "✂️ Scissors",
                callback_data="rps:scissors",
            ),
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


async def start_rps(query) -> None:
    await query.edit_message_text(
        "✊ *Rock Paper Scissors*\n\n"
        "তোমার choice নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )


async def handle_rps(query, data: str) -> None:
    player = data.split(":", 1)[1]

    if player not in CHOICES:
        await query.answer("Invalid move!", show_alert=True)
        return

    bot = random.choice(list(CHOICES.keys()))

    if player == bot:
        result = "🤝 *Draw!*"

    elif (
        (player == "rock" and bot == "scissors")
        or
        (player == "paper" and bot == "rock")
        or
        (player == "scissors" and bot == "paper")
    ):
        result = "🏆 *You Win!*"

    else:
        result = "🤖 *Bot Wins!*"

    await query.edit_message_text(
        "✊ *Rock Paper Scissors*\n\n"
        f"👤 You: {CHOICES[player]}\n"
        f"🤖 Bot: {CHOICES[bot]}\n\n"
        f"{result}",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
