import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# GAME SETTINGS
# ============================================================

ROWS = 6
COLS = 7

EMPTY = "⚪"
PLAYER = "🔴"
BOT = "🟡"


# ============================================================
# GAME MENU
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔴 New Game",
                callback_data="game:connect4",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


# ============================================================
# BOARD
# ============================================================

def create_board():
    return [
        [EMPTY for _ in range(COLS)]
        for _ in range(ROWS)
    ]


def board_text(board) -> str:
    return "\n".join(
        " ".join(row)
        for row in board
    )


# ============================================================
# COLUMN KEYBOARD
# ============================================================

def board_keyboard() -> InlineKeyboardMarkup:
    keyboard = []

    keyboard.append([
        InlineKeyboardButton(
            str(column + 1),
            callback_data=f"connect4:move:{column}",
        )
        for column in range(COLS)
    ])

    keyboard.append([
        InlineKeyboardButton(
            "🚪 Quit",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# DROP PIECE
# ============================================================

def drop_piece(
    board,
    column: int,
    symbol: str,
):
    """
    Drop a piece into a column.

    Returns the row where the piece landed,
    or None if the column is full.
    """

    if not 0 <= column < COLS:
        return None

    for row in range(ROWS - 1, -1, -1):
        if board[row][column] == EMPTY:
            board[row][column] = symbol
            return row

    return None


# ============================================================
# CHECK WIN
# ============================================================

def check_win(
    board,
    symbol: str,
) -> bool:

    directions = [
        (0, 1),   # Horizontal
        (1, 0),   # Vertical
        (1, 1),   # Diagonal down-right
        (1, -1),  # Diagonal down-left
    ]

    for row in range(ROWS):
        for col in range(COLS):

            if board[row][col] != symbol:
                continue

            for row_dir, col_dir in directions:

                count = 1

                # Forward
                next_row = row + row_dir
                next_col = col + col_dir

                while (
                    0 <= next_row < ROWS
                    and 0 <= next_col < COLS
                    and board[next_row][next_col] == symbol
                ):
                    count += 1
                    next_row += row_dir
                    next_col += col_dir

                # Backward
                next_row = row - row_dir
                next_col = col - col_dir

                while (
                    0 <= next_row < ROWS
                    and 0 <= next_col < COLS
                    and board[next_row][next_col] == symbol
                ):
                    count += 1
                    next_row -= row_dir
                    next_col -= col_dir

                if count >= 4:
                    return True

    return False


# ============================================================
# CHECK DRAW
# ============================================================

def is_draw(board) -> bool:
    return all(
        board[0][column] != EMPTY
        for column in range(COLS)
    )


# ============================================================
# BOT MOVE HELPERS
# ============================================================

def test_move(
    board,
    column: int,
    symbol: str,
) -> bool:
    """
    Temporarily place a piece and check whether
    that move creates a winning position.
    """

    row = drop_piece(board, column, symbol)

    if row is None:
        return False

    won = check_win(board, symbol)

    board[row][column] = EMPTY

    return won


def choose_bot_column(board):
    available = [
        column
        for column in range(COLS)
        if board[0][column] == EMPTY
    ]

    if not available:
        return None

    # --------------------------------------------------------
    # 1. Try to win
    # --------------------------------------------------------

    for column in available:
        if test_move(board, column, BOT):
            return column

    # --------------------------------------------------------
    # 2. Block player's winning move
    # --------------------------------------------------------

    for column in available:
        if test_move(board, column, PLAYER):
            return column

    # --------------------------------------------------------
    # 3. Prefer center columns
    # --------------------------------------------------------

    preferred = [
        3,
        2,
        4,
        1,
        5,
        0,
        6,
    ]

    preferred_available = [
        column
        for column in preferred
        if column in available
    ]

    if preferred_available:
        # Mostly choose strong central positions,
        # while still keeping some randomness.
        if random.random() < 0.75:
            return preferred_available[0]

        return random.choice(preferred_available)

    return random.choice(available)


# ============================================================
# START CONNECT FOUR
# ============================================================

async def start_connect4(query) -> None:

    user_id = query.from_user.id

    board = create_board()

    active_games[user_id] = {
        "board": board,
    }

    await query.edit_message_text(
        "🔴 *Connect Four*\n\n"
        "তুমি = 🔴\n"
        "Bot = 🟡\n\n"
        "যে আগে পরপর ৪টি piece মিলাতে পারবে সে জিতবে।\n\n"
        f"{board_text(board)}\n\n"
        "নিচের column থেকে একটি নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(),
    )


# ============================================================
# HANDLE CONNECT FOUR
# ============================================================

async def handle_connect4(
    query,
    data: str,
) -> None:

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Connect Four game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    parts = data.split(":")

    if len(parts) != 3 or parts[1] != "move":
        await query.answer(
            "⚠️ Invalid move!",
            show_alert=True,
        )
        return

    try:
        column = int(parts[2])
    except ValueError:
        await query.answer(
            "⚠️ Invalid column!",
            show_alert=True,
        )
        return

    if not 0 <= column < COLS:
        await query.answer(
            "⚠️ Invalid column!",
            show_alert=True,
        )
        return

    board = game["board"]

    # --------------------------------------------------------
    # Player move
    # --------------------------------------------------------

    row = drop_piece(
        board,
        column,
        PLAYER,
    )

    if row is None:
        await query.answer(
            "এই column পুরোপুরি filled!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Player wins
    # --------------------------------------------------------

    if check_win(board, PLAYER):
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "🔴 *Connect Four*\n\n"
            f"{board_text(board)}\n\n"
            "🏆 *You Win!*\n\n"
            "দারুণ খেলেছো! 🔥",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Draw after player move
    # --------------------------------------------------------

    if is_draw(board):
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "🔴 *Connect Four*\n\n"
            f"{board_text(board)}\n\n"
            "🤝 *Draw!*\n\n"
            "Board পুরোপুরি filled হয়ে গেছে।",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Bot move
    # --------------------------------------------------------

    bot_column = choose_bot_column(board)

    if bot_column is not None:
        drop_piece(
            board,
            bot_column,
            BOT,
        )

    # --------------------------------------------------------
    # Bot wins
    # --------------------------------------------------------

    if check_win(board, BOT):
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "🔴 *Connect Four*\n\n"
            f"{board_text(board)}\n\n"
            "🤖 *Bot Wins!*\n\n"
            "আবার চেষ্টা করো! 😎",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Draw after bot move
    # --------------------------------------------------------

    if is_draw(board):
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "🔴 *Connect Four*\n\n"
            f"{board_text(board)}\n\n"
            "🤝 *Draw!*\n\n"
            "আবার খেলতে পারো।",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Continue game
    # --------------------------------------------------------

    await query.edit_message_text(
        "🔴 *Connect Four*\n\n"
        f"{board_text(board)}\n\n"
        "তোমার turn — একটি column নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(),
    )
