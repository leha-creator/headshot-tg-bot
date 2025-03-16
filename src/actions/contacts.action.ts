import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";

export class ContactsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('contacts', async (ctx) => {
            return await ctx.scene.enter('contacts');
        })
    }
}
