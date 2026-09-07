import random

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


QUESTIONS = [
    {
        "question": "🌍 বাংলাদেশের রাজধানী কোনটি?",
        "options": ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "সিলেট"],
        "answer": 0,
    },
    {
        "question": "🪐 কোন গ্রহকে Red Planet বলা হয়?",
        "options": ["Earth", "Mars", "Venus", "Jupiter"],
        "answer": 1,
    },
    {
        "question": "🧮 12 × 8 = কত?",
        "options": ["86", "96", "108", "88"],
        "answer": 1,
    },
    {
        "question": "💻 Python কী?",
        "options": ["Programming Language", "Browser", "Operating System", "Game Console"],
        "answer": 0,
    },
    {
        "question": "🌊 পৃথিবীর সবচেয়ে বড় মহাসাগর কোনটি?",
        "options": ["Atlantic", "Indian", "Pacific", "Arctic"],
        "answer": 2,
    },
    {
        "question": "🦁 Lion-কে কী বলা হয়?",
        "options": [
            "King of the Jungle",
            "King of the Ocean",
            "Fastest Animal",
            "Largest Bird",
        ],
        "answer": 0,
    },
    {
        "question": "📅 এক সপ্তাহে কয় দিন?",
        "options": ["5", "6", "7", "8"],
        "answer": 2,
    },
    {
        "question": "🔢 100 ÷ 4 = কত?",
        "options": ["20", "25", "30", "40"],
        "answer": 1,
    },
    {
        "question": "🌙 পৃথিবীর natural satellite কোনটি?",
        "options": ["Sun", "Mars", "Moon", "Venus"],
        "answer": 2,
    },
    {
        "question": "🎮 কোনটি একটি programming language?",
        "options": ["Python", "HTML", "Chrome", "Windows"],
        "answer": 0,
    },
]


# Temporary RAM-only quiz state.
# No database and no permanent user data.
active_quizzes = {}


def main_menu():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🧠 Play Again",
                callback_data="game:quiz",
            )
        ],
        [
            InlineKeyboardButton(
                "🎮 All Games",
                callback_data="menu:games",
            )
        ],
    ])


async def start_quiz(query) -> None:
    user_id = query.from_user.id

    # Shuffle question order for this temporary session.
    question_indexes = list(range(len(QUESTIONS)))
    random.shuffle(question_indexes)

    active_quizzes[user_id] = {
        "questions": question_indexes,
        "current": 0,
        "score": 0,
    }

    await show_question(query, user_id)


async def show_question(query, user_id: int) -> None:
    quiz = active_quizzes.get(user_id)

    if quiz is None:
        await query.edit_message_text(
            "⏳ Quiz session শেষ হয়ে গেছে।",
            reply_markup=main_menu(),
        )
        return

    current = quiz["current"]
    question_indexes = quiz["questions"]

    # Quiz finished
    if current >= len(question_indexes):
        score = quiz["score"]
        total = len(question_indexes)

        active_quizzes.pop(user_id, None)

        percentage = round((score / total) * 100)

        if percentage >= 80:
            message = "🏆 Excellent!"
        elif percentage >= 50:
            message = "👍 Good job!"
        else:
            message = "💪 Keep practicing!"

        await query.edit_message_text(
            "🧠 *Quiz Finished!*\n\n"
            f"🏆 Score: *{score}/{total}*\n"
            f"📊 Accuracy: *{percentage}%*\n\n"
            f"{message}",
            parse_mode="Markdown",
            reply_markup=main_menu(),
        )

        return

    question = QUESTIONS[question_indexes[current]]

    keyboard = []

    for index, option in enumerate(question["options"]):
        keyboard.append([
            InlineKeyboardButton(
                option,
                callback_data=f"quiz:answer:{index}",
            )
        ])

    keyboard.append([
        InlineKeyboardButton(
            "🚪 Quit",
            callback_data="menu:games",
        )
    ])

    await query.edit_message_text(
        "🧠 *Quiz*\n\n"
        f"Question *{current + 1}/{len(question_indexes)}*\n\n"
        f"{question['question']}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def handle_quiz(query, data: str) -> None:
    user_id = query.from_user.id

    quiz = active_quizzes.get(user_id)

    if quiz is None:
        await query.edit_message_text(
            "⏳ এই quiz session আর active নেই।",
            reply_markup=main_menu(),
        )
        return

    parts = data.split(":")

    if len(parts) != 3:
        await query.answer(
            "Invalid answer!",
            show_alert=True,
        )
        return

    try:
        selected_answer = int(parts[2])
    except ValueError:
        await query.answer(
            "Invalid answer!",
            show_alert=True,
        )
        return

    current = quiz["current"]
    question_index = quiz["questions"][current]
    question = QUESTIONS[question_index]

    if not 0 <= selected_answer < len(question["options"]):
        await query.answer(
            "Invalid option!",
            show_alert=True,
        )
        return

    correct_answer = question["answer"]

    if selected_answer == correct_answer:
        quiz["score"] += 1

        result_text = (
            "✅ *Correct!*\n\n"
            f"🎯 Score: *{quiz['score']}*"
        )
    else:
        correct_option = question["options"][correct_answer]

        result_text = (
            "❌ *Wrong!*\n\n"
            f"✅ Correct answer: *{correct_option}*\n"
            f"🎯 Score: *{quiz['score']}*"
        )

    quiz["current"] += 1

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "➡️ Next Question",
                callback_data="quiz:next",
            )
        ],
        [
            InlineKeyboardButton(
                "🚪 Quit",
                callback_data="menu:games",
            )
        ],
    ])

    await query.edit_message_text(
        result_text,
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


async def continue_quiz(query) -> None:
    user_id = query.from_user.id

    await show_question(query, user_id)
