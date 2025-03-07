import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {IConfigServise} from "../config/config.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {MessageSchema} from "../Models/Message.model";

export class CheckAction extends Action {
    constructor(bot: Telegraf<IBotContext>, public configService: IConfigServise) {
        super(bot);
    }

    handle(): void {
        this.bot.action('check', async (ctx: any, next: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: chat_id});
            if (user) {
                if (user.is_bonus_accrued) {
                    return ctx.reply('Бонусы уже начислены!');
                }

                const chat_member = await this.bot.telegram.getChatMember(this.configService.get('HEADSHOT_CHANNEL_ID'), chat_id);
                const Message = model("Message", MessageSchema);
                const message = await Message.findOne({
                    chat_id: chat_id,
                    is_referral_message: false,
                    is_processed: false
                });
                if (message && message.message_id) {
                    ctx.reply('Ваша заявка всё ещё обрабатывается');
                } else if (chat_member.status == 'member') {
                    const User = model("User", UserSchema);
                    const ref_user = await User.findOne({ref_code: user.join_code});
                    user.is_subscribed = true;
                    await user.updateOne(user);
                    ctx.reply('Отлично! После проверки модератором мы вышлем вам сообщение о начислении бонуса.');
                    AdminService.sendMessagesToAdminOnSubscribe(user, ref_user, ctx);
                    next();
                } else {
                    return ctx.reply(`Вы не подписались на канал!`).then(() => next());
                }
            }
        });
    }
}

