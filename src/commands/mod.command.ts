import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";

export class ModCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('mod', (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                ctx.reply(`Недостаточко прав`);
                return;
            }

            let args = ctx.update.message.text.split(' ');
            if (args[1]) {
                this.adminService.addAdmin(parseInt(args[1]))
                ctx.reply(`Администратор добавлен`);
            } else {
                ctx.reply(`Ошибка при добавлении: некорректный id`);
            }
        });
    }
}