import os
import asyncio
import logging
from http import HTTPStatus

from asgiref.wsgi import WsgiToAsgi
from flask import Flask, request, Response, send_from_directory

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


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


# =========================================================
# ENVIRONMENT
# =========================================================

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "").rstrip("/")
PORT = int(os.getenv("PORT", "10000"))

if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN environment variable is missing."
    )

if not WEBHOOK_URL:
    raise RuntimeError(
        "WEBHOOK_URL environment variable is missing."
    )


# =========================================================
# FLASK APP
# =========================================================

web_app = Flask(__name__)


# =========================================================
# WEBAPP DIRECTORY
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

WEBAPP_DIR = os.path.join(
    BASE_DIR,
    "webapp",
)


# =========================================================
# TELEGRAM APPLICATION
# =========================================================

telegram_app = (
    Application.builder()
    .token(BOT_TOKEN)
    .updater(None)
    .build()
)


# =========================================================
# TELEGRAM HANDLERS
# =========================================================

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


# =========================================================
# PREMIUM LANDING PAGE
# =========================================================

@web_app.get("/")
def home():

    return """
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
    content="#030305"
>

<title>CRACKER GAMES — MASTERMIND</title>


<style>

/* =====================================================
   RESET
===================================================== */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}


/* =====================================================
   BODY
===================================================== */

html {
    scroll-behavior: smooth;
}

body {

    min-height: 100vh;

    overflow: hidden;

    font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    color: white;

    background: #030305;

    position: relative;
}


/* =====================================================
   ANIMATED ATMOSPHERE
===================================================== */

body::before {

    content: "";

    position: fixed;

    inset: -35%;

    z-index: -10;

    background:

        radial-gradient(
            circle at 15% 20%,
            rgba(0, 229, 255, 0.16),
            transparent 28%
        ),

        radial-gradient(
            circle at 85% 20%,
            rgba(124, 58, 237, 0.17),
            transparent 30%
        ),

        radial-gradient(
            circle at 50% 90%,
            rgba(0, 255, 153, 0.09),
            transparent 30%
        );

    filter: blur(35px);

    animation:
        atmosphere 12s ease-in-out infinite alternate;
}


@keyframes atmosphere {

    0% {
        transform:
            scale(1)
            rotate(0deg);
    }

    100% {
        transform:
            scale(1.18)
            rotate(5deg);
    }
}


/* =====================================================
   GRID
===================================================== */

.grid {

    position: fixed;

    inset: 0;

    z-index: -8;

    opacity: 0.15;

    background-image:

        linear-gradient(
            rgba(255,255,255,0.04) 1px,
            transparent 1px
        ),

        linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 1px,
            transparent 1px
        );

    background-size: 55px 55px;

    mask-image:
        radial-gradient(
            ellipse at center,
            black 15%,
            transparent 78%
        );

    animation:
        gridMove 18s linear infinite;
}


@keyframes gridMove {

    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(55px);
    }
}


/* =====================================================
   PARTICLES
===================================================== */

.particles {

    position: fixed;

    inset: 0;

    z-index: -5;

    pointer-events: none;

    overflow: hidden;
}


.particle {

    position: absolute;

    width: 3px;

    height: 3px;

    border-radius: 50%;

    background: rgba(255,255,255,0.8);

    box-shadow:
        0 0 14px rgba(255,255,255,0.9);

    animation:
        floatParticle linear infinite;
}


@keyframes floatParticle {

    from {

        transform:
            translateY(110vh)
            scale(0.5);

        opacity: 0;
    }

    15% {
        opacity: 1;
    }

    85% {
        opacity: 1;
    }

    to {

        transform:
            translateY(-10vh)
            scale(1.25);

        opacity: 0;
    }
}


/* =====================================================
   SCANLINES
===================================================== */

.scanlines {

    position: fixed;

    inset: 0;

    z-index: 50;

    pointer-events: none;

    opacity: 0.13;

    background:
        linear-gradient(
            transparent 50%,
            rgba(255,255,255,0.025) 50%
        );

    background-size:
        100% 4px;
}


/* =====================================================
   NAVIGATION
===================================================== */

.nav {

    width: min(1150px, 92%);

    margin: auto;

    padding: 25px 0;

    display: flex;

    justify-content: space-between;

    align-items: center;

    position: relative;

    z-index: 10;
}


.brand {

    display: flex;

    align-items: center;

    gap: 12px;

    font-size: 13px;

    font-weight: 900;

    letter-spacing: 3px;
}


.brand-icon {

    width: 40px;

    height: 40px;

    display: grid;

    place-items: center;

    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            rgba(0,229,255,0.15),
            rgba(124,58,237,0.18)
        );

    border:
        1px solid
        rgba(255,255,255,0.12);

    box-shadow:
        0 0 30px
        rgba(0,229,255,0.13);

    font-size: 20px;
}


.nav-status {

    display: flex;

    align-items: center;

    gap: 9px;

    padding: 9px 15px;

    border-radius: 999px;

    background:
        rgba(255,255,255,0.035);

    border:
        1px solid
        rgba(255,255,255,0.08);

    backdrop-filter: blur(15px);

    color: #8d98aa;

    font-size: 10px;

    letter-spacing: 1.5px;
}


.nav-dot {

    width: 7px;

    height: 7px;

    border-radius: 50%;

    background: #31ff91;

    box-shadow:
        0 0 15px #31ff91;

    animation:
        pulse 1.5s ease-in-out infinite;
}


@keyframes pulse {

    50% {

        transform: scale(1.55);

        opacity: 0.5;
    }
}


/* =====================================================
   HERO
===================================================== */

.hero {

    width: min(1150px, 92%);

    min-height:
        calc(100vh - 90px);

    margin: auto;

    display: flex;

    justify-content: center;

    align-items: center;

    text-align: center;

    position: relative;
}


.hero-content {

    width: 100%;

    max-width: 1000px;

    padding:
        30px
        20px
        80px;

    animation:
        heroEnter
        1.2s
        cubic-bezier(.2,.8,.2,1)
        both;

    transition:
        transform
        0.25s
        ease-out;
}


@keyframes heroEnter {

    from {

        opacity: 0;

        transform:
            translateY(45px)
            scale(0.96);
    }

    to {

        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }
}


/* =====================================================
   BADGE
===================================================== */

.badge {

    display: inline-flex;

    align-items: center;

    gap: 9px;

    padding: 10px 17px;

    border-radius: 999px;

    background:
        rgba(255,255,255,0.035);

    border:
        1px solid
        rgba(255,255,255,0.10);

    color: #919bad;

    font-size: 10px;

    letter-spacing: 2.5px;

    text-transform: uppercase;

    backdrop-filter:
        blur(18px);

    box-shadow:

        inset 0 1px
        rgba(255,255,255,0.06),

        0 20px 60px
        rgba(0,0,0,0.3);

    animation:
        badgeFloat
        4s
        ease-in-out
        infinite;
}


@keyframes badgeFloat {

    50% {
        transform: translateY(-5px);
    }
}


.badge-icon {

    color: #63e6ff;

    text-shadow:
        0 0 15px
        rgba(99,230,255,0.8);

    font-size: 14px;
}


/* =====================================================
   TITLE
===================================================== */

.title {

    margin-top: 28px;

    font-size:
        clamp(45px, 9.5vw, 108px);

    line-height: 0.88;

    font-weight: 950;

    letter-spacing:
        clamp(2px, 0.7vw, 8px);

    text-transform: uppercase;

    background:

        linear-gradient(
            105deg,
            #ffffff 5%,
            #7deaff 28%,
            #ffffff 48%,
            #bb83ff 72%,
            #ffffff 95%
        );

    background-size: 250% auto;

    -webkit-background-clip: text;

    background-clip: text;

    -webkit-text-fill-color: transparent;

    animation:
        titleShine
        6s
        linear
        infinite;

    filter:
        drop-shadow(
            0 0 30px
            rgba(0,220,255,0.14)
        );
}


@keyframes titleShine {

    from {
        background-position: 0% center;
    }

    to {
        background-position: 250% center;
    }
}


/* =====================================================
   TITLE GLOW
===================================================== */

.title::after {

    content: "CRACKER GAMES";

    position: absolute;

    left: 50%;

    transform:
        translateX(-50%);

    margin-top: 12px;

    width: 100%;

    font-size:
        clamp(45px, 9.5vw, 108px);

    line-height: 0.88;

    font-weight: 950;

    letter-spacing:
        clamp(2px, 0.7vw, 8px);

    color: transparent;

    filter:
        blur(35px);

    opacity: 0.13;

    z-index: -1;
}


/* =====================================================
   DEVELOPER
===================================================== */

.developer {

    margin-top: 28px;

    display: flex;

    justify-content: center;

    align-items: center;

    gap: 13px;

    color: #7f899c;

    font-size:
        clamp(12px, 2vw, 16px);

    letter-spacing: 5px;

    text-transform: uppercase;
}


.developer-line {

    width: 35px;

    height: 1px;

    background:
        linear-gradient(
            90deg,
            transparent,
            #63e6ff
        );
}


.developer-line.right {

    background:
        linear-gradient(
            90deg,
            #b57cff,
            transparent
        );
}


.developer strong {

    color: #ffffff;

    font-weight: 850;

    text-shadow:
        0 0 25px
        rgba(255,255,255,0.2);
}


/* =====================================================
   DESCRIPTION
===================================================== */

.description {

    max-width: 620px;

    margin:
        30px auto 0;

    color: #747f92;

    font-size:
        clamp(14px, 2vw, 17px);

    line-height: 1.8;
}


/* =====================================================
   STATUS
===================================================== */

.status-card {

    margin:
        38px auto 0;

    width: fit-content;

    max-width: 90%;

    padding:
        14px 20px;

    display: flex;

    align-items: center;

    gap: 12px;

    border-radius: 16px;

    background:
        linear-gradient(
            135deg,
            rgba(255,255,255,0.065),
            rgba(255,255,255,0.025)
        );

    border:
        1px solid
        rgba(255,255,255,0.09);

    backdrop-filter:
        blur(22px);

    box-shadow:

        inset 0 1px
        rgba(255,255,255,0.07),

        0 25px 70px
        rgba(0,0,0,0.4);

    color: #909bae;

    font-size: 11px;

    letter-spacing: 1px;
}


.status-light {

    width: 9px;

    height: 9px;

    border-radius: 50%;

    background: #31ff91;

    box-shadow:
        0 0 20px
        rgba(49,255,145,0.9);

    animation:
        pulse 1.4s
        ease-in-out
        infinite;
}


.status-card strong {

    color: #5effa8;
}


/* =====================================================
   FLOATING ORBS
===================================================== */

.orb {

    position: absolute;

    border-radius: 50%;

    pointer-events: none;

    filter: blur(4px);
}


.orb-one {

    width: 180px;

    height: 180px;

    left: -40px;

    top: 18%;

    background:
        radial-gradient(
            circle,
            rgba(0,229,255,0.11),
            transparent 70%
        );

    animation:
        orbOne
        8s
        ease-in-out
        infinite;
}


.orb-two {

    width: 220px;

    height: 220px;

    right: -50px;

    bottom: 12%;

    background:
        radial-gradient(
            circle,
            rgba(145,70,255,0.12),
            transparent 70%
        );

    animation:
        orbTwo
        10s
        ease-in-out
        infinite;
}


@keyframes orbOne {

    50% {

        transform:
            translate(35px,-30px)
            scale(1.15);
    }
}


@keyframes orbTwo {

    50% {

        transform:
            translate(-35px,25px)
            scale(0.85);
    }
}


/* =====================================================
   FOOTER
===================================================== */

.footer {

    position: absolute;

    left: 0;

    right: 0;

    bottom: 22px;

    text-align: center;

    color: #3e4654;

    font-size: 9px;

    letter-spacing: 3px;

    text-transform: uppercase;
}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 600px) {

    body {
        overflow: hidden;
    }

    .nav {
        padding-top: 18px;
    }

    .brand {
        font-size: 10px;
        letter-spacing: 2px;
    }

    .brand-icon {
        width: 34px;
        height: 34px;
        font-size: 17px;
    }

    .nav-status {
        padding: 8px 10px;
        font-size: 8px;
    }

    .hero-content {
        padding-top: 20px;
    }

    .title {
        letter-spacing: 2px;
    }

    .developer {
        letter-spacing: 2.5px;
        gap: 8px;
    }

    .developer-line {
        width: 20px;
    }

    .description {
        padding: 0 12px;
        font-size: 13px;
    }

    .status-card {
        font-size: 9px;
        padding: 12px 14px;
    }

    .orb-one {
        left: -100px;
    }

    .orb-two {
        right: -120px;
    }

}


/* =====================================================
   REDUCED MOTION
===================================================== */

@media (prefers-reduced-motion: reduce) {

    *,
    *::before,
    *::after {

        animation-duration:
            0.01ms !important;

        animation-iteration-count:
            1 !important;
    }
}

</style>

</head>


<body>


<!-- =====================================================
     BACKGROUND
===================================================== -->

<div class="grid"></div>

<div class="particles"></div>

<div class="scanlines"></div>


<!-- =====================================================
     NAV
===================================================== -->

<header class="nav">

    <div class="brand">

        <div class="brand-icon">
            🎮
        </div>

        <span>
            CRACKER
        </span>

    </div>


    <div class="nav-status">

        <span class="nav-dot"></span>

        SYSTEM ONLINE

    </div>

</header>


<!-- =====================================================
     HERO
===================================================== -->

<main class="hero">


    <div class="orb orb-one"></div>

    <div class="orb orb-two"></div>


    <section class="hero-content">


        <div class="badge">

            <span class="badge-icon">✦</span>

            TELEGRAM GAMING HUB

        </div>


        <h1 class="title">

            CRACKER<br>
            GAMES

        </h1>


        <div class="developer">

            <span class="developer-line"></span>

            <span>
                Crafted by
                <strong>MASTERMIND</strong>
            </span>

            <span class="developer-line right"></span>

        </div>


        <p class="description">

            A premium collection of free
            mini-games built for fast,
            simple and fun gaming directly
            inside Telegram.

        </p>


        <div class="status-card">

            <span class="status-light"></span>

            <span>
                CRACKER GAMES SERVER
                <strong>READY</strong>
            </span>

        </div>


    </section>


    <div class="footer">

        MASTERMIND • CRACKER GAMES

    </div>


</main>


<script>

/* =====================================================
   PARTICLE ENGINE
===================================================== */

const particleBox =
    document.querySelector(".particles");


for (let i = 0; i < 42; i++) {

    const particle =
        document.createElement("div");

    particle.className =
        "particle";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.animationDuration =
        (10 + Math.random() * 18) + "s";

    particle.style.animationDelay =
        (Math.random() * 15) + "s";

    particle.style.opacity =
        0.25 + Math.random() * 0.75;

    const size =
        1 + Math.random() * 3;

    particle.style.width =
        size + "px";

    particle.style.height =
        size + "px";

    particleBox.appendChild(
        particle
    );
}


/* =====================================================
   MOUSE PARALLAX
===================================================== */

const hero =
    document.querySelector(
        ".hero-content"
    );


document.addEventListener(
    "mousemove",
    (event) => {

        if (window.innerWidth < 800) {
            return;
        }

        const x =
            event.clientX /
            window.innerWidth -
            0.5;

        const y =
            event.clientY /
            window.innerHeight -
            0.5;

        hero.style.transform =
            `translate(
                ${x * 8}px,
                ${y * 8}px
            )`;
    }
);


/* =====================================================
   RESET PARALLAX
===================================================== */

document.addEventListener(
    "mouseleave",
    () => {

        hero.style.transform =
            "translate(0, 0)";
    }
);

</script>


</body>

</html>
"""


# =========================================================
# TELEGRAM MINI APP
# =========================================================

@web_app.get("/games")
def games_webapp():

    return send_from_directory(
        WEBAPP_DIR,
        "index.html",
    )


# =========================================================
# TELEGRAM MINI APP STATIC FILES
# =========================================================

@web_app.get("/games/<path:filename>")
def games_webapp_files(filename):

    return send_from_directory(
        WEBAPP_DIR,
        filename,
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@web_app.get("/health")
def health():

    return "OK", HTTPStatus.OK


# =========================================================
# TELEGRAM WEBHOOK
# =========================================================

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

        await telegram_app.update_queue.put(
            update
        )

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


# =========================================================
# MAIN
# =========================================================

async def main():

    webhook_url = (
        f"{WEBHOOK_URL}/telegram"
    )


    logger.info(
        "Setting Telegram webhook: %s",
        webhook_url,
    )


    # =====================================================
    # SET WEBHOOK
    # =====================================================

    await telegram_app.bot.set_webhook(

        url=webhook_url,

        allowed_updates=Update.ALL_TYPES,

        drop_pending_updates=True,
    )


    # =====================================================
    # TELEGRAM MINI APP MENU BUTTON
    # =====================================================
    #
    # Telegram Menu Button:
    #
    # 🎮 Games
    #
    # Clicking it opens:
    #
    # https://YOUR-DOMAIN/games
    #
    # =====================================================

    await telegram_app.bot.set_chat_menu_button(

        menu_button=MenuButtonWebApp(

            text="🎮 Games",

            web_app=WebAppInfo(

                url=f"{WEBHOOK_URL}/games"

            ),
        )
    )


    logger.info(
        "🎮 Games Mini App menu button configured."
    )


    # =====================================================
    # ASGI
    # =====================================================

    asgi_app = WsgiToAsgi(
        web_app
    )


    # =====================================================
    # UVICORN
    # =====================================================

    server = uvicorn.Server(

        uvicorn.Config(

            asgi_app,

            host="0.0.0.0",

            port=PORT,

            log_level="info",
        )
    )


    # =====================================================
    # START
    # =====================================================

    async with telegram_app:

        await telegram_app.start()

        logger.info(
            "🎮 CRACKER GAMES — MASTERMIND is running!"
        )

        await server.serve()

        await telegram_app.stop()


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":

    asyncio.run(main())
