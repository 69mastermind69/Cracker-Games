# 🎮 Telegram Gaming Bot

A free Telegram mini-game bot built with Python.

## ✨ Features

- 🎲 Dice
- 🪙 Coin Flip
- ✊ Rock Paper Scissors
- 🔢 Number Guess
- 🧠 Quiz
- 🔤 Word Scramble
- 😈 Hangman
- ❌ Tic-Tac-Toe
- 🔴 Connect Four
- 🧮 Math Challenge
- 🧠 Memory
- 🎯 Higher / Lower

## 💾 Data Policy

This bot does NOT use a database.

It does NOT permanently store:

- User profiles
- Coins
- XP
- Inventory
- Achievements
- Leaderboards
- Game history

Interactive games may keep temporary game state in RAM while a game is running.

RAM state is lost when the application restarts or redeploys.

## 📁 Project Structure

```text
telegram-gaming-bot/
│
├── app.py
├── requirements.txt
├── render.yaml
├── .python-version
├── README.md
│
└── bot/
    ├── __init__.py
    ├── handlers.py
    ├── callbacks.py
    │
    └── games/
        ├── __init__.py
        ├── dice.py
        ├── coin.py
        ├── rps.py
        ├── number_guess.py
        ├── quiz.py
        ├── scramble.py
        ├── hangman.py
        ├── tictactoe.py
        ├── connect4.py
        ├── math_challenge.py
        ├── memory.py
        └── higher_lower.py
