import { Schema } from 'mongoose';

export interface IDailyBox
{
    chat_id: number,
    is_success: boolean,
    next_notified: boolean,
    code: string|undefined,
    box_id: string
}

export const DailyBoxSchema = new Schema<IDailyBox>
({
    chat_id: { type: Number, required: true },
    is_success: { type: Boolean, default: false },
    next_notified: { type: Boolean, default: false },
    code: { type: String, required: false },
    box_id: { type: String, required: true },
}, {
    timestamps: true,
});
