import {composeWizardScene} from "../helpers/scene.servise";

export const CLUB_CONTACTS = {
    1: {
        name: 'Центр',
        text: '🏙️ г. Ульяновск, ул. Гончарова, д. 23\n' +
            '(отдельный вход со стороны отеля Radisson)',
    },
    2: {
        name: 'Засвияжье',
        text: '🏬 г. Ульяновск, ул. Рябикова, д. 74\n' +
            '(за ТЦ Айсберг)',
    },
    3: {
        name: 'Новый Город',
        text: '🏘️ г. Ульяновск, ул. 40-летия Победы, д.19а\n' +
            'г. Ульяновск, ул. Ливанова, д. 5',
    },
    4: {
        name: 'Димитровград',
        text: '🏢 г. Димитровград, ул. Ленина, д.51\n' +
            '(за ТЦ Дом Торговли)',
    }
}

export const contactsScene = composeWizardScene(
    async (ctx: any, next: any) => {
        ctx.wizard.state.address = null;
        const inline_keyboard: Array<Array<NonNullable<unknown>>> = [[]];

        for (const [key, value] of Object.entries(CLUB_CONTACTS)) {
            inline_keyboard[inline_keyboard.length-1].push({text: value.name, callback_data: 'contacts-select-club-' + key})
            if (inline_keyboard[inline_keyboard.length-1].length > 1) {
                inline_keyboard.push([]);
            }
        }

        ctx.reply('📍 Выбери район, чтобы узнать адрес и контакты ближайшего клуба!\n' +
            '⏰ Работаем 24/7\n' +
            '📞 Общий номер: 8 (8422) 22-91-24', {
            reply_markup: {
                inline_keyboard: inline_keyboard
            },
        });

        return ctx.scene.leave();
    },

    async (ctx: any, done: any) => {
        return done();
    },
);