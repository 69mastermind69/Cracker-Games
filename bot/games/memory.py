import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


# ============================================================
# TEMPORARY RAM-ONLY GAME STATE
# ============================================================

active_games = {}


# ============================================================
# GAME SETTINGS
# ============================================================

GRID_SIZE = 4

SYMBOLS = [
    "🍎",
    "🍌",
    "🍇",
    "🍉",
    "🍓",
    "🍒",
    "🥝",
    "🍍",
]


# ============================================================
# GAME MENU
# ============================================================

def game_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🧠 New Game",
                callback_data="game:memory",
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
# CREATE BOARD
# ============================================================

def create_board():
    """
    Create a 4x4 memory board.

    Every symbol appears exactly twice.
    """

    cards = SYMBOLS * 2

    random.shuffle(cards)

    return cards


# ============================================================
# CREATE HIDDEN BOARD
# ============================================================

def hidden_board():
    return ["❓"] * (GRID_SIZE * GRID_SIZE)


# ============================================================
# BOARD KEYBOARD
# ============================================================

def board_keyboard(
    visible,
    matched,
    first_pick=None,
) -> InlineKeyboardMarkup:

    keyboard = []

    for row in range(GRID_SIZE):
        buttons = []

        for col in range(GRID_SIZE):
            position = row * GRID_SIZE + col

            # ------------------------------------------------
            # Show card when:
            # - already matched
            # - currently selected
            # ------------------------------------------------

            if position in matched:
                text = visible[position]

            elif position == first_pick:
                text = visible[position]

            else:
                text = "❓"

            buttons.append(
                InlineKeyboardButton(
                    text,
                    callback_data=f"memory:pick:{position}",
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
# START MEMORY
# ============================================================

async def start_memory(query) -> None:

    user_id = query.from_user.id

    board = create_board()

    active_games[user_id] = {
        "board": board,
        "visible": board[:],
        "matched": set(),
        "first_pick": None,
    }

    await query.edit_message_text(
        "🧠 *Memory Game*\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "একই দুইটি emoji খুঁজে বের করো।\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "প্রথমে একটি card নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(
            board,
            set(),
        ),
    )


# ============================================================
# HANDLE MEMORY
# ============================================================

async def handle_memory(
    query,
    data: str,
) -> None:

    user_id = query.from_user.id

    game = active_games.get(user_id)

    if game is None:
        await query.edit_message_text(
            "⏳ এই Memory game আর active নেই।\n\n"
            "নতুন game শুরু করো।",
            reply_markup=game_menu(),
        )
        return

    parts = data.split(":")

    if len(parts) != 3 or parts[1] != "pick":
        await query.answer(
            "⚠️ Invalid move!",
            show_alert=True,
        )
        return

    try:
        position = int(parts[2])
    except ValueError:
        await query.answer(
            "⚠️ Invalid card!",
            show_alert=True,
        )
        return

    board = game["board"]
    matched = game["matched"]
    first_pick = game["first_pick"]

    # --------------------------------------------------------
    # Validate position
    # --------------------------------------------------------

    if not 0 <= position < len(board):
        await query.answer(
            "⚠️ Invalid card!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Already matched
    # --------------------------------------------------------

    if position in matched:
        await query.answer(
            "এই card already matched!",
            show_alert=True,
        )
        return

    # --------------------------------------------------------
    # Clicking the same card twice
    # --------------------------------------------------------

    if first_pick == position:
        await query.answer(
            "অন্য একটি card নির্বাচন করো!",
            show_alert=True,
        )
        return

    # ========================================================
    # FIRST CARD
    # ========================================================

    if first_pick is None:

        game["first_pick"] = position

        await query.edit_message_text(
            "🧠 *Memory Game*\n\n"
            "প্রথম card:\n\n"
            f"👉 {board[position]}\n\n"
            "এখন দ্বিতীয় card নির্বাচন করো:",
            parse_mode="Markdown",
            reply_markup=board_keyboard(
                board,
                matched,
                first_pick=position,
            ),
        )

        return

    # ========================================================
    # SECOND CARD
    # ========================================================

    second_pick = position

    first_symbol = board[first_pick]
    second_symbol = board[second_pick]

    # --------------------------------------------------------
    # Match
    # --------------------------------------------------------

    if first_symbol == second_symbol:

        matched.add(first_pick)
        matched.add(second_pick)

        game["first_pick"] = None

        # ----------------------------------------------------
        # Check complete
        # ----------------------------------------------------

        if len(matched) == len(board):

            active_games.pop(user_id, None)

            await query.edit_message_text(
                "🧠 *Memory Game*\n\n"
                "━━━━━━━━━━━━━━━━━━\n"
                "🎉 *You Found All Pairs!*\n"
                "━━━━━━━━━━━━━━━━━━\n\n"
                "🏆 Congratulations! 🔥",
                parse_mode="Markdown",
                reply_markup=game_menu(),
            )

            return

        await query.edit_message_text(
            "🧠 *Memory Game*\n\n"
            f"✅ Match found: {first_symbol}\n\n"
            f"🎯 Pairs found: *{len(matched) // 2}*"
            f"/{len(board) // 2}\n\n"
            "আরও pair খুঁজে বের করো:",
            parse_mode="Markdown",
            reply_markup=board_keyboard(
                board,
                matched,
            ),
        )

        return

    # --------------------------------------------------------
    # No match
    # --------------------------------------------------------

    game["first_pick"] = None

    # Show the two selected cards briefly through the result
    # message instead of keeping hidden state.
    await query.edit_message_text(
        "🧠 *Memory Game*\n\n"
        f"❌ No Match!\n\n"
        f"{first_symbol} ≠ {second_symbol}\n\n"
        "আবার দুইটি card নির্বাচন করো:",
        parse_mode="Markdown",
        reply_markup=board_keyboard(
            board,
            matched,
        ),
    )
