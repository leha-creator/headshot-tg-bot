import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {model} from "mongoose";
import {Action} from "./action.class";
import {ActionSchema} from "../Models/Action.model";
import {ConfigService} from "../config/configService";
import {UserSchema} from "../Models/User.model";

const configService = ConfigService.getInstance();

export class ActionWin25Action extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('actionwin25', async (ctx: any) => {
            ctx.reply('Акция закончилась, но халява — нет! 🎁 \n' +
                '\n' +
                'Оставайся подписанным, чтобы не пропустить следующие раздачи!');
        });
    }
}

