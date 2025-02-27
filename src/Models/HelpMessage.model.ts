import { Schema } from 'mongoose';

export interface IHelpMessage
{
    original_message_id: number,
    message_id: number,
    chat_id: number,
}

export const HelpMessageSchema = new Schema<IHelpMessage>
({
    original_message_id: { type: Number, required: false },
    message_id: { type: Number, required: false },
    chat_id: { type: Number, required: true },
});
