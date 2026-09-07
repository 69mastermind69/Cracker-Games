import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# Temporary RAM state only.
# No database and no permanent user data.
games = {}


def menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔢 2048", callback_data="pro:2048"),
            InlineKeyboardButton("🟩 Word Guess", callback_data="pro:word"),
        ],
        [
            InlineKeyboardButton("💣 Minesweeper", callback_data="pro:mine"),
            InlineKeyboardButton("🚢 Battleship", callback_data="pro:battle"),
        ],
        [
            InlineKeyboardButton("🔐 Code Breaker", callback_data="pro:code"),
            InlineKeyboardButton("🔢 Sudoku", callback_data="pro:sudoku"),
        ],
        [
            InlineKeyboardButton("🐍 Snake", callback_data="pro:snake"),
            InlineKeyboardButton("🧱 Breakout", callback_data="pro:break"),
        ],
        [
            InlineKeyboardButton("⬅️ More Free Games", callback_data="extra:menu"),
        ],
    ])


def back_button():
    return InlineKeyboardButton(
        "⬅️ More Free Games",
        callback_data="extra:menu",
    )


def uid(query):
    return query.from_user.id


# ============================================================
# 2048
# ============================================================

def new_2048():
    board = [[0] * 4 for _ in range(4)]

    for _ in range(2):
        add_tile(board)

    return {
        "game": "2048",
        "board": board,
        "score": 0,
    }


def add_tile(board):
    empty = [
        (r, c)
        for r in range(4)
        for c in range(4)
        if board[r][c] == 0
    ]

    if empty:
        r, c = random.choice(empty)
        board[r][c] = 4 if random.random() < 0.1 else 2


def merge_line(line):
    values = [x for x in line if x]

    result = []
    score = 0
    i = 0

    while i < len(values):
        if i + 1 < len(values) and values[i] == values[i + 1]:
            value = values[i] * 2
            result.append(value)
            score += value
            i += 2
        else:
            result.append(values[i])
            i += 1

    return result + [0] * (4 - len(result)), score


def move_2048(board, direction):
    old = [row[:] for row in board]
    gained = 0

    if direction in ("L", "R"):
        for r in range(4):
            line = board[r][:]

            if direction == "R":
                line.reverse()

            line, score = merge_line(line)

            if direction == "R":
                line.reverse()

            board[r] = line
            gained += score

    else:
        for c in range(4):
            line = [board[r][c] for r in range(4)]

            if direction == "D":
                line.reverse()

            line, score = merge_line(line)

            if direction == "D":
                line.reverse()

            for r in range(4):
                board[r][c] = line[r]

            gained += score

    changed = board != old

    if changed:
        add_tile(board)

    return changed, gained


def can_move_2048(board):
    if any(0 in row for row in board):
        return True

    for r in range(4):
        for c in range(4):
            if r < 3 and board[r][c] == board[r + 1][c]:
                return True

            if c < 3 and board[r][c] == board[r][c + 1]:
                return True

    return False


def render_2048(game):
    board = game["board"]

    rows = []

    for row in board:
        rows.append(
            "`" +
            " ".join(
                f"{value:4}" if value else "   ."
                for value in row
            )
            + "`"
        )

    return (
        "🔢 *2048*\n\n"
        + "\n".join(rows)
        + f"\n\n⭐ Score: *{game['score']}*"
    )


async def start_2048(query):
    games[uid(query)] = new_2048()

    await show_2048(query)


async def show_2048(query):
    game = games[uid(query)]

    keyboard = [
        [
            InlineKeyboardButton(
                "⬆️",
                callback_data="pro:2048:U",
            )
        ],
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="pro:2048:L",
            ),
            InlineKeyboardButton(
                "⬇️",
                callback_data="pro:2048:D",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="pro:2048:R",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔄 New",
                callback_data="pro:2048",
            ),
            back_button(),
        ],
    ]

    await query.edit_message_text(
        render_2048(game),
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_2048(query, data):
    if data == "pro:2048":
        await start_2048(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "2048":
        await start_2048(query)
        return

    direction = data[-1]

    changed, score = move_2048(
        game["board"],
        direction,
    )

    if changed:
        game["score"] += score

    if any(
        2048 in row
        for row in game["board"]
    ):
        await query.edit_message_text(
            render_2048(game)
            + "\n\n🏆 *You reached 2048!*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New Game",
                        callback_data="pro:2048",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    if not can_move_2048(game["board"]):
        await query.edit_message_text(
            render_2048(game)
            + "\n\n💀 *Game Over!*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 Try Again",
                        callback_data="pro:2048",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    await show_2048(query)


# ============================================================
# WORD GUESS
# ============================================================

WORDS = [
    "apple",
    "brave",
    "cloud",
    "dream",
    "flame",
    "grape",
    "house",
    "light",
    "magic",
    "ocean",
    "piano",
    "robot",
    "smile",
    "storm",
    "tiger",
    "water",
    "world",
    "zebra",
]


def word_keyboard():
    rows = []

    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    for i in range(0, 26, 7):
        rows.append([
            InlineKeyboardButton(
                letter,
                callback_data=f"pro:word:{letter.lower()}",
            )
            for letter in letters[i:i + 7]
        ])

    rows.append([
        InlineKeyboardButton(
            "⌫",
            callback_data="pro:word:back",
        ),
        InlineKeyboardButton(
            "✅ Enter",
            callback_data="pro:word:enter",
        ),
    ])

    rows.append([back_button()])

    return InlineKeyboardMarkup(rows)


def word_view(game, message=""):
    lines = []

    for guess in game["guesses"]:
        marks = []

        for i, char in enumerate(guess):
            if char == game["target"][i]:
                marks.append("🟩")
            elif char in game["target"]:
                marks.append("🟨")
            else:
                marks.append("⬜")

        lines.append("".join(marks))

    while len(lines) < 6:
        lines.append("⬛⬛⬛⬛⬛")

    text = (
        "🟩 *Word Guess*\n\n"
        + "\n".join(lines)
        + f"\n\nCurrent: `{game['current'].upper() or '-----'}`"
    )

    if message:
        text += "\n\n" + message

    return text


async def start_word(query):
    games[uid(query)] = {
        "game": "word",
        "target": random.choice(WORDS),
        "guesses": [],
        "current": "",
    }

    game = games[uid(query)]

    await query.edit_message_text(
        word_view(game),
        parse_mode="Markdown",
        reply_markup=word_keyboard(),
    )


async def handle_word(query, data):
    if data == "pro:word":
        await start_word(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "word":
        await start_word(query)
        return

    action = data.split(":")[-1]

    if action == "back":
        game["current"] = game["current"][:-1]

    elif action == "enter":
        if len(game["current"]) != 5:
            await query.answer(
                "5 letters required.",
                show_alert=True,
            )
            return

        game["guesses"].append(game["current"])

        if game["current"] == game["target"]:
            await query.edit_message_text(
                word_view(
                    game,
                    "🏆 *Correct! Great job!*",
                ),
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "🔄 New Word",
                            callback_data="pro:word",
                        )
                    ],
                    [back_button()],
                ]),
            )
            return

        game["current"] = ""

        if len(game["guesses"]) >= 6:
            await query.edit_message_text(
                word_view(
                    game,
                    f"😅 Answer: `{game['target'].upper()}`",
                ),
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "🔄 Try Again",
                            callback_data="pro:word",
                        )
                    ],
                    [back_button()],
                ]),
            )
            return

    elif len(action) == 1 and action.isalpha():
        if len(game["current"]) < 5:
            game["current"] += action

    await query.edit_message_text(
        word_view(game),
        parse_mode="Markdown",
        reply_markup=word_keyboard(),
    )


# ============================================================
# MINESWEEPER
# ============================================================

def new_minesweeper():
    size = 6
    mine_count = 7

    bombs = set(
        random.sample(
            range(size * size),
            mine_count,
        )
    )

    numbers = [0] * (size * size)

    for position in bombs:
        row, col = divmod(position, size)

        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue

                rr = row + dr
                cc = col + dc

                if 0 <= rr < size and 0 <= cc < size:
                    numbers[rr * size + cc] += 1

    return {
        "game": "mine",
        "bombs": bombs,
        "numbers": numbers,
        "open": set(),
        "flags": set(),
        "flag_mode": False,
    }


def mines_keyboard(game):
    rows = []

    for row in range(6):
        buttons = []

        for col in range(6):
            position = row * 6 + col

            if position in game["flags"]:
                label = "🚩"

            elif position in game["open"]:
                if position in game["bombs"]:
                    label = "💥"
                elif game["numbers"][position]:
                    label = str(game["numbers"][position])
                else:
                    label = "·"

            else:
                label = "⬜"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"pro:mine:{position}",
                )
            )

        rows.append(buttons)

    rows.append([
        InlineKeyboardButton(
            "🚩 Flag Mode",
            callback_data="pro:mine:flag",
        ),
        InlineKeyboardButton(
            "🔄 New",
            callback_data="pro:mine",
        ),
    ])

    rows.append([back_button()])

    return InlineKeyboardMarkup(rows)


def flood_open(game, position):
    stack = [position]
    visited = set()

    while stack:
        current = stack.pop()

        if current in visited:
            continue

        if current in game["bombs"]:
            continue

        visited.add(current)
        game["open"].add(current)

        if game["numbers"][current] != 0:
            continue

        row, col = divmod(current, 6)

        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                rr = row + dr
                cc = col + dc

                if 0 <= rr < 6 and 0 <= cc < 6:
                    stack.append(rr * 6 + cc)


async def start_minesweeper(query):
    games[uid(query)] = new_minesweeper()

    await query.edit_message_text(
        "💣 *Minesweeper*\n\n"
        "Open cells and avoid mines.\n"
        "Use Flag Mode to mark suspected mines.",
        parse_mode="Markdown",
        reply_markup=mines_keyboard(
            games[uid(query)]
        ),
    )


async def handle_minesweeper(query, data):
    if data == "pro:mine":
        await start_minesweeper(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "mine":
        await start_minesweeper(query)
        return

    action = data.split(":")[-1]

    if action == "flag":
        game["flag_mode"] = not game["flag_mode"]

    elif action.isdigit():
        position = int(action)

        if game["flag_mode"]:
            if position in game["flags"]:
                game["flags"].remove(position)
            else:
                game["flags"].add(position)

        else:
            if position in game["bombs"]:
                await query.edit_message_text(
                    "💥 *Boom! You hit a mine.*",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup([
                        [
                            InlineKeyboardButton(
                                "🔄 New Board",
                                callback_data="pro:mine",
                            )
                        ],
                        [back_button()],
                    ]),
                )
                return

            flood_open(game, position)

    if len(game["open"]) >= 29:
        await query.edit_message_text(
            "🏆 *Mines cleared!*\n\nExcellent!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New Board",
                        callback_data="pro:mine",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    await query.edit_message_text(
        "💣 *Minesweeper*\n\n"
        + (
            "🚩 Flag Mode: ON"
            if game["flag_mode"]
            else "🖱️ Open Mode: ON"
        ),
        parse_mode="Markdown",
        reply_markup=mines_keyboard(game),
    )


# ============================================================
# BATTLESHIP
# ============================================================

def generate_ships():
    ships = set()

    for length in (3, 2, 2):
        while True:
            row = random.randrange(5)
            col = random.randrange(5)
            horizontal = random.choice([True, False])

            cells = {
                (row, col + i)
                if horizontal
                else (row + i, col)
                for i in range(length)
            }

            if (
                all(
                    0 <= r < 5 and 0 <= c < 5
                    for r, c in cells
                )
                and ships.isdisjoint(cells)
            ):
                ships |= cells
                break

    return ships


def battleship_keyboard(game):
    rows = []

    for row in range(5):
        buttons = []

        for col in range(5):
            position = (row, col)

            if position not in game["shots"]:
                label = "⬜"
            elif position in game["enemy"]:
                label = "💥"
            else:
                label = "🌊"

            buttons.append(
                InlineKeyboardButton(
                    label,
                    callback_data=f"pro:battle:{row}{col}",
                )
            )

        rows.append(buttons)

    rows.append([back_button()])

    return InlineKeyboardMarkup(rows)


async def start_battleship(query):
    games[uid(query)] = {
        "game": "battle",
        "enemy": generate_ships(),
        "shots": set(),
    }

    await query.edit_message_text(
        "🚢 *Battleship*\n\n"
        "Find all enemy ship cells.\n\n"
        "💥 Hit • 🌊 Miss",
        parse_mode="Markdown",
        reply_markup=battleship_keyboard(
            games[uid(query)]
        ),
    )


async def handle_battleship(query, data):
    if data == "pro:battle":
        await start_battleship(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "battle":
        await start_battleship(query)
        return

    code = data.split(":")[-1]

    if len(code) != 2 or not code.isdigit():
        return

    position = (
        int(code[0]),
        int(code[1]),
    )

    if position in game["shots"]:
        await query.answer("Already targeted.")
        return

    game["shots"].add(position)

    if game["enemy"].issubset(game["shots"]):
        await query.edit_message_text(
            "🏆 *Fleet Destroyed!*\n\n"
            "You win Battleship!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New Game",
                        callback_data="pro:battle",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    await query.edit_message_text(
        "🚢 *Battleship*\n\n"
        "💥 Hit • 🌊 Miss",
        parse_mode="Markdown",
        reply_markup=battleship_keyboard(game),
    )


# ============================================================
# CODE BREAKER
# ============================================================

def new_code():
    digits = list("0123456789")
    random.shuffle(digits)

    return {
        "game": "code",
        "target": "".join(digits[:4]),
        "current": "",
        "tries": 0,
    }


def code_keyboard():
    rows = [
        [
            InlineKeyboardButton(
                str(i),
                callback_data=f"pro:code:{i}",
            )
            for i in range(1, 10)
        ],
        [
            InlineKeyboardButton(
                "0",
                callback_data="pro:code:0",
            ),
            InlineKeyboardButton(
                "⌫",
                callback_data="pro:code:back",
            ),
            InlineKeyboardButton(
                "✅ Check",
                callback_data="pro:code:check",
            ),
        ],
        [back_button()],
    ]

    return InlineKeyboardMarkup(rows)


async def start_code(query):
    games[uid(query)] = new_code()

    await query.edit_message_text(
        "🔐 *Code Breaker*\n\n"
        "Guess the 4-digit code.\n"
        "Each digit is different.",
        parse_mode="Markdown",
        reply_markup=code_keyboard(),
    )


async def handle_code(query, data):
    if data == "pro:code":
        await start_code(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "code":
        await start_code(query)
        return

    action = data.split(":")[-1]

    if action == "back":
        game["current"] = game["current"][:-1]

    elif action == "check":
        if (
            len(game["current"]) != 4
            or len(set(game["current"])) != 4
        ):
            await query.answer(
                "Use 4 different digits.",
                show_alert=True,
            )
            return

        game["tries"] += 1

        if game["current"] == game["target"]:
            await query.edit_message_text(
                f"🏆 *Code Cracked!*\n\n"
                f"Attempts: *{game['tries']}*",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "🔄 New Code",
                            callback_data="pro:code",
                        )
                    ],
                    [back_button()],
                ]),
            )
            return

        exact = sum(
            a == b
            for a, b in zip(
                game["current"],
                game["target"],
            )
        )

        common = sum(
            min(
                game["current"].count(d),
                game["target"].count(d),
            )
            for d in set(game["current"])
        )

        game["current"] = ""

        await query.answer(
            f"Exact: {exact} • Correct digits: {common}",
            show_alert=True,
        )

    elif (
        len(action) == 1
        and action.isdigit()
        and len(game["current"]) < 4
        and action not in game["current"]
    ):
        game["current"] += action

    await query.edit_message_text(
        "🔐 *Code Breaker*\n\n"
        f"Current: `{game['current'] or '----'}`\n"
        f"Attempts: *{game['tries']}*",
        parse_mode="Markdown",
        reply_markup=code_keyboard(),
    )


# ============================================================
# SNAKE
# ============================================================

def new_snake():
    return {
        "game": "snake",
        "snake": [
            (2, 2),
            (2, 1),
            (2, 0),
        ],
        "food": (1, 4),
        "direction": "R",
        "score": 0,
    }


def snake_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "⬆️",
                callback_data="pro:snake:U",
            )
        ],
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="pro:snake:L",
            ),
            InlineKeyboardButton(
                "⬇️",
                callback_data="pro:snake:D",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="pro:snake:R",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔄 New",
                callback_data="pro:snake",
            ),
            back_button(),
        ],
    ])


def snake_view(game):
    rows = []

    for row in range(5):
        line = ""

        for col in range(5):
            position = (row, col)

            if position == game["snake"][0]:
                line += "🟢"
            elif position in game["snake"]:
                line += "🟩"
            elif position == game["food"]:
                line += "🍎"
            else:
                line += "▫️"

        rows.append(line)

    return (
        "🐍 *Snake*\n\n"
        + "\n".join(rows)
        + f"\n\n⭐ Score: *{game['score']}*"
    )


async def start_snake(query):
    games[uid(query)] = new_snake()

    await query.edit_message_text(
        snake_view(games[uid(query)]),
        parse_mode="Markdown",
        reply_markup=snake_keyboard(),
    )


async def handle_snake(query, data):
    if data == "pro:snake":
        await start_snake(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "snake":
        await start_snake(query)
        return

    direction = data.split(":")[-1]

    opposite = {
        "U": "D",
        "D": "U",
        "L": "R",
        "R": "L",
    }

    if (
        direction not in opposite
        or opposite[direction] == game["direction"]
    ):
        await query.answer("Can't reverse!")
        return

    game["direction"] = direction

    movement = {
        "U": (-1, 0),
        "D": (1, 0),
        "L": (0, -1),
        "R": (0, 1),
    }

    dr, dc = movement[direction]

    head = game["snake"][0]

    new_head = (
        head[0] + dr,
        head[1] + dc,
    )

    if (
        not 0 <= new_head[0] < 5
        or not 0 <= new_head[1] < 5
        or new_head in game["snake"]
    ):
        await query.edit_message_text(
            "💥 *Game Over!*\n\n"
            f"Score: *{game['score']}*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New Game",
                        callback_data="pro:snake",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    game["snake"].insert(0, new_head)

    if new_head == game["food"]:
        game["score"] += 1

        empty = [
            (r, c)
            for r in range(5)
            for c in range(5)
            if (r, c) not in game["snake"]
        ]

        if not empty:
            await query.edit_message_text(
                "🏆 *Perfect Snake!*",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "🔄 New",
                            callback_data="pro:snake",
                        )
                    ],
                    [back_button()],
                ]),
            )
            return

        game["food"] = random.choice(empty)

    else:
        game["snake"].pop()

    await query.edit_message_text(
        snake_view(game),
        parse_mode="Markdown",
        reply_markup=snake_keyboard(),
    )


# ============================================================
# BREAKOUT MINI
# ============================================================

def new_breakout():
    return {
        "game": "break",
        "paddle": 2,
        "ball": [3, 2],
        "direction": [-1, 1],
        "blocks": [
            (row, col)
            for row in range(2)
            for col in range(5)
        ],
        "score": 0,
    }


def breakout_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "⬅️",
                callback_data="pro:break:L",
            ),
            InlineKeyboardButton(
                "▶️ Step",
                callback_data="pro:break:S",
            ),
            InlineKeyboardButton(
                "➡️",
                callback_data="pro:break:R",
            ),
        ],
        [
            InlineKeyboardButton(
                "🔄 New",
                callback_data="pro:break",
            ),
            back_button(),
        ],
    ])


def breakout_view(game):
    rows = []

    for row in range(5):
        line = ""

        for col in range(5):
            position = (row, col)

            if position in game["blocks"]:
                line += "🧱"
            elif position == tuple(game["ball"]):
                line += "🔵"
            elif row == 4 and col == game["paddle"]:
                line += "🟩"
            else:
                line += "▫️"

        rows.append(line)

    return (
        "🧱 *Breakout*\n\n"
        + "\n".join(rows)
        + f"\n\n⭐ Score: *{game['score']}*"
    )


async def start_breakout(query):
    games[uid(query)] = new_breakout()

    await query.edit_message_text(
        breakout_view(games[uid(query)]),
        parse_mode="Markdown",
        reply_markup=breakout_keyboard(),
    )


async def handle_breakout(query, data):
    if data == "pro:break":
        await start_breakout(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "break":
        await start_breakout(query)
        return

    action = data.split(":")[-1]

    if action == "L":
        game["paddle"] = max(
            0,
            game["paddle"] - 1,
        )

    elif action == "R":
        game["paddle"] = min(
            4,
            game["paddle"] + 1,
        )

    else:
        row, col = game["ball"]
        dr, dc = game["direction"]

        new_col = col + dc
        new_row = row + dr

        if new_col < 0 or new_col > 4:
            dc = -dc
            new_col = col + dc

        if new_row < 0:
            dr = -dr
            new_row = row + dr

        if (new_row, new_col) in game["blocks"]:
            game["blocks"].remove(
                (new_row, new_col)
            )
            game["score"] += 10

            dr = -dr
            new_row = row + dr

        if new_row >= 4:
            if new_col == game["paddle"]:
                dr = -1
                new_row = 3
            else:
                await query.edit_message_text(
                    "💥 *Ball missed the paddle!*\n\n"
                    f"Score: *{game['score']}*",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup([
                        [
                            InlineKeyboardButton(
                                "🔄 New Game",
                                callback_data="pro:break",
                            )
                        ],
                        [back_button()],
                    ]),
                )
                return

        game["direction"] = [dr, dc]
        game["ball"] = [new_row, new_col]

    if not game["blocks"]:
        await query.edit_message_text(
            "🏆 *All blocks cleared!*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New",
                        callback_data="pro:break",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    await query.edit_message_text(
        breakout_view(game),
        parse_mode="Markdown",
        reply_markup=breakout_keyboard(),
    )


# ============================================================
# SUDOKU MINI
# ============================================================

def sudoku_solution():
    base = [
        [
            ((row * 3 + row // 3 + col) % 9) + 1
            for col in range(9)
        ]
        for row in range(9)
    ]

    rows = []
    bands = [0, 1, 2]
    random.shuffle(bands)

    for band in bands:
        group = list(range(3))
        random.shuffle(group)

        for row in group:
            rows.append(
                band * 3 + row
            )

    stacks = [0, 1, 2]
    random.shuffle(stacks)

    cols = []

    for stack in stacks:
        group = list(range(3))
        random.shuffle(group)

        for col in group:
            cols.append(
                stack * 3 + col
            )

    return [
        [base[row][col] for col in cols]
        for row in rows
    ]


def sudoku_view(game):
    rows = []

    for row in range(9):
        values = []

        for col in range(9):
            value = game["board"][row][col]

            values.append(
                str(value)
                if value
                else "."
            )

        line = (
            " ".join(values[:3])
            + " | "
            + " ".join(values[3:6])
            + " | "
            + " ".join(values[6:])
        )

        rows.append(line)

        if row in (2, 5):
            rows.append(
                "------+-------+------"
            )

    return (
        "🔢 *Sudoku*\n\n"
        "```text\n"
        + "\n".join(rows)
        + "\n```\n"
        "\nTap a cell to change its value."
    )


def sudoku_keyboard():
    rows = []

    for row in range(9):
        rows.append([
            InlineKeyboardButton(
                str(col + 1),
                callback_data=f"pro:sudoku:{row}{col}",
            )
            for col in range(9)
        ])

    rows.append([
        InlineKeyboardButton(
            "🔄 New",
            callback_data="pro:sudoku",
        ),
        back_button(),
    ])

    return InlineKeyboardMarkup(rows)


async def start_sudoku(query):
    solution = sudoku_solution()

    puzzle = [
        row[:]
        for row in solution
    ]

    for position in random.sample(
        range(81),
        45,
    ):
        puzzle[position // 9][position % 9] = 0

    games[uid(query)] = {
        "game": "sudoku",
        "board": puzzle,
        "solution": solution,
    }

    await query.edit_message_text(
        sudoku_view(games[uid(query)]),
        parse_mode="Markdown",
        reply_markup=sudoku_keyboard(),
    )


async def handle_sudoku(query, data):
    if data == "pro:sudoku":
        await start_sudoku(query)
        return

    game = games.get(uid(query))

    if not game or game["game"] != "sudoku":
        await start_sudoku(query)
        return

    code = data.split(":")[-1]

    if len(code) != 2 or not code.isdigit():
        return

    row = int(code[0])
    col = int(code[1])

    game["board"][row][col] = (
        game["board"][row][col] % 9
    ) + 1

    if game["board"] == game["solution"]:
        await query.edit_message_text(
            "🏆 *Sudoku Solved!*\n\n"
            "Excellent work!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 New Sudoku",
                        callback_data="pro:sudoku",
                    )
                ],
                [back_button()],
            ]),
        )
        return

    await query.edit_message_text(
        sudoku_view(game),
        parse_mode="Markdown",
        reply_markup=sudoku_keyboard(),
    )


# ============================================================
# PREMIUM GAME DISPATCHER
# ============================================================

async def handle(query, data):
    if data == "pro:2048" or data.startswith("pro:2048:"):
        await handle_2048(query, data)
        return

    if data == "pro:word" or data.startswith("pro:word:"):
        await handle_word(query, data)
        return

    if data == "pro:mine" or data.startswith("pro:mine:"):
        await handle_minesweeper(query, data)
        return

    if data == "pro:battle" or data.startswith("pro:battle:"):
        await handle_battleship(query, data)
        return

    if data == "pro:code" or data.startswith("pro:code:"):
        await handle_code(query, data)
        return

    if data == "pro:sudoku" or data.startswith("pro:sudoku:"):
        await handle_sudoku(query, data)
        return

    if data == "pro:snake" or data.startswith("pro:snake:"):
        await handle_snake(query, data)
        return

    if data == "pro:break" or data.startswith("pro:break:"):
        await handle_breakout(query, data)
        return

    await query.answer(
        "Game not found.",
        show_alert=True,
    )
