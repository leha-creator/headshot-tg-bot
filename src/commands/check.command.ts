import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {MessageSchema} from "../Models/Message.model";

export class CheckCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
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
            users.forEach((user) => {
                const promise = new Promise((resolve) => {
                    Message.findOne({chat_id: user.chat_id}).then(result => resolve(result))
                });

                promise.then(
                    async result => {
                        if (!result) {
                            const chat_member = await this.bot.telegram.getChatMember(-1001634058732, user.chat_id);
                            if (chat_member.status == 'member') {
                                console.log(user);
                            }
                        }
                    })
            })
        });
    }
}

