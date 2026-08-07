import json
import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv(Path(__file__).resolve().parent / ".env")

TOKEN = os.getenv("BOT_TOKEN", "")
OWNER_ID = os.getenv("OWNER_ID", "")

if not TOKEN:
    raise SystemExit("BOT_TOKEN не задан — положи его в bot/.env")

API = f"https://api.telegram.org/bot{TOKEN}"

app = Flask(__name__)

states = {}

SERVICES = [
    "Лендинги и сайты",
    "Айдентика и брендинг",
    "Мобильные интерфейсы",
    "Интернет-магазины",
    "Веб-приложения",
    "Дизайн-системы",
    "Telegram-боты",
]

PRICES = (
    "Цены:\n\n"
    "• Дизайн интерфейсов — от 10 000 ₽\n"
    "• Разработка — от 15 000 ₽\n"
    "• Дизайн-системы — от 25 000 ₽\n"
    "• Консультации — от 2 000 ₽\n"
    "• Telegram-боты — от 1 000 ₽\n\n"
    "Точная цена зависит от задачи — нажми «Сделать заказ» и обсудим."
)


def kb(rows):
    return {"keyboard": rows, "resize_keyboard": True}


MAIN_KB = kb([["Ассортимент"], ["Цены"], ["Обо мне"], ["Сделать заказ"]])
CONTACT_KB = kb([[{"text": "Отправить номер", "request_contact": True}], ["Отмена"]])


def send(chat_id, text, markup=None):
    data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if markup:
        data["reply_markup"] = markup
    try:
        requests.post(f"{API}/sendMessage", json=data, timeout=30)
    except Exception as exc:
        logging.warning("sendMessage error: %s", exc)


def services_text():
    lines = "\n".join(f"{i}. {name}" for i, name in enumerate(SERVICES, 1))
    return f"Вот что я умею:\n\n{lines}"


def finish_order(chat_id, state, contact, username):
    states.pop(chat_id, None)
    order = (
        "🛒 <b>Новый заказ</b>\n\n"
        f"Услуга: <b>{state['service']}</b>\n"
        f"Задача: {state['details']}\n"
        f"Контакт: {contact}\n"
        f"От: @{username or chat_id}"
    )
    send(OWNER_ID, order)
    send(chat_id, "Заказ отправлен! Свяжемся в ближайшее время 🚀", MAIN_KB)


def handle_text(chat_id, text, username):
    if text == "Ассортимент":
        send(chat_id, services_text(), MAIN_KB)
        return

    if text == "Цены":
        send(chat_id, PRICES, MAIN_KB)
        return

    if text == "Обо мне":
        send(
            chat_id,
            "Меня зовут cosmo, мне 16 лет. Занимаюсь дизайном и разработкой: "
            "лендинги, сайты, интерфейсы, дизайн-системы и Telegram-боты.",
            MAIN_KB,
        )
        return

    if text == "Сделать заказ":
        states[chat_id] = {"step": "service"}
        send(chat_id, "Выбери номер услуги:\n\n" + services_text())
        return

    if text == "Отмена":
        states.pop(chat_id, None)
        send(chat_id, "Отменено.", MAIN_KB)
        return

    state = states.get(chat_id)

    if state and state["step"] == "service":
        try:
            idx = int(text.strip())
            if 1 <= idx <= len(SERVICES):
                state["service"] = SERVICES[idx - 1]
                state["step"] = "details"
                send(chat_id, f"Отлично, <b>{state['service']}</b>! Коротко опиши задачу:")
                return
        except ValueError:
            pass
        send(chat_id, "Введи номер услуги (1-7):")
        return

    if state and state["step"] == "details":
        state["details"] = text
        state["step"] = "contact"
        send(chat_id, "Теперь оставь контакт — номер или @ник:", CONTACT_KB)
        return

    if state and state["step"] == "contact":
        finish_order(chat_id, state, text, username)
        return

    send(chat_id, "Не понял. Выбери пункт меню:", MAIN_KB)


@app.route("/setup")
def setup():
    url = request.host_url.rstrip("/") + "/" + TOKEN
    try:
        resp = requests.post(
            f"{API}/setWebhook",
            json={"url": url, "allowed_updates": ["message"]},
            timeout=30,
        )
        return jsonify(resp.json())
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/" + TOKEN, methods=["POST"])
def webhook():
    update = request.get_json(silent=True) or {}
    message = update.get("message") or {}
    chat_id = (message.get("chat") or {}).get("id")
    if not chat_id:
        return jsonify({"ok": True})

    username = (message.get("from") or {}).get("username") or ""
    contact = message.get("contact")
    text = (message.get("text") or "").strip()

    if text == "/start":
        states.pop(chat_id, None)
        send(
            chat_id,
            "Привет! Я cosmo — делаю сайты, интерфейсы и Telegram-ботов.\n\n"
            "Что тебя интересует?",
            MAIN_KB,
        )
        return jsonify({"ok": True})

    state = states.get(chat_id)

    if contact and state and state["step"] == "contact":
        finish_order(chat_id, state, f"+{contact.get('phone_number')}", username)
        return jsonify({"ok": True})

    handle_text(chat_id, text, username)
    return jsonify({"ok": True})


@app.route("/")
def index():
    return "cosmo bot is running"
