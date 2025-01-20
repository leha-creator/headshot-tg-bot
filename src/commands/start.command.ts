import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {logger} from "../helpers/logger";
import {IUser, UserSchema} from "../Models/User.model";
import {model} from "mongoose";
import crypto from "crypto";
import {escapeText} from "../helpers/domain.service";

export class StartCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
            this.bot.start(async (ctx: any) => {
                const parameters = ctx.update.message.text.split(' ');
                console.log(parameters);
                let join_code = '';
                let ref_user_name = '';
                if (parameters[1] !== undefined) {
                    const User = model("User", UserSchema);
                    const ref_user = await User.findOne({ref_code: parameters[1]});
                    if (ref_user && ref_user.ref_code !== undefined) {
                        join_code = ref_user.ref_code;
                        ref_user_name = ref_user.name;
                    }
                }
                const ref_code = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();

                await storeUser({
                    chat_id: ctx.message.chat.id,
                    name: ctx.message.from.username,
                    ref_code,
                    join_code
                });
                
                try {
                    ctx.reply('Привет' + (ref_user_name ? ', вы приглашены от пользователя ' + escapeText('@' + ref_user_name) : '\\! 👋'), {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: "Зарегистрироваться", callback_data: "enter_register"}],
                            ],
                        },
                        parse_mode: 'MarkdownV2',
                        disable_web_page_preview: true,
                    });
                } catch (e: any) {
                    logger.info(e.message);
                }
            });
    }
}

async function storeUser(user_data: IUser) {
    const User = model<IUser>("User", UserSchema);
    await User.create(user_data);
}