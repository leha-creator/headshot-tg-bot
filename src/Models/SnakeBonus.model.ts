import {Schema} from 'mongoose';
import {Model} from "sequelize-typescript";

export interface ISnakeBonus {
    chat_id: number,
    bonusScore: number | boolean,
    score: number,
    is_bonus_accrued?: boolean | undefined,
}

export const SnakeBonusSchema = new Schema<ISnakeBonus, Model<ISnakeBonus>>
({
    chat_id: {type: Number, required: true},
    bonusScore: {type: Number, required: true},
    score: {type: Number, required: true},
    is_bonus_accrued: {type: Boolean, required: false, default: undefined},
}, {
    timestamps: true,
});
