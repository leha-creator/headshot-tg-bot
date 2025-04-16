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
import {ModCommand} from "./commands/mod.command";
import {UnmodCommand} from "./commands/unmod.command";
import {logger} from "./helpers/logger";
import {SnakeBonusAccruedAction} from "./actions/snake_bonuses_accrued.action";

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

        this.bot.catch(err => {
            logger.error(err)
        });

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

        for (const command of this.commands) {
            command.handle();
        }
    }

    initActions() {
        this.actions = [
            new SnakeBonusAccruedAction(this.bot),
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
