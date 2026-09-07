import os
import logging
from flask import Flask

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
)

from bot.handlers import start_command, games_command
from bot.callbacks import button_callback


# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# Environment
# --------------------------------------------------

BOT_TOKEN = os.getenv("BOT_TOKEN")
PORT = int(os.getenv("PORT", "10000"))


if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )


# --------------------------------------------------
# Flask app
# --------------------------------------------------

web_app = Flask(__name__)


@web_app.get("/")
def home():
    return "🎮 Telegram Gaming Bot is running!"


@web_app.get("/health")
def health():
    return "OK"


# --------------------------------------------------
# Telegram application
# --------------------------------------------------

telegram_app = (
    Application.builder()
    .token(BOT_TOKEN)
    .build()
)


# --------------------------------------------------
# Telegram handlers
# --------------------------------------------------

telegram_app.add_handler(
    CommandHandler("start", start_command)
)

telegram_app.add_handler(
    CommandHandler("games", games_command)
)

telegram_app.add_handler(
    CallbackQueryHandler(button_callback)
)


# --------------------------------------------------
# Startup
# --------------------------------------------------

def main():
    logger.info("Starting Telegram Gaming Bot...")

    telegram_app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


# --------------------------------------------------
# Entry point
# --------------------------------------------------

if __name__ == "__main__":
    main()
