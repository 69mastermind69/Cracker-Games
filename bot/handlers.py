# bot/handlers.py

import os

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import ContextTypes

WEBHOOK_URL = os.getenv("WEBHOOK_URL", "https://cracker-games.onrender.com").rstrip("/")
WEBAPP_URL = f"{WEBHOOK_URL}/games"

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🎮 Play Games", callback_data="menu:games")]]
    if not update.effective_message:
        return
    await update.effective_message.reply_text(
        "🎮 *Welcome to Cracker Games!*\n\n"
        "এখানে অনেকগুলো free mini game খেলতে পারবে।\n\n"
        "✨ No database\n✨ No permanent profile\n✨ No coins / XP system\n"
        "✨ Game state temporary RAM-এ থাকে\n\n👇 নিচের button থেকে শুরু করো!",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🎮 Games", callback_data="menu:games")]]
    if not update.effective_message:
        return
    await update.effective_message.reply_text(
        "ℹ️ *Cracker Games Help*\n\n"
        "🎮 Games — সব available games দেখাবে\n"
        "🆕 More Free Games — নতুন mini games\n"
        "👨‍💻 Developer — developer information\n\n"
        "কোনো permanent user profile বা game history সংরক্ষণ করা হয় না।",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard),
    )

def games_menu():
    keyboard = [
        [InlineKeyboardButton("🎲 Dice", callback_data="game:dice"), InlineKeyboardButton("🪙 Coin Flip", callback_data="game:coin")],
        [InlineKeyboardButton("✊ Rock Paper Scissors", callback_data="game:rps")],
        [InlineKeyboardButton("🔢 Number Guess", callback_data="game:number"), InlineKeyboardButton("❓ Quiz", callback_data="game:quiz")],
        [InlineKeyboardButton("🔤 Word Scramble", callback_data="game:scramble"), InlineKeyboardButton("🎯 Hangman", callback_data="game:hangman")],
        [InlineKeyboardButton("⭕ Tic-Tac-Toe", callback_data="game:ttt"), InlineKeyboardButton("🔴 Connect Four", callback_data="game:connect4")],
        [InlineKeyboardButton("➗ Math Challenge", callback_data="game:math"), InlineKeyboardButton("🧠 Memory", callback_data="game:memory")],
        [InlineKeyboardButton("⬆️ Higher / Lower", callback_data="game:higher")],
        [InlineKeyboardButton("🏰 Dungeon RPG", callback_data="game:dungeon"), InlineKeyboardButton("🕵️ Detective Case", callback_data="game:detective")],
        [InlineKeyboardButton("🌍 World Conquest", callback_data="game:world"), InlineKeyboardButton("🚂 Railway Tycoon", callback_data="game:railway")],
        [InlineKeyboardButton("🏝️ Survival Island", callback_data="game:survival"), InlineKeyboardButton("🚀 Space Empire", callback_data="game:space")],
        [InlineKeyboardButton("🏛️ Civilization", callback_data="game:civilization"), InlineKeyboardButton("🏥 Hospital Manager", callback_data="game:hospital")],
        [InlineKeyboardButton("⚔️ Fantasy Quest", callback_data="game:fantasy"), InlineKeyboardButton("🚪 Escape Room", callback_data="game:escape")],
        [InlineKeyboardButton("👨‍💻 Developer", callback_data="developer")],
        [InlineKeyboardButton("🆕 More Free Games", callback_data="extra:menu")],
    ]
    return InlineKeyboardMarkup(keyboard)

async def games_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🎮 Open Games", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("📋 Classic Games", callback_data="menu:games")],
    ]
    if not update.effective_message:
        return
    await update.effective_message.reply_text(
        "🎮 *Cracker Games*\n\n"
        "Real-time graphical games খেলতে নিচের button চাপো।\n\n"
        "🏎️ Car Racing\n🥊 Fighting Arena\n🚀 Space Shooter\n"
        "🏃 Endless Runner\n⚽ Penalty Shootout\n🏀 Basketball\n"
        "🏹 Archery\n🎯 Target Shooter\n\n👇 *Choose an option:*",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def about_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🎮 Play Games", callback_data="menu:games")]]
    if not update.effective_message:
        return
    await update.effective_message.reply_text(
        "🎮 *Cracker Games*\n\n"
        "A collection of free Telegram mini games.\n\n"
        "💾 No permanent game database\n🎯 Temporary game state only\n🆓 Free to play\n\n"
        "Developer: *MASTERMIND*\nTelegram: *@Do_x_Die*",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard),
    )
