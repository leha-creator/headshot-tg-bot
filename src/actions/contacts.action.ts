import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";

export class ContactsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('contacts', (ctx) => {
            ctx.reply('*Контакты*\n' +
                '8 \\(8422\\) 22\\-91\\-24\n' +
                '*Режим работы: 24\\/7*\n' +
                '\n' +
                '\n' +
                'HEADSHOT ЦЕНТР\n' +
                'г\\. Ульяновск, ул\\. Гончарова, д\\. 23 \\(отдельный вход со стороны отеля Radisson\\)\n' +
                '\n' +
                'HEADSHOT ЗАСВИЯЖЬЕ\n' +
                'г\\. Ульяновск, ул\\. Рябикова, д\\. 74\n' +
                '\\(за ТЦ Айсберг\\)\n' +
                '\n' +
                'HEADSHOT НОВЫЙ ГОРОД\n' +
                'г\\. Ульяновск, ул\\. 40\\-летия Победы, д\\.19а\n' +
                '\n' +
                'HEADSHOT НОВЫЙ ГОРОД 2\n' +
                'г\\. Ульяновск, ул\\. Ливанова, д\\. 5\n' +
                '\n' +
                'HEADSHOT ДИМИТРОВГРАД\n' +
                'г\\. Димитровград ул\\. Ленина д\\.51 \\(за ТЦ Дом Торговли\\)',
                {
                    parse_mode: 'MarkdownV2',
                });
        })
    }
}
