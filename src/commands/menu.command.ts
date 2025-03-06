import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";

export class MenuCommand extends Command {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('menu', async (ctx) => {
            await ctx.reply('Выберите пункт меню', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Прайс",
                                callback_data: 'price',
                            },
                            {
                                text: "Забронировать",
                                callback_data: 'book',
                            },
                        ],
                    ],
                },
            })
        });
    }
}