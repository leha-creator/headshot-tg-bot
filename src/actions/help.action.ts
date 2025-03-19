import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {increaseBonusCounter} from "../helpers/counters.service";

export class HelpAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('help', async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'help');

            if (ctx.update.callback_query.message) {
                const message = ctx.update.callback_query.message;
                if (message && 'text' in message && !message.text.includes('Меню')) {
                    await this.bot.telegram.editMessageReplyMarkup(chat_id, ctx.update.callback_query.message.message_id, undefined, undefined);
                }
            }

            return await ctx.scene.enter('help');
        });

        this.bot.action('end_help', async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'end_help');

            if (ctx.update.callback_query.message) {
                await this.bot.telegram.editMessageReplyMarkup(chat_id, ctx.update.callback_query.message.message_id, undefined, undefined);
            }
            return await ctx.reply('Обращение успешно закрыто');
        });
    }
}

