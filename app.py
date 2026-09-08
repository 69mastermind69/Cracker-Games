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
    "https://cracker-games.onrender.com",
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


# ============================================================
# FLASK
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
# /onbot COMMAND
# ============================================================

async def on_bot_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

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
                web_app=WebAppInfo(
                    url=GAMES_URL
                ),
            )
        ],
    ]

    await update.effective_message.reply_text(
        "🚀 *MASTERMIND*\n\n"
        "🎮 *CRACKER GAMES*\n\n"
        "🟢 Bot control panel is ready.\n\n"
        "👇 Open the game hub:",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
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
        button_callback
    )
)


# ============================================================
# PREMIUM LANDING PAGE
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

<meta
    name="theme-color"
    content="#02030a"
>

<meta
    name="description"
    content="MASTERMIND - CRACKER GAMES"
>

<title>MASTERMIND • CRACKER GAMES</title>


<style>

/* ==========================================================
   RESET
========================================================== */

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

html {{
    scroll-behavior: smooth;
}}

body {{

    min-height: 100vh;

    overflow-x: hidden;

    background:
        radial-gradient(
            circle at 50% 30%,
            rgba(46, 35, 110, 0.22),
            transparent 35%
        ),
        radial-gradient(
            circle at 15% 70%,
            rgba(95, 35, 180, 0.13),
            transparent 28%
        ),
        radial-gradient(
            circle at 85% 70%,
            rgba(20, 80, 190, 0.12),
            transparent 28%
        ),
        #010208;

    color: #ffffff;

    font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}}


/* ==========================================================
   BACKGROUND
========================================================== */

.background {{

    position: fixed;

    inset: 0;

    z-index: -10;

    overflow: hidden;

    pointer-events: none;
}}

.aurora {{

    position: absolute;

    width: 700px;
    height: 700px;

    border-radius: 50%;

    filter: blur(120px);

    opacity: 0.18;

    animation:
        auroraMove 15s ease-in-out infinite alternate;
}}

.aurora.one {{

    background: #6d28d9;

    top: -350px;
    left: -250px;
}}

.aurora.two {{

    background: #2563eb;

    right: -350px;
    top: 30%;

    animation-delay: -5s;
}}

.aurora.three {{

    background: #9333ea;

    bottom: -450px;
    left: 30%;

    animation-delay: -9s;
}}

@keyframes auroraMove {{

    0% {{
        transform:
            translate3d(0, 0, 0)
            scale(1);
    }}

    50% {{
        transform:
            translate3d(80px, -30px, 0)
            scale(1.12);
    }}

    100% {{
        transform:
            translate3d(-40px, 50px, 0)
            scale(0.95);
    }}
}}


/* ==========================================================
   STARS
========================================================== */

.stars {{

    position: absolute;

    inset: 0;

    background-image:
        radial-gradient(
            1px 1px at 10% 20%,
            rgba(255,255,255,0.7),
            transparent
        ),
        radial-gradient(
            1px 1px at 25% 70%,
            rgba(170,150,255,0.7),
            transparent
        ),
        radial-gradient(
            1px 1px at 40% 30%,
            rgba(255,255,255,0.6),
            transparent
        ),
        radial-gradient(
            1px 1px at 60% 15%,
            rgba(150,180,255,0.7),
            transparent
        ),
        radial-gradient(
            1px 1px at 75% 65%,
            rgba(255,255,255,0.6),
            transparent
        ),
        radial-gradient(
            1px 1px at 90% 35%,
            rgba(170,130,255,0.7),
            transparent
        );

    background-size:
        300px 300px;

    opacity: 0.45;

    animation:
        starsMove 25s linear infinite;
}}

@keyframes starsMove {{

    from {{
        transform: translateY(0);
    }}

    to {{
        transform: translateY(-120px);
    }}
}}


/* ==========================================================
   GRID
========================================================== */

.grid {{

    position: absolute;

    width: 160%;

    height: 55%;

    left: -30%;

    bottom: -12%;

    background-image:
        linear-gradient(
            rgba(100, 80, 180, 0.12) 1px,
            transparent 1px
        ),
        linear-gradient(
            90deg,
            rgba(70, 100, 190, 0.10) 1px,
            transparent 1px
        );

    background-size:
        55px 55px;

    transform:
        perspective(450px)
        rotateX(62deg);

    transform-origin: bottom;

    opacity: 0.45;

    mask-image:
        linear-gradient(
            to top,
            black,
            transparent
        );

    animation:
        gridMove 7s linear infinite;
}}

@keyframes gridMove {{

    from {{
        background-position:
            0 0,
            0 0;
    }}

    to {{
        background-position:
            0 55px,
            55px 0;
    }}
}}


/* ==========================================================
   TOP NAV
========================================================== */

.navbar {{

    width: min(1200px, 92%);

    margin: auto;

    padding:
        28px 0;

    display: flex;

    align-items: center;

    justify-content: space-between;
}}

.brand {{

    display: flex;

    align-items: center;

    gap: 12px;

    letter-spacing: 6px;

    font-size: 14px;

    font-weight: 700;

    color: #e8e5ff;
}}

.brand-crown {{

    font-size: 25px;

    filter:
        drop-shadow(
            0 0 10px
            rgba(130,100,255,0.8)
        );

    animation:
        crownFloat 3s ease-in-out infinite;
}}

@keyframes crownFloat {{

    0%, 100% {{
        transform: translateY(0);
    }}

    50% {{
        transform: translateY(-5px);
    }}
}}

.online-pill {{

    display: flex;

    align-items: center;

    gap: 9px;

    padding:
        9px 17px;

    border-radius: 50px;

    border:
        1px solid
        rgba(80, 255, 170, 0.35);

    background:
        rgba(0, 20, 15, 0.45);

    box-shadow:
        0 0 25px
        rgba(0, 255, 150, 0.08);

    color: #b7ffd9;

    font-size: 11px;

    font-weight: 700;

    letter-spacing: 2px;
}}

.online-dot {{

    width: 8px;
    height: 8px;

    border-radius: 50%;

    background: #21f58c;

    box-shadow:
        0 0 8px #21f58c,
        0 0 18px #21f58c;

    animation:
        onlinePulse 1.8s infinite;
}}

@keyframes onlinePulse {{

    0%, 100% {{
        opacity: 1;
        transform: scale(1);
    }}

    50% {{
        opacity: 0.45;
        transform: scale(0.7);
    }}
}}


/* ==========================================================
   HERO
========================================================== */

.hero {{

    min-height:
        calc(100vh - 80px);

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding:
        40px 20px
        100px;

    position: relative;
}}


/* ==========================================================
   CROWN
========================================================== */

.hero-crown-wrap {{

    position: relative;

    width: 180px;

    height: 120px;

    display: flex;

    align-items: center;

    justify-content: center;

    margin-bottom: 15px;

    animation:
        crownHero 4s ease-in-out infinite;
}}

.hero-crown-wrap::before {{

    content: "";

    position: absolute;

    width: 180px;
    height: 65px;

    border-radius: 50%;

    border:
        2px solid
        rgba(150, 70, 255, 0.8);

    box-shadow:
        0 0 18px
        rgba(145, 60, 255, 0.8),
        0 0 50px
        rgba(60, 100, 255, 0.5);

    transform:
        rotate(-8deg);

    animation:
        ringRotate 5s linear infinite;
}}

.hero-crown-wrap::after {{

    content: "";

    position: absolute;

    width: 140px;
    height: 30px;

    border-radius: 50%;

    background:
        rgba(40, 100, 255, 0.35);

    filter: blur(25px);

    bottom: 5px;
}}

.hero-crown {{

    font-size: 92px;

    position: relative;

    z-index: 2;

    filter:
        drop-shadow(
            0 0 7px
            rgba(255,255,255,0.9)
        )
        drop-shadow(
            0 0 22px
            rgba(80,90,255,0.9)
        )
        drop-shadow(
            0 0 45px
            rgba(190,50,255,0.6)
        );
}}

@keyframes crownHero {{

    0%, 100% {{
        transform:
            translateY(0)
            rotate(-1deg);
    }}

    50% {{
        transform:
            translateY(-14px)
            rotate(1deg);
    }}
}}

@keyframes ringRotate {{

    from {{
        transform:
            rotate(-8deg)
            scaleX(1);
    }}

    50% {{
        transform:
            rotate(8deg)
            scaleX(1.08);
    }}

    to {{
        transform:
            rotate(-8deg)
            scaleX(1);
    }}
}}


/* ==========================================================
   TITLE
========================================================== */

.main-title {{

    position: relative;

    font-size:
        clamp(48px, 9vw, 112px);

    line-height: 0.95;

    font-weight: 900;

    letter-spacing:
        clamp(3px, 1vw, 10px);

    margin-top: 5px;

    background:
        linear-gradient(
            100deg,
            #ffffff 0%,
            #b7b8ff 20%,
            #ffffff 35%,
            #8c72ff 55%,
            #dcd9ff 75%,
            #ffffff 100%
        );

    background-size: 250% auto;

    -webkit-background-clip: text;

    background-clip: text;

    -webkit-text-fill-color: transparent;

    animation:
        titleShine 6s linear infinite;

    filter:
        drop-shadow(
            0 0 15px
            rgba(100,90,255,0.45)
        );
}}

.main-title::after {{

    content: "MASTERMIND";

    position: absolute;

    inset: 0;

    z-index: -1;

    background:
        linear-gradient(
            90deg,
            #5b21b6,
            #2563eb,
            #9333ea
        );

    -webkit-background-clip: text;

    -webkit-text-fill-color: transparent;

    filter: blur(25px);

    opacity: 0.55;
}}

@keyframes titleShine {{

    from {{
        background-position: 0% center;
    }}

    to {{
        background-position: 250% center;
    }}
}}


/* ==========================================================
   DIVIDER
========================================================== */

.divider {{

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 18px;

    margin:
        22px auto 12px;

    width:
        min(600px, 80%);
}}

.divider span {{

    display: block;

    height: 1px;

    flex: 1;

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(150,130,255,0.8)
        );

    box-shadow:
        0 0 8px
        rgba(130,100,255,0.5);
}}

.divider span:last-child {{

    background:
        linear-gradient(
            90deg,
            rgba(150,130,255,0.8),
            transparent
        );
}}

.subtitle {{

    color: #c7c3e6;

    font-size:
        clamp(15px, 2vw, 21px);

    letter-spacing:
        clamp(4px, 1.2vw, 8px);

    font-weight: 500;
}}

.mini-text {{

    margin-top: 20px;

    color: #777593;

    letter-spacing: 6px;

    font-size: 11px;
}}


/* ==========================================================
   OPEN BUTTON
========================================================== */

.open-btn {{

    position: relative;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 15px;

    margin-top: 38px;

    min-width: 280px;

    padding:
        18px 30px;

    border-radius: 50px;

    color: white;

    text-decoration: none;

    font-size: 15px;

    font-weight: 800;

    letter-spacing: 2px;

    border:
        1px solid
        rgba(145,100,255,0.95);

    background:
        linear-gradient(
            100deg,
            rgba(100,30,190,0.22),
            rgba(20,70,220,0.22)
        );

    box-shadow:
        0 0 20px
        rgba(130,70,255,0.3),
        inset 0 0 25px
        rgba(90,60,255,0.1);

    overflow: hidden;

    transition:
        transform .3s ease,
        box-shadow .3s ease;
}}

.open-btn::before {{

    content: "";

    position: absolute;

    top: 0;
    left: -120%;

    width: 70%;
    height: 100%;

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.25),
            transparent
        );

    transform:
        skewX(-20deg);

    animation:
        buttonShine 3.5s infinite;
}}

@keyframes buttonShine {{

    0% {{
        left: -120%;
    }}

    55%, 100% {{
        left: 140%;
    }}
}}

.open-btn:hover {{

    transform:
        translateY(-5px)
        scale(1.02);

    box-shadow:
        0 0 30px
        rgba(140,80,255,0.55),
        0 0 80px
        rgba(30,100,255,0.2),
        inset 0 0 30px
        rgba(100,70,255,0.15);
}}

.game-icon {{

    font-size: 22px;

    filter:
        drop-shadow(
            0 0 8px
            rgba(160,100,255,0.8)
        );
}}

.arrow {{

    font-size: 23px;

    transition:
        transform .25s ease;
}}

.open-btn:hover .arrow {{

    transform:
        translateX(6px);
}}


/* ==========================================================
   STATUS BAR
========================================================== */

.hero-status {{

    margin-top: 28px;

    display: flex;

    align-items: center;

    gap: 9px;

    padding:
        8px 20px;

    border-radius: 50px;

    border:
        1px solid
        rgba(70,100,180,0.4);

    background:
        rgba(5,10,30,0.55);

    color: #9da9d1;

    font-size: 10px;

    letter-spacing: 3px;

    backdrop-filter: blur(12px);
}}


/* ==========================================================
   FEATURES
========================================================== */

.features {{

    width:
        min(1100px, 92%);

    margin:
        -20px auto
        100px;

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    border-top:
        1px solid
        rgba(130,120,220,0.10);

    border-bottom:
        1px solid
        rgba(130,120,220,0.10);

    background:
        rgba(2,3,12,0.28);

    backdrop-filter:
        blur(10px);
}}

.feature {{

    position: relative;

    text-align: center;

    padding:
        35px 18px;

    transition:
        background .3s ease;
}}

.feature:not(:last-child)::after {{

    content: "";

    position: absolute;

    top: 25%;
    right: 0;

    width: 1px;

    height: 50%;

    background:
        rgba(130,120,220,0.13);
}}

.feature:hover {{

    background:
        rgba(80,60,160,0.06);
}}

.feature-icon {{

    font-size: 25px;

    margin-bottom: 13px;

    filter:
        drop-shadow(
            0 0 9px
            rgba(120,100,255,0.65)
        );
}}

.feature h3 {{

    font-size: 11px;

    letter-spacing: 3px;

    margin-bottom: 9px;

    color: #e9e7ff;
}}

.feature p {{

    color: #74738d;

    font-size: 12px;
}}


/* ==========================================================
   GAME PREVIEW
========================================================== */

.preview-section {{

    width:
        min(1100px, 92%);

    margin:
        0 auto 80px;

    text-align: center;
}}

.preview-title {{

    color: #e7e4ff;

    font-size: 25px;

    letter-spacing: 4px;

    margin-bottom: 30px;
}}

.game-grid {{

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 14px;
}}

.game-card {{

    position: relative;

    padding:
        25px 15px;

    border-radius: 18px;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,0.055),
            rgba(255,255,255,0.015)
        );

    border:
        1px solid
        rgba(130,110,220,0.12);

    overflow: hidden;

    transition:
        transform .3s ease,
        border-color .3s ease,
        box-shadow .3s ease;
}}

.game-card::before {{

    content: "";

    position: absolute;

    width: 100px;
    height: 100px;

    top: -60px;
    right: -60px;

    border-radius: 50%;

    background:
        #6938ef;

    filter: blur(45px);

    opacity: .22;
}}

.game-card:hover {{

    transform:
        translateY(-6px);

    border-color:
        rgba(130,100,255,0.42);

    box-shadow:
        0 15px 40px
        rgba(60,30,150,0.18);
}}

.game-card-icon {{

    font-size: 32px;

    margin-bottom: 12px;
}}

.game-card-name {{

    font-size: 13px;

    font-weight: 700;

    letter-spacing: 1px;

    color: #dcd9f4;
}}

.game-card-status {{

    display: inline-block;

    margin-top: 10px;

    font-size: 9px;

    letter-spacing: 2px;

    color: #6f6d86;
}}


/* ==========================================================
   FOOTER
========================================================== */

footer {{

    width:
        min(1100px, 92%);

    margin: auto;

    padding:
        30px 0
        45px;

    text-align: center;

    border-top:
        1px solid
        rgba(130,120,220,0.09);

    color: #55546c;

    font-size: 11px;

    letter-spacing: 2px;
}}

footer strong {{

    color: #8c82bd;
}}


/* ==========================================================
   MOBILE
========================================================== */

@media (max-width: 800px) {{

    .navbar {{
        padding-top: 20px;
    }}

    .brand {{
        letter-spacing: 4px;
        font-size: 11px;
    }}

    .brand-crown {{
        font-size: 20px;
    }}

    .online-pill {{
        padding: 7px 12px;
        font-size: 9px;
    }}

    .hero {{
        min-height: auto;
        padding-top: 70px;
        padding-bottom: 100px;
    }}

    .hero-crown-wrap {{
        transform: scale(.78);
        margin-bottom: -5px;
    }}

    .main-title {{
        font-size:
            clamp(43px, 14vw, 75px);

        letter-spacing: 3px;
    }}

    .subtitle {{
        font-size: 13px;
        letter-spacing: 4px;
    }}

    .mini-text {{
        font-size: 8px;
        letter-spacing: 4px;
    }}

    .open-btn {{
        min-width: 240px;
        padding: 16px 22px;
        font-size: 13px;
    }}

    .features {{
        grid-template-columns:
            repeat(2, 1fr);

        margin-bottom: 70px;
    }}

    .feature:nth-child(2)::after {{
        display: none;
    }}

    .feature:nth-child(1),
    .feature:nth-child(2) {{
        border-bottom:
            1px solid
            rgba(130,120,220,0.10);
    }}

    .game-grid {{
        grid-template-columns:
            repeat(2, 1fr);
    }}

    .grid {{
        height: 45%;
        background-size:
            38px 38px;
    }}
}}


@media (max-width: 430px) {{

    .navbar {{
        width: 90%;
    }}

    .online-pill {{
        padding: 6px 9px;
    }}

    .online-pill span:last-child {{
        display: none;
    }}

    .hero {{
        padding-left: 12px;
        padding-right: 12px;
    }}

    .hero-crown-wrap {{
        transform: scale(.68);
        margin-bottom: -15px;
    }}

    .main-title {{
        font-size: 42px;
    }}

    .divider {{
        width: 90%;
    }}

    .open-btn {{
        width: 90%;
        min-width: unset;
    }}

    .features {{
        width: 92%;
    }}

    .feature {{
        padding:
            28px 10px;
    }}

    .feature h3 {{
        font-size: 9px;
        letter-spacing: 2px;
    }}

    .feature p {{
        font-size: 10px;
    }}

    .preview-title {{
        font-size: 19px;
    }}

    .game-card {{
        padding: 20px 10px;
    }}
}}


/* ==========================================================
   REDUCE MOTION
========================================================== */

@media (prefers-reduced-motion: reduce) {{

    *,
    *::before,
    *::after {{
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
    }}
}}

</style>

</head>


<body>


<!-- ========================================================
     BACKGROUND
======================================================== -->

<div class="background">

    <div class="aurora one"></div>

    <div class="aurora two"></div>

    <div class="aurora three"></div>

    <div class="stars"></div>

    <div class="grid"></div>

</div>


<!-- ========================================================
     NAVBAR
======================================================== -->

<header class="navbar">

    <div class="brand">

        <span class="brand-crown">
            ♛
        </span>

        <span>
            MASTERMIND
        </span>

    </div>


    <div class="online-pill">

        <span class="online-dot"></span>

        <span>
            BOT ONLINE
        </span>

    </div>

</header>


<!-- ========================================================
     HERO
======================================================== -->

<main>

<section class="hero">


    <div class="hero-crown-wrap">

        <div class="hero-crown">
            ♛
        </div>

    </div>


    <h1 class="main-title">
        MASTERMIND
    </h1>


    <div class="divider">

        <span></span>

        <div class="subtitle">
            CRACKER GAMES
        </div>

        <span></span>

    </div>


    <div class="mini-text">
        PLAY&nbsp;&nbsp;•&nbsp;&nbsp;EXPLORE&nbsp;&nbsp;•&nbsp;&nbsp;WIN
    </div>


    <a
        href="{GAMES_URL}"
        class="open-btn"
    >

        <span class="game-icon">
            🎮
        </span>

        <span>
            OPEN GAMES
        </span>

        <span class="arrow">
            →
        </span>

    </a>


    <div class="hero-status">

        <span class="online-dot"></span>

        SYSTEM ONLINE

    </div>


</section>


<!-- ========================================================
     FEATURES
======================================================== -->

<section class="features">


    <div class="feature">

        <div class="feature-icon">
            🎮
        </div>

        <h3>
            MULTIPLE GAMES
        </h3>

        <p>
            Play your favorites
        </p>

    </div>


    <div class="feature">

        <div class="feature-icon">
            ⚡
        </div>

        <h3>
            FAST & SMOOTH
        </h3>

        <p>
            No lag, just fun
        </p>

    </div>


    <div class="feature">

        <div class="feature-icon">
            🛡️
        </div>

        <h3>
            SAFE & SECURE
        </h3>

        <p>
            Your data, our priority
        </p>

    </div>


    <div class="feature">

        <div class="feature-icon">
            ♛
        </div>

        <h3>
            CRACKER GAMES
        </h3>

        <p>
            More than just games
        </p>

    </div>


</section>


<!-- ========================================================
     GAME PREVIEW
======================================================== -->

<section class="preview-section">

    <h2 class="preview-title">
        ✦ GAME COLLECTION ✦
    </h2>


    <div class="game-grid">


        <div class="game-card">

            <div class="game-card-icon">
                🏎️
            </div>

            <div class="game-card-name">
                CAR RACING
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🥊
            </div>

            <div class="game-card-name">
                FIGHTING ARENA
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🚀
            </div>

            <div class="game-card-name">
                SPACE SHOOTER
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🏃
            </div>

            <div class="game-card-name">
                ENDLESS RUNNER
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                ⚽
            </div>

            <div class="game-card-name">
                PENALTY SHOOTOUT
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🏀
            </div>

            <div class="game-card-name">
                BASKETBALL
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🏹
            </div>

            <div class="game-card-name">
                ARCHERY
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


        <div class="game-card">

            <div class="game-card-icon">
                🎯
            </div>

            <div class="game-card-name">
                TARGET SHOOTER
            </div>

            <span class="game-card-status">
                READY TO PLAY
            </span>

        </div>


    </div>

</section>


</main>


<!-- ========================================================
     FOOTER
======================================================== -->

<footer>

    Crafted with ✦ by
    <strong>MASTERMIND</strong>
    • CRACKER GAMES

</footer>


</body>

</html>
"""

    return Response(
        html,
        mimetype="text/html",
    )


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
# HEALTH
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
                status=400,
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
        "Webhook URL: %s",
        TELEGRAM_WEBHOOK_URL,
    )


    # --------------------------------------------------------
    # Telegram menu
    #
    # Clicking Menu → 🚀 On Bot
    # opens the Render landing page directly.
    # --------------------------------------------------------

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="🚀 On Bot",
            web_app=WebAppInfo(
                url=LANDING_URL,
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
    # Telegram webhook
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


    server = uvicorn.Server(
        config
    )


    # --------------------------------------------------------
    # Telegram lifecycle
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
