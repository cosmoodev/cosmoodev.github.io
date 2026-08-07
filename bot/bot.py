import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
)

from config import BOT_TOKEN, OWNER_ID

logging.basicConfig(level=logging.INFO)

if not BOT_TOKEN:
    raise SystemExit("BOT_TOKEN не задан — положи его в bot/.env")

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

MAIN_KB = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Ассортимент")],
        [KeyboardButton(text="Цены")],
        [KeyboardButton(text="Сделать заказ")],
        [KeyboardButton(text="Обо мне")],
    ],
    resize_keyboard=True,
)

SERVICES = [
    ("Лендинги и сайты", "Одностраничники, которые продают"),
    ("Айдентика и брендинг", "Логотипы, стиль и характер бренда"),
    ("Мобильные интерфейсы", "Макеты приложений и адаптация под телефон"),
    ("Интернет-магазины", "Магазины с корзиной и фильтрами"),
    ("Веб-приложения", "Сервисы и дашборды"),
    ("Дизайн-системы", "Компоненты и токены под продукт"),
    ("Telegram-боты", "Боты для продаж и автоматизации — от 1 000 ₽"),
]

SERVICE_KB = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text=name, callback_data=f"service:{i}")]
        for i, (name, _) in enumerate(SERVICES)
    ]
)


class OrderFlow(StatesGroup):
    service = State()
    details = State()
    contact = State()


@dp.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer(
        "Привет! Я cosmo — делаю сайты, интерфейсы и Telegram-ботов.\n\n"
        "Что тебя интересует?",
        reply_markup=MAIN_KB,
    )


@dp.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("Отменено. Могу ещё чем-то помочь?", reply_markup=MAIN_KB)


@dp.message(F.text == "Ассортимент")
async def show_services(message: Message):
    lines = [f"<b>{name}</b> — {desc}" for name, desc in SERVICES]
    await message.answer("Вот что я умею:\n\n" + "\n\n".join(lines))


@dp.message(F.text == "Цены")
async def show_prices(message: Message):
    await message.answer(
        "Цены:\n\n"
        "• Дизайн интерфейсов — от 10 000 ₽\n"
        "• Разработка — от 15 000 ₽\n"
        "• Дизайн-системы — от 25 000 ₽\n"
        "• Консультации — от 2 000 ₽\n"
        "• Telegram-боты — от 1 000 ₽\n\n"
        "Точная цена зависит от задачи — нажми «Сделать заказ» и обсудим."
    )


@dp.message(F.text == "Обо мне")
async def about(message: Message):
    await message.answer(
        "Меня зовут cosmo, мне 16 лет. Занимаюсь дизайном и разработкой: "
        "лендинги, сайты, интерфейсы, дизайн-системы и Telegram-боты."
    )


@dp.message(F.text == "Сделать заказ")
async def start_order(message: Message, state: FSMContext):
    await state.set_state(OrderFlow.service)
    await message.answer("Выбери, что нужно сделать:", reply_markup=SERVICE_KB)


@dp.callback_query(OrderFlow.service, F.data.startswith("service:"))
async def choose_service(cb: CallbackQuery, state: FSMContext):
    index = int(cb.data.split(":")[1])
    name, _ = SERVICES[index]
    await state.update_data(service=name)
    await state.set_state(OrderFlow.details)
    await cb.message.delete()
    await cb.message.answer(f"Отлично, <b>{name}</b>! Коротко опиши задачу:")
    await cb.answer()


@dp.message(OrderFlow.details)
async def get_details(message: Message, state: FSMContext):
    await state.update_data(details=message.text)
    await state.set_state(OrderFlow.contact)
    contact_kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="Отправить контакт", request_contact=True)]],
        resize_keyboard=True,
    )
    await message.answer(
        "Теперь оставь контакт — номер телефона или @ник в Telegram:",
        reply_markup=contact_kb,
    )


@dp.message(OrderFlow.contact, F.contact)
async def get_contact_phone(message: Message, state: FSMContext):
    await finish_order(message, state, f"+{message.contact.phone_number}")


@dp.message(OrderFlow.contact)
async def get_contact_text(message: Message, state: FSMContext):
    await finish_order(message, state, message.text)


async def finish_order(message: Message, state: FSMContext, contact: str):
    data = await state.get_data()
    await state.clear()

    order_text = (
        "🛒 <b>Новый заказ</b>\n\n"
        f"Услуга: <b>{data.get('service', '—')}</b>\n"
        f"Задача: {data.get('details', '—')}\n"
        f"Контакт: {contact}\n"
        f"От: @{message.from_user.username or message.from_user.id}"
    )

    if OWNER_ID:
        await bot.send_message(OWNER_ID, order_text)
    else:
        logging.warning("OWNER_ID не задан — заказ не отправлен владельцу.")

    await message.answer(
        "Заказ отправлен! Свяжемся с тобой в ближайшее время 🚀",
        reply_markup=MAIN_KB,
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
