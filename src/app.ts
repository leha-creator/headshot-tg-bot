import {Telegraf} from "telegraf";
import {IConfigServise} from "./config/config.interface";
import {ConfigService} from "./config/configService";
import {IBotContext} from "./context/context.interface";
import {Command} from "./commands/command.class";
import {StartCommnds} from "./commands/start.command";
import LocalSession from "telegraf-session-local";
import {logger} from "./helpers/logger";
import {AdminService} from "./helpers/admin.service";
import {Stage} from "telegraf/scenes";
import {registerScene} from "./scenes/register.scene";
import {RegisterCommand} from "./commands/register.command";
import {connect, model} from 'mongoose';
import {UserSchema} from "./Models/User.model";
import {MessageSchema} from "./Models/Message.model";

class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];

    constructor(private readonly configService: IConfigServise) {
        this.bot = new Telegraf<IBotContext>(this.configService.get('TOKEN'));
        this.bot.use(
            new LocalSession({database: 'sessions.json'}).middleware()
        );
    }

    init() {
        const register = registerScene('register', () => {
            console.log('ok')
        });

        const stage = new Stage([
            register,
        ]);

        this.bot.use(stage.middleware());
        this.commands = [
            new StartCommnds(this.bot, adminService),
            new RegisterCommand(this.bot),
        ];

        this.bot.action('bonuses_accrued', async (ctx: any, next: any) => {
            const Message = model("Message", MessageSchema);
            const message = await Message.findOne({message_id: ctx.update.callback_query.message.message_id});
            console.log(message);
            if (message && message.chat_id !== undefined) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: message.chat_id});
                if (user) {
                    await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, 'Пользователю ' + user.phone + ' зачислено ' + message.balance + ' бонусов ✅');
                }
            }
        });

        this.bot.action('check', async (ctx: any, next: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: chat_id});
            if (user) {
                const chat_member = await this.bot.telegram.getChatMember(-1001634058732, chat_id);
                if (chat_member.status == 'member') {
                    const User = model("User", UserSchema);
                    const ref_user = await User.findOne({ref_code: user.join_code});
                    ctx.reply(`Поздравляем! Вы успешно подписались! 300 рублей скоро зачислятся на ваш бонусный счет. Пригласите друга по этой ссылке и получите оба на каждого по 150 бонусных рублей! Реферальная ссылка: https://t.me/headshot_club_bot?start=` + user.ref_code);
                    if (ref_user && ref_user.ref_code !== undefined) {
                        return ctx.telegram.sendMessage(ref_user.chat_id, 'Ура! 🎉 Ваш друг @' + user.name + ' зарегистрировался! 150 рублей скоро зачислятся на ваш бонусный счёт! 💰');
                    }
                    let message = "❗️Новый пользователь:\n" +
                        "\n" +
                        "Номер: " + user.phone + "\n" +
                        "ID: @" + user.name + "\n" +
                        "Начислить бонусов: 300\n";
                    let balance = 300;
                    if (ref_user && ref_user.ref_code !== undefined) {
                        message = "❗️Новый пользователь по приглашению:\n" +
                            "\n" +
                            "Номер: " + user.phone + "\n" +
                            "ID: @" + user.name + "\n" +
                            "Начислить бонусов: 450\n";
                        balance = 450;
                        const admin_message = "❗ Пригласивший пользователь:\n" +
                            "Номер: " + ref_user.phone + "\n" +
                            "ID: @" + ref_user.name + "\n" +
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
                        }).then((textMessage: any) => {
                            const Message = model("Message", MessageSchema);
                            Message.create({chat_id: ref_user.chat_id, message_id: textMessage.message_id, balance: 150});
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
                    }).then((textMessage: any) => {
                        const Message = model("Message", MessageSchema);
                        Message.create({chat_id: chat_id, message_id: textMessage.message_id, balance: balance});
                        next();
                    });
                } else {
                    return ctx.reply(`Вы не подписались на канал!`).then(() => next());
                }
            }
        });

        for (const command of this.commands) {
            command.handle();
        }

        this.bot.launch();
    }
}

const configService = ConfigService.getInstance();
const bot = new Bot(configService);
const adminService = AdminService.getInstance();

const start = async () => {
    bot.init();
    logger.info('app started');
};

async function connectMongo() {
    const url = "mongodb://127.0.0.1:27017/";
    try {
        await connect(url);
    } catch (err) {
        console.log("Возникла ошибка");
        console.log(err);
    }
}

connectMongo()
start();