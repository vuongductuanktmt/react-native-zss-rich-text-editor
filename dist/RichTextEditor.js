import React, { Component } from "react";
import WebView from "react-native-webview";
import { MessageConverter } from "./WebviewMessageHandler";
import { actions, messages } from "./constants";
import { Dimensions, Keyboard, Platform, StyleSheet, View } from "react-native";
import RichTextLinkModal from "./RichTextLinkModal";
const PlatformIOS = Platform.OS === "ios";
export default class RichTextEditor extends Component {
    constructor(props) {
        super(props);
        this.webViewRef = null;
        this._selectedTextChangeListeners = [];
        this.keyboardEventListeners = [];
        this.handleOnApply = (linkTitle, linkUrl) => {
            if (!this.state.linkInitialUrl) {
                this.insertLink(linkUrl, linkTitle);
            }
            else {
                this.updateLink(linkUrl, linkTitle);
            }
            this._hideModal();
        };
        this.contentFocusHandler = undefined;
        this._sendAction = this._sendAction.bind(this);
        this.registerToolbar = this.registerToolbar.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this._onKeyboardWillShow = this._onKeyboardWillShow.bind(this);
        this._onKeyboardWillHide = this._onKeyboardWillHide.bind(this);
        this.state = {
            selectionChangeListeners: [],
            onChange: [],
            showLinkDialog: false,
            linkInitialUrl: "",
            linkTitle: "",
            linkUrl: "",
            keyboardHeight: 0,
        };
        this._selectedTextChangeListeners = [];
    }
    componentDidMount() {
        if (PlatformIOS) {
            this.keyboardEventListeners = [
                Keyboard.addListener("keyboardWillShow", this._onKeyboardWillShow),
                Keyboard.addListener("keyboardWillHide", this._onKeyboardWillHide),
            ];
        }
        else {
            this.keyboardEventListeners = [
                Keyboard.addListener("keyboardDidShow", this._onKeyboardWillShow),
                Keyboard.addListener("keyboardDidHide", this._onKeyboardWillHide),
            ];
        }
    }
    componentWillUnmount() {
        this.keyboardEventListeners.forEach(eventListener => eventListener.remove());
    }
    _onKeyboardWillShow(event) {
        console.log("!!!!", event);
        const newKeyboardHeight = event.endCoordinates.height;
        if (this.state.keyboardHeight === newKeyboardHeight) {
            return;
        }
        if (newKeyboardHeight) {
            this.setEditorAvailableHeightBasedOnKeyboardHeight(newKeyboardHeight);
        }
        this.setState({ keyboardHeight: newKeyboardHeight });
    }
    _onKeyboardWillHide() {
        this.setState({ keyboardHeight: 0 });
    }
    setEditorAvailableHeightBasedOnKeyboardHeight(keyboardHeight) {
        const { top = 0, bottom = 0 } = this.props.contentInset || {};
        const marginTop = parseInt(this.props?.style?.marginTop?.toString() || "0");
        const marginBottom = parseInt(this.props.style?.marginBottom?.toString() || "0");
        const spacing = marginTop + marginBottom + top + bottom;
        const editorAvailableHeight = Dimensions.get("window").height - keyboardHeight - spacing;
        this.setEditorHeight(editorAvailableHeight);
    }
    onMessage(message) {
        const { nativeEvent } = message;
        const { data: str } = nativeEvent;
        try {
            const message = JSON.parse(str);
            switch (message.type) {
                case messages.CONTENT_HTML_RESPONSE:
                    if (this.contentResolve) {
                        this.contentResolve(message.data);
                        this.contentResolve = undefined;
                        this.contentReject = undefined;
                        if (this.pendingContentHtml) {
                            clearTimeout(this.pendingContentHtml);
                            this.pendingContentHtml = undefined;
                        }
                    }
                    break;
                case messages.SELECTED_TEXT_RESPONSE:
                    if (this.selectedTextResolve) {
                        this.selectedTextResolve(message.data);
                        this.selectedTextResolve = undefined;
                        this.selectedTextReject = undefined;
                        if (this.pendingSelectedText) {
                            clearTimeout(this.pendingSelectedText);
                            this.pendingSelectedText = undefined;
                        }
                    }
                    break;
                case messages.ZSS_INITIALIZED:
                    this.props.customCSS && this.setCustomCSS(this.props.customCSS);
                    this.props.placeholder && this.setContentPlaceholder(this.props.placeholder);
                    this.props.initialHTMLValue && this.setContentHTML(this.props.initialHTMLValue);
                    this.props.onChange && this.enableOnChange();
                    this.props.onInitialized && this.props.onInitialized();
                    break;
                case messages.LINK_TOUCHED:
                    this.prepareInsert();
                    const { title, url } = message.data;
                    this.showLinkDialog(title, url);
                    break;
                case messages.LOG:
                    console.log("FROM ZSS", message.data);
                    break;
                case messages.SCROLL:
                    if (this.webViewRef) {
                        this.webViewRef.setNativeProps({ contentOffset: { y: message.data } });
                    }
                    break;
                case messages.CONTENT_FOCUSED:
                    this.contentFocusHandler && this.contentFocusHandler();
                    break;
                case messages.SELECTION_CHANGE: {
                    const items = message.data.items;
                    this.state.selectionChangeListeners?.map(listener => {
                        listener(items);
                    });
                    break;
                }
                case messages.CONTENT_CHANGE: {
                    const html = message.data.html;
                    const text = message.data.text;
                    this.state?.onChange?.map(listener => listener(html));
                    if (this.props.onChange) {
                        this.props.onChange(html, text);
                    }
                    break;
                }
                case messages.SELECTED_TEXT_CHANGED: {
                    const selectedText = message.data;
                    this._selectedTextChangeListeners.forEach((listener) => {
                        listener(selectedText);
                    });
                    break;
                }
            }
        }
        catch (e) {
        }
    }
    _hideModal() {
        this.setState({
            showLinkDialog: false,
            linkInitialUrl: "",
            linkTitle: "",
            linkUrl: "",
        });
    }
    render() {
        const pageSource = PlatformIOS ? require("./editor.html") : { uri: "file:///android_asset/editor.html" };
        return (<View style={styles.flex}>
        <WebView {...this.props} hideKeyboardAccessoryView={true} keyboardDisplayRequiresUserAction={false} ref={r => (this.webViewRef = r)} onMessage={message => this.onMessage(message)} source={pageSource} onLoad={() => this.init()}/>
        <RichTextLinkModal visible={this.state.showLinkDialog} keyboardHeight={this.state.keyboardHeight} linkTitle={this.state.linkTitle} linkUrl={this.state.linkUrl} onApply={this.handleOnApply} onHideModal={this._hideModal} onRequestClose={this._hideModal}/>
      </View>);
    }
    _sendAction(action, data) {
        const jsToBeExecutedOnPage = MessageConverter({ type: action, data });
        if (this.webViewRef) {
            this.webViewRef.injectJavaScript(jsToBeExecutedOnPage + ";true;");
        }
    }
    showLinkDialog(optionalTitle = "", optionalUrl = "") {
        this.setState({
            linkInitialUrl: optionalUrl,
            linkTitle: optionalTitle,
            linkUrl: optionalUrl,
            showLinkDialog: true,
        });
    }
    focusContent() {
        this._sendAction(actions.focusContent);
    }
    registerToolbar(listener) {
        this.setState({
            selectionChangeListeners: [...(this.state.selectionChangeListeners || []), listener],
        });
    }
    enableOnChange() {
        this._sendAction(actions.enableOnChange);
    }
    registerContentChangeListener(listener) {
        this.setState({
            onChange: [...(this.state.onChange || []), listener],
        });
    }
    setContentHTML(html) {
        this._sendAction(actions.setContentHtml, html);
    }
    blurContentEditor() {
        this._sendAction(actions.blurContentEditor);
    }
    setBold() {
        this._sendAction(actions.setBold);
    }
    setItalic() {
        this._sendAction(actions.setItalic);
    }
    setUnderline() {
        this._sendAction(actions.setUnderline);
    }
    heading1() {
        this._sendAction(actions.heading1);
    }
    heading2() {
        this._sendAction(actions.heading2);
    }
    heading3() {
        this._sendAction(actions.heading3);
    }
    heading4() {
        this._sendAction(actions.heading4);
    }
    heading5() {
        this._sendAction(actions.heading5);
    }
    heading6() {
        this._sendAction(actions.heading6);
    }
    setParagraph() {
        this._sendAction(actions.setParagraph);
    }
    removeFormat() {
        this._sendAction(actions.removeFormat);
    }
    alignLeft() {
        this._sendAction(actions.alignLeft);
    }
    alignCenter() {
        this._sendAction(actions.alignCenter);
    }
    alignRight() {
        this._sendAction(actions.alignRight);
    }
    alignFull() {
        this._sendAction(actions.alignFull);
    }
    insertBulletsList() {
        this._sendAction(actions.insertBulletsList);
    }
    insertOrderedList() {
        this._sendAction(actions.insertOrderedList);
    }
    insertLink(url, title) {
        this._sendAction(actions.insertLink, { url, title });
    }
    updateLink(url, title) {
        this._sendAction(actions.updateLink, { url, title });
    }
    insertImage(attributes) {
        this._sendAction(actions.insertImage, attributes);
        this.prepareInsert();
    }
    setSubscript() {
        this._sendAction(actions.setSubscript);
    }
    setSuperscript() {
        this._sendAction(actions.setSuperscript);
    }
    setStrikethrough() {
        this._sendAction(actions.setStrikethrough);
    }
    setHR() {
        this._sendAction(actions.setHR);
    }
    setIndent() {
        this._sendAction(actions.setIndent);
    }
    setOutdent() {
        this._sendAction(actions.setOutdent);
    }
    setBackgroundColor(color) {
        this._sendAction(actions.setBackgroundColor, color);
    }
    setTextColor(color) {
        this._sendAction(actions.setTextColor, color);
    }
    setContentPlaceholder(placeholder) {
        this._sendAction(actions.setContentPlaceholder, placeholder);
    }
    setCustomCSS(css) {
        this._sendAction(actions.setCustomCSS, css);
    }
    prepareInsert() {
        this._sendAction(actions.prepareInsert);
    }
    restoreSelection() {
        this._sendAction(actions.restoreSelection);
    }
    init() {
        this._sendAction(actions.init);
        this.setPlatform();
        if (this.props.footerHeight) {
            this.setFooterHeight();
        }
    }
    setEditorHeight(height) {
        this._sendAction(actions.setEditorHeight, height);
    }
    setFooterHeight() {
        this._sendAction(actions.setFooterHeight, this.props.footerHeight);
    }
    setPlatform() {
        this._sendAction(actions.setPlatform, Platform.OS);
    }
    async getContentHtml() {
        return new Promise((resolve, reject) => {
            this.contentResolve = resolve;
            this.contentReject = reject;
            this._sendAction(actions.getContentHtml);
            this.pendingContentHtml = setTimeout(() => {
                if (this.contentReject) {
                    this.contentReject("timeout");
                }
            }, 5000);
        });
    }
    async getSelectedText() {
        return new Promise((resolve, reject) => {
            this.selectedTextResolve = resolve;
            this.selectedTextReject = reject;
            this._sendAction(actions.getSelectedText);
            this.pendingSelectedText = setTimeout(() => {
                if (this.selectedTextReject) {
                    this.selectedTextReject("timeout");
                }
            }, 5000);
        });
    }
    setContentFocusHandler(callbackHandler) {
        this.contentFocusHandler = callbackHandler;
        this._sendAction(actions.setContentFocusHandler);
    }
    addSelectedTextChangeListener(listener) {
        this._selectedTextChangeListeners.push(listener);
    }
}
RichTextEditor.defaultProps = {
    contentInset: {},
};
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
