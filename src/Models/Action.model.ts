import { Schema } from 'mongoose';

export interface IAction
{
    message_id: number,
    balance: number,
    chat_id: number,
    is_processed: boolean|undefined,
    is_bonus_accrued: boolean|undefined,
    action_code: string
}

export const ActionSchema = new Schema<IAction>
({
    message_id: { type: Number, required: false },
    balance: { type: Number, required: false },
    chat_id: { type: Number, required: true },
    is_processed: { type: Boolean, required: false, default: false },
    is_bonus_accrued: { type: Boolean, required: false, default: false },
    action_code: { type: String, required: true },
}, {
    timestamps: true,
});
