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
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonCommands,
    WebAppInfo,
)

from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from bot.handlers import (
    start_command,
    games_command,
)

from bot.callbacks import (
    button_callback,
)


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
    "https://cracker-games.onrender.com",
).rstrip("/")

PORT = int(
    os.getenv(
        "PORT",
        "10000",
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
# URL CONFIG
# ============================================================

LANDING_URL = WEBHOOK_URL
GAMES_URL = f"{WEBHOOK_URL}/games"
HEALTH_URL = f"{WEBHOOK_URL}/health"
TELEGRAM_WEBHOOK_URL = f"{WEBHOOK_URL}/telegram"


# ============================================================
# FLASK
# ============================================================

app = Flask(__name__)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

WEBAPP_DIR = os.path.join(
    BASE_DIR,
    "webapp",
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
# ON BOT
# ============================================================

async def on_bot_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):
    """
    /onbot

    Shows an animated Render landing-page button.
    """

    if not update.effective_message:
        return

    keyboard = [
        [
            InlineKeyboardButton(
                "🚀 Open MASTERMIND",
                url=LANDING_URL,
            )
        ],
    ]

    await update.effective_message.reply_text(
        "🚀 *MASTERMIND*\n\n"
        "🎮 *CRACKER GAMES*\n\n"
        "🟢 Bot control panel is ready.\n"
        "👇 Open the page below.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            keyboard
        ),
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
# ANIMATED LANDING PAGE
# ============================================================

@app.route("/")
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

    <meta
        name="theme-color"
        content="#050816"
    >

    <title>
        MASTERMIND • CRACKER GAMES
    </title>

    <style>

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            min-height: 100vh;

            font-family:
                Inter,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            color: #ffffff;

            overflow-x: hidden;

            background:
                radial-gradient(
                    circle at 50% -10%,
                    rgba(59,130,246,0.28),
                    transparent 38%
                ),
                radial-gradient(
                    circle at 0% 100%,
                    rgba(124,58,237,0.20),
                    transparent 35%
                ),
                #030712;
        }


        /* ==================================================
           BACKGROUND
        ================================================== */

        .background {
            position: fixed;

            inset: 0;

            overflow: hidden;

            pointer-events: none;

            z-index: 0;
        }

        .orb {
            position: absolute;

            border-radius: 50%;

            filter: blur(70px);

            opacity: 0.30;

            animation:
                floatOrb 8s ease-in-out infinite;
        }

        .orb.one {
            width: 280px;
            height: 280px;

            background: #2563eb;

            top: 8%;
            left: 5%;
        }

        .orb.two {
            width: 240px;
            height: 240px;

            background: #7c3aed;

            right: 5%;
            top: 25%;

            animation-delay: -3s;
        }

        .orb.three {
            width: 220px;
            height: 220px;

            background: #0891b2;

            left: 35%;
            bottom: -80px;

            animation-delay: -5s;
        }

        @keyframes floatOrb {

            0%,
            100% {
                transform:
                    translate3d(0,0,0)
                    scale(1);
            }

            50% {
                transform:
                    translate3d(20px,-25px,0)
                    scale(1.08);
            }
        }


        /* ==================================================
           PARTICLES
        ================================================== */

        .particles {
            position: absolute;

            inset: 0;
        }

        .particle {
            position: absolute;

            width: 3px;
            height: 3px;

            border-radius: 50%;

            background: rgba(
                255,
                255,
                255,
                0.7
            );

            animation:
                particleFloat
                linear infinite;
        }

        .p1 {
            left: 8%;
            top: 20%;
            animation-duration: 7s;
        }

        .p2 {
            left: 20%;
            top: 70%;
            animation-duration: 10s;
        }

        .p3 {
            left: 40%;
            top: 15%;
            animation-duration: 8s;
        }

        .p4 {
            left: 65%;
            top: 80%;
            animation-duration: 11s;
        }

        .p5 {
            left: 82%;
            top: 25%;
            animation-duration: 9s;
        }

        .p6 {
            left: 92%;
            top: 65%;
            animation-duration: 12s;
        }

        @keyframes particleFloat {

            from {
                transform:
                    translateY(30px);

                opacity: 0;
            }

            20% {
                opacity: 1;
            }

            80% {
                opacity: 1;
            }

            to {
                transform:
                    translateY(-100px);

                opacity: 0;
            }
        }


        /* ==================================================
           MAIN
        ================================================== */

        .page {
            position: relative;

            z-index: 1;

            min-height: 100vh;

            display: flex;

            justify-content: center;

            align-items: center;

            padding: 30px 18px;
        }

        .container {
            width: 100%;

            max-width: 1000px;

            text-align: center;
        }


        /* ==================================================
           BRAND
        ================================================== */

        .brand {
            margin-bottom: 35px;
        }

        .crown {
            font-size: 54px;

            display: inline-block;

            animation:
                crownFloat
                3s ease-in-out infinite;

            filter:
                drop-shadow(
                    0 0 18px
                    rgba(255,255,255,0.25)
                );
        }

        @keyframes crownFloat {

            0%,
            100% {
                transform:
                    translateY(0)
                    rotate(-3deg);
            }

            50% {
                transform:
                    translateY(-9px)
                    rotate(3deg);
            }
        }

        .mastermind {
            margin-top: 12px;

            font-size: clamp(
                38px,
                8vw,
                82px
            );

            font-weight: 900;

            letter-spacing: 0.16em;

            text-transform: uppercase;

            background:
                linear-gradient(
                    90deg,
                    #ffffff,
                    #93c5fd,
                    #c4b5fd,
                    #ffffff
                );

            background-size: 300% auto;

            -webkit-background-clip: text;
            background-clip: text;

            color: transparent;

            animation:
                shineText
                5s linear infinite;

            text-shadow:
                0 0 30px
                rgba(96,165,250,0.12);
        }

        @keyframes shineText {

            0% {
                background-position: 0% center;
            }

            100% {
                background-position: 300% center;
            }
        }

        .line {
            width: 120px;

            height: 2px;

            margin: 18px auto;

            background:
                linear-gradient(
                    90deg,
                    transparent,
                    #60a5fa,
                    #a78bfa,
                    transparent
                );

            animation:
                linePulse
                2s ease-in-out infinite;
        }

        @keyframes linePulse {

            0%,
            100% {
                width: 100px;
                opacity: 0.6;
            }

            50% {
                width: 180px;
                opacity: 1;
            }
        }

        .cracker {
            font-size: clamp(
                25px,
                5vw,
                48px
            );

            font-weight: 800;

            letter-spacing: 0.12em;

            text-transform: uppercase;

            color: #f8fafc;
        }

        .tagline {
            margin-top: 14px;

            color: #94a3b8;

            font-size: 16px;

            letter-spacing: 0.04em;
        }


        /* ==================================================
           STATUS
        ================================================== */

        .status {
            display: inline-flex;

            align-items: center;

            gap: 9px;

            margin-top: 25px;

            padding: 9px 16px;

            border-radius: 999px;

            background:
                rgba(
                    16,
                    185,
                    129,
                    0.08
                );

            border:
                1px solid
                rgba(
                    16,
                    185,
                    129,
                    0.25
                );

            color: #a7f3d0;

            font-size: 14px;

            font-weight: 600;
        }

        .status-dot {
            width: 9px;
            height: 9px;

            border-radius: 50%;

            background: #34d399;

            box-shadow:
                0 0 0 0
                rgba(52,211,153,0.6);

            animation:
                statusPulse
                2s infinite;
        }

        @keyframes statusPulse {

            0% {
                box-shadow:
                    0 0 0 0
                    rgba(52,211,153,0.6);
            }

            70% {
                box-shadow:
                    0 0 0 10px
                    rgba(52,211,153,0);
            }

            100% {
                box-shadow:
                    0 0 0 0
                    rgba(52,211,153,0);
            }
        }


        /* ==================================================
           BUTTONS
        ================================================== */

        .actions {
            margin-top: 35px;

            display: flex;

            justify-content: center;

            gap: 14px;

            flex-wrap: wrap;
        }

        .button {
            position: relative;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 10px;

            min-width: 190px;

            padding: 15px 25px;

            border-radius: 15px;

            text-decoration: none;

            color: white;

            font-weight: 800;

            font-size: 16px;

            overflow: hidden;

            transition:
                transform 0.25s ease,
                box-shadow 0.25s ease;
        }

        .button::before {
            content: "";

            position: absolute;

            top: 0;
            left: -100%;

            width: 100%;
            height: 100%;

            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,0.20),
                    transparent
                );

            transition:
                left 0.6s ease;
        }

        .button:hover::before {
            left: 100%;
        }

        .button:hover {
            transform:
                translateY(-4px);
        }

        .primary {
            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                );

            box-shadow:
                0 15px 40px
                rgba(
                    37,
                    99,
                    235,
                    0.25
                );
        }

        .secondary {
            background:
                rgba(
                    15,
                    23,
                    42,
                    0.8
                );

            border:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.18
                );
        }


        /* ==================================================
           GAMES
        ================================================== */

        .games {
            margin-top: 55px;

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        180px,
                        1fr
                    )
                );

            gap: 14px;
        }

        .game {
            padding: 23px 15px;

            border-radius: 19px;

            background:
                rgba(
                    15,
                    23,
                    42,
                    0.60
                );

            border:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.10
                );

            backdrop-filter:
                blur(14px);

            transition:
                transform 0.25s ease,
                border-color 0.25s ease,
                background 0.25s ease;
        }

        .game:hover {
            transform:
                translateY(-5px);

            border-color:
                rgba(
                    96,
                    165,
                    250,
                    0.35
                );

            background:
                rgba(
                    30,
                    41,
                    59,
                    0.75
                );
        }

        .game-icon {
            display: block;

            font-size: 38px;

            margin-bottom: 10px;

            animation:
                iconFloat
                4s ease-in-out infinite;
        }

        @keyframes iconFloat {

            0%,
            100% {
                transform:
                    translateY(0);
            }

            50% {
                transform:
                    translateY(-4px);
            }
        }

        .game-name {
            color: #e2e8f0;

            font-size: 15px;

            font-weight: 700;
        }


        /* ==================================================
           FOOTER
        ================================================== */

        .footer {
            margin-top: 45px;

            color: #64748b;

            font-size: 13px;
        }

        .footer strong {
            color: #94a3b8;
        }


        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 600px) {

            .page {
                padding:
                    35px 15px;
            }

            .brand {
                margin-bottom: 25px;
            }

            .crown {
                font-size: 42px;
            }

            .tagline {
                font-size: 14px;
            }

            .actions {
                flex-direction: column;

                align-items: stretch;
            }

            .button {
                width: 100%;
            }

            .games {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }

            .game {
                padding:
                    18px 10px;
            }

            .game-icon {
                font-size: 31px;
            }

            .game-name {
                font-size: 13px;
            }
        }

        @media (max-width: 380px) {

            .games {
                grid-template-columns:
                    1fr;
            }
        }

    </style>

</head>


<body>


    <!-- ====================================================
         BACKGROUND
    ===================================================== -->

    <div class="background">

        <div class="orb one"></div>
        <div class="orb two"></div>
        <div class="orb three"></div>

        <div class="particles">

            <div class="particle p1"></div>
            <div class="particle p2"></div>
            <div class="particle p3"></div>
            <div class="particle p4"></div>
            <div class="particle p5"></div>
            <div class="particle p6"></div>

        </div>

    </div>


    <!-- ====================================================
         PAGE
    ===================================================== -->

    <main class="page">

        <div class="container">


            <!-- BRAND -->

            <section class="brand">

                <div class="crown">
                    👑
                </div>

                <div class="mastermind">
                    MASTERMIND
                </div>

                <div class="line"></div>

                <div class="cracker">
                    CRACKER GAMES
                </div>

                <div class="tagline">
                    ⚡ Play. Compete. Have Fun.
                </div>

                <div class="status">

                    <span class="status-dot"></span>

                    BOT ONLINE

                </div>

            </section>


            <!-- ACTIONS -->

            <section class="actions">

                <a
                    class="button primary"
                    href="/games"
                >
                    🎮 Open Games
                </a>

                <a
                    class="button secondary"
                    href="/health"
                >
                    🟢 Check Status
                </a>

            </section>


            <!-- GAMES -->

            <section class="games">


                <div class="game">

                    <span class="game-icon">
                        🏎️
                    </span>

                    <span class="game-name">
                        Car Racing
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🥊
                    </span>

                    <span class="game-name">
                        Fighting Arena
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🚀
                    </span>

                    <span class="game-name">
                        Space Shooter
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🏃
                    </span>

                    <span class="game-name">
                        Endless Runner
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        ⚽
                    </span>

                    <span class="game-name">
                        Penalty Shootout
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🏀
                    </span>

                    <span class="game-name">
                        Basketball
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🏹
                    </span>

                    <span class="game-name">
                        Archery
                    </span>

                </div>


                <div class="game">

                    <span class="game-icon">
                        🎯
                    </span>

                    <span class="game-name">
                        Target Shooter
                    </span>

                </div>


            </section>


            <!-- FOOTER -->

            <footer class="footer">

                Crafted by
                <strong>
                    MASTERMIND
                </strong>
                •
                <strong>
                    CRACKER GAMES
                </strong>

            </footer>


        </div>

    </main>


</body>

</html>
"""

    return Response(
        html,
        status=HTTPStatus.OK,
        mimetype="text/html",
    )


# ============================================================
# MINI APP
# ============================================================

@app.route("/games")
def games():

    return send_from_directory(
        WEBAPP_DIR,
        "index.html",
    )


# ============================================================
# MINI APP STATIC FILES
# ============================================================

@app.route("/games/<path:filename>")
def games_static(filename):

    return send_from_directory(
        WEBAPP_DIR,
        filename,
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return Response(
        "CRACKER GAMES BOT IS ONLINE",
        status=HTTPStatus.OK,
        mimetype="text/plain",
    )


# ============================================================
# TELEGRAM WEBHOOK
# ============================================================

@app.route(
    "/telegram",
    methods=["POST"],
)
def telegram_webhook():

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
            update,
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

    logger.info(
        "Starting CRACKER GAMES..."
    )

    logger.info(
        "Landing URL: %s",
        LANDING_URL,
    )

    logger.info(
        "Games URL: %s",
        GAMES_URL,
    )

    logger.info(
        "Health URL: %s",
        HEALTH_URL,
    )

    logger.info(
        "Telegram webhook: %s",
        TELEGRAM_WEBHOOK_URL,
    )


    # ========================================================
    # TELEGRAM COMMAND MENU
    # ========================================================

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


    # ========================================================
    # MENU BUTTON
    # ========================================================

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonCommands()
    )


    # ========================================================
    # WEBHOOK
    # ========================================================

    await telegram_app.bot.set_webhook(
        url=TELEGRAM_WEBHOOK_URL,

        allowed_updates=Update.ALL_TYPES,

        drop_pending_updates=True,
    )


    # ========================================================
    # ASGI
    # ========================================================

    asgi_app = WsgiToAsgi(
        app
    )


    # ========================================================
    # UVICORN
    # ========================================================

    config = uvicorn.Config(
        asgi_app,

        host="0.0.0.0",

        port=PORT,

        log_level="info",
    )

    server = uvicorn.Server(
        config
    )


    # ========================================================
    # START
    # ========================================================

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
            "CRACKER GAMES stopped."
        )
