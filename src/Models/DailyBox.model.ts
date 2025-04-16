import { Schema } from 'mongoose';

export interface IDailyBox
{
    chat_id: number,
    is_success: boolean,
    is_bonus_accrued: boolean
    next_notified: boolean,
    code: number|string|undefined,
    box_id: string
}

export const DailyBoxSchema = new Schema<IDailyBox>
({
    chat_id: { type: Number, required: true },
    is_success: { type: Boolean, default: false },
    is_bonus_accrued: { type: Boolean, default: false },
    next_notified: { type: Boolean, default: false },
    code: { type: Number, required: false },
    box_id: { type: String, required: true },
}, {
    timestamps: true,
});