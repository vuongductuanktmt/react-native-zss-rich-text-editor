import { Component, RefObject } from "react";
import PropTypes from "prop-types";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { EmitterSubscription, ViewStyle } from "react-native";
export declare type RichTextValue = {
    html: string;
    text: string;
};
declare type PropTypes = {
    initialHTMLValue?: string;
    placeholder?: string;
    onInitialized?: () => void;
    customCSS?: string;
    footerHeight?: number;
    contentInset?: {
        top?: number;
        bottom?: number;
    };
    style?: ViewStyle;
    onChange?: (value: RichTextValue) => void;
    onHeightChange?: (height: number) => void;
    onFocus?: () => void;
    onBlur?: () => void;
};
declare type StateType = {
    selectionChangeListeners?: ((items: string[]) => void)[];
    onChange?: any[];
    showLinkDialog: boolean;
    linkInitialUrl?: string;
    linkTitle?: string;
    linkUrl?: string;
    keyboardHeight?: number;
};
export default class RichTextEditor extends Component<PropTypes, StateType> {
    static defaultProps: {
        contentInset: {};
    };
    state: StateType;
    webViewRef: RefObject<WebView>;
    _selectedTextChangeListeners: any;
    keyboardEventListeners: EmitterSubscription[];
    componentDidMount(): void;
    componentWillUnmount(): void;
    _onKeyboardWillShow: (event: any) => void;
    _onKeyboardWillHide: () => void;
    setEditorAvailableHeightBasedOnKeyboardHeight: (keyboardHeight: number) => void;
    contentResolve?: (value?: unknown) => void;
    contentReject?: (reason?: any) => void;
    pendingContentHtml?: number;
    selectedTextResolve?: (value?: unknown) => void;
    selectedTextReject?: (reason?: any) => void;
    pendingSelectedText?: number;
    onMessage: (messageEvent: WebViewMessageEvent) => void;
    hideModal: () => void;
    handleOnApply: (linkTitle: string, linkUrl: string) => void;
    sendAction: (action: string, data?: any) => void;
    init: () => void;
    render(): JSX.Element;
    showLinkDialog: (optionalTitle?: string, optionalUrl?: string) => void;
    registerToolbar: (listener: (items: string[]) => void) => void;
    focus: () => void;
    blur: () => void;
    enableOnChange: () => void;
    enableOnFocus: () => void;
    enableOnBlur: () => void;
    setContentHTML: (html: string) => void;
    setBold: () => void;
    setItalic: () => void;
    setUnderline: () => void;
    heading1: () => void;
    heading2: () => void;
    heading3: () => void;
    heading4: () => void;
    heading5: () => void;
    heading6: () => void;
    setParagraph: () => void;
    removeFormat: () => void;
    alignLeft: () => void;
    alignCenter: () => void;
    alignRight: () => void;
    alignFull: () => void;
    insertBulletsList: () => void;
    insertOrderedList: () => void;
    insertLink: (url?: string | undefined, title?: string | undefined) => void;
    updateLink: (url?: string | undefined, title?: string | undefined) => void;
    insertImage: (attributes: any) => void;
    setSubscript: () => void;
    setSuperscript: () => void;
    setStrikethrough: () => void;
    setHR: () => void;
    setIndent: () => void;
    setOutdent: () => void;
    setBackgroundColor: (color: string) => void;
    setTextColor: (color: string) => void;
    setPlaceholder: (placeholder?: string | undefined) => void;
    setCustomCSS: (css: string) => void;
    prepareInsert: () => void;
    restoreSelection: () => void;
    setEditorHeight: (height: number) => void;
    setFooterHeight: () => void;
    setPlatform: () => void;
    getHtml: () => Promise<unknown>;
    getSelectedText: () => Promise<unknown>;
    addSelectedTextChangeListener: (listener: any) => any;
}
export {};
