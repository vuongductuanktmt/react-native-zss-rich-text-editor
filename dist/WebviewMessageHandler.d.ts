export declare type MessageConverterAction = {
    type: string;
    data: any;
};
export declare const MessageConverter: (action: MessageConverterAction) => string | undefined;
