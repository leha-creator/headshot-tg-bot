import {composeWizardScene} from "../helpers/scene.servise";

export const CLUBS = {
    1: {
        name: 'Ливанова',
        price_url: 'https://static.tildacdn.com/tild3564-6233-4432-a432-303331366132/_____1112.jpg',
    },
    2: {
        name: 'Гончарова',
        price_url: 'https://static.tildacdn.com/tild3635-3264-4863-a236-376633623063/____1112.jpg',
    },
    3: {
        name: 'Рябикова',
        price_url: 'https://static.tildacdn.com/tild3635-3264-4863-a236-376633623063/____1112.jpg',
    },
    4: {
        name: '40 летия победы',
        price_url: 'https://static.tildacdn.com/tild3564-6233-4432-a432-303331366132/_____1112.jpg',
    },
    5: {
        name: 'Димитровград Ленина',
        price_url: 'https://static.tildacdn.com/tild6365-3462-4361-a130-386663373063/___1112.jpg',
    }
}

export const priceScene = composeWizardScene(
    async (ctx: any, next: any) => {
        ctx.wizard.state.address = null;
        const inline_keyboard: Array<Array<NonNullable<unknown>>> = [[]];

        for (const [key, value] of Object.entries(CLUBS)) {
            inline_keyboard[inline_keyboard.length-1].push({text: value.name, callback_data: 'price-select-club-' + key})
            if (inline_keyboard[inline_keyboard.length-1].length > 1) {
                inline_keyboard.push([]);
            }
        }

        ctx.reply('Выберите клуб, по которому хотели бы узнать прайс', {
            reply_markup: {
                inline_keyboard: inline_keyboard
            },
        });

        return ctx.wizard.next();
    },

    async (ctx: any, done: any) => {
        return done();
    },
);