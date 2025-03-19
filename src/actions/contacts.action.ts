import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {increaseBonusCounter} from "../helpers/counters.service";

export class ContactsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('contacts', async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'contacts');

            return await ctx.scene.enter('contacts');
        })
    }
}
