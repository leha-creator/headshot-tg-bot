import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";

export class StartCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx: any, next: any) => {
            const parameters = ctx.update.message.text.split(' ');
            ctx.session.ref_code = parameters[1] ?? 0;

            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: ctx.message.chat.id});
            if (user) {
                await ctx.reply('Вы уже зарегистрированы');
            } else {
                await ctx.scene.enter('register', {});
            }
            return await next();
        });
    }
}
