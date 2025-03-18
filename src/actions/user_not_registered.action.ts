import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {Action} from "./action.class";
import {model} from "mongoose";
import {MessageSchema} from "../Models/Message.model";
import {UserSchema} from "../Models/User.model";

export class UserNotRegisteredAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('user_not_registered', async (ctx: any) => {
            const Message = model("Message", MessageSchema);
            const message = await Message.findOne({message_id: ctx.update.callback_query.message.message_id});
            console.log(message);
            if (message && message.chat_id !== undefined) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: message.chat_id});
                if (user) {
                    const ref_user = await User.findOne({ref_code: user.join_code});
                    if (ref_user && ref_user.ref_code !== undefined) {
                        const ref_message = await Message.findOne({
                            referral_chat_id: ref_user.chat_id,
                            chat_id: user.chat_id,
                            is_referral_message: true,
                            is_processed: false,
                        });
                        if (ref_message && ref_message.message_id) {
                            await AdminService.setMessageProcessed(ref_message.message_id);
                            await this.bot.telegram.editMessageText(ctx.chat.id, ref_message.message_id, undefined, 'Пользователь, который отправил реферальную ссылку, не зарегистрирован в системе.');
                        }
                    }

                    await this.bot.telegram.editMessageText(ctx.chat.id, message.message_id, undefined, 'Пользователь ' + user.phone + ' не зарегистрирован в LANGAME');
                    ctx.telegram.sendMessage(user.chat_id, 'Ваш аккаунт не зарегистрирован. Пожалуйста, зарегистрируйтесь на сайте Langame, чтобы получить бонусы! После регистрации нажмите кнопку "Я зарегистрирован"', {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Регистрация на портале LANGAME",
                                        url: 'https://langame.ru/registration?userType=player'
                                    },
                                    {
                                        text: "Я зарегистрирован",
                                        callback_data: 'check'
                                    },
                                ],
                            ],
                        },
                    });
                }

                await AdminService.setMessageProcessed(message.message_id);
            }
        });
    }
}

