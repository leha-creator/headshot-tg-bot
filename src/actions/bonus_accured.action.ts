import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {MessageSchema} from "../Models/Message.model";
import {Action} from "./action.class";

export class BonusAccruedAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('bonuses_accrued', async (ctx: any) => {
            const Message = model("Message", MessageSchema);
            const message = await Message.findOne({message_id: ctx.update.callback_query.message.message_id});
            if (message && message.chat_id !== undefined) {
                const User = model("User", UserSchema);
                if (message.is_referral_message == true) {
                    const user = await User.findOne({chat_id: message.referral_chat_id});
                    if (user) {
                        user.is_bonus_accrued = true;
                        ctx.telegram.sendMessage(user.chat_id, `🎉 Вам успешно начислили ${message.balance} бонусных рублей!`);
                        await user.updateOne(user);
                        await AdminService.setMessageProcessed(message.message_id, true);
                        await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, 'Пользователю ' + user.phone + ' зачислено ' + message.balance + ' бонусов ✅');
                    }
                } else {
                    const user = await User.findOne({chat_id: message.chat_id});
                    if (user) {
                        const ref_user = await User.findOne({ref_code: user.join_code});
                        if (ref_user && ref_user.ref_code !== undefined) {
                            ctx.telegram.sendMessage(ref_user.chat_id, 'Ура! 🎉 Ваш друг @' + user.name + ' зарегистрировался! 150 рублей скоро зачислятся на ваш бонусный счёт! 💰');
                        }

                        user.is_bonus_accrued = true;
                        await user.updateOne(user);

                        await AdminService.setMessageProcessed(message.message_id, true);
                        ctx.telegram.sendMessage(user.chat_id, `Поздравляем! Вы успешно подписались! ${message.balance} рублей скоро зачислятся на ваш бонусный счет. Пригласите друга по этой ссылке и получите оба на каждого по 150 бонусных рублей! Реферальная ссылка: https://t.me/headshot_club_bot?start=` + user.ref_code);
                        await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, 'Пользователю ' + user.phone + ' зачислено ' + message.balance + ' бонусов ✅');
                    }
                }

            }
        });
    }
}

