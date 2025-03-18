import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";

export class RegisterAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('register', async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: chat_id});
            if (user) {
                await ctx.reply('Вы уже зарегистрированы');
            } else {
                await ctx.scene.enter('register', {});
            }
        });

    }
}

