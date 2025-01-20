import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";

export class UnmodCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('unmod', (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                ctx.reply(`Недостаточко прав`);
                return;
            }

            let args = ctx.update.message.text.split(' ');
            if (args[1] && this.adminService.isAdmin(parseInt(args[1]))) {
                this.adminService.deleteAdmin(parseInt(args[1]))
                ctx.reply(`Администратор удалён`);
            } else {
                ctx.reply(`Ошибка при удалении: некорректный id`);
            }
        });
    }
}