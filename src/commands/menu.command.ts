import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import {increaseBonusCounter} from "../helpers/counters.service";
import {webApp} from "telegraf/typings/button";

export class MenuCommand extends Command {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('menu', async (ctx) => {
            const chat_id = ctx.update.message.from.id;
            await increaseBonusCounter(chat_id, 'menu');

            await ctx.reply('Меню 🎮', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🎉 Акции",
                                callback_data: 'current-actions',
                            },
                            {
                                text: "📞 Контакты",
                                callback_data: 'contacts',
                            },
                        ],
                        [
                            {
                                text: "💸 Прайс",
                                callback_data: 'price',
                            },
                            {
                                text: "🕹️ Забронировать",
                                callback_data: 'book',
                            },
                        ],
                        [
                            {
                                text: "🛠️ Поддержка",
                                callback_data: 'help',
                            },
                            {
                                text: "🎁 Рундук",
                                callback_data: 'chest',
                            },
                        ],
                        [
                            {
                                text: "🐍 Змейка",
                                web_app: {
                                    url: `https://lk.adswap.ru/snake-game?chat_id=${chat_id}`
                                }
                            },
                        ],
                    ],
                },
            })
        });
    }
}