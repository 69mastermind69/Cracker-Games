# bot/games/extra_games.py

import random
import time

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM STATE
# ============================================================
# No database.
# No permanent user data.
# State disappears when the bot restarts/redeploys.

active_games = {}


# ============================================================
# COMMON MENU
# ============================================================

def all_games_button():
    return [
        InlineKeyboardButton(
            "🎮 All Games",
            callback_data="menu:games",
        )
    ]


def extra_menu():
    keyboard = [
        [
            InlineKeyboardButton(
                "🎲 Dice Battle",
                callback_data="extra:dicebattle",
            ),
            InlineKeyboardButton(
                "🎯 Target Hit",
                callback_data="extra:target",
            ),
        ],
        [
            InlineKeyboardButton(
                "🍀 Lucky Number",
                callback_data="extra:lucky",
            ),
            InlineKeyboardButton(
                "🎰 Random Choice",
                callback_data="extra:choice",
            ),
        ],
        [
            InlineKeyboardButton(
                "🃏 High Card",
                callback_data="extra:highcard",
            ),
            InlineKeyboardButton(
                "⚡ Quick Tap",
                callback_data="extra:quicktap",
            ),
        ],
        [
            InlineKeyboardButton(
                "🧩 Riddle",
                callback_data="extra:riddle",
            ),
            InlineKeyboardButton(
                "🔢 Sequence",
                callback_data="extra:sequence",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔎 Odd One",
                callback_data="extra:oddone",
            ),
            InlineKeyboardButton(
                "⚡ Reaction",
                callback_data="extra:reaction",
            ),
        ],
        [
            InlineKeyboardButton(
                "🎯 Accuracy",
                callback_data="extra:accuracy",
            ),
            InlineKeyboardButton(
                "🎈 Balloon Pop",
                callback_data="extra:balloon",
            ),
        ],
        [
            InlineKeyboardButton(
                "🐍 Snake",
                callback_data="extra:snake",
            ),
            InlineKeyboardButton(
                "🚗 Dodge",
                callback_data="extra:dodger",
            ),
        ],
        [
            InlineKeyboardButton(
                "🧱 Brick Breaker",
                callback_data="extra:brick",
            ),
        ],
        all_games_button(),
    ]

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# DICE BATTLE
# ============================================================

async def start_dice_battle(query):
    player = random.randint(1, 6)
    bot = random.randint(1, 6)

    if player > bot:
        result = "🏆 *You Win!*"
    elif player < bot:
        result = "🤖 *Bot Wins!*"
    else:
        result = "🤝 *Draw!*"

    keyboard = [
        [
            InlineKeyboardButton(
                "🎲 Roll Again",
                callback_data="extra:dicebattle",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🎲 *Dice Battle*\n\n"
        f"👤 Your Roll: *{player}*\n"
        f"🤖 Bot Roll: *{bot}*\n\n"
        f"{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# TARGET HIT
# ============================================================

async def start_target(query):
    target = random.randint(1, 5)

    keyboard = []

    row = []

    for number in range(1, 6):
        row.append(
            InlineKeyboardButton(
                str(number),
                callback_data=f"extra:target:{target}:{number}",
            )
        )

    keyboard.append(row)
    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🎯 *Target Hit*\n\n"
        "Target number-এ hit করো!\n"
        "একটি number নির্বাচন করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_target(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        target = int(parts[2])
        choice = int(parts[3])
    except ValueError:
        return

    if target == choice:
        result = "🎯 *Perfect Hit!*\n\n🏆 তুমি জিতে গেছো!"
    else:
        result = (
            f"❌ Miss!\n\n"
            f"🎯 Target: *{target}*\n"
            f"👉 তোমার choice: *{choice}*"
        )

    keyboard = [
        [
            InlineKeyboardButton(
                "🎯 Play Again",
                callback_data="extra:target",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🎯 *Target Hit*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# LUCKY NUMBER
# ============================================================

async def start_lucky(query):
    lucky = random.randint(1, 10)

    keyboard = [
        [
            InlineKeyboardButton(
                "🍀 Try Again",
                callback_data="extra:lucky",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🍀 *Lucky Number*\n\n"
        f"আজকের random number:\n\n"
        f"✨ *{lucky}*\n\n"
        "আবার try করতে পারো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# RANDOM CHOICE
# ============================================================

CHOICES = [
    "YES",
    "NO",
    "MAYBE",
    "TRY AGAIN",
    "GO FOR IT",
    "NOT NOW",
]


async def start_random_choice(query):
    result = random.choice(CHOICES)

    keyboard = [
        [
            InlineKeyboardButton(
                "🔄 Choose Again",
                callback_data="extra:choice",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🎰 *Random Choice*\n\n"
        f"🎯 Result:\n\n"
        f"*{result}*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# HIGH CARD
# ============================================================

async def start_high_card(query):
    player = random.randint(1, 13)
    bot = random.randint(1, 13)

    names = {
        1: "A",
        11: "J",
        12: "Q",
        13: "K",
    }

    player_card = names.get(player, str(player))
    bot_card = names.get(bot, str(bot))

    if player > bot:
        result = "🏆 *You Win!*"
    elif player < bot:
        result = "🤖 *Bot Wins!*"
    else:
        result = "🤝 *Draw!*"

    keyboard = [
        [
            InlineKeyboardButton(
                "🃏 Draw Again",
                callback_data="extra:highcard",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🃏 *High Card*\n\n"
        f"👤 Your Card: *{player_card}*\n"
        f"🤖 Bot Card: *{bot_card}*\n\n"
        f"{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# QUICK TAP
# ============================================================

async def start_quick_tap(query):
    number = random.randint(1, 9)

    keyboard = [
        [
            InlineKeyboardButton(
                str(number),
                callback_data=f"extra:quicktap:{number}",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "⚡ *Quick Tap*\n\n"
        f"এই number-এ tap করো:\n\n"
        f"## *{number}*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_quick_tap(query, data):
    parts = data.split(":")

    if len(parts) != 3:
        return

    keyboard = [
        [
            InlineKeyboardButton(
                "⚡ Play Again",
                callback_data="extra:quicktap",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "⚡ *Quick Tap*\n\n"
        "🔥 Nice tap!\n"
        "তুমি button-এ successfully tap করেছো।",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# RIDDLE
# ============================================================

RIDDLES = [
    (
        "আমি যত বেশি শুকাই, তত বেশি ভিজি। আমি কী?",
        ["তোয়ালে", "বৃষ্টি", "মেঘ"],
        0,
    ),
    (
        "আমার দাঁত আছে, কিন্তু আমি কামড়াতে পারি না। আমি কী?",
        ["চিরুনি", "কুকুর", "চাবি"],
        0,
    ),
    (
        "আমার চোখ আছে, কিন্তু আমি দেখতে পারি না। আমি কী?",
        ["আলু", "সুঁই", "পাথর"],
        1,
    ),
    (
        "যতই নাও, ততই পিছনে রেখে যাও। সেটা কী?",
        ["পদচিহ্ন", "পানি", "সময়"],
        0,
    ),
]


async def start_riddle(query):
    question, options, correct = random.choice(RIDDLES)

    keyboard = []

    for index, option in enumerate(options):
        keyboard.append(
            [
                InlineKeyboardButton(
                    option,
                    callback_data=f"extra:riddle:{correct}:{index}",
                )
            ]
        )

    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🧩 *Riddle Challenge*\n\n"
        f"{question}\n\n"
        "উত্তর নির্বাচন করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_riddle(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        correct = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    if selected == correct:
        result = "🏆 *Correct!*"
    else:
        result = "❌ *Wrong Answer!*"

    keyboard = [
        [
            InlineKeyboardButton(
                "🧩 New Riddle",
                callback_data="extra:riddle",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🧩 *Riddle Challenge*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# SEQUENCE PUZZLE
# ============================================================

SEQUENCES = [
    ([2, 4, 6], 8),
    ([3, 6, 9], 12),
    ([5, 10, 15], 20),
    ([1, 4, 7], 10),
    ([10, 20, 30], 40),
]


async def start_sequence(query):
    sequence, answer = random.choice(SEQUENCES)

    options = [
        answer,
        answer + random.randint(1, 3),
        max(1, answer - random.randint(1, 3)),
    ]

    random.shuffle(options)

    keyboard = [
        [
            InlineKeyboardButton(
                str(option),
                callback_data=f"extra:sequence:{answer}:{option}",
            )
        ]
        for option in options
    ]

    keyboard.append(all_games_button())

    sequence_text = " → ".join(str(x) for x in sequence)

    await query.edit_message_text(
        "🔢 *Sequence Puzzle*\n\n"
        f"{sequence_text} → ?\n\n"
        "পরের number কোনটি?",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_sequence(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        answer = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    result = (
        "🏆 *Correct!*"
        if answer == selected
        else f"❌ *Wrong!*\n\nCorrect answer: *{answer}*"
    )

    keyboard = [
        [
            InlineKeyboardButton(
                "🔢 Next Puzzle",
                callback_data="extra:sequence",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🔢 *Sequence Puzzle*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# ODD ONE OUT
# ============================================================

ODD_SETS = [
    (["🍎", "🍎", "🍎", "🍊"], 3),
    (["🔵", "🔵", "🟢", "🔵"], 2),
    (["⭐", "⭐", "🌟", "⭐"], 2),
    (["🐶", "🐶", "🐱", "🐶"], 2),
    (["🚗", "🚗", "🚕", "🚗"], 2),
]


async def start_odd_one(query):
    items, odd_index = random.choice(ODD_SETS)

    keyboard = []

    row = []

    for index, item in enumerate(items):
        row.append(
            InlineKeyboardButton(
                item,
                callback_data=f"extra:oddone:{odd_index}:{index}",
            )
        )

        if len(row) == 4:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)

    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🔎 *Find the Odd One*\n\n"
        "যেটা অন্যগুলোর থেকে আলাদা সেটায় tap করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_odd_one(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        correct = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    result = (
        "🎯 *Great! Correct!*\n\n"
        if correct == selected
        else "❌ *Not quite!*\n\n"
    )

    keyboard = [
        [
            InlineKeyboardButton(
                "🔎 Try Again",
                callback_data="extra:oddone",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🔎 *Find the Odd One*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# REACTION
# ============================================================

async def start_reaction(query):
    number = random.randint(100, 999)

    keyboard = [
        [
            InlineKeyboardButton(
                "⚡ TAP!",
                callback_data=f"extra:reaction:{number}",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "⚡ *Reaction Test*\n\n"
        "Ready?\n\n"
        f"🔢 *{number}*\n\n"
        "দেখলেই TAP করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_reaction(query, data):
    keyboard = [
        [
            InlineKeyboardButton(
                "⚡ Try Again",
                callback_data="extra:reaction",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "⚡ *Reaction Test*\n\n"
        "🔥 Nice reaction!\n\n"
        "আবার চেষ্টা করো এবং নিজের best time improve করার চেষ্টা করো।",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# ACCURACY
# ============================================================

async def start_accuracy(query):
    target = random.randint(1, 9)

    keyboard = []

    for row_start in range(1, 10, 3):
        row = []

        for number in range(row_start, row_start + 3):
            row.append(
                InlineKeyboardButton(
                    str(number),
                    callback_data=f"extra:accuracy:{target}:{number}",
                )
            )

        keyboard.append(row)

    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🎯 *Accuracy Challenge*\n\n"
        f"Target: *{target}*\n\n"
        "ঠিক number-এ tap করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_accuracy(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        target = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    if target == selected:
        result = "🎯 *Perfect Accuracy!*"
    else:
        result = (
            f"❌ Miss!\n\n"
            f"Target: *{target}*\n"
            f"You selected: *{selected}*"
        )

    keyboard = [
        [
            InlineKeyboardButton(
                "🎯 Play Again",
                callback_data="extra:accuracy",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🎯 *Accuracy Challenge*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# BALLOON POP
# ============================================================

async def start_balloon(query):
    balloon_count = random.randint(3, 6)

    balloons = ["🎈"] * balloon_count

    keyboard = []

    for index in range(balloon_count):
        keyboard.append(
            [
                InlineKeyboardButton(
                    "🎈",
                    callback_data=f"extra:balloon:{index}",
                )
            ]
        )

    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🎈 *Balloon Pop*\n\n"
        f"{' '.join(balloons)}\n\n"
        "একটা balloon pop করো! 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_balloon(query, data):
    keyboard = [
        [
            InlineKeyboardButton(
                "🎈 Pop Again",
                callback_data="extra:balloon",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🎈 *Balloon Pop*\n\n"
        "💥 POP!\n\n"
        "Nice!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# SNAKE - SIMPLE GRID VERSION
# ============================================================

async def start_snake(query):
    size = 3

    snake = random.randint(0, size * size - 1)
    food = random.randint(0, size * size - 1)

    while food == snake:
        food = random.randint(0, size * size - 1)

    keyboard = []

    for row in range(size):
        buttons = []

        for col in range(size):
            index = row * size + col

            if index == snake:
                label = "🟢"
            elif index == food:
                label = "🍎"
            else:
                label = "⬜"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"extra:snake:{food}:{index}",
                )
            )

        keyboard.append(buttons)

    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🐍 *Snake Mini*\n\n"
        "🍎 food-এ পৌঁছানোর চেষ্টা করো!\n"
        "Grid-এর একটি cell নির্বাচন করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_snake(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        food = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    if selected == food:
        result = "🍎 *Food Collected!*\n\n🏆 Nice move!"
    else:
        result = "🐍 *Good Try!*\n\n🍎 Food miss হয়েছে।"

    keyboard = [
        [
            InlineKeyboardButton(
                "🐍 Play Again",
                callback_data="extra:snake",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🐍 *Snake Mini*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# DODGER
# ============================================================

async def start_dodger(query):
    safe = random.randint(1, 5)

    keyboard = [
        [
            InlineKeyboardButton(
                "⬅️ 1",
                callback_data=f"extra:dodger:{safe}:1",
            ),
            InlineKeyboardButton(
                "2",
                callback_data=f"extra:dodger:{safe}:2",
            ),
            InlineKeyboardButton(
                "3",
                callback_data=f"extra:dodger:{safe}:3",
            ),
            InlineKeyboardButton(
                "4",
                callback_data=f"extra:dodger:{safe}:4",
            ),
            InlineKeyboardButton(
                "5 ➡️",
                callback_data=f"extra:dodger:{safe}:5",
            ),
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🚗 *Traffic Dodge*\n\n"
        "Safe lane নির্বাচন করো 👇\n\n"
        "🚙 🚙 🚙\n"
        "💥 ⚠️ 💥\n"
        "━━━━━━━━━━",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_dodger(query, data):
    parts = data.split(":")

    if len(parts) != 4:
        return

    try:
        safe = int(parts[2])
        selected = int(parts[3])
    except ValueError:
        return

    if safe == selected:
        result = "🛡️ *Safe!*\n\n🚗 তুমি traffic dodge করতে পেরেছো!"
    else:
        result = "💥 *Oops!*\n\nএই lane safe ছিল না।"

    keyboard = [
        [
            InlineKeyboardButton(
                "🚗 Try Again",
                callback_data="extra:dodger",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        f"🚗 *Traffic Dodge*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# BRICK BREAKER
# ============================================================

async def start_brick(query):
    keyboard = [
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="extra:brick:left",
            ),
            InlineKeyboardButton(
                "⬆️ HIT",
                callback_data="extra:brick:hit",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="extra:brick:right",
            ),
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        "🧱 *Brick Breaker Mini*\n\n"
        "🧱 🧱 🧱 🧱 🧱\n"
        "🧱 🧱 🧱 🧱 🧱\n"
        "━━━━━━━━━━\n"
        "     🏓\n\n"
        "⬅️ ➡️ move করো অথবা HIT চাপো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_brick(query, data):
    action = data.split(":", 2)[-1]

    if action == "hit":
        message = (
            "🧱 *Brick Breaker*\n\n"
            "💥 *HIT!*\n\n"
            "একটা brick ভেঙে গেছে!"
        )
    else:
        message = (
            "🧱 *Brick Breaker*\n\n"
            f"{'⬅️' if action == 'left' else '➡️'} Paddle moved!"
        )

    keyboard = [
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="extra:brick:left",
            ),
            InlineKeyboardButton(
                "⬆️ HIT",
                callback_data="extra:brick:hit",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="extra:brick:right",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔄 Restart",
                callback_data="extra:brick",
            )
        ],
        all_games_button(),
    ]

    await query.edit_message_text(
        message,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# EXTRA GAME CONTROLLER
# ============================================================

async def handle_extra_game(query, data: str) -> None:

    # --------------------------------------------------------
    # DICE BATTLE
    # --------------------------------------------------------

    if data == "extra:dicebattle":
        await start_dice_battle(query)
        return

    # --------------------------------------------------------
    # TARGET
    # --------------------------------------------------------

    if data == "extra:target":
        await start_target(query)
        return

    if data.startswith("extra:target:"):
        await handle_target(query, data)
        return

    # --------------------------------------------------------
    # LUCKY NUMBER
    # --------------------------------------------------------

    if data == "extra:lucky":
        await start_lucky(query)
        return

    # --------------------------------------------------------
    # RANDOM CHOICE
    # --------------------------------------------------------

    if data == "extra:choice":
        await start_random_choice(query)
        return

    # --------------------------------------------------------
    # HIGH CARD
    # --------------------------------------------------------

    if data == "extra:highcard":
        await start_high_card(query)
        return

    # --------------------------------------------------------
    # QUICK TAP
    # --------------------------------------------------------

    if data == "extra:quicktap":
        await start_quick_tap(query)
        return

    if data.startswith("extra:quicktap:"):
        await handle_quick_tap(query, data)
        return

    # --------------------------------------------------------
    # RIDDLE
    # --------------------------------------------------------

    if data == "extra:riddle":
        await start_riddle(query)
        return

    if data.startswith("extra:riddle:"):
        await handle_riddle(query, data)
        return

    # --------------------------------------------------------
    # SEQUENCE
    # --------------------------------------------------------

    if data == "extra:sequence":
        await start_sequence(query)
        return

    if data.startswith("extra:sequence:"):
        await handle_sequence(query, data)
        return

    # --------------------------------------------------------
    # ODD ONE
    # --------------------------------------------------------

    if data == "extra:oddone":
        await start_odd_one(query)
        return

    if data.startswith("extra:oddone:"):
        await handle_odd_one(query, data)
        return

    # --------------------------------------------------------
    # REACTION
    # --------------------------------------------------------

    if data == "extra:reaction":
        await start_reaction(query)
        return

    if data.startswith("extra:reaction:"):
        await handle_reaction(query, data)
        return

    # --------------------------------------------------------
    # ACCURACY
    # --------------------------------------------------------

    if data == "extra:accuracy":
        await start_accuracy(query)
        return

    if data.startswith("extra:accuracy:"):
        await handle_accuracy(query, data)
        return

    # --------------------------------------------------------
    # BALLOON
    # --------------------------------------------------------

    if data == "extra:balloon":
        await start_balloon(query)
        return

    if data.startswith("extra:balloon:"):
        await handle_balloon(query, data)
        return

    # --------------------------------------------------------
    # SNAKE
    # --------------------------------------------------------

    if data == "extra:snake":
        await start_snake(query)
        return

    if data.startswith("extra:snake:"):
        await handle_snake(query, data)
        return

    # --------------------------------------------------------
    # DODGER
    # --------------------------------------------------------

    if data == "extra:dodger":
        await start_dodger(query)
        return

    if data.startswith("extra:dodger:"):
        await handle_dodger(query, data)
        return

    # --------------------------------------------------------
    # BRICK BREAKER
    # --------------------------------------------------------

    if data == "extra:brick":
        await start_brick(query)
        return

    if data.startswith("extra:brick:"):
        await handle_brick(query, data)
        return

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    await query.edit_message_text(
        "⚠️ *Game Error*\n\n"
        "এই game/action পাওয়া যায়নি।",
        parse_mode="Markdown",
        reply_markup=extra_menu(),
    )
