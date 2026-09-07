import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


def game_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🎲 Roll Again",
                callback_data="game:dice",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


async def start_dice(query) -> None:
    result = random.randint(1, 6)

    await query.edit_message_text(
        f"🎲 *Dice Roll*\n\n"
        f"━━━━━━━━━━━━━━\n"
        f"🎯 Result: *{result}*\n"
        f"━━━━━━━━━━━━━━\n\n"
        f"Roll again or choose another game.",
        parse_mode="Markdown",
        reply_markup=game_menu(),
    )
