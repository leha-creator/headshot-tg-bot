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
                                const User = model("User", UserSchema);
                                const ref_user = await User.findOne({ref_code: user.join_code});
                                let message = "❗️Новый пользователь:\n" +
                                    "\n" +
                                    "Номер: " + user.phone + "\n" +
                                    "ID: @" + user.name + "\n" +
                                    "Город: " + (user.city ?? 'Не указан') + "\n" +
                                    "Начислить бонусов: 300\n";
                                let balance = 300;
                                if (ref_user && ref_user.ref_code !== undefined) {
                                    message = "❗️Новый пользователь по приглашению:\n" +
                                        "\n" +
                                        "Номер: " + user.phone + "\n" +
                                        "ID: @" + user.name + "\n" +
                                        "Город: " + (user.city ?? 'Не указан') + "\n" +
                                        "Начислить бонусов: 450\n";
                                    balance = 450;
                                    const admin_message = "❗ Пригласивший пользователь:\n" +
                                        "Номер: " + ref_user.phone + "\n" +
                                        "ID: @" + ref_user.name + "\n" +
                                        "Город: " + (ref_user.city ?? 'Не указан') + "\n" +
                                        "Начислить бонусов: 150\n";
                                    ctx.telegram.sendMessage(-1002424442799, admin_message, {
                                        reply_markup: {
                                            inline_keyboard: [
                                                [
                                                    {
                                                        text: "✅ Начислено",
                                                        callback_data: 'bonuses_accrued',
                                                    },
                                                ],
                                            ],
                                        },
                                    }).then((textMessage) => {
                                        const Message = model("Message", MessageSchema);
                                        Message.create({
                                            chat_id: ref_user.chat_id,
                                            message_id: textMessage.message_id,
                                            balance: 150
                                        });
                                    });
                                }
                                ctx.telegram.sendMessage(-1002424442799, message, {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: "✅ Начислено",
                                                    callback_data: 'bonuses_accrued',
                                                },
                                            ],
                                        ],
                                    },
                                }).then((textMessage) => {
                                    const Message = model("Message", MessageSchema);
                                    Message.create({
                                        chat_id: user.chat_id,
                                        message_id: textMessage.message_id,
                                        balance: balance
                                    });
                                });
                            }
                        }
                    })
            })
        });
    }
}

