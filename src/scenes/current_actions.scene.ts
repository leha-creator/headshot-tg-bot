import {composeWizardScene} from "../helpers/scene.servise";

export const ACTIONS = {
    1: {
        name: '🎂 День рождения',
        price_url: 'https://static.tildacdn.com/tild3534-6162-4133-a132-353962653238/IMG_20250410_120347_.jpg',
    },
    2: {
        name: '👫 Приведи друга',
        price_url: 'https://static.tildacdn.com/tild3934-3236-4531-b134-383535323936/---1_1.jpg',
    },
    3: {
        name: '🎰 Испытай удачу',
        price_url: 'https://static.tildacdn.com/tild3066-3739-4436-b063-396638626637/IMG_20250410_120359_.jpg',
    },
    4: {
        name: '🆕 Новым клиентам',
        price_url: 'https://static.tildacdn.com/tild6561-3665-4863-b630-303537363066/IMG_20250410_120415_.jpg',
    },
    5: {
        name: '🚕 Бонусы за Такси',
        price_url: 'https://static.tildacdn.com/tild3664-6130-4262-b630-633563656264/IMG_20250410_120409_.jpg',
    },
    6: {
        name: '📝 Бонусы за отзыв',
        price_url: 'https://static.tildacdn.com/tild3631-3231-4434-a436-313465616437/IMG_20250410_120405_.jpg',
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

        ctx.reply('Выбери акцию, чтобы узнать подробности:', {
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