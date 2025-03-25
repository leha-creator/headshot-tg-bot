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
import {helpScene} from "./scenes/help.scene";
import {HelpCommand} from "./commands/help.command";
import {MessageCommands} from "./commands/message.command";
import {DistributeCommand} from "./commands/distribute.command";
import {MenuCommand} from "./commands/menu.command";
import {CLUBS, priceScene} from "./scenes/price.scene";
import {BonusAccruedAction} from "./actions/bonus_accured.action";
import {BookAction} from "./actions/book.action";
import {CheckAction} from "./actions/check.action";
import {HelpAction} from "./actions/help.action";
import {PriceAction} from "./actions/price.action";
import {PriceSelectClubAction} from "./actions/price_select_club.action";
import {UserNotRegisteredAction} from "./actions/user_not_registered.action";
import {Action} from "./actions/action.class";
import {schedule} from "node-cron";
import {OpenedChestAction} from "./actions/opened_chest.action";
import {ACTIONS, currentActionsScene} from "./scenes/current_actions.scene";
import {CurrentActionsAction} from "./actions/current_actions.action";
import {ContactsAction} from "./actions/contacts.action";
import {ChestAction} from "./actions/chest.action";
import {DailyBoxSchema} from "./Models/DailyBox.model";
import {ContactSelectClubAction} from "./actions/contacts_select_club.action";
import {CLUB_CONTACTS, contactsScene} from "./scenes/contacts.scene";
import {RegisterAction} from "./actions/register.action";
import {ChestBonusAccruedAction} from "./actions/chest_bonus_accured.action";
import {model} from "mongoose";
import {MessageSchema} from "./Models/Message.model";
import {UserSchema} from "./Models/User.model";
import {AdminService, USER_REF_BONUS_QUANTITY} from "./helpers/admin.service";
import {ModCommand, ModCommnds} from "./commands/mod.command";
import {UnmodCommand} from "./commands/unmod.command";

export class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];
    actions: Action[] = [];

    constructor(private readonly configService: IConfigServise, private readonly adminService: AdminService) {
        this.adminService = adminService;
        this.bot = new Telegraf<IBotContext>(this.configService.get('TOKEN'), {handlerTimeout: 9_000_000});
        this.bot.use(
            new LocalSession({database: 'sessions.json'}).middleware()
        );
    }

    async init() {
        this.initScenes();
        this.initCommands();
        this.initActions();

        schedule('* * * * *', async () => {
            const DailyBox = model("DailyBox", DailyBoxSchema);
            const daily_boxes = await DailyBox.find({createdAt: {$lt: new Date().getTime() - 24 * 60 * 60 * 1000}, next_notified: false});
            for (const daily_box of daily_boxes) {
                daily_box.next_notified = true;
                await daily_box.updateOne(daily_box);
                await this.bot.telegram.sendMessage(daily_box.chat_id, 'Рундук уже доступен, испытай удачу! 🎉');

            }
        })

        await this.bot.launch();
    }

    initScenes() {
        const register = registerScene('register', () => {
            console.log('register');
        });

        const help = helpScene('help', () => {
            console.log('help');
        });

        const price = priceScene('price', () => {
            console.log('price');
        });

        const currentActions = currentActionsScene('current-actions', () => {
            console.log('current-actions');
        });

        const contacts = contactsScene('contacts', () => {
            console.log('contacts');
        });

        const stage = new Stage([
            register,
            help,
            price,
            currentActions,
            contacts
        ]);

        this.bot.use(stage.middleware());

        help.action(/^select-club-(\d+)$/, (ctx) => {
            ctx.wizard.state.address = ctx.match[1];
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        });

        price.action(/^price-select-club-(\d+)$/, async (ctx) => {
            if (CLUBS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(CLUBS[ctx.match[1]].price_url);
            }
            return ctx.scene.leave();
        });

        currentActions.action(/^action-select-(\d+)$/, async (ctx) => {
            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(ACTIONS[ctx.match[1]].price_url);
            }
        });

        contacts.action(/^contacts-select-club-(\d+)$/, async (ctx) => {
            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.reply(CLUB_CONTACTS[ctx.match[1]].text);
            }
        });
    }

    initCommands() {
        this.commands = [
            new StartCommand(this.bot, this.adminService),
            new RegisterCommand(this.bot),
            new ListCommand(this.bot, this.adminService),
            new ModCommand(this.bot, this.adminService),
            new UnmodCommand(this.bot, this.adminService),
            new CheckCommand(this.bot, this.adminService, this.configService),
            new HelpCommand(this.bot),
            new DistributeCommand(this.bot, this.adminService),
            new MenuCommand(this.bot),
            new ContactSelectClubAction(this.bot),
            new MessageCommands(this.bot),
        ];

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
                            const ref_message = await Message.findOne({chat_id: user.chat_id, referral_chat_id: ref_user.chat_id});
                            if (ref_message) {
                                ctx.telegram.sendMessage(ref_user.chat_id, `Ура! 🎉 Ваш друг @` + user.name + ` зарегистрировался! ${ref_message.balance} рублей скоро зачислятся на ваш бонусный счёт! 💰`);
                            }
                        }

                        user.is_bonus_accrued = true;
                        await user.updateOne(user);

                        ctx.telegram.sendMessage(user.chat_id, `Поздравляем! Вы успешно подписались! ${message.balance} рублей скоро зачислятся на ваш бонусный счет. Пригласите друга по этой ссылке и получите оба на каждого по ` + USER_REF_BONUS_QUANTITY + ` бонусных рублей! Реферальная ссылка: https://t.me/headshot_club_bot?start=` + user.ref_code);
                        await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, 'Пользователю ' + user.phone + ' зачислено ' + message.balance + ' бонусов ✅');
                    }
                }

                await AdminService.setMessageProcessed(message.message_id);
            }
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
    }

    initActions() {
        this.actions = [
            new BonusAccruedAction(this.bot),
            new BookAction(this.bot),
            new CheckAction(this.bot, this.configService),
            new HelpAction(this.bot),
            new PriceAction(this.bot),
            new PriceSelectClubAction(this.bot),
            new UserNotRegisteredAction(this.bot),
            new OpenedChestAction(this.bot),
            new ChestAction(this.bot),
            new CurrentActionsAction(this.bot),
            new ContactsAction(this.bot),
            new ContactSelectClubAction(this.bot),
            new RegisterAction(this.bot),
            new ChestBonusAccruedAction(this.bot),
        ];

        for (const action of this.actions) {
            action.handle();
        }
    }
}
