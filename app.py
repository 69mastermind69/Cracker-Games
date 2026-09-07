import os
import asyncio
import logging
from http import HTTPStatus

from asgiref.wsgi import WsgiToAsgi
from flask import Flask, request, Response
import uvicorn

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
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "").rstrip("/")
PORT = int(os.getenv("PORT", "10000"))


if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN environment variable is missing.")

if not WEBHOOK_URL:
    raise RuntimeError("WEBHOOK_URL environment variable is missing.")


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
# HANDLERS
# ============================================================

telegram_app.add_handler(
    CommandHandler("start", start_command)
)

telegram_app.add_handler(
    CommandHandler("games", games_command)
)

telegram_app.add_handler(
    CallbackQueryHandler(button_callback)
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

        await telegram_app.update_queue.put(update)

        return Response(
            "OK",
            status=HTTPStatus.OK,
        )

    except Exception:
        logger.exception(
            "Error while receiving Telegram update."
        )

        return Response(
            "ERROR",
            status=HTTPStatus.INTERNAL_SERVER_ERROR,
        )


# ============================================================
# START SERVER
# ============================================================

async def main():

    webhook_url = f"{WEBHOOK_URL}/telegram"

    logger.info(
        "Setting Telegram webhook: %s",
        webhook_url,
    )

    await telegram_app.bot.set_webhook(
        url=webhook_url,
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )

    asgi_app = WsgiToAsgi(web_app)

    server = uvicorn.Server(
        uvicorn.Config(
            asgi_app,
            host="0.0.0.0",
            port=PORT,
            log_level="info",
        )
    )

    async with telegram_app:

        await telegram_app.start()

        logger.info(
            "🎮 Telegram Gaming Bot is running!"
        )

        await server.serve()

        await telegram_app.stop()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    asyncio.run(main())
