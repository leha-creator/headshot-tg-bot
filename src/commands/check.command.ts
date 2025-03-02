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

            const users = await User.find();
            let number_subscribed_users = 0;
            for (const user of users) {
                const message = await Message.findOne({chat_id: user.chat_id});

                if (message !== undefined) {
                    const chat_member = await this.bot.telegram.getChatMember(this.configService.get('HEADSHOT_CHANNEL_ID'), user.chat_id);
                    if (chat_member.status == 'member') {
                        await updateOrInsert(user);
                        number_subscribed_users += 1;
                    }
                }

                await sleep(500);
            }

            await ctx.reply('Количество подписанных пользователей: ' + number_subscribed_users);
        });
    }
}

async function updateOrInsert(user_data: IUser) {
    const User = model("User", UserSchema);
    const user = await User.findOne({chat_id: user_data.chat_id});
    if (user) {
        await user.updateOne(user_data);
    } else {
        await User.create(user_data);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}