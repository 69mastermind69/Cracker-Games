import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# BOARD
# ============================================================

EMPTY = "⬜"
PLAYER = "❌"
BOT = "⭕"


# ============================================================
# GAME MENU
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "❌ New Game",
                callback_data="game:ttt",
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
# BOARD KEYBOARD
# ============================================================

def board_keyboard(board) -> InlineKeyboardMarkup:
    keyboard = []

    for row in range(3):
        buttons = []

        for col in range(3):
            position = row * 3 + col

            buttons.append(
                InlineKeyboardButton(
                    board[position],
                    callback_data=f"ttt:move:{position}",
                )
            )

        keyboard.append(buttons)

    keyboard.append([
        InlineKeyboardButton(
            "🚪 Quit",
            callback_data="menu:games",
        )
    ])

    return InlineKeyboardMarkup(keyboard)


# ============================================================
# WIN CONDITIONS
# ============================================================

WIN_LINES = [
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),

    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),

    (0, 4, 8),
    (2, 4, 6),
]


def get_winner(board):
    for a, b, c in WIN_LINES:

        if (
            board[a] != EMPTY
            and board[a] == board[b]
            and board[b] == board[c]
        ):
            return board[a]

    if EMPTY not in board:
        return "draw"

    return None


# ============================================================
# BOT MOVE
# ============================================================

def find_winning_move(board, symbol):
    for position in range(9):

        if board[position] != EMPTY:
            continue

        board[position] = symbol

        winner = get_winner(board)

        board[position] = EMPTY

        if winner == symbol:
            return position

    return None


def bot_move(board):
    # --------------------------------------------------------
    # 1. Try to win
    # --------------------------------------------------------

    winning_move = find_winning_move(board, BOT)

    if winning_move is not None:
        return winning_move

    # --------------------------------------------------------
    # 2. Block player
    # --------------------------------------------------------

    blocking_move = find_winning_move(board, PLAYER)

    if blocking_move is not None:
        return blocking_move

    # --------------------------------------------------------
    # 3. Take center
    # --------------------------------------------------------

    if board[4] == EMPTY:
        return 4

    # --------------------------------------------------------
    # 4. Take a corner
    # --------------------------------------------------------

    corners = [
        position
        for position in [0, 2, 6, 8]
        if board[position] == EMPTY
    ]

    if corners:
        return random.choice(corners)

    # --------------------------------------------------------
    # 5. Take any remaining position
    # --------------------------------------------------------

    available = [
        position
        for position in range(9)
        if board[position] == EMPTY
    ]

    if available:
        return random.choice(available)

    return None


# ============================================================
# START GAME
# ============================================================

async def start_tictactoe(query) -> None:
    user_id = query.from_user.id

    board = [EMPTY] * 9

    active_games[user_id] = {
        "board": board,
    }

    await query.edit_message_text(
        "❌ *Tic-Tac-Toe*\n\n"
        "তুমি = ❌\n"
        "Bot = ⭕\n\n"
        "প্রথমে তুমি move করবে।\n"
        "নিচের board থেকে একটি ঘর নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(board),
    )


# ============================================================
# HANDLE GAME
# ============================================================

async def handle_tictactoe(
    query,
    data: str,
) -> None:

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Tic-Tac-Toe game আর active নেই।\n\n"
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
        position = int(parts[2])
    except ValueError:
        await query.answer(
            "⚠️ Invalid position!",
            show_alert=True,
        )
        return

    if not 0 <= position <= 8:
        await query.answer(
            "⚠️ Invalid position!",
            show_alert=True,
        )
        return

    board = game["board"]

    # --------------------------------------------------------
    # Position already occupied
    # --------------------------------------------------------

    if board[position] != EMPTY:
        await query.answer(
            "এই ঘরটি already occupied!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Player move
    # --------------------------------------------------------

    board[position] = PLAYER

    winner = get_winner(board)

    # --------------------------------------------------------
    # Player wins
    # --------------------------------------------------------

    if winner == PLAYER:
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "❌ *Tic-Tac-Toe*\n\n"
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

    if winner == "draw":
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "❌ *Tic-Tac-Toe*\n\n"
            f"{board_text(board)}\n\n"
            "🤝 *Draw!*\n\n"
            "কেউ জিততে পারেনি।",
            parse_mode="Markdown",
            reply_markup=game_menu(),
        )
        return

    # --------------------------------------------------------
    # Bot move
    # --------------------------------------------------------

    move = bot_move(board)

    if move is not None:
        board[move] = BOT

    winner = get_winner(board)

    # --------------------------------------------------------
    # Bot wins
    # --------------------------------------------------------

    if winner == BOT:
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "❌ *Tic-Tac-Toe*\n\n"
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

    if winner == "draw":
        active_games.pop(user_id, None)

        await query.edit_message_text(
            "❌ *Tic-Tac-Toe*\n\n"
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
        "❌ *Tic-Tac-Toe*\n\n"
        f"{board_text(board)}\n\n"
        "তোমার turn — একটি ঘর নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(board),
    )


# ============================================================
# BOARD TEXT
# ============================================================

def board_text(board) -> str:
    return (
        f"{board[0]} {board[1]} {board[2]}\n"
        f"{board[3]} {board[4]} {board[5]}\n"
        f"{board[6]} {board[7]} {board[8]}"
    )
