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

MAIN_KB = {
    "inline_keyboard": [
        [{"text": "Ассортимент", "callback_data": "menu:assort"}],
        [{"text": "Цены", "callback_data": "menu:prices"}],
        [{"text": "Сделать заказ", "callback_data": "menu:order"}],
        [{"text": "Новости — канал", "url": "https://t.me/cosmoodev"}],
        [{"text": "Сайт", "url": "https://cosmoodev.github.io"}],
    ]
}

SERVICE_KB = {
    "inline_keyboard": [
        [{"text": f"{i}. {name}", "callback_data": f"service:{i - 1}"}]
        for i, name in enumerate(SERVICES, 1)
    ]
    + [[{"text": "Отмена", "callback_data": "cancel"}]]
}

CONTACT_KB = {
    "inline_keyboard": [[{"text": "Отмена", "callback_data": "cancel"}]]
}


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


def handle_callback(cb):
    chat_id = ((cb.get("message") or {}).get("chat") or {}).get("id")
    data = cb.get("data") or ""
    username = (cb.get("from") or {}).get("username") or ""
    cb_id = cb.get("id")

    if cb_id:
        try:
            requests.post(
                f"{API}/answerCallbackQuery",
                json={"callback_query_id": cb_id},
                timeout=30,
            )
        except Exception as exc:
            logging.warning("answerCallbackQuery error: %s", exc)

    if not chat_id:
        return

    if data == "menu:assort":
        send(chat_id, services_text(), MAIN_KB)
    elif data == "menu:prices":
        send(chat_id, PRICES, MAIN_KB)
    elif data == "menu:order":
        states[chat_id] = {"step": "service"}
        send(chat_id, "Выбери, что нужно сделать:", SERVICE_KB)
    elif data == "cancel":
        states.pop(chat_id, None)
        send(chat_id, "Отменено.", MAIN_KB)
    elif data.startswith("service:"):
        idx = int(data.split(":")[1])
        states[chat_id] = {"service": SERVICES[idx], "step": "details"}
        send(chat_id, f"Отлично, <b>{SERVICES[idx]}</b>! Коротко опиши задачу:")


def handle_text(chat_id, text, username):
    state = states.get(chat_id)

    if state and state["step"] == "details":
        state["details"] = text
        state["step"] = "contact"
        send(chat_id, "Теперь оставь контакт — номер или @ник:", CONTACT_KB)
        return

    if state and state["step"] == "contact":
        finish_order(chat_id, state, text, username)
        return

    send(chat_id, "Выбери пункт меню:", MAIN_KB)


@app.route("/setup")
def setup():
    url = request.host_url.rstrip("/") + "/" + TOKEN
    try:
        resp = requests.post(
            f"{API}/setWebhook",
            json={"url": url, "allowed_updates": ["message", "callback_query"]},
            timeout=30,
        )
        return jsonify(resp.json())
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/" + TOKEN, methods=["POST"])
def webhook():
    update = request.get_json(silent=True) or {}

    callback = update.get("callback_query")
    if callback:
        handle_callback(callback)
        return jsonify({"ok": True})

    message = update.get("message") or {}
    chat_id = (message.get("chat") or {}).get("id")
    if not chat_id:
        return jsonify({"ok": True})

    username = (message.get("from") or {}).get("username") or ""
    text = (message.get("text") or "").strip()

    if text == "/start":
        states.pop(chat_id, None)
        send(
            chat_id,
            "Привет! Я cosmo — делаю сайты, интерфейсы и Telegram-ботов.",
            {"remove_keyboard": True},
        )
        send(chat_id, "Выбери, что тебя интересует:", MAIN_KB)
        return jsonify({"ok": True})

    handle_text(chat_id, text, username)
    return jsonify({"ok": True})


@app.route("/")
def index():
    return "cosmo bot is running"
