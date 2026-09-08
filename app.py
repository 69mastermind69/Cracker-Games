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
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )


# ============================================================
# FLASK
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
# TELEGRAM
# ============================================================

telegram_app = (
    Application.builder()
    .token(BOT_TOKEN)
    .updater(None)
    .build()
)


# ============================================================
# /onbot
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
        "👑 *MASTERMIND*\n\n"
        "🎮 *CRACKER GAMES*\n\n"
        "🟢 System is online.\n\n"
        "Enter the game world below.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            keyboard
        ),
    )


# ============================================================
# HANDLERS
# ============================================================

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
    CommandHandler(
        "onbot",
        on_bot_command
    )
)

telegram_app.add_handler(
    CallbackQueryHandler(
        button_callback
    )
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
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
>

<meta
    name="theme-color"
    content="#010106"
>

<title>
    MASTERMIND • CRACKER GAMES
</title>


<style>

/* ============================================================
   RESET
============================================================ */

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

html {{
    width: 100%;
    min-height: 100%;
    background: #010106;
}}

body {{

    width: 100%;
    min-height: 100vh;

    overflow-x: hidden;

    color: #ffffff;

    background:
        #010106;

    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}}


/* ============================================================
   MAIN SCENE
============================================================ */

.scene {{

    position: relative;

    width: 100%;

    min-height: 100vh;

    overflow: hidden;

    background:

        radial-gradient(
            ellipse at 50% 28%,
            rgba(45, 25, 105, 0.30),
            transparent 34%
        ),

        radial-gradient(
            ellipse at 50% 72%,
            rgba(18, 44, 105, 0.16),
            transparent 35%
        ),

        linear-gradient(
            180deg,
            #000106 0%,
            #01020a 40%,
            #02020b 72%,
            #000104 100%
        );
}}


/* ============================================================
   VIGNETTE
============================================================ */

.scene::after {{

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 50;

    background:
        radial-gradient(
            ellipse at center,
            transparent 35%,
            rgba(0,0,0,0.22) 70%,
            rgba(0,0,0,0.82) 100%
        );
}}


/* ============================================================
   TOP NAV
============================================================ */

.topbar {{

    position: relative;

    z-index: 80;

    width: min(1450px, 92%);

    margin: auto;

    padding-top: 28px;

    display: flex;

    justify-content: space-between;

    align-items: center;
}}


.brand {{

    display: flex;

    align-items: center;

    gap: 13px;

    color: #eeeeff;

    font-size: 13px;

    font-weight: 600;

    letter-spacing: 6px;

    text-transform: uppercase;

    text-shadow:
        0 0 18px rgba(150,130,255,0.25);
}}


.brand-icon {{

    font-size: 28px;

    color: #e5e3ff;

    filter:
        drop-shadow(
            0 0 7px
            rgba(150,120,255,0.9)
        )
        drop-shadow(
            0 0 17px
            rgba(90,100,255,0.65)
        );
}}


.online {{

    display: flex;

    align-items: center;

    gap: 10px;

    padding: 9px 17px;

    border-radius: 50px;

    border:
        1px solid
        rgba(100,120,255,0.35);

    background:
        rgba(5,7,20,0.60);

    box-shadow:
        0 0 25px
        rgba(50,80,255,0.08);

    backdrop-filter:
        blur(14px);

    color: #cdd0e8;

    font-size: 10px;

    letter-spacing: 2px;
}}


.online-dot {{

    width: 8px;
    height: 8px;

    border-radius: 50%;

    background: #28f48c;

    box-shadow:
        0 0 8px #28f48c,
        0 0 18px rgba(40,244,140,0.7);

    animation:
        onlinePulse 2s ease-in-out infinite;
}}

@keyframes onlinePulse {{

    0%, 100% {{
        opacity: 1;
        transform: scale(1);
    }}

    50% {{
        opacity: .4;
        transform: scale(.72);
    }}
}}


/* ============================================================
   STARS / PARTICLES
============================================================ */

.stars {{

    position: absolute;

    inset: 0;

    z-index: 1;

    opacity: .65;

    background-image:

        radial-gradient(
            1px 1px at 8% 16%,
            rgba(255,255,255,.9),
            transparent
        ),

        radial-gradient(
            1px 1px at 15% 48%,
            rgba(140,120,255,.8),
            transparent
        ),

        radial-gradient(
            1px 1px at 24% 22%,
            rgba(255,255,255,.8),
            transparent
        ),

        radial-gradient(
            1px 1px at 31% 63%,
            rgba(110,140,255,.75),
            transparent
        ),

        radial-gradient(
            1px 1px at 42% 13%,
            rgba(255,255,255,.8),
            transparent
        ),

        radial-gradient(
            1px 1px at 51% 31%,
            rgba(170,130,255,.85),
            transparent
        ),

        radial-gradient(
            1px 1px at 63% 17%,
            rgba(255,255,255,.75),
            transparent
        ),

        radial-gradient(
            1px 1px at 71% 46%,
            rgba(110,140,255,.8),
            transparent
        ),

        radial-gradient(
            1px 1px at 79% 20%,
            rgba(255,255,255,.75),
            transparent
        ),

        radial-gradient(
            1px 1px at 91% 38%,
            rgba(170,120,255,.8),
            transparent
        ),

        radial-gradient(
            1px 1px at 84% 71%,
            rgba(100,120,255,.7),
            transparent
        );

    animation:
        starsDrift 18s linear infinite;
}}

@keyframes starsDrift {{

    from {{
        transform:
            translateY(0);
    }}

    to {{
        transform:
            translateY(-80px);
    }}
}}


/* ============================================================
   FLOATING PARTICLES
============================================================ */

.particle {{

    position: absolute;

    z-index: 4;

    width: 2px;
    height: 2px;

    border-radius: 50%;

    background: #ffffff;

    box-shadow:
        0 0 8px
        rgba(160,140,255,.9);

    opacity: .65;

    animation:
        particleFloat
        var(--time)
        ease-in-out
        infinite
        var(--delay);
}}

.p1 {{
    left: 19%;
    top: 35%;
    --time: 5s;
    --delay: 0s;
}}

.p2 {{
    left: 27%;
    top: 42%;
    --time: 7s;
    --delay: -2s;
}}

.p3 {{
    left: 73%;
    top: 32%;
    --time: 6s;
    --delay: -3s;
}}

.p4 {{
    left: 81%;
    top: 51%;
    --time: 8s;
    --delay: -4s;
}}

.p5 {{
    left: 12%;
    top: 58%;
    --time: 7s;
    --delay: -1s;
}}

.p6 {{
    left: 88%;
    top: 27%;
    --time: 5s;
    --delay: -2s;
}}

.p7 {{
    left: 57%;
    top: 18%;
    --time: 6s;
    --delay: -1s;
}}

@keyframes particleFloat {{

    0%, 100% {{
        transform:
            translate3d(0,0,0)
            scale(.7);

        opacity: .2;
    }}

    50% {{
        transform:
            translate3d(0,-35px,0)
            scale(1.5);

        opacity: 1;
    }}
}}


/* ============================================================
   BACKGROUND MOUNTAINS
============================================================ */

.mountains {{

    position: absolute;

    left: 0;
    right: 0;

    bottom: 19%;

    height: 40%;

    z-index: 3;

    overflow: hidden;

    pointer-events: none;
}}


.mountain-left {{

    position: absolute;

    left: -4%;

    bottom: 0;

    width: 48%;

    height: 100%;

    background:
        linear-gradient(
            135deg,
            #050313,
            #100c27 55%,
            #03030b
        );

    clip-path:
        polygon(
            0 100%,
            0 72%,
            7% 66%,
            13% 48%,
            18% 54%,
            26% 28%,
            33% 44%,
            42% 16%,
            48% 31%,
            58% 50%,
            67% 38%,
            76% 64%,
            88% 55%,
            100% 74%,
            100% 100%
        );

    box-shadow:
        inset -30px 0 50px
        rgba(100,50,200,.12);
}}


.mountain-right {{

    position: absolute;

    right: -4%;

    bottom: 0;

    width: 48%;

    height: 100%;

    background:
        linear-gradient(
            225deg,
            #050313,
            #0e0a24 55%,
            #03030b
        );

    clip-path:
        polygon(
            0 74%,
            12% 55%,
            24% 64%,
            33% 38%,
            42% 50%,
            52% 18%,
            61% 45%,
            70% 29%,
            78% 55%,
            87% 46%,
            100% 69%,
            100% 100%,
            0 100%
        );
}}


/* ============================================================
   MOUNTAIN NEON EDGES
============================================================ */

.neon-edge-left {{

    position: absolute;

    left: 0;

    bottom: 29%;

    width: 43%;

    height: 1px;

    z-index: 5;

    transform:
        rotate(-8deg);

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(174,58,255,.7),
            rgba(72,102,255,.5),
            transparent
        );

    filter:
        blur(.3px);

    box-shadow:
        0 0 10px
        rgba(150,50,255,.6);
}}

.neon-edge-right {{

    position: absolute;

    right: 0;

    bottom: 30%;

    width: 43%;

    height: 1px;

    z-index: 5;

    transform:
        rotate(8deg);

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(72,102,255,.5),
            rgba(174,58,255,.7),
            transparent
        );

    box-shadow:
        0 0 10px
        rgba(80,100,255,.6);
}}


/* ============================================================
   CENTRAL GLOW
============================================================ */

.center-glow {{

    position: absolute;

    left: 50%;
    top: 47%;

    width: 600px;
    height: 320px;

    transform:
        translate(-50%, -50%);

    z-index: 2;

    background:
        radial-gradient(
            ellipse,
            rgba(82,56,210,.24),
            rgba(55,80,190,.10) 35%,
            transparent 70%
        );

    filter:
        blur(25px);

    animation:
        centerGlow 5s ease-in-out infinite;
}}

@keyframes centerGlow {{

    0%, 100% {{
        opacity: .65;
        transform:
            translate(-50%,-50%)
            scale(1);
    }}

    50% {{
        opacity: 1;
        transform:
            translate(-50%,-50%)
            scale(1.08);
    }}
}}


/* ============================================================
   HERO
============================================================ */

.hero {{

    position: relative;

    z-index: 20;

    min-height: 84vh;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding:
        90px 20px
        120px;
}}


/* ============================================================
   CROWN
============================================================ */

.crown-area {{

    position: relative;

    width: 240px;

    height: 175px;

    display: flex;

    align-items: center;

    justify-content: center;

    margin-bottom: 2px;

    animation:
        crownFloat
        5s
        ease-in-out
        infinite;
}}


.crown {{

    position: relative;

    z-index: 4;

    font-size: 105px;

    line-height: 1;

    color: #f3efff;

    filter:

        drop-shadow(
            0 0 5px
            rgba(255,255,255,.95)
        )

        drop-shadow(
            0 0 14px
            rgba(96,110,255,.95)
        )

        drop-shadow(
            0 0 30px
            rgba(158,50,255,.65)
        );
}}


.crown-area::before {{

    content: "";

    position: absolute;

    width: 215px;
    height: 70px;

    border-radius: 50%;

    border:
        1px solid
        rgba(124,73,255,.9);

    box-shadow:

        0 0 10px
        rgba(140,70,255,.9),

        0 0 30px
        rgba(75,95,255,.55),

        inset 0 0 12px
        rgba(120,60,255,.45);

    transform:
        rotate(-7deg);

    animation:
        energyRing
        5s
        ease-in-out
        infinite;
}}


.crown-area::after {{

    content: "";

    position: absolute;

    width: 175px;
    height: 38px;

    border-radius: 50%;

    border:
        1px solid
        rgba(70,120,255,.7);

    box-shadow:
        0 0 15px
        rgba(50,100,255,.75);

    transform:
        rotate(8deg);

    animation:
        energyRingTwo
        4s
        ease-in-out
        infinite;
}}


@keyframes crownFloat {{

    0%, 100% {{
        transform:
            translateY(0);
    }}

    50% {{
        transform:
            translateY(-13px);
    }}
}}

@keyframes energyRing {{

    0%, 100% {{
        transform:
            rotate(-7deg)
            scaleX(1);
    }}

    50% {{
        transform:
            rotate(8deg)
            scaleX(1.08);
    }}
}}

@keyframes energyRingTwo {{

    0%, 100% {{
        transform:
            rotate(8deg)
            scaleX(1);
    }}

    50% {{
        transform:
            rotate(-10deg)
            scaleX(.9);
    }}
}}


/* ============================================================
   TITLE
============================================================ */

.title {{

    position: relative;

    z-index: 10;

    font-size:
        clamp(48px, 9.2vw, 128px);

    line-height: .9;

    font-weight: 950;

    letter-spacing:
        clamp(2px, 1vw, 10px);

    white-space: nowrap;

    color: #f4f3ff;

    text-shadow:

        0 1px 0 #ffffff,

        0 4px 12px
        rgba(0,0,0,.8),

        0 0 18px
        rgba(112,102,255,.8),

        0 0 45px
        rgba(92,65,255,.45);

    background:
        linear-gradient(
            180deg,
            #ffffff 0%,
            #d9d7ff 22%,
            #ffffff 43%,
            #9b91df 68%,
            #ffffff 100%
        );

    -webkit-background-clip: text;

    background-clip: text;

    -webkit-text-fill-color: transparent;

    filter:
        drop-shadow(
            0 0 8px
            rgba(100,90,255,.6)
        );

    animation:
        titleBreath
        6s
        ease-in-out
        infinite;
}}


@keyframes titleBreath {{

    0%, 100% {{
        filter:
            drop-shadow(
                0 0 7px
                rgba(100,90,255,.55)
            );
    }}

    50% {{
        filter:
            drop-shadow(
                0 0 15px
                rgba(100,90,255,.85)
            );
    }}
}}


/* ============================================================
   SUBTITLE
============================================================ */

.title-line {{

    width:
        min(720px, 82vw);

    display: flex;

    align-items: center;

    gap: 18px;

    margin-top: 22px;
}}


.title-line::before,
.title-line::after {{

    content: "";

    height: 1px;

    flex: 1;
}}


.title-line::before {{

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(180,170,255,.85)
        );
}}

.title-line::after {{

    background:
        linear-gradient(
            90deg,
            rgba(180,170,255,.85),
            transparent
        );
}}


.subtitle {{

    color: #d7d5ed;

    font-size:
        clamp(14px, 2vw, 22px);

    letter-spacing:
        clamp(4px, 1.2vw, 9px);

    font-weight: 400;

    white-space: nowrap;

    text-shadow:
        0 0 14px
        rgba(160,150,255,.3);
}}


.tagline {{

    margin-top: 25px;

    color: #aaa7c6;

    font-size: 11px;

    letter-spacing: 7px;

    font-weight: 500;
}}


/* ============================================================
   OPEN GAMES BUTTON
============================================================ */

.open-games {{

    position: relative;

    z-index: 20;

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 16px;

    width: 330px;

    max-width: 88vw;

    height: 76px;

    margin-top: 40px;

    border-radius: 50px;

    text-decoration: none;

    color: #f7f5ff;

    font-size: 16px;

    font-weight: 800;

    letter-spacing: 2px;

    border:
        1px solid
        rgba(165,100,255,.95);

    background:

        linear-gradient(
            90deg,
            rgba(94,24,188,.28),
            rgba(25,76,220,.22)
        );

    box-shadow:

        0 0 15px
        rgba(150,70,255,.5),

        0 0 45px
        rgba(50,90,255,.25),

        inset 0 0 25px
        rgba(110,60,255,.14);

    overflow: hidden;

    transition:
        transform .35s ease,
        box-shadow .35s ease;
}}


.open-games::before {{

    content: "";

    position: absolute;

    top: 0;

    left: -100%;

    width: 65%;

    height: 100%;

    transform:
        skewX(-20deg);

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.27),
            transparent
        );

    animation:
        buttonSweep
        4s
        ease-in-out
        infinite;
}}


@keyframes buttonSweep {{

    0% {{
        left: -100%;
    }}

    48%, 100% {{
        left: 150%;
    }}
}}


.open-games:hover {{

    transform:
        translateY(-5px)
        scale(1.025);

    box-shadow:

        0 0 25px
        rgba(160,80,255,.75),

        0 0 65px
        rgba(45,95,255,.40),

        inset 0 0 30px
        rgba(120,70,255,.18);
}}


.controller {{

    font-size: 25px;

    filter:
        drop-shadow(
            0 0 8px
            rgba(150,110,255,.9)
        );
}}


.arrow {{

    font-size: 24px;

    transition:
        transform .3s ease;
}}


.open-games:hover .arrow {{
    transform:
        translateX(7px);
}}


/* ============================================================
   SYSTEM STATUS
============================================================ */

.system-status {{

    margin-top: 25px;

    display: flex;

    align-items: center;

    gap: 10px;

    padding:
        9px 20px;

    border-radius: 50px;

    border:
        1px solid
        rgba(80,90,180,.30);

    background:
        rgba(2,4,16,.65);

    color: #9294b2;

    font-size: 9px;

    letter-spacing: 3px;

    backdrop-filter:
        blur(12px);
}}


/* ============================================================
   REFLECTIVE FLOOR
============================================================ */

.floor {{

    position: absolute;

    left: -15%;

    right: -15%;

    bottom: -15%;

    height: 39%;

    z-index: 6;

    transform:
        perspective(500px)
        rotateX(62deg);

    transform-origin:
        center bottom;

    background-image:

        linear-gradient(
            rgba(90,80,180,.13) 1px,
            transparent 1px
        ),

        linear-gradient(
            90deg,
            rgba(70,100,220,.10) 1px,
            transparent 1px
        );

    background-size:
        65px 65px;

    mask-image:
        linear-gradient(
            to bottom,
            transparent 0%,
            black 40%,
            black 100%
        );

    opacity: .55;

    animation:
        floorMove
        7s
        linear
        infinite;
}}


@keyframes floorMove {{

    from {{
        background-position:
            0 0,
            0 0;
    }}

    to {{
        background-position:
            0 65px,
            65px 0;
    }}
}}


/* ============================================================
   HORIZON LIGHT
============================================================ */

.horizon {{

    position: absolute;

    left: 50%;

    bottom: 22%;

    width: 72%;

    height: 2px;

    transform:
        translateX(-50%);

    z-index: 10;

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(174,60,255,.85) 22%,
            rgba(70,130,255,.95) 50%,
            rgba(174,60,255,.85) 78%,
            transparent
        );

    box-shadow:

        0 0 8px
        rgba(95,100,255,.9),

        0 0 25px
        rgba(125,55,255,.55);
}}


.horizon-glow {{

    position: absolute;

    left: 50%;

    bottom: 20%;

    width: 65%;

    height: 80px;

    transform:
        translateX(-50%);

    z-index: 8;

    background:
        radial-gradient(
            ellipse,
            rgba(65,95,255,.20),
            transparent 70%
        );

    filter:
        blur(18px);
}}


/* ============================================================
   FEATURES
============================================================ */

.features {{

    position: relative;

    z-index: 30;

    width:
        min(1200px, 92%);

    margin:
        -10px auto
        0;

    display:
        grid;

    grid-template-columns:
        repeat(4, 1fr);

    border-top:
        1px solid
        rgba(130,120,210,.10);

    border-bottom:
        1px solid
        rgba(130,120,210,.10);

    background:
        linear-gradient(
            180deg,
            rgba(3,4,15,.25),
            rgba(1,2,8,.50)
        );

    backdrop-filter:
        blur(10px);
}}


.feature {{

    position: relative;

    padding:
        35px 20px;

    text-align: center;
}}


.feature:not(:last-child)::after {{

    content: "";

    position: absolute;

    top: 24%;

    right: 0;

    width: 1px;

    height: 52%;

    background:
        rgba(150,140,230,.12);
}}


.feature-icon {{

    font-size: 25px;

    margin-bottom: 13px;

    filter:
        drop-shadow(
            0 0 8px
            rgba(110,100,255,.75)
        );
}}


.feature h3 {{

    color: #eeeeff;

    font-size: 10px;

    letter-spacing: 3px;

    margin-bottom: 10px;
}}


.feature p {{

    color: #77768d;

    font-size: 11px;

    letter-spacing: .3px;
}}


/* ============================================================
   FOOTER
============================================================ */

.footer {{

    position: relative;

    z-index: 40;

    padding:
        28px 15px
        40px;

    text-align: center;

    color: #4f4e62;

    font-size: 10px;

    letter-spacing: 2px;
}}


.footer strong {{

    color: #8178aa;
}}


/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 850px) {{

    .topbar {{
        width: 90%;
        padding-top: 20px;
    }}

    .brand {{
        font-size: 10px;
        letter-spacing: 4px;
    }}

    .brand-icon {{
        font-size: 22px;
    }}

    .online {{
        padding: 7px 12px;
        font-size: 8px;
    }}

    .hero {{
        min-height: 82vh;
        padding:
            55px 15px
            95px;
    }}

    .crown-area {{
        transform: scale(.76);
        margin-bottom: -12px;
    }}

    .title {{
        font-size:
            clamp(40px, 13vw, 82px);

        letter-spacing: 2px;
    }}

    .subtitle {{
        font-size: 12px;
        letter-spacing: 4px;
    }}

    .tagline {{
        font-size: 8px;
        letter-spacing: 4px;
    }}

    .open-games {{
        width: 285px;
        height: 65px;
        font-size: 13px;
    }}

    .features {{
        grid-template-columns:
            repeat(2, 1fr);
    }}

    .feature:nth-child(1),
    .feature:nth-child(2) {{
        border-bottom:
            1px solid
            rgba(130,120,210,.10);
    }}

    .feature:nth-child(2)::after {{
        display: none;
    }}

    .mountains {{
        bottom: 20%;
        height: 32%;
    }}

    .floor {{
        height: 32%;
    }}
}}


@media (max-width: 480px) {{

    .hero {{
        padding-top: 50px;
    }}

    .brand {{
        gap: 8px;
        font-size: 8px;
        letter-spacing: 3px;
    }}

    .online {{
        padding: 6px 9px;
    }}

    .hero-crown-wrap {{
        transform: scale(.62);
        margin-bottom: -22px;
    }}

    .title {{
        font-size: 40px;
    }}

    .title-line {{
        gap: 10px;
    }}

    .subtitle {{
        font-size: 10px;
        letter-spacing: 3px;
    }}

    .tagline {{
        margin-top: 18px;
        letter-spacing: 3px;
    }}

    .open-games {{
        width: 265px;
        height: 61px;
        margin-top: 32px;
    }}

    .features {{
        width: 94%;
    }}

    .feature {{
        padding:
            27px 8px;
    }}

    .feature-icon {{
        font-size: 22px;
    }}

    .feature h3 {{
        font-size: 8px;
        letter-spacing: 2px;
    }}

    .feature p {{
        font-size: 9px;
    }}

    .mountains {{
        bottom: 21%;
    }}

    .horizon {{
        bottom: 23%;
        width: 90%;
    }}

    .horizon-glow {{
        bottom: 21%;
        width: 85%;
    }}

    .floor {{
        height: 27%;
    }}
}}


/* ============================================================
   REDUCED MOTION
============================================================ */

@media (prefers-reduced-motion: reduce) {{

    *,
    *::before,
    *::after {{
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
    }}
}}

</style>

</head>


<body>


<div class="scene">


    <!-- =====================================================
         BACKGROUND
    ====================================================== -->

    <div class="stars"></div>

    <div class="center-glow"></div>


    <div class="particle p1"></div>
    <div class="particle p2"></div>
    <div class="particle p3"></div>
    <div class="particle p4"></div>
    <div class="particle p5"></div>
    <div class="particle p6"></div>
    <div class="particle p7"></div>


    <!-- =====================================================
         MOUNTAINS
    ====================================================== -->

    <div class="mountains">

        <div class="mountain-left"></div>

        <div class="mountain-right"></div>

    </div>


    <div class="neon-edge-left"></div>

    <div class="neon-edge-right"></div>


    <!-- =====================================================
         FLOOR
    ====================================================== -->

    <div class="floor"></div>

    <div class="horizon"></div>

    <div class="horizon-glow"></div>


    <!-- =====================================================
         NAVBAR
    ====================================================== -->

    <header class="topbar">


        <div class="brand">

            <span class="brand-icon">
                ♛
            </span>

            <span>
                MASTERMIND
            </span>

        </div>


        <div class="online">

            <span class="online-dot"></span>

            <span>
                BOT ONLINE
            </span>

        </div>


    </header>


    <!-- =====================================================
         HERO
    ====================================================== -->

    <section class="hero">


        <!-- CROWN -->

        <div class="crown-area">

            <div class="crown">
                ♛
            </div>

        </div>


        <!-- TITLE -->

        <h1 class="title">
            MASTERMIND
        </h1>


        <!-- SUBTITLE -->

        <div class="title-line">

            <div class="subtitle">
                CRACKER GAMES
            </div>

        </div>


        <div class="tagline">
            PLAY&nbsp;&nbsp;•&nbsp;&nbsp;EXPLORE&nbsp;&nbsp;•&nbsp;&nbsp;WIN
        </div>


        <!-- OPEN GAMES -->

        <a
            href="{GAMES_URL}"
            class="open-games"
        >

            <span class="controller">
                🎮
            </span>

            <span>
                OPEN GAMES
            </span>

            <span class="arrow">
                →
            </span>

        </a>


        <!-- STATUS -->

        <div class="system-status">

            <span class="online-dot"></span>

            <span>
                BOT ONLINE
            </span>

        </div>


    </section>


    <!-- =====================================================
         FEATURES
    ====================================================== -->

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


    <!-- =====================================================
         FOOTER
    ====================================================== -->

    <div class="footer">

        Crafted by
        <strong>MASTERMIND</strong>
        • CRACKER GAMES

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
# GAMES MINI APP
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
    methods=["POST"]
)
def telegram_webhook():

    try:

        data = request.get_json(
            force=True,
            silent=True
        )

        if not data:

            return Response(
                "Bad Request",
                status=400
            )


        update = Update.de_json(
            data,
            telegram_app.bot
        )


        telegram_app.update_queue.put_nowait(
            update
        )


        return Response(
            "OK",
            status=200
        )


    except Exception:

        logger.exception(
            "Telegram webhook error"
        )

        return Response(
            "Internal Server Error",
            status=500
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
        LANDING_URL
    )

    logger.info(
        "Games URL: %s",
        GAMES_URL
    )

    logger.info(
        "Webhook URL: %s",
        TELEGRAM_WEBHOOK_URL
    )


    # --------------------------------------------------------
    # Telegram Menu
    #
    # Menu -> 🚀 On Bot
    # -> Render landing page
    # --------------------------------------------------------

    await telegram_app.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="🚀 On Bot",
            web_app=WebAppInfo(
                url=LANDING_URL
            )
        )
    )


    # --------------------------------------------------------
    # Commands
    # --------------------------------------------------------

    await telegram_app.bot.set_my_commands(
        [
            BotCommand(
                "start",
                "🏠 Start"
            ),

            BotCommand(
                "games",
                "🎮 Games"
            ),

            BotCommand(
                "onbot",
                "🚀 On Bot"
            ),
        ]
    )


    # --------------------------------------------------------
    # Webhook
    # --------------------------------------------------------

    await telegram_app.bot.set_webhook(
        url=TELEGRAM_WEBHOOK_URL,
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )


    # --------------------------------------------------------
    # ASGI
    # --------------------------------------------------------

    asgi_app = WsgiToAsgi(app)


    config = uvicorn.Config(
        asgi_app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )


    server = uvicorn.Server(
        config
    )


    # --------------------------------------------------------
    # START
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
