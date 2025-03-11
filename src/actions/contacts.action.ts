import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";

export class ContactsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('contacts', (ctx) => {
            ctx.reply(`📞 8 (8422) 22-91-24
⏰ Режим работы: 24/7

📍 HEADSHOT ЦЕНТР
г. Ульяновск, ул. Гончарова, д. 23
(отдельный вход со стороны отеля Radisson)

📍 HEADSHOT ЗАСВИЯЖЬЕ
г. Ульяновск, ул. Рябикова, д. 74
(за ТЦ Айсберг)

📍 HEADSHOT НОВЫЙ ГОРОД
г. Ульяновск, ул. 40-летия Победы, д.19а

📍 HEADSHOT НОВЫЙ ГОРОД 2
г. Ульяновск, ул. Ливанова, д. 5

📍 HEADSHOT ДИМИТРОВГРАД
г. Димитровград, ул. Ленина, д.51
(за ТЦ Дом Торговли)`);
        })
    }
}
