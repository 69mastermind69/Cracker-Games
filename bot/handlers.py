# app.py

import os
import asyncio
import logging
from http import HTTPStatus

from asgiref.wsgi import WsgiToAsgi
from flask import Flask, request, Response, send_from_directory

import uvicorn

from telegram import (
    Update,
    BotCommand,
    MenuButtonCommands,
)

from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
)

from bot.handlers import (
    start_command,
    games_command,
)

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


# ============================================================
# VALIDATION
# ============================================================

if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )

if not WEBHOOK_URL:
    raise RuntimeError(
        "WEBHOOK_URL environment variable is missing."
    )


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

WEBAPP_DIR = os.path.join(
    BASE_DIR,
    "webapp"
)


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
# ON BOT COMMAND
# ============================================================

async def on_bot_command(
    update: Update,
    context,
):
    """
    /onbot command

    Telegram Menu:
        🚀 On Bot
    """

    if not update.effective_message:
        return

    await update.effective_message.reply_text(
        "🟢 CRACKER GAMES BOT IS ONLINE!\n\n"
        "🚀 Bot successfully connected.\n\n"
        "🎮 Games খেলতে নিচের Menu থেকে "
        "🎮 Games select করো।"
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
    CommandHandler(
        "onbot",
        on_bot_command,
    )
)

telegram_app.add_handler(
    CallbackQueryHandler(
        button_callback,
    )
)


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():
    """
    Main landing page.
    """

    html = """
<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Cracker Games</title>

    <style>

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            min-height: 100vh;
            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background:
                radial-gradient(
                    circle at top,
                    #172554,
                    #020617 55%
                );

            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 25px;
        }

        .container {
            width: 100%;
            max-width: 900px;

            text-align: center;

            padding: 50px 30px;

            border-radius: 28px;

            background:
                rgba(15, 23, 42, 0.88);

            border:
                1px solid rgba(255,255,255,0.08);

            box-shadow:
                0 25px 80px
                rgba(0,0,0,0.45);
        }

        .logo {
            font-size: 72px;
            margin-bottom: 15px;
        }

        h1 {
            font-size: 42px;
            margin-bottom: 12px;
        }

        .subtitle {
            color: #cbd5e1;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 35px;
        }

        .button {
            display: inline-block;

            padding: 15px 30px;

            border-radius: 14px;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                );

            color: white;

            text-decoration: none;

            font-size: 18px;
            font-weight: bold;

            box-shadow:
                0 12px 30px
                rgba(37,99,235,0.25);

            transition:
                transform 0.2s ease;
        }

        .button:hover {
            transform: translateY(-3px);
        }

        .games {
            margin-top: 45px;

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(180px, 1fr)
                );

            gap: 15px;
        }

        .game {
            padding: 22px 15px;

            border-radius: 18px;

            background:
                rgba(30,41,59,0.65);

            border:
                1px solid
                rgba(255,255,255,0.06);

            font-size: 16px;
        }

        .game span {
            display: block;

            font-size: 35px;

            margin-bottom: 8px;
        }

        .footer {
            margin-top: 35px;

            color: #64748b;

            font-size: 14px;
        }

        @media (max-width: 600px) {

            .container {
                padding: 35px 20px;
            }

            .logo {
                font-size: 55px;
            }

            h1 {
                font-size: 32px;
            }

            .subtitle {
                font-size: 16px;
            }

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

        <p class="subtitle">
            Free Telegram mini games
            with real-time graphical gameplay.
        </p>

        <a
            class="button"
            href="/games"
        >
            🎮 Open Games
        </a>

        <div class="games">

            <div class="game">
                <span>🏎️</span>
                Car Racing
            </div>

            <div class="game">
                <span>🥊</span>
                Fighting Arena
            </div>

            <div class="game">
                <span>🚀</span>
                Space Shooter
            </div>

            <div class="game">
                <span>🏃</span>
                Endless Runner
            </div>

            <div class="game">
                <span>⚽</span>
                Penalty Shootout
            </div>

            <div class="game">
                <span>🏀</span>
                Basketball
            </div>

            <div class="game">
                <span>🏹</span>
                Archery
            </div>

            <div class="game">
                <span>🎯</span>
                Target Shooter
            </div>

        </div>

        <div class="footer">
            © Cracker Games
        </div>

    </div>

</body>
</html>
"""

    return Response(
        html,
        mimetype="text/html",
    )


# ============================================================
# WEB APP
# ============================================================

@app.route("/games")
def games():
    """
    Telegram Mini App entry point.
    """

    return send_from_directory(
        WEBAPP_DIR,
        "index.html",
    )


# ============================================================
# WEB APP STATIC FILES
# ============================================================

@app.route("/games/<path:filename>")
def games_static(filename):
    """
    Serve Mini App CSS / JS / assets.
    """

    return send_from_directory(
        WEBAPP_DIR,
        filename,
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():
    """
    Render health check.
    """

    return Response(
        "OK",
        status=HTTPStatus.OK,
        mimetype="text/plain",
    )


# ============================================================
# TELEGRAM WEBHOOK
# ============================================================

@app.route(
    "/telegram",
    methods=[
        "POST",
    ],
)
def telegram_webhook():
    """
    Telegram sends webhook updates here.
    """

    try:

        data = request.get_json(
            force=True,
            silent=True,
        )

        if not data:
            return Response(
                "Bad Request",
                status=HTTPStatus.BAD_REQUEST,
            )

        update = Update.de_json(
            data,
            telegram_app.bot,
        )

        telegram_app.update_queue.put_nowait(
            update
        )

        return Response(
            "OK",
            status=HTTPStatus.OK,
        )

    except Exception:

        logger.exception(
            "Error processing Telegram webhook"
        )

        return Response(
            "Internal Server Error",
            status=HTTPStatus.INTERNAL_SERVER_ERROR,
        )


# ============================================================
# MAIN
# ============================================================

async def main():

    webhook_url = (
        f"{WEBHOOK_URL}/telegram"
    )

    logger.info(
        "Starting Cracker Games Bot..."
    )

    logger.info(
        "Webhook URL: %s",
        webhook_url,
    )

    logger.info(
        "Web App URL: %s/games",
        WEBHOOK_URL,
    )


    # --------------------------------------------------------
    # TELEGRAM MENU
    # --------------------------------------------------------

    await telegram_app.bot.set_my_commands(
        [
            BotCommand(
                "onbot",
                "🚀 On Bot",
            ),
            BotCommand(
                "games",
                "🎮 Games",
            ),
        ]
    )


    # --------------------------------------------------------
    # SET MENU BUTTON TO COMMANDS
    #
    # Telegram menu can show commands:
    #
    # ☰ Menu
    # ├── 🚀 On Bot
    # └── 🎮 Games
    #
    # --------------------------------------------------------

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonCommands()
    )


    # --------------------------------------------------------
    # SET WEBHOOK
    # --------------------------------------------------------

    await telegram_app.bot.set_webhook(
        url=webhook_url,

        allowed_updates=Update.ALL_TYPES,

        drop_pending_updates=True,
    )


    # --------------------------------------------------------
    # ASGI WRAPPER
    # --------------------------------------------------------

    asgi_app = WsgiToAsgi(
        app
    )


    # --------------------------------------------------------
    # UVICORN CONFIG
    # --------------------------------------------------------

    config = uvicorn.Config(
        asgi_app,

        host="0.0.0.0",

        port=PORT,

        log_level="info",
    )

    server = uvicorn.Server(
        config
    )


    # --------------------------------------------------------
    # START TELEGRAM APPLICATION
    # --------------------------------------------------------

    async with telegram_app:

        await telegram_app.start()

        logger.info(
            "Telegram application started."
        )

        try:

            await server.serve()

        finally:

            logger.info(
                "Stopping Telegram application..."
            )

            await telegram_app.stop()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    try:

        asyncio.run(
            main()
        )

    except KeyboardInterrupt:

        logger.info(
            "Bot stopped by user."
        )
