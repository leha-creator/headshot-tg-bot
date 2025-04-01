import { Schema } from 'mongoose';

export interface IMessage
{
    message_id: number,
    balance: number,
    chat_id: number,
    referral_chat_id: number|undefined,
    is_processed: boolean|undefined,
    is_bonus_accrued: boolean|undefined,
    is_referral_message: boolean|undefined,
}

export const MessageSchema = new Schema<IMessage>
({
    message_id: { type: Number, required: false },
    chat_id: { type: Number, required: true },
    referral_chat_id: { type: Number, required: false },
    balance: { type: Number, required: false },
    is_processed: { type: Boolean, required: false, default: false },
    is_bonus_accrued: { type: Boolean, required: false, default: false },
    is_referral_message: { type: Boolean, required: false, default: false },
}, {
    timestamps: true,
});
