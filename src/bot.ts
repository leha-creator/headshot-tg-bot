import {Telegraf} from "telegraf";
import {IBotContext} from "./context/context.interface";
import {Command} from "./commands/command.class";
import {IConfigServise} from "./config/config.interface";
import LocalSession from "telegraf-session-local";
import {registerScene} from "./scenes/register.scene";
import {Stage} from "telegraf/scenes";
import {StartCommand} from "./commands/start.command";
import {RegisterCommand} from "./commands/register.command";
import {ListCommand} from "./commands/list.command";
import {CheckCommand} from "./commands/check.command";
import {model} from "mongoose";
import {MessageSchema} from "./Models/Message.model";
import {UserSchema} from "./Models/User.model";
import {AdminService} from "./helpers/admin.service";
import {helpScene} from "./scenes/help.scene";
import {HelpCommand} from "./commands/help.command";
import {MessageCommands} from "./commands/message.command";
import {DistributeCommand} from "./commands/distribute.command";
import {MenuCommand} from "./commands/menu.command";

export class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];

    constructor(private readonly configService: IConfigServise, private readonly adminService: AdminService) {
        this.adminService = adminService;
        this.bot = new Telegraf<IBotContext>(this.configService.get('TOKEN'));
        this.bot.use(
            new LocalSession({database: 'sessions.json'}).middleware()
        );
    }

    async init() {
        const register = registerScene('register', () => {
            console.log('register');
        });

        const help = helpScene('help', () => {
            console.log('help');
        });

        const stage = new Stage([
            register,
            help
        ]);

        this.bot.use(stage.middleware());
        this.commands = [
            new StartCommand(this.bot, this.adminService),
            new RegisterCommand(this.bot),
            new ListCommand(this.bot, this.adminService),
            new CheckCommand(this.bot, this.adminService, this.configService),
            new HelpCommand(this.bot),
            new DistributeCommand(this.bot, this.adminService),
            new MenuCommand(this.bot),
            new MessageCommands(this.bot)
        ];
        this.bot.action('book', async (ctx: any) => {
            ctx.reply('Выберите клуб', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Ливанова",
                                url: 'https://langame.ru/799451106_computerniy_club_headshot-na-livanova_ulyanovsk',
                            },
                            {
                                text: "Гончарова",
                                url: 'https://langame.ru/797058697_computerniy_club_headshot-na-goncarova_ulyanovsk',
                            },
                        ],
                        [
                            {
                                text: "Рябикова",
                                url: 'https://langame.ru/797072563_computerniy_club_headshot-na-ryabikova_ulyanovsk',
                            },
                            {
                                text: "40 летия победы",
                                url: 'https://langame.ru/799447780_computerniy_club_headshot-na-40-letiya-pobedy_ulyanovsk',
                            },
                        ],
                        [
                            {
                                text: "Димитровград Ленина",
                                url: 'https://langame.ru/799448233_computerniy_club_headshot-na-lenina_dimitrovgrad',
                            },
                        ],
                    ],
                },
            })
        })

        help.action(/^select-club-(\d+)$/, (ctx) => {
            ctx.wizard.state.address = ctx.match[1];
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        })

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

                        ctx.telegram.sendMessage(user.chat_id, `Поздравляем! Вы успешно подписались! ${message.balance} рублей скоро зачислятся на ваш бонусный счет. Пригласите друга по этой ссылке и получите оба на каждого по 150 бонусных рублей! Реферальная ссылка: https://t.me/headshot_club_bot?start=` + user.ref_code);
                        await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, 'Пользователю ' + user.phone + ' зачислено ' + message.balance + ' бонусов ✅');
                    }
                }

                await AdminService.setMessageProcessed(message.message_id);
            }
        });

        this.bot.action('help', (ctx) => {
            ctx.scene.enter('help');
        });

        this.bot.action('end_help', (ctx) => {
            ctx.reply('Обращение успешно закрыто');
        });

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

        for (const command of this.commands) {
            command.handle();
        }

        await this.bot.launch();
    }
}
