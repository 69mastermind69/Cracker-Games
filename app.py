import os
import asyncio
import logging
from http import HTTPStatus

from asgiref.wsgi import WsgiToAsgi
from flask import Flask, request, Response

import uvicorn

from telegram import (
    Update,
    MenuButtonWebApp,
    WebAppInfo,
)

from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
)

from bot.handlers import start_command, games_command
from bot.callbacks import button_callback


# =========================
# LOGGING
# =========================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


# =========================
# ENVIRONMENT
# =========================

BOT_TOKEN = os.getenv("BOT_TOKEN")

WEBHOOK_URL = os.getenv(
    "WEBHOOK_URL",
    ""
).rstrip("/")

PORT = int(
    os.getenv(
        "PORT",
        "10000"
    )
)


if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )

if not WEBHOOK_URL:
    raise RuntimeError(
        "WEBHOOK_URL environment variable is missing."
    )


# =========================
# FLASK APP
# =========================

web_app = Flask(__name__)


# =========================
# TELEGRAM APPLICATION
# =========================

telegram_app = (
    Application.builder()
    .token(BOT_TOKEN)
    .updater(None)
    .build()
)


# =========================
# HANDLERS
# =========================

telegram_app.add_handler(
    CommandHandler(
        "start",
        start_command
    )
)

telegram_app.add_handler(
    CommandHandler(
        "games",
        games_command
    )
)

telegram_app.add_handler(
    CallbackQueryHandler(
        button_callback
    )
)


# =========================
# AESTHETIC HOME PAGE
# =========================

@web_app.get("/")
def home():

    html = """
<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>CRACKER GAMES</title>

    <style>

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background:
                radial-gradient(
                    circle at top,
                    #182848,
                    #090b12 55%,
                    #05060a
                );

            color: white;
            overflow: hidden;
        }

        .container {
            width: min(92%, 700px);
            text-align: center;

            padding: 55px 25px;

            border: 1px solid
                rgba(255,255,255,0.12);

            border-radius: 28px;

            background:
                rgba(255,255,255,0.04);

            backdrop-filter: blur(20px);

            box-shadow:
                0 25px 80px
                rgba(0,0,0,0.55);
        }

        .logo {
            font-size: 70px;
            margin-bottom: 15px;

            filter:
                drop-shadow(
                    0 0 25px
                    rgba(0,220,255,0.45)
                );
        }

        h1 {
            font-size: clamp(38px, 8vw, 72px);

            letter-spacing: 5px;

            font-weight: 900;

            background:
                linear-gradient(
                    90deg,
                    #ffffff,
                    #63e6ff,
                    #ffffff
                );

            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .developer {
            margin-top: 12px;

            font-size: 20px;

            letter-spacing: 6px;

            color: #8eeeff;

            font-weight: 700;
        }

        .status {
            display: inline-flex;

            align-items: center;

            gap: 9px;

            margin-top: 30px;

            padding: 10px 18px;

            border-radius: 999px;

            background:
                rgba(0,255,140,0.08);

            border:
                1px solid
                rgba(0,255,140,0.25);

            color: #63ffb0;

            font-size: 14px;

            font-weight: bold;
        }

        .dot {
            width: 9px;
            height: 9px;

            border-radius: 50%;

            background: #35ff91;

            box-shadow:
                0 0 15px
                #35ff91;
        }

        .description {
            margin-top: 25px;

            color: #aeb7c7;

            line-height: 1.7;

            font-size: 16px;
        }

        .footer {
            margin-top: 35px;

            color: #687386;

            font-size: 13px;
        }

    </style>

</head>

<body>

    <div class="container">

        <div class="logo">
            🎮
        </div>

        <h1>
            CRACKER GAMES
        </h1>

        <div class="developer">
            MASTERMIND
        </div>

        <div class="status">
            <span class="dot"></span>
            BOT SERVER ONLINE
        </div>

        <p class="description">
            Welcome to the CRACKER GAMES hub.
            <br>
            Enjoy free mini games directly
            through Telegram.
        </p>

        <div class="footer">
            👨‍💻 Developed by MASTERMIND
        </div>

    </div>

</body>
</html>
"""

    return html


# =========================
# HEALTH CHECK
# =========================

@web_app.get("/health")
def health():

    return "OK", HTTPStatus.OK


# =========================
# TELEGRAM WEBHOOK
# =========================

@web_app.post("/telegram")
async def telegram_webhook():

    try:

        data = request.get_json(
            force=True,
            silent=False
        )

        update = Update.de_json(
            data,
            telegram_app.bot
        )

        await telegram_app.update_queue.put(
            update
        )

        return Response(
            "OK",
            status=HTTPStatus.OK
        )

    except Exception:

        logger.exception(
            "Error while receiving Telegram update."
        )

        return Response(
            "ERROR",
            status=HTTPStatus.INTERNAL_SERVER_ERROR
        )


# =========================
# MAIN
# =========================

async def main():

    webhook_url = (
        f"{WEBHOOK_URL}/telegram"
    )

    logger.info(
        "Setting Telegram webhook: %s",
        webhook_url
    )


    # =========================
    # SET WEBHOOK
    # =========================

    await telegram_app.bot.set_webhook(
        url=webhook_url,

        allowed_updates=Update.ALL_TYPES,

        drop_pending_updates=True
    )


    # =========================
    # TELEGRAM MENU BUTTON
    # =========================

    #
    # Telegram-এর Menu button-এ
    # "🚀 Open Bot" দেখাবে।
    #
    # User চাপ দিলে Render-এর /
    # URL open হবে।
    #
    # Render sleeping থাকলে request
    # service-কে wake করার সুযোগ দেবে।
    #

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="🚀 Open Bot",

            web_app=WebAppInfo(
                url=WEBHOOK_URL
            )
        )
    )


    logger.info(
        "Telegram Menu Button configured."
    )


    # =========================
    # ASGI
    # =========================

    asgi_app = WsgiToAsgi(
        web_app
    )


    # =========================
    # UVICORN
    # =========================

    server = uvicorn.Server(
        uvicorn.Config(
            asgi_app,

            host="0.0.0.0",

            port=PORT,

            log_level="info"
        )
    )


    # =========================
    # START TELEGRAM
    # =========================

    async with telegram_app:

        await telegram_app.start()

        logger.info(
            "🎮 CRACKER GAMES BOT IS RUNNING!"
        )

        await server.serve()

        await telegram_app.stop()


# =========================
# ENTRY POINT
# =========================

if __name__ == "__main__":

    asyncio.run(main())
