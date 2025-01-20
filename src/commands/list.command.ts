import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";

export class ListCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('list', (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                ctx.reply(`Недостаточко прав`);
                return;
            }

            let adminsList = this.adminService.getAdmins();
            let adminsString = '';
            adminsList.forEach((admin, key) => {
                adminsString += `${key}. ${admin}\n`;
            })

            ctx.reply(`Список администраторов:\n${adminsString}`);
        });
    }
}