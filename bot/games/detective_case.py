# bot/games/detective_case.py

"""Detective Case - a standalone Telegram mystery game.

No database is used. Active case state is kept in RAM, matching the other
small games in this project. Existing games are not modified by this module.
"""

import random
from typing import Dict, Any, List

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


active_cases: Dict[int, Dict[str, Any]] = {}


CASES: List[Dict[str, Any]] = [
    {
        "title": "The Missing Trophy",
        "intro": (
            "The school gaming club's championship trophy disappeared "
            "before the award ceremony. Three people were nearby."
        ),
        "suspects": [
            {
                "name": "Rafi",
                "role": "Team Captain",
                "statement": "I was practicing in the computer room.",
                "secret": "A screenshot timestamp places him there during the key period.",
            },
            {
                "name": "Mina",
                "role": "Club Treasurer",
                "statement": "I locked the office and left the building.",
                "secret": "The office key log shows her key was used again later.",
            },
            {
                "name": "Sami",
                "role": "Event Helper",
                "statement": "I was setting up chairs in the hall.",
                "secret": "A volunteer saw Sami carrying an empty display box toward storage.",
            },
        ],
        "clues": [
            "The display cabinet was opened with a normal club key, not forced.",
            "A camera near the hallway shows someone entering storage with a large empty box.",
            "The storage-room sign-in sheet has one fresh entry written after the cabinet was locked.",
        ],
        "culprit": 1,
        "solution": "Mina used her club key to move the trophy into storage so the ceremony could be delayed.",
    },
    {
        "title": "The Library Mystery",
        "intro": (
            "A rare puzzle book vanished from the library's reserved shelf. "
            "Nothing else was disturbed."
        ),
        "suspects": [
            {
                "name": "Nabil",
                "role": "Puzzle Fan",
                "statement": "I only used the public computers.",
                "secret": "His computer session ended before the book was last seen.",
            },
            {
                "name": "Tania",
                "role": "Library Assistant",
                "statement": "I was returning books in the back room.",
                "secret": "Her cart was recorded in the reserved-shelf aisle.",
            },
            {
                "name": "Imran",
                "role": "Visitor",
                "statement": "I left as soon as I finished reading.",
                "secret": "The exit scanner recorded him leaving before the book disappeared.",
            },
        ],
        "clues": [
            "The reserved shelf requires an assistant card to unlock.",
            "A book cart wheel left a faint track directly in front of the shelf.",
            "The missing book was found hidden beneath a stack of return slips in the back room.",
        ],
        "culprit": 1,
        "solution": "Tania temporarily hid the book while reorganizing the reserved shelf.",
    },
    {
        "title": "The Tournament Code",
        "intro": (
            "Someone changed the final round code for a friendly online tournament. "
            "The code was written on a note inside the organizers' room."
        ),
        "suspects": [
            {
                "name": "Arif",
                "role": "Player",
                "statement": "I never entered the organizers' room.",
                "secret": "His match history shows he was playing continuously.",
            },
            {
                "name": "Lima",
                "role": "Organizer",
                "statement": "I printed the brackets and stayed at the front desk.",
                "secret": "The printer log confirms a bracket print at the exact time.",
            },
            {
                "name": "Joy",
                "role": "Volunteer",
                "statement": "I delivered cables to the organizers' room.",
                "secret": "The room's door sensor recorded Joy entering twice.",
            },
        ],
        "clues": [
            "The changed note has a fresh pencil mark beside the code.",
            "Only volunteers had the temporary room key during setup.",
            "A cable-delivery checklist was signed immediately after the code was changed.",
        ],
        "culprit": 2,
        "solution": "Joy changed the code as a harmless prank after entering the organizers' room.",
    },
    {
        "title": "The Vanishing Gift",
        "intro": (
            "A birthday gift disappeared from a locked game-room cabinet. "
            "The cabinet itself was not damaged."
        ),
        "suspects": [
            {
                "name": "Sadia",
                "role": "Host",
                "statement": "I placed the gift in the cabinet and went outside.",
                "secret": "She still had the cabinet key when she returned.",
            },
            {
                "name": "Fahim",
                "role": "Guest",
                "statement": "I stayed in the living room the whole time.",
                "secret": "A board-game score sheet shows his name on every round.",
            },
            {
                "name": "Rima",
                "role": "Helper",
                "statement": "I was decorating the dining table.",
                "secret": "A roll of wrapping paper was found beside the cabinet.",
            },
        ],
        "clues": [
            "The cabinet lock was opened normally.",
            "A tiny piece of matching wrapping paper was found inside the cabinet.",
            "The decoration checklist shows Rima left the dining table for several minutes.",
        ],
        "culprit": 2,
        "solution": "Rima moved the gift while preparing the decorations and forgot to mention it.",
    },
]


def _user_id(query) -> int:
    """Return a stable user id for per-player state."""
    if query.from_user:
        return query.from_user.id
    if query.message and query.message.chat:
        return query.message.chat.id
    return 0


def _main_buttons() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🕵️ New Case",
                    callback_data="game:detective",
                )
            ],
            [
                InlineKeyboardButton(
                    "🎮 All Games",
                    callback_data="menu:games",
                )
            ],
        ]
    )


def _case_buttons(case: Dict[str, Any]) -> InlineKeyboardMarkup:
    rows = []
    for index, suspect in enumerate(case["suspects"]):
        rows.append(
            [
                InlineKeyboardButton(
                    f"🔎 Inspect {suspect['name']}",
                    callback_data=f"detective:inspect:{index}",
                ),
                InlineKeyboardButton(
                    f"⚖️ Accuse {suspect['name']}",
                    callback_data=f"detective:accuse:{index}",
                ),
            ]
        )

    rows.append(
        [
            InlineKeyboardButton(
                "💡 Find a Clue",
                callback_data="detective:clue",
            )
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ]
    )
    return InlineKeyboardMarkup(rows)


def _new_case() -> Dict[str, Any]:
    case = random.choice(CASES)
    # Copy the mutable clue counter into a player-specific state object.
    return {
        "case": case,
        "clues_found": [],
        "inspected": [],
        "solved": False,
        "attempts": 0,
    }


def _case_text(state: Dict[str, Any]) -> str:
    case = state["case"]
    suspects = case["suspects"]
    clues_found = state["clues_found"]

    clue_text = ""
    if clues_found:
        clue_text = "\n\n🧩 *Evidence found:*\n"
        for clue_index in clues_found:
            clue_text += f"• {case['clues'][clue_index]}\n"

    suspect_text = "\n👥 *Suspects:*\n"
    for index, suspect in enumerate(suspects):
        mark = " 🔍" if index in state["inspected"] else ""
        suspect_text += f"• {suspect['name']} — {suspect['role']}{mark}\n"

    return (
        f"🕵️ *Detective Case*\n\n"
        f"📁 *Case:* {case['title']}\n\n"
        f"{case['intro']}\n"
        f"{suspect_text}"
        f"{clue_text}\n"
        f"Choose someone to inspect, find evidence, or make an accusation."
    )


async def start_detective(query) -> None:
    """Start a new detective case."""
    uid = _user_id(query)
    state = _new_case()
    active_cases[uid] = state

    await query.edit_message_text(
        _case_text(state),
        parse_mode="Markdown",
        reply_markup=_case_buttons(state["case"]),
    )


async def _inspect_suspect(query, state: Dict[str, Any], index: int) -> None:
    case = state["case"]
    suspects = case["suspects"]

    if index < 0 or index >= len(suspects):
        return

    if index not in state["inspected"]:
        state["inspected"].append(index)

    suspect = suspects[index]
    text = (
        f"🕵️ *Suspect Profile*\n\n"
        f"👤 *{suspect['name']}*\n"
        f"🎭 Role: {suspect['role']}\n\n"
        f"💬 Statement:\n{suspect['statement']}\n\n"
        f"🔍 Investigation note:\n{suspect['secret']}\n\n"
        f"Return to the case and compare the evidence."
    )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🔙 Back to Case",
                    callback_data="detective:board",
                )
            ],
            [
                InlineKeyboardButton(
                    "🎮 All Games",
                    callback_data="menu:games",
                )
            ],
        ]
    )

    await query.edit_message_text(
        text,
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


async def _find_clue(query, state: Dict[str, Any]) -> None:
    case = state["case"]
    available = [i for i in range(len(case["clues"])) if i not in state["clues_found"]]

    if not available:
        await query.edit_message_text(
            _case_text(state) + "\n\n💡 *No new clues remain.*",
            parse_mode="Markdown",
            reply_markup=_case_buttons(case),
        )
        return

    clue_index = random.choice(available)
    state["clues_found"].append(clue_index)

    await query.edit_message_text(
        _case_text(state) + "\n\n🧩 *New evidence discovered!*",
        parse_mode="Markdown",
        reply_markup=_case_buttons(case),
    )


async def _accuse(query, state: Dict[str, Any], index: int) -> None:
    case = state["case"]
    suspects = case["suspects"]

    if index < 0 or index >= len(suspects):
        return

    state["attempts"] += 1
    suspect = suspects[index]
    correct = index == case["culprit"]

    if correct:
        state["solved"] = True
        text = (
            f"🎉 *Case Solved!*\n\n"
            f"🕵️ You correctly identified *{suspect['name']}*.\n\n"
            f"📁 Case: *{case['title']}*\n"
            f"🔎 Attempts: *{state['attempts']}*\n\n"
            f"📖 *Solution:* {case['solution']}\n\n"
            f"Excellent detective work!"
        )
    else:
        text = (
            f"❌ *Wrong Accusation*\n\n"
            f"*{suspect['name']}* is not the culprit.\n\n"
            f"The case is still open. Check the clues and inspect the suspects again."
        )

    await query.edit_message_text(
        text,
        parse_mode="Markdown",
        reply_markup=_main_buttons() if correct else _case_buttons(case),
    )


async def handle_detective(query, data: str) -> None:
    """Handle detective callback data.

    Supported callbacks:
      detective:board
      detective:clue
      detective:inspect:<index>
      detective:accuse:<index>
    """
    uid = _user_id(query)
    state = active_cases.get(uid)

    if state is None:
        await start_detective(query)
        return

    if state.get("solved"):
        await query.edit_message_text(
            "🕵️ *This case is already solved.*\n\nStart a new case below.",
            parse_mode="Markdown",
            reply_markup=_main_buttons(),
        )
        return

    if data == "detective:board":
        await query.edit_message_text(
            _case_text(state),
            parse_mode="Markdown",
            reply_markup=_case_buttons(state["case"]),
        )
        return

    if data == "detective:clue":
        await _find_clue(query, state)
        return

    parts = data.split(":")
    if len(parts) == 3 and parts[0] == "detective":
        try:
            index = int(parts[2])
        except ValueError:
            index = -1

        if parts[1] == "inspect":
            await _inspect_suspect(query, state, index)
            return

        if parts[1] == "accuse":
            await _accuse(query, state, index)
            return

    await query.edit_message_text(
        "❌ *Invalid detective action.*\n\nReturn to the case below.",
        parse_mode="Markdown",
        reply_markup=_case_buttons(state["case"]),
    )
