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
# COMMON HELPERS
# ============================================================

def all_games_button():
    return [
        InlineKeyboardButton(
            "🎮 All Games",
            callback_data="menu:games",
        )
    ]


def extra_back_button():
    return [
        InlineKeyboardButton(
            "🆕 More Games",
            callback_data="extra:menu",
        )
    ]


def game_buttons(play_callback, play_text="🔄 Play Again"):
    return [
        [
            InlineKeyboardButton(
                play_text,
                callback_data=play_callback,
            )
        ],
        extra_back_button(),
        all_games_button(),
    ]


# ============================================================
# EXTRA GAMES MENU
# ============================================================

def extra_menu():
    keyboard = [
        [
            InlineKeyboardButton(
                "🎯 Target Hit",
                callback_data="extra:target",
            ),
            InlineKeyboardButton(
                "🍀 Lucky Number",
                callback_data="extra:lucky",
            ),
        ],
        [
            InlineKeyboardButton(
                "🎰 Random Choice",
                callback_data="extra:choice",
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

        # ----------------------------------------------------
        # NEW FREE GAMES
        # ----------------------------------------------------

        [
            InlineKeyboardButton(
                "🔢 2048",
                callback_data="extra:2048",
            ),
            InlineKeyboardButton(
                "🟩 Word Guess",
                callback_data="extra:wordguess",
            ),
        ],
        [
            InlineKeyboardButton(
                "💣 Minesweeper",
                callback_data="extra:minesweeper",
            ),
            InlineKeyboardButton(
                "🚢 Battleship",
                callback_data="extra:battleship",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔐 Code Breaker",
                callback_data="extra:codebreaker",
            ),
            InlineKeyboardButton(
                "🏓 Breakout",
                callback_data="extra:breakout",
            ),
        ],
        [
            InlineKeyboardButton(
                "🧩 Sudoku",
                callback_data="extra:sudoku",
            ),
        ],

        all_games_button(),
    ]

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# TARGET HIT
# ============================================================

async def start_target(query):
    target = random.randint(1, 5)

    row = []

    for number in range(1, 6):
        row.append(
            InlineKeyboardButton(
                str(number),
                callback_data=f"extra:target:{target}:{number}",
            )
        )

    keyboard = [
        row,
        extra_back_button(),
        all_games_button(),
    ]

    await query.edit_message_text(
        "🎯 *Target Hit*\n\n"
        "Target number-এ hit করো!\n\n"
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
            "❌ *Miss!*\n\n"
            f"🎯 Target: *{target}*\n"
            f"👉 তোমার choice: *{choice}*"
        )

    keyboard = game_buttons(
        "extra:target",
        "🎯 Play Again",
    )

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

    keyboard = game_buttons(
        "extra:lucky",
        "🍀 Try Again",
    )

    await query.edit_message_text(
        "🍀 *Lucky Number*\n\n"
        "আজকের random number:\n\n"
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

    keyboard = game_buttons(
        "extra:choice",
        "🔄 Choose Again",
    )

    await query.edit_message_text(
        "🎰 *Random Choice*\n\n"
        f"🎯 Result:\n\n*{result}*",
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
        extra_back_button(),
        all_games_button(),
    ]

    await query.edit_message_text(
        "⚡ *Quick Tap*\n\n"
        f"এই number-এ tap করো:\n\n"
        f"*{number}*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_quick_tap(query, data):
    parts = data.split(":")

    if len(parts) != 3:
        return

    keyboard = game_buttons(
        "extra:quicktap",
        "⚡ Play Again",
    )

    await query.edit_message_text(
        "⚡ *Quick Tap*\n\n"
        "🔥 Nice tap!\n\n"
        "তুমি successfully tap করেছো।",
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

    keyboard.append(extra_back_button())
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

    keyboard = game_buttons(
        "extra:riddle",
        "🧩 New Riddle",
    )

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

    wrong1 = answer + random.randint(1, 3)
    wrong2 = max(1, answer - random.randint(1, 3))

    options = list({answer, wrong1, wrong2})

    while len(options) < 3:
        options.append(answer + random.randint(4, 8))

    random.shuffle(options)

    keyboard = [
        [
            InlineKeyboardButton(
                str(option),
                callback_data=f"extra:sequence:{answer}:{option}",
            )
        ]
        for option in options[:3]
    ]

    keyboard.append(extra_back_button())
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

    keyboard = game_buttons(
        "extra:sequence",
        "🔢 Next Puzzle",
    )

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

    keyboard.append(row)
    keyboard.append(extra_back_button())
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

    if correct == selected:
        result = "🎯 *Great! Correct!*"
    else:
        result = "❌ *Not quite!*"

    keyboard = game_buttons(
        "extra:oddone",
        "🔎 Try Again",
    )

    await query.edit_message_text(
        f"🔎 *Find the Odd One*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# REACTION TEST
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
        extra_back_button(),
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
    keyboard = game_buttons(
        "extra:reaction",
        "⚡ Try Again",
    )

    await query.edit_message_text(
        "⚡ *Reaction Test*\n\n"
        "🔥 Nice reaction!\n\n"
        "আবার চেষ্টা করো!",
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

    keyboard.append(extra_back_button())
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
            "❌ *Miss!*\n\n"
            f"Target: *{target}*\n"
            f"You selected: *{selected}*"
        )

    keyboard = game_buttons(
        "extra:accuracy",
        "🎯 Play Again",
    )

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

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🎈 *Balloon Pop*\n\n"
        f"{' '.join(['🎈'] * balloon_count)}\n\n"
        "একটা balloon pop করো! 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_balloon(query, data):
    keyboard = game_buttons(
        "extra:balloon",
        "🎈 Pop Again",
    )

    await query.edit_message_text(
        "🎈 *Balloon Pop*\n\n"
        "💥 POP!\n\n"
        "Nice!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# SNAKE
# ============================================================

SNAKE_SIZE = 5


def snake_board(snake, food):
    lines = []

    for row in range(SNAKE_SIZE):
        line = ""

        for col in range(SNAKE_SIZE):
            pos = row * SNAKE_SIZE + col

            if pos == snake:
                line += "🟢"
            elif pos == food:
                line += "🍎"
            else:
                line += "⬜"

        lines.append(line)

    return "\n".join(lines)


async def start_snake(query):
    snake = random.randint(0, SNAKE_SIZE * SNAKE_SIZE - 1)
    food = random.randint(0, SNAKE_SIZE * SNAKE_SIZE - 1)

    while food == snake:
        food = random.randint(0, SNAKE_SIZE * SNAKE_SIZE - 1)

    keyboard = []

    for row in range(SNAKE_SIZE):
        buttons = []

        for col in range(SNAKE_SIZE):
            index = row * SNAKE_SIZE + col

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

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    await query.edit_message_text(
        "🐍 *Snake Mini*\n\n"
        f"{snake_board(snake, food)}\n\n"
        "🍎 Food-এ পৌঁছানোর চেষ্টা করো!",
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

    keyboard = game_buttons(
        "extra:snake",
        "🐍 Play Again",
    )

    await query.edit_message_text(
        f"🐍 *Snake Mini*\n\n{result}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# TRAFFIC DODGE
# ============================================================

async def start_dodger(query):
    safe = random.randint(1, 5)

    keyboard = [
        [
            InlineKeyboardButton(
                "1",
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
                "5",
                callback_data=f"extra:dodger:{safe}:5",
            ),
        ],
        extra_back_button(),
        all_games_button(),
    ]

    await query.edit_message_text(
        "🚗 *Traffic Dodge*\n\n"
        "Safe lane নির্বাচন করো 👇\n\n"
        "🚙 🚙 🚙 🚙 🚙\n"
        "💥 ⚠️ 💥 ⚠️ 💥",
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

    keyboard = game_buttons(
        "extra:dodger",
        "🚗 Try Again",
    )

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
        extra_back_button(),
        all_games_button(),
    ]

    await query.edit_message_text(
        "🧱 *Brick Breaker Mini*\n\n"
        "🧱 🧱 🧱 🧱 🧱\n"
        "🧱 🧱 🧱 🧱 🧱\n"
        "━━━━━━━━━━\n"
        "      🟦\n\n"
        "Ball hit করতে button ব্যবহার করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_brick(query, data):
    keyboard = game_buttons(
        "extra:brick",
        "🧱 Play Again",
    )

    await query.edit_message_text(
        "🧱 *Brick Breaker*\n\n"
        "💥 Brick hit!\n\n"
        "🔥 Nice!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ============================================================
# 2048
# ============================================================

def new_2048_board():
    board = [[0 for _ in range(4)] for _ in range(4)]

    add_2048_tile(board)
    add_2048_tile(board)

    return board


def add_2048_tile(board):
    empty = []

    for r in range(4):
        for c in range(4):
            if board[r][c] == 0:
                empty.append((r, c))

    if not empty:
        return False

    r, c = random.choice(empty)
    board[r][c] = 4 if random.random() < 0.1 else 2

    return True


def slide_line(line):
    values = [x for x in line if x != 0]
    result = []
    score = 0

    i = 0

    while i < len(values):
        if i + 1 < len(values) and values[i] == values[i + 1]:
            merged = values[i] * 2
            result.append(merged)
            score += merged
            i += 2
        else:
            result.append(values[i])
            i += 1

    while len(result) < 4:
        result.append(0)

    return result, score


def move_2048(board, direction):
    old = [row[:] for row in board]
    score = 0

    if direction in ("left", "right"):
        for r in range(4):
            line = board[r][:]

            if direction == "right":
                line.reverse()

            new_line, gained = slide_line(line)

            if direction == "right":
                new_line.reverse()

            board[r] = new_line
            score += gained

    else:
        for c in range(4):
            line = [board[r][c] for r in range(4)]

            if direction == "down":
                line.reverse()

            new_line, gained = slide_line(line)

            if direction == "down":
                new_line.reverse()

            for r in range(4):
                board[r][c] = new_line[r]

            score += gained

    changed = board != old

    if changed:
        add_2048_tile(board)

    return changed, score


def board_2048_text(board):
    lines = []

    for row in board:
        parts = []

        for value in row:
            parts.append(str(value) if value else "·")

        lines.append(" | ".join(parts))

    return "\n".join(lines)


def get_2048_keyboard():
    return [
        [
            InlineKeyboardButton("⬅️", callback_data="extra:2048:left"),
            InlineKeyboardButton("⬆️", callback_data="extra:2048:up"),
            InlineKeyboardButton("⬇️", callback_data="extra:2048:down"),
            InlineKeyboardButton("➡️", callback_data="extra:2048:right"),
        ],
        [
            InlineKeyboardButton(
                "🔄 New Game",
                callback_data="extra:2048",
            )
        ],
        extra_back_button(),
        all_games_button(),
    ]


async def start_2048(query):
    board = new_2048_board()

    active_games[query.from_user.id] = {
        "type": "2048",
        "board": board,
        "score": 0,
    }

    await query.edit_message_text(
        "🔢 *2048*\n\n"
        f"```text\n{board_2048_text(board)}\n```\n"
        "🎯 2048 তৈরি করার চেষ্টা করো!\n\n"
        "Move নির্বাচন করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(get_2048_keyboard()),
    )


async def handle_2048(query, data):
    user_id = query.from_user.id

    if data == "extra:2048":
        await start_2048(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "2048":
        await start_2048(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    direction = parts[2]

    if direction not in {"left", "right", "up", "down"}:
        return

    board = game["board"]

    changed, gained = move_2048(board, direction)

    if changed:
        game["score"] += gained

    won = any(2048 in row for row in board)

    if won:
        text = (
            "🎉 *YOU MADE 2048!*\n\n"
            f"Score: *{game['score']}*\n\n"
            f"```text\n{board_2048_text(board)}\n```"
        )

        keyboard = game_buttons(
            "extra:2048",
            "🔢 Play Again",
        )

        await query.edit_message_text(
            text,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "🔢 *2048*\n\n"
        f"Score: *{game['score']}*\n\n"
        f"```text\n{board_2048_text(board)}\n```\n"
        "Move করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(get_2048_keyboard()),
    )


# ============================================================
# WORD GUESS
# ============================================================

WORD_LIST = [
    "APPLE",
    "HOUSE",
    "WATER",
    "PHONE",
    "MUSIC",
    "LIGHT",
    "TRAIN",
    "CLOUD",
    "TIGER",
    "RIVER",
    "PLANE",
    "WORLD",
]


def word_guess_keyboard():
    rows = []

    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    for i in range(0, len(alphabet), 6):
        row = []

        for letter in alphabet[i:i + 6]:
            row.append(
                InlineKeyboardButton(
                    letter,
                    callback_data=f"extra:wordguess:{letter}",
                )
            )

        rows.append(row)

    rows.append(
        [
            InlineKeyboardButton(
                "🔄 New Word",
                callback_data="extra:wordguess",
            )
        ]
    )

    rows.append(extra_back_button())
    rows.append(all_games_button())

    return rows


def word_display(word, guessed):
    return " ".join(
        letter if letter in guessed else "_"
        for letter in word
    )


async def start_word_guess(query):
    word = random.choice(WORD_LIST)

    active_games[query.from_user.id] = {
        "type": "wordguess",
        "word": word,
        "guessed": set(),
        "wrong": 0,
    }

    await query.edit_message_text(
        "🟩 *Word Guess*\n\n"
        f"Word: *{word_guess_mask(word)}*\n\n"
        "একটি letter guess করো 👇\n"
        "Maximum 6 wrong guesses.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(word_guess_keyboard()),
    )


def word_guess_mask(word):
    return " ".join("_" for _ in word)


async def handle_word_guess(query, data):
    user_id = query.from_user.id

    if data == "extra:wordguess":
        await start_word_guess(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "wordguess":
        await start_word_guess(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    letter = parts[2].upper()
    word = game["word"]

    if len(letter) != 1 or not letter.isalpha():
        return

    if letter in game["guessed"]:
        return

    game["guessed"].add(letter)

    if letter not in word:
        game["wrong"] += 1

    display = word_display(word, game["guessed"])

    if "_" not in display:
        keyboard = game_buttons(
            "extra:wordguess",
            "🟩 New Word",
        )

        await query.edit_message_text(
            "🎉 *Correct!*\n\n"
            f"Word: *{word}*\n\n"
            f"Wrong guesses: *{game['wrong']}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    if game["wrong"] >= 6:
        keyboard = game_buttons(
            "extra:wordguess",
            "🟩 Try New Word",
        )

        await query.edit_message_text(
            "❌ *Game Over!*\n\n"
            f"The word was: *{word}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "🟩 *Word Guess*\n\n"
        f"Word: *{display}*\n\n"
        f"❌ Wrong: *{game['wrong']}/6*\n\n"
        "আরেকটি letter choose করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(word_guess_keyboard()),
    )


# ============================================================
# MINESWEEPER
# ============================================================

MINE_SIZE = 5
MINE_COUNT = 5


def mines_positions():
    return set(
        random.sample(
            range(MINE_SIZE * MINE_SIZE),
            MINE_COUNT,
        )
    )


def mine_neighbors(pos):
    row = pos // MINE_SIZE
    col = pos % MINE_SIZE

    result = []

    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue

            nr = row + dr
            nc = col + dc

            if 0 <= nr < MINE_SIZE and 0 <= nc < MINE_SIZE:
                result.append(nr * MINE_SIZE + nc)

    return result


def adjacent_mines(pos, mines):
    return sum(
        1
        for neighbor in mine_neighbors(pos)
        if neighbor in mines
    )


def mines_keyboard(opened):
    keyboard = []

    for row in range(MINE_SIZE):
        buttons = []

        for col in range(MINE_SIZE):
            pos = row * MINE_SIZE + col

            if pos in opened:
                label = str(
                    adjacent_mines(
                        pos,
                        active_games.get(
                            "dummy",
                            set(),
                        ),
                    )
                )
            else:
                label = "⬜"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"extra:minesweeper:{pos}",
                )
            )

        keyboard.append(buttons)

    keyboard.append(
        [
            InlineKeyboardButton(
                "🔄 New Game",
                callback_data="extra:minesweeper",
            )
        ]
    )

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    return keyboard


def render_mines_board(game):
    lines = []

    mines = game["mines"]
    opened = game["opened"]

    for row in range(MINE_SIZE):
        line = []

        for col in range(MINE_SIZE):
            pos = row * MINE_SIZE + col

            if pos not in opened:
                symbol = "⬜"
            else:
                count = adjacent_mines(pos, mines)

                if count == 0:
                    symbol = "▫️"
                else:
                    symbol = str(count)

            line.append(symbol)

        lines.append(" ".join(line))

    return "\n".join(lines)


def mines_keyboard_for_game(game):
    keyboard = []

    for row in range(MINE_SIZE):
        buttons = []

        for col in range(MINE_SIZE):
            pos = row * MINE_SIZE + col

            if pos in game["opened"]:
                count = adjacent_mines(pos, game["mines"])
                label = "▫️" if count == 0 else str(count)
            else:
                label = "⬜"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"extra:minesweeper:{pos}",
                )
            )

        keyboard.append(buttons)

    keyboard.append(
        [
            InlineKeyboardButton(
                "🔄 New Game",
                callback_data="extra:minesweeper",
            )
        ]
    )

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    return keyboard


async def start_minesweeper(query):
    game = {
        "type": "minesweeper",
        "mines": mines_positions(),
        "opened": set(),
    }

    active_games[query.from_user.id] = game

    await query.edit_message_text(
        "💣 *Minesweeper*\n\n"
        f"{render_mines_board(game)}\n\n"
        f"💣 Mines: *{MINE_COUNT}*\n"
        "সব mine avoid করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            mines_keyboard_for_game(game)
        ),
    )


async def handle_minesweeper(query, data):
    user_id = query.from_user.id

    if data == "extra:minesweeper":
        await start_minesweeper(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "minesweeper":
        await start_minesweeper(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    try:
        pos = int(parts[2])
    except ValueError:
        return

    if pos in game["opened"]:
        return

    if pos in game["mines"]:
        keyboard = game_buttons(
            "extra:minesweeper",
            "💣 New Game",
        )

        await query.edit_message_text(
            "💥 *BOOM!*\n\n"
            "Mine hit হয়েছে!\n\n"
            "Better luck next time.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    game["opened"].add(pos)

    safe_total = MINE_SIZE * MINE_SIZE - MINE_COUNT

    if len(game["opened"]) >= safe_total:
        keyboard = game_buttons(
            "extra:minesweeper",
            "🏆 Play Again",
        )

        await query.edit_message_text(
            "🏆 *MINESWEEPER COMPLETE!*\n\n"
            "সব safe cell খুলে ফেলেছো! 🎉",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "💣 *Minesweeper*\n\n"
        f"{render_mines_board(game)}\n\n"
        f"Safe cells: *{len(game['opened'])}/{safe_total}*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            mines_keyboard_for_game(game)
        ),
    )


# ============================================================
# BATTLESHIP
# ============================================================

BATTLE_SIZE = 5


def new_battleship_game():
    positions = list(range(BATTLE_SIZE * BATTLE_SIZE))
    enemy = set(random.sample(positions, 5))

    return {
        "type": "battleship",
        "enemy": enemy,
        "shots": set(),
        "hits": set(),
    }


def battleship_keyboard(game):
    keyboard = []

    for row in range(BATTLE_SIZE):
        buttons = []

        for col in range(BATTLE_SIZE):
            pos = row * BATTLE_SIZE + col

            if pos in game["hits"]:
                label = "💥"
            elif pos in game["shots"]:
                label = "❌"
            else:
                label = "🌊"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"extra:battleship:{pos}",
                )
            )

        keyboard.append(buttons)

    keyboard.append(
        [
            InlineKeyboardButton(
                "🔄 New Battle",
                callback_data="extra:battleship",
            )
        ]
    )

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    return keyboard


def render_battleship(game):
    lines = []

    for row in range(BATTLE_SIZE):
        line = []

        for col in range(BATTLE_SIZE):
            pos = row * BATTLE_SIZE + col

            if pos in game["hits"]:
                symbol = "💥"
            elif pos in game["shots"]:
                symbol = "❌"
            else:
                symbol = "🌊"

            line.append(symbol)

        lines.append(" ".join(line))

    return "\n".join(lines)


async def start_battleship(query):
    game = new_battleship_game()

    active_games[query.from_user.id] = game

    await query.edit_message_text(
        "🚢 *Battleship*\n\n"
        f"{render_battleship(game)}\n\n"
        "Enemy ship খুঁজে destroy করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            battleship_keyboard(game)
        ),
    )


async def handle_battleship(query, data):
    user_id = query.from_user.id

    if data == "extra:battleship":
        await start_battleship(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "battleship":
        await start_battleship(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    try:
        pos = int(parts[2])
    except ValueError:
        return

    if pos in game["shots"]:
        return

    game["shots"].add(pos)

    if pos in game["enemy"]:
        game["hits"].add(pos)
        message = "💥 *HIT!*"
    else:
        message = "🌊 *MISS!*"

    if game["enemy"].issubset(game["hits"]):
        keyboard = game_buttons(
            "extra:battleship",
            "🚢 New Battle",
        )

        await query.edit_message_text(
            "🏆 *FLEET DESTROYED!*\n\n"
            "তুমি সব enemy ship খুঁজে পেয়েছো! 🎉",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "🚢 *Battleship*\n\n"
        f"{render_battleship(game)}\n\n"
        f"{message}\n\n"
        f"Hits: *{len(game['hits'])}/5*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            battleship_keyboard(game)
        ),
    )


# ============================================================
# CODE BREAKER
# ============================================================

def generate_code():
    digits = list("0123456789")
    return "".join(random.sample(digits, 4))


def code_keyboard():
    keyboard = []

    for i in range(0, 10, 5):
        row = []

        for digit in range(i, i + 5):
            row.append(
                InlineKeyboardButton(
                    str(digit),
                    callback_data=f"extra:codebreaker:{digit}",
                )
            )

        keyboard.append(row)

    keyboard.append(
        [
            InlineKeyboardButton(
                "🔄 New Code",
                callback_data="extra:codebreaker",
            )
        ]
    )

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    return keyboard


async def start_codebreaker(query):
    code = generate_code()

    active_games[query.from_user.id] = {
        "type": "codebreaker",
        "code": code,
        "guess": "",
        "attempts": 0,
    }

    await query.edit_message_text(
        "🔐 *Code Breaker*\n\n"
        "4-digit secret code guess করো।\n\n"
        "প্রতিটি digit unique.\n\n"
        "Current: *----*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(code_keyboard()),
    )


async def handle_codebreaker(query, data):
    user_id = query.from_user.id

    if data == "extra:codebreaker":
        await start_codebreaker(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "codebreaker":
        await start_codebreaker(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    digit = parts[2]

    if len(digit) != 1 or not digit.isdigit():
        return

    if digit in game["guess"]:
        return

    game["guess"] += digit

    if len(game["guess"]) < 4:
        await query.edit_message_text(
            "🔐 *Code Breaker*\n\n"
            "Secret code guess করো।\n\n"
            f"Current: *{game['guess'] + '-' * (4 - len(game['guess']))}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(code_keyboard()),
        )
        return

    game["attempts"] += 1

    code = game["code"]
    guess = game["guess"]

    exact = sum(
        code[i] == guess[i]
        for i in range(4)
    )

    common = sum(
        digit in code
        for digit in guess
    )

    if guess == code:
        keyboard = game_buttons(
            "extra:codebreaker",
            "🔐 New Code",
        )

        await query.edit_message_text(
            "🎉 *CODE CRACKED!*\n\n"
            f"Code: *{code}*\n"
            f"Attempts: *{game['attempts']}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    game["guess"] = ""

    await query.edit_message_text(
        "🔐 *Code Breaker*\n\n"
        "❌ Not correct.\n\n"
        f"🎯 Exact positions: *{exact}*\n"
        f"🔢 Correct digits: *{common}*\n\n"
        "আবার 4 digit code তৈরি করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(code_keyboard()),
    )


# ============================================================
# BREAKOUT
# ============================================================

def breakout_board(game):
    bricks = game["bricks"]
    paddle = game["paddle"]
    ball = game["ball"]

    lines = []

    for row in range(2):
        line = ""

        for col in range(7):
            pos = row * 7 + col

            if pos in bricks:
                line += "🧱"
            else:
                line += "⬛"

        lines.append(line)

    paddle_line = ""

    for col in range(7):
        if col == paddle:
            paddle_line += "🟦"
        else:
            paddle_line += "⬛"

    lines.append("────────────")
    lines.append(paddle_line)

    return "\n".join(lines)


def breakout_keyboard():
    return [
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="extra:breakout:left",
            ),
            InlineKeyboardButton(
                "🏓 HIT",
                callback_data="extra:breakout:hit",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="extra:breakout:right",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔄 New Game",
                callback_data="extra:breakout",
            )
        ],
        extra_back_button(),
        all_games_button(),
    ]


async def start_breakout(query):
    game = {
        "type": "breakout",
        "bricks": set(range(14)),
        "paddle": 3,
        "ball": 3,
        "score": 0,
    }

    active_games[query.from_user.id] = game

    await query.edit_message_text(
        "🏓 *Breakout Mini*\n\n"
        f"{breakout_board(game)}\n\n"
        f"Score: *{game['score']}*\n\n"
        "Paddle move করে brick hit করো!",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            breakout_keyboard()
        ),
    )


async def handle_breakout(query, data):
    user_id = query.from_user.id

    if data == "extra:breakout":
        await start_breakout(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "breakout":
        await start_breakout(query)
        return

    parts = data.split(":")

    if len(parts) != 3:
        return

    action = parts[2]

    if action == "left":
        game["paddle"] = max(0, game["paddle"] - 1)

    elif action == "right":
        game["paddle"] = min(6, game["paddle"] + 1)

    elif action == "hit":
        if game["bricks"]:
            target = min(
                game["bricks"],
                key=lambda x: abs((x % 7) - game["paddle"]),
            )

            game["bricks"].remove(target)
            game["score"] += 10

    if not game["bricks"]:
        keyboard = game_buttons(
            "extra:breakout",
            "🏓 Play Again",
        )

        await query.edit_message_text(
            "🏆 *BREAKOUT COMPLETE!*\n\n"
            f"Final Score: *{game['score']}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "🏓 *Breakout Mini*\n\n"
        f"{breakout_board(game)}\n\n"
        f"Score: *{game['score']}*\n"
        f"Bricks left: *{len(game['bricks'])}*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            breakout_keyboard()
        ),
    )


# ============================================================
# SUDOKU MINI
# ============================================================

SUDOKU_SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
]


def new_sudoku():
    board = [row[:] for row in SUDOKU_SOLUTION]

    positions = [
        (r, c)
        for r in range(9)
        for c in range(9)
    ]

    random.shuffle(positions)

    for r, c in positions[:45]:
        board[r][c] = 0

    return board


def sudoku_text(board):
    lines = []

    for r, row in enumerate(board):
        values = [
            str(x) if x != 0 else "."
            for x in row
        ]

        lines.append(
            " ".join(values[:3])
            + " | "
            + " ".join(values[3:6])
            + " | "
            + " ".join(values[6:])
        )

        if r in (2, 5):
            lines.append("------+-------+------")

    return "\n".join(lines)


def sudoku_keyboard(game):
    keyboard = []

    for r in range(9):
        row = []

        for c in range(9):
            if game["board"][r][c] == 0:
                label = f"{r + 1},{c + 1}"

                row.append(
                    InlineKeyboardButton(
                        label,
                        callback_data=f"extra:sudoku:cell:{r}:{c}",
                    )
                )

        if row:
            keyboard.append(row[:4])

    keyboard.append(
        [
            InlineKeyboardButton(
                "🔄 New Puzzle",
                callback_data="extra:sudoku",
            )
        ]
    )

    keyboard.append(extra_back_button())
    keyboard.append(all_games_button())

    return keyboard


async def start_sudoku(query):
    board = new_sudoku()

    active_games[query.from_user.id] = {
        "type": "sudoku",
        "board": board,
        "givens": [
            row[:]
            for row in board
        ],
    }

    await query.edit_message_text(
        "🧩 *Sudoku Mini*\n\n"
        f"```text\n{sudoku_text(board)}\n```\n\n"
        "Blank cell-এর position select করো।",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            sudoku_keyboard(active_games[query.from_user.id])
        ),
    )


async def handle_sudoku(query, data):
    user_id = query.from_user.id

    if data == "extra:sudoku":
        await start_sudoku(query)
        return

    game = active_games.get(user_id)

    if not game or game.get("type") != "sudoku":
        await start_sudoku(query)
        return

    parts = data.split(":")

    if len(parts) != 5:
        return

    try:
        row = int(parts[3])
        col = int(parts[4])
    except ValueError:
        return

    if not (0 <= row < 9 and 0 <= col < 9):
        return

    if game["givens"][row][col] != 0:
        return

    # For Telegram-friendly play, automatically place the
    # correct value for the selected blank cell.
    game["board"][row][col] = SUDOKU_SOLUTION[row][col]

    complete = all(
        game["board"][r][c] == SUDOKU_SOLUTION[r][c]
        for r in range(9)
        for c in range(9)
    )

    if complete:
        keyboard = game_buttons(
            "extra:sudoku",
            "🧩 New Sudoku",
        )

        await query.edit_message_text(
            "🏆 *SUDOKU COMPLETE!*\n\n"
            "Puzzle solved! 🎉",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    await query.edit_message_text(
        "🧩 *Sudoku Mini*\n\n"
        f"```text\n{sudoku_text(game['board'])}\n```\n\n"
        "আরও blank cell select করো 👇",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(
            sudoku_keyboard(game)
        ),
    )


# ============================================================
# EXTRA GAME CALLBACK ROUTER
# ============================================================

async def handle_extra_game(query, data):
    # Menu
    if data == "extra:menu":
        await query.edit_message_text(
            "🆕 *More Free Games*\n\n"
            "একটি game নির্বাচন করো 👇",
            parse_mode="Markdown",
            reply_markup=extra_menu(),
        )
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
    # LUCKY
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
    # 2048
    # --------------------------------------------------------

    if data == "extra:2048":
        await start_2048(query)
        return

    if data.startswith("extra:2048:"):
        await handle_2048(query, data)
        return

    # --------------------------------------------------------
    # WORD GUESS
    # --------------------------------------------------------

    if data == "extra:wordguess":
        await start_word_guess(query)
        return

    if data.startswith("extra:wordguess:"):
        await handle_word_guess(query, data)
        return

    # --------------------------------------------------------
    # MINESWEEPER
    # --------------------------------------------------------

    if data == "extra:minesweeper":
        await start_minesweeper(query)
        return

    if data.startswith("extra:minesweeper:"):
        await handle_minesweeper(query, data)
        return

    # --------------------------------------------------------
    # BATTLESHIP
    # --------------------------------------------------------

    if data == "extra:battleship":
        await start_battleship(query)
        return

    if data.startswith("extra:battleship:"):
        await handle_battleship(query, data)
        return

    # --------------------------------------------------------
    # CODE BREAKER
    # --------------------------------------------------------

    if data == "extra:codebreaker":
        await start_codebreaker(query)
        return

    if data.startswith("extra:codebreaker:"):
        await handle_codebreaker(query, data)
        return

    # --------------------------------------------------------
    # BREAKOUT
    # --------------------------------------------------------

    if data == "extra:breakout":
        await start_breakout(query)
        return

    if data.startswith("extra:breakout:"):
        await handle_breakout(query, data)
        return

    # --------------------------------------------------------
    # SUDOKU
    # --------------------------------------------------------

    if data == "extra:sudoku":
        await start_sudoku(query)
        return

    if data.startswith("extra:sudoku:"):
        await handle_sudoku(query, data)
        return

    # --------------------------------------------------------
    # UNKNOWN
    # --------------------------------------------------------

    await query.edit_message_text(
        "❌ Game পাওয়া যায়নি।\n\n"
        "নিচের button দিয়ে games menu-তে ফিরে যাও:",
        reply_markup=InlineKeyboardMarkup(
            [
                extra_back_button(),
                all_games_button(),
            ]
        ),
    )
