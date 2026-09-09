# bot/games/escape_room.py

import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

active_escape_rooms = {}

ROOMS = [
    {
        "name": "🕰️ The Clock Room",
        "story": "একটি পুরোনো ঘরে দরজা লক হয়ে গেছে। দেয়ালে একটি clock, একটি locked drawer আর একটি keypad আছে।",
        "clues": [
            "Clock-এ 3:15 দেখা যাচ্ছে।",
            "Drawer-এর পাশে লেখা: 'সময়কে সংখ্যায় বদলাও'।",
            "Keypad-এ 4 digit code দরকার।",
        ],
        "answer": "0315",
        "hint": "ঘড়িতে যে সময় দেখা যাচ্ছে, সেটাই code-এর সবচেয়ে বড় clue।",
    },
    {
        "name": "📚 The Secret Library",
        "story": "একটি secret library-তে আটকে গেছো। দরজার পাশে চারটি symbol এবং একটি keypad আছে।",
        "clues": [
            "বইয়ের মলাটে symbols-এর order: STAR, MOON, SUN, CLOUD।",
            "একটি note বলছে: STAR=7, MOON=2, SUN=5, CLOUD=9।",
            "Keypad-এ চার digit code দরকার।",
        ],
        "answer": "7259",
        "hint": "Symbols-এর order ঠিক রেখে তাদের সংখ্যাগুলো বসাও।",
    },
    {
        "name": "🧪 The Laboratory",
        "story": "একটি puzzle lab-এ exit lock খুলতে হবে। তিনটি coloured bottle-এর নিচে সংখ্যা লেখা।",
        "clues": [
            "Blue bottle: 4",
            "Green bottle: 8",
            "Red bottle: 1",
        ],
        "answer": "481",
        "hint": "Bottle-এর যে order দেওয়া আছে, সেই order-এই সংখ্যাগুলো ব্যবহার করো।",
    },
]


def menu_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔍 Search Room", callback_data="escape:search")],
        [InlineKeyboardButton("🧩 Check Clues", callback_data="escape:clues")],
        [InlineKeyboardButton("💡 Hint", callback_data="escape:hint")],
        [InlineKeyboardButton("🔐 Enter Code", callback_data="escape:code")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def result_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🚪 New Room", callback_data="game:escape")],
        [InlineKeyboardButton("🎮 All Games", callback_data="menu:games")],
    ])


def user_key(query):
    return query.from_user.id if query.from_user else query.message.chat_id


def room_text(state):
    room = ROOMS[state["room_index"]]
    return (
        f"🚪 *Escape Room*\n\n"
        f"🏛️ *{room['name']}*\n\n"
        f"{room['story']}\n\n"
        f"🔐 Attempts: *{state['attempts']}*\n"
        f"🧩 Clues found: *{len(state['found'])}/{len(room['clues'])}*\n\n"
        f"নিচের action বেছে নাও 👇"
    )


async def start_escape_room(query):
    key = user_key(query)
    index = random.randrange(len(ROOMS))
    active_escape_rooms[key] = {
        "room_index": index,
        "found": set(),
        "attempts": 0,
    }
    await query.edit_message_text(
        room_text(active_escape_rooms[key]),
        parse_mode="Markdown",
        reply_markup=menu_keyboard(),
    )


async def handle_escape_room(query, data):
    key = user_key(query)
    state = active_escape_rooms.get(key)

    if state is None:
        await start_escape_room(query)
        return

    room = ROOMS[state["room_index"]]

    if data == "escape:search":
        available = [i for i in range(len(room["clues"])) if i not in state["found"]]
        if available:
            clue_index = random.choice(available)
            state["found"].add(clue_index)
            clue = room["clues"][clue_index]
            text = (
                "🔎 *You found a clue!*\n\n"
                f"🧩 {clue}\n\n"
                + room_text(state)
            )
        else:
            text = "🔎 *আর কোনো নতুন clue পাওয়া যাচ্ছে না!*\n\n" + room_text(state)

        await query.edit_message_text(text, parse_mode="Markdown", reply_markup=menu_keyboard())
        return

    if data == "escape:clues":
        if not state["found"]:
            text = "🧩 এখনো কোনো clue খুঁজে পাওনি। *Search Room* চাপো।"
        else:
            lines = [f"🧩 *Found Clues ({len(state['found'])}/{len(room['clues'])})*\n"]
            for i in sorted(state["found"]):
                lines.append(f"• {room['clues'][i]}")
            text = "\n".join(lines)
        await query.edit_message_text(text, parse_mode="Markdown", reply_markup=menu_keyboard())
        return

    if data == "escape:hint":
        await query.edit_message_text(
            f"💡 *Hint*\n\n{room['hint']}\n\n"
            "Clueগুলো ভালো করে মিলিয়ে code বের করো!",
            parse_mode="Markdown",
            reply_markup=menu_keyboard(),
        )
        return

    if data == "escape:code":
        await query.edit_message_text(
            "🔐 *Enter Code*\n\n"
            "Telegram button দিয়ে text input নেওয়া যায় না, তাই নিচের ready codes থেকে একটি বেছে নাও।",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔢 Try 0315", callback_data="escape:try:0315")],
                [InlineKeyboardButton("🔢 Try 7259", callback_data="escape:try:7259")],
                [InlineKeyboardButton("🔢 Try 481", callback_data="escape:try:481")],
                [InlineKeyboardButton("🔙 Back", callback_data="game:escape:back")],
            ]),
        )
        return

    if data.startswith("escape:try:"):
        code = data.split(":", 2)[2]
        state["attempts"] += 1

        if code == room["answer"]:
            score = max(100 - (state["attempts"] - 1) * 15, 25)
            active_escape_rooms.pop(key, None)
            await query.edit_message_text(
                "🎉 *ESCAPED!* 🚪\n\n"
                f"🏛️ {room['name']}\n"
                f"🔐 Attempts: *{state['attempts']}*\n"
                f"🏆 Score: *{score}*\n\n"
                "তুমি successfully room-এর puzzle solve করেছো!",
                parse_mode="Markdown",
                reply_markup=result_keyboard(),
            )
        else:
            await query.edit_message_text(
                "❌ *Wrong Code!*\n\n"
                f"🔐 Attempts: *{state['attempts']}*\n"
                "আরও clue খুঁজে দেখো।",
                parse_mode="Markdown",
                reply_markup=menu_keyboard(),
            )
        return

    if data == "game:escape:back":
        await query.edit_message_text(
            room_text(state),
            parse_mode="Markdown",
            reply_markup=menu_keyboard(),
        )
        return

    await query.edit_message_text(
        room_text(state),
        parse_mode="Markdown",
        reply_markup=menu_keyboard(),
    )
