import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


def game_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🪙 Flip Again",
                callback_data="game:coin",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


async def start_coin(query) -> None:
    result = random.choice(["Heads", "Tails"])

    emoji = "🙂" if result == "Heads" else "🦅"

    await query.edit_message_text(
        f"🪙 *Coin Flip*\n\n"
        f"━━━━━━━━━━━━━━\n"
        f"{emoji} Result: *{result}*\n"
        f"━━━━━━━━━━━━━━\n\n"
        f"Flip again or choose another game.",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
