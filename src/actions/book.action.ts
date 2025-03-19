import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {increaseBonusCounter} from "../helpers/counters.service";

export class BookAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('book', async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'book');
            ctx.reply('🖥️ Выбери клуб, чтобы забронировать комп или приставку через Langame.\n' +
                '🎮 Или зарегистрируйся, чтобы получить бонусы!', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Ливанова",
                                url: 'https://langame.ru/799451106_computerniy_club_headshot-na-livanova_ulyanovsk',
                            },
                            {
                                text: "Гончарова",
                                url: 'https://langame.ru/797058697_computerniy_club_headshot-na-goncarova_ulyanovsk',
                            },
                        ],
                        [
                            {
                                text: "Рябикова",
                                url: 'https://langame.ru/797072563_computerniy_club_headshot-na-ryabikova_ulyanovsk',
                            },
                            {
                                text: "40 летия победы",
                                url: 'https://langame.ru/799447780_computerniy_club_headshot-na-40-letiya-pobedy_ulyanovsk',
                            },
                        ],
                        [
                            {
                                text: "Димитровград Ленина",
                                url: 'https://langame.ru/799448233_computerniy_club_headshot-na-lenina_dimitrovgrad',
                            },
                        ],
                        [
                            {
                                text: "📝 Зарегистрироваться",
                                callback_data: 'register',
                            },
                        ],
                    ],
                },
            })
        })
    }
}

