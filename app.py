# app.py

import os
import asyncio
import logging

from flask import Flask, request, Response, send_from_directory
from asgiref.wsgi import WsgiToAsgi
import uvicorn

from telegram import (
    Update,
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    WebAppInfo,
)

from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from bot.handlers import start_command, games_command
from bot.callbacks import button_callback


# ============================================================
# CONFIG
# ============================================================

BOT_TOKEN = os.getenv("BOT_TOKEN")

WEBHOOK_URL = os.getenv(
    "WEBHOOK_URL",
    "https://cracker-games.onrender.com"
).rstrip("/")

PORT = int(os.getenv("PORT", "10000"))

LANDING_URL = WEBHOOK_URL
GAMES_URL = f"{WEBHOOK_URL}/games"
HEALTH_URL = f"{WEBHOOK_URL}/health"
TELEGRAM_WEBHOOK_URL = f"{WEBHOOK_URL}/telegram"


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


# ============================================================
# VALIDATION
# ============================================================

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN environment variable is missing.")

if not WEBHOOK_URL:
    raise RuntimeError("WEBHOOK_URL environment variable is missing.")


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEBAPP_DIR = os.path.join(BASE_DIR, "webapp")


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
    Fallback /onbot command.

    The Telegram Menu button itself opens LANDING_URL directly.
    If user types /onbot manually, this command also provides
    a direct button to the Render landing page.
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
        [
            InlineKeyboardButton(
                "🎮 Open Games",
                web_app=WebAppInfo(url=GAMES_URL),
            )
        ],
    ]

    await update.effective_message.reply_text(
        "🚀 *CRACKER GAMES*\n\n"
        "🟢 Bot control panel is ready.\n\n"
        "👇 Open the Render web app:",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# TELEGRAM HANDLERS
# ============================================================

telegram_app.add_handler(
    CommandHandler("start", start_command)
)

telegram_app.add_handler(
    CommandHandler("games", games_command)
)

telegram_app.add_handler(
    CommandHandler("onbot", on_bot_command)
)

telegram_app.add_handler(
    CallbackQueryHandler(button_callback)
)


# ============================================================
# LANDING PAGE
# ============================================================

@app.route("/")
def home():
    html = f"""
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

* {{
    box-sizing: border-box;
}}

html,
body {{
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
}}

body {{
    background:
        radial-gradient(circle at top, #172554 0%, #020617 45%, #000000 100%);
    color: white;
    font-family:
        Arial,
        Helvetica,
        sans-serif;
    overflow-x: hidden;
}}

.container {{
    width: min(1100px, 92%);
    margin: auto;
    padding: 60px 0;
}}

.hero {{
    text-align: center;
    padding: 40px 0 30px;
}}

.crown {{
    font-size: 58px;
    animation: float 2.5s ease-in-out infinite;
}}

@keyframes float {{
    0%, 100% {{
        transform: translateY(0);
    }}

    50% {{
        transform: translateY(-12px);
    }}
}}

.title {{
    margin: 10px 0 0;
    font-size: clamp(48px, 10vw, 100px);
    font-weight: 900;
    letter-spacing: 5px;

    background:
        linear-gradient(
            90deg,
            #22d3ee,
            #8b5cf6,
            #ec4899,
            #22d3ee
        );

    background-size: 300% 300%;

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    animation: gradient 5s ease infinite;
}}

@keyframes gradient {{
    0% {{
        background-position: 0% 50%;
    }}

    50% {{
        background-position: 100% 50%;
    }}

    100% {{
        background-position: 0% 50%;
    }}
}}

.subtitle {{
    margin-top: 12px;
    font-size: 20px;
    letter-spacing: 6px;
    color: #cbd5e1;
}}

.status {{
    display: inline-flex;
    align-items: center;
    gap: 8px;

    margin-top: 20px;
    padding: 9px 18px;

    border-radius: 999px;

    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.4);

    color: #4ade80;
    font-weight: 700;
}}

.dot {{
    width: 9px;
    height: 9px;

    border-radius: 50%;
    background: #22c55e;

    box-shadow:
        0 0 15px #22c55e;

    animation: pulse 1.5s infinite;
}}

@keyframes pulse {{
    0%, 100% {{
        opacity: 1;
    }}

    50% {{
        opacity: 0.4;
    }}
}}

.buttons {{
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 35px;
}}

.btn {{
    display: inline-flex;
    justify-content: center;
    align-items: center;

    min-width: 190px;

    padding: 15px 24px;

    border-radius: 14px;

    text-decoration: none;
    color: white;

    font-size: 16px;
    font-weight: 800;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}}

.btn:hover {{
    transform: translateY(-4px);
}}

.games-btn {{
    background:
        linear-gradient(
            135deg,
            #7c3aed,
            #2563eb
        );

    box-shadow:
        0 15px 35px rgba(37, 99, 235, 0.25);
}}

.status-btn {{
    background:
        rgba(255,255,255,0.06);

    border:
        1px solid rgba(255,255,255,0.12);
}}

.section-title {{
    text-align: center;
    margin: 70px 0 25px;
    font-size: 30px;
}}

.games {{
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(220px, 1fr));

    gap: 18px;
}}

.card {{
    padding: 25px;

    border-radius: 22px;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,0.08),
            rgba(255,255,255,0.025)
        );

    border:
        1px solid rgba(255,255,255,0.1);

    backdrop-filter: blur(12px);

    transition:
        transform 0.2s ease,
        border-color 0.2s ease;
}}

.card:hover {{
    transform: translateY(-6px);

    border-color:
        rgba(139,92,246,0.65);
}}

.icon {{
    font-size: 42px;
}}

.card h3 {{
    margin:
        15px 0 8px;
}}

.card p {{
    margin: 0;
    color: #94a3b8;
    line-height: 1.5;
}}

.footer {{
    text-align: center;
    margin-top: 70px;
    padding-top: 25px;

    border-top:
        1px solid rgba(255,255,255,0.08);

    color: #64748b;
}}

</style>

</head>

<body>

<div class="container">

    <section class="hero">

        <div class="crown">
            👑
        </div>

        <div class="title">
            MASTERMIND
        </div>

        <div class="subtitle">
            CRACKER GAMES
        </div>

        <div class="status">
            <span class="dot"></span>
            BOT ONLINE
        </div>

        <div class="buttons">

            <a
                class="btn games-btn"
                href="{GAMES_URL}"
            >
                🎮 Open Games
            </a>

            <a
                class="btn status-btn"
                href="{HEALTH_URL}"
            >
                🟢 Check Status
            </a>

        </div>

    </section>


    <h2 class="section-title">
        🎮 Available Games
    </h2>


    <section class="games">

        <div class="card">
            <div class="icon">🏎️</div>
            <h3>Car Racing</h3>
            <p>Race your car and beat the high score.</p>
        </div>

        <div class="card">
            <div class="icon">🥊</div>
            <h3>Fighting Arena</h3>
            <p>Real-time fighting action.</p>
        </div>

        <div class="card">
            <div class="icon">🚀</div>
            <h3>Space Shooter</h3>
            <p>Destroy enemies and survive.</p>
        </div>

        <div class="card">
            <div class="icon">🏃</div>
            <h3>Endless Runner</h3>
            <p>Run as far as possible.</p>
        </div>

        <div class="card">
            <div class="icon">⚽</div>
            <h3>Penalty Shootout</h3>
            <p>Score goals and beat the keeper.</p>
        </div>

        <div class="card">
            <div class="icon">🏀</div>
            <h3>Basketball</h3>
            <p>Take shots and build your score.</p>
        </div>

        <div class="card">
            <div class="icon">🏹</div>
            <h3>Archery</h3>
            <p>Hit moving targets with precision.</p>
        </div>

        <div class="card">
            <div class="icon">🎯</div>
            <h3>Target Shooter</h3>
            <p>React quickly and hit every target.</p>
        </div>

    </section>


    <footer class="footer">
        Crafted by MASTERMIND • CRACKER GAMES
    </footer>

</div>

</body>
</html>
"""

    return Response(html, mimetype="text/html")


# ============================================================
# MINI APP
# ============================================================

@app.route("/games")
def games_page():
    return send_from_directory(
        WEBAPP_DIR,
        "index.html",
    )


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
        "CRACKER GAMES OK",
        status=200,
        mimetype="text/plain",
    )


# ============================================================
# TELEGRAM WEBHOOK
# ============================================================

@app.route("/telegram", methods=["POST"])
def telegram_webhook():

    try:
        data = request.get_json(
            force=True,
            silent=True,
        )

        if not data:
            return Response(
                "Bad Request",
                status=400,
            )

        update = Update.de_json(
            data,
            telegram_app.bot,
        )

        telegram_app.update_queue.put_nowait(update)

        return Response(
            "OK",
            status=200,
        )

    except Exception:
        logger.exception(
            "Telegram webhook error"
        )

        return Response(
            "Internal Server Error",
            status=500,
        )


# ============================================================
# START SERVER
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
        "Webhook URL: %s",
        TELEGRAM_WEBHOOK_URL,
    )


    # --------------------------------------------------------
    # Telegram Menu
    #
    # IMPORTANT:
    # Menu button now directly opens Render landing page.
    # --------------------------------------------------------

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="🚀 On Bot",
            web_app=WebAppInfo(
                url=LANDING_URL
            ),
        )
    )


    # --------------------------------------------------------
    # Commands
    # --------------------------------------------------------

    await telegram_app.bot.set_my_commands(
        [
            BotCommand(
                "start",
                "🏠 Start",
            ),
            BotCommand(
                "games",
                "🎮 Games",
            ),
            BotCommand(
                "onbot",
                "🚀 On Bot",
            ),
        ]
    )


    # --------------------------------------------------------
    # Webhook
    # --------------------------------------------------------

    await telegram_app.bot.set_webhook(
        url=TELEGRAM_WEBHOOK_URL,
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


    # --------------------------------------------------------
    # Flask → ASGI
    # --------------------------------------------------------

    asgi_app = WsgiToAsgi(app)


    config = uvicorn.Config(
        asgi_app,
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )

    server = uvicorn.Server(config)


    # --------------------------------------------------------
    # Telegram application lifecycle
    # --------------------------------------------------------

    async with telegram_app:

        await telegram_app.start()

        logger.info(
            "CRACKER GAMES BOT IS ONLINE"
        )

        await server.serve()

        await telegram_app.stop()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    asyncio.run(main())
