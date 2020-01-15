import React from "react";
declare type PropTypes = {
    linkTitle?: string;
    linkUrl?: string;
    visible: boolean;
    onRequestClose?: () => void;
    keyboardHeight?: number;
    onHideModal?: () => void;
    onApply?: (title: string, url: string) => void;
};
declare const RichTextLinkModal: React.NamedExoticComponent<PropTypes>;
export default RichTextLinkModal;
