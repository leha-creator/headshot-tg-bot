import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {model} from "mongoose";
import {Action} from "./action.class";
import {ActionSchema} from "../Models/Action.model";
import {ConfigService} from "../config/configService";
import {UserSchema} from "../Models/User.model";

const configService = ConfigService.getInstance();

export class ActionWin25Action extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('actionwin25', async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            const Action = model("Action", ActionSchema);
            const action = await Action.findOne({chat_id: chat_id, action_code: 'actionwin25'});
            if (!action) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: chat_id});
                if (user) {
                    const message = "❗️Акция:\n" +
                        "\n" +
                        "Номер: " + user.phone + "\n" +
                        "ID: @" + user.name + "\n" +
                        "Город: " + (user.city ?? 'Не указан') + "\n" +
                        "Начислить бонусов: " + 300 + "\n";


                    ctx.telegram.sendMessage(configService.get('HEADSHOT_ADMIN_GROUP_ID'), message, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "✅ Начислено",
                                        callback_data: 'action-bonus-accrued',
                                    },
                                ],
                            ],
                        },
                    }).then((textMessage: any) => {
                        Action.create({chat_id: user.chat_id, message_id: textMessage.message_id, balance: 300, action_code: 'actionwin25'});
                    })
                }
            } else {
                ctx.reply('Вы уже забрали бонусы!');
            }
        });
    }
}

