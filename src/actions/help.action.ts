import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";

export class HelpAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('help', (ctx) => {
            ctx.scene.enter('help');
        });

        this.bot.action('end_help', (ctx) => {
            ctx.reply('Обращение успешно закрыто');
        });
    }
}

