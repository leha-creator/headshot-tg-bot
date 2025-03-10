import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {IUser, UserSchema} from "../Models/User.model";
import {MessageSchema} from "../Models/Message.model";
import {IConfigServise} from "../config/config.interface";

export class CheckCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService, public configService: IConfigServise) {
        super(bot);
    }

    handle(): void {
        this.bot.command('checkusers', async (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                ctx.reply(`Недостаточно прав`);
                return;
            }

            const User = model("User", UserSchema);
            const Message = model("Message", MessageSchema);

            const users = await User.find({});
            await ctx.reply('Пользователей для обработки: ' + users.length);
            console.log('Пользователей для обработки: ' + users.length);
            let number_subscribed_users = 0;
            for (const user of users) {
                console.log('Обрабатываем пользователя phone:' + user.phone);
                try {
                    const message = await Message.findOne({chat_id: user.chat_id});

                    if (!message) {
                        const chat_member = await this.bot.telegram.getChatMember(this.configService.get('HEADSHOT_CHANNEL_ID'), user.chat_id);
                        if (chat_member.status == 'member') {
                            const User = model("User", UserSchema);
                            const ref_user = await User.findOne({ref_code: user.join_code});
                            number_subscribed_users += 1;
                            AdminService.sendMessagesToAdminOnSubscribe(user, ref_user, ctx);
                        }
                        await sleep(1500);
                    }
                } catch (e) {
                    console.log(e)
                }
            }

            await ctx.reply('Количество потерявшихся пользователей: ' + number_subscribed_users);
        });
    }
}

async function updateSubscribed(chat_id: number, is_subscribed: boolean) {
    const User = model("User", UserSchema);
    const user = await User.findOne({chat_id: chat_id});
    if (user) {
        user.is_subscribed = is_subscribed;
        await user.updateOne(user);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}