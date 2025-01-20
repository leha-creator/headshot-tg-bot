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

        this.bot.action('enter_register', (ctx) => {
            ctx.scene.enter('register', {});
        });

        this.bot.action('check', async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: chat_id});
            if (user) {
                const chat_member = await ctx.getChatMember(chat_id, -1002268341872)

                if (chat_member.status == 'left') {
                    ctx.reply(`подпишись на канал`);
                } else {
                    ctx.reply(`Вы подписаны бонусы начисляться в ближайшее время, реферальная ссылка: https://t.me/headshot_pc_bot?start=` + user.ref_code);
                    ctx.telegram.sendMessage(-1002301958705, 'Новый пользователь: номер - ' + user.phone + ' id: @' + user.name);
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