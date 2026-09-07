import os
import logging

from flask import Flask, request

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
)

from bot.handlers import start_command, games_command
from bot.callbacks import button_callback


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


# ============================================================
# ENVIRONMENT
# ============================================================

BOT_TOKEN = os.getenv("BOT_TOKEN")
PORT = int(os.getenv("PORT", "10000"))

# Optional:
# Set this on Render to your public service URL.
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "").rstrip("/")


if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )


# ============================================================
# FLASK APP
# ============================================================

web_app = Flask(__name__)


# ============================================================
# TELEGRAM APPLICATION
# ============================================================

telegram_app = (
    Application.builder()
    .token(BOT_TOKEN)
    .updater(None)
    .build()
)


# ============================================================
# TELEGRAM HANDLERS
# ============================================================

telegram_app.add_handler(
    CommandHandler(
        "start",
        start_command,
    )
)

telegram_app.add_handler(
    CommandHandler(
        "games",
        games_command,
    )
)

telegram_app.add_handler(
    CallbackQueryHandler(
        button_callback,
    )
)


# ============================================================
# HEALTH CHECK
# ============================================================

@web_app.get("/")
def home():
    return "🎮 Telegram Gaming Bot is running!"


@web_app.get("/health")
def health():
    return "OK"


# ============================================================
# TELEGRAM WEBHOOK
# ============================================================

@web_app.post("/telegram")
async def telegram_webhook():

    try:
        data = request.get_json(
            force=True,
            silent=False,
        )

        update = Update.de_json(
            data,
            telegram_app.bot,
        )

        await telegram_app.process_update(update)

        return "OK", 200

    except Exception:
        logger.exception(
            "Error while processing Telegram update."
        )

        return "ERROR", 500


# ============================================================
# STARTUP
# ============================================================

async def initialize_bot():
    """
    Initialize Telegram application and configure webhook.
    """

    await telegram_app.initialize()

    if WEBHOOK_URL:
        webhook_url = f"{WEBHOOK_URL}/telegram"

        await telegram_app.bot.set_webhook(
            url=webhook_url,
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True,
        )

        logger.info(
            "Telegram webhook configured: %s",
            webhook_url,
        )

    else:
        logger.warning(
            "WEBHOOK_URL is not configured. "
            "Telegram webhook was not set."
        )


# ============================================================
# RUN SERVER
# ============================================================

def main():
    import asyncio

    logger.info(
        "Starting Telegram Gaming Bot..."
    )

    asyncio.run(
        initialize_bot()
    )

    web_app.run(
        host="0.0.0.0",
        port=PORT,
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
