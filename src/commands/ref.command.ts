import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";

export class RefCommand extends Command {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('ref', async (ctx) => {
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: ctx.message.chat.id});
            if (!user) {
                return await ctx.reply(`Зарегистрируйся и попробуй ещё раз!`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "📝 Зарегистрироваться",
                                    callback_data: 'register',
                                },
                            ]]
                    }
                });
            }

            return await ctx.reply(`Реферальная ссылка:  https://t.me/headshot_club_bot?start=` + user.ref_code);
        });
    }
}