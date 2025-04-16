import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {webApp} from "telegraf/typings/button";


export class SnakeAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('chest', async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;

            return webApp('', `https://lk.adswap.ru/snake-game?chat_id=${chat_id}`);
        })
    }
}

