import {composeWizardScene} from "../helpers/scene.servise";

export const ACTIONS = {
    1: {
        name: 'День рождения',
        price_url: 'https://static.tildacdn.com/tild3433-6365-4533-a664-643237333436/__2.jpg',
    },
    2: {
        name: 'Приведи друга',
        price_url: 'https://static.tildacdn.com/tild3564-6564-4336-a630-626237383135/_-.jpg',
    },
    3: {
        name: 'Испытай удачу',
        price_url: 'https://static.tildacdn.com/tild3430-3963-4138-b761-366536623861/_2.jpg',
    },
    4: {
        name: 'Новым клиентам',
        price_url: 'https://static.tildacdn.com/tild3736-3335-4536-b930-333961356338/_.jpg',
    },
    5: {
        name: 'Бонусы за такси',
        price_url: 'https://static.tildacdn.com/tild6432-3965-4631-b561-343235343030/photo_2024-12-14_113.jpeg',
    },
    6: {
        name: 'Бонусы за отзыв',
        price_url: 'https://static.tildacdn.com/tild6435-6662-4161-a138-356464343962/IMG_6615.jpeg',
    }
}


export const currentActionsScene = composeWizardScene(
    async (ctx: any, next: any) => {
        ctx.wizard.state.address = null;
        const inline_keyboard: Array<Array<NonNullable<unknown>>> = [[]];

        for (const [key, value] of Object.entries(ACTIONS)) {
            inline_keyboard[inline_keyboard.length-1].push({text: value.name, callback_data: 'action-select-' + key})
            if (inline_keyboard[inline_keyboard.length-1].length > 1) {
                inline_keyboard.push([]);
            }
        }

        ctx.reply('Выберите акцию, по которому хотели бы узнать подробнее', {
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