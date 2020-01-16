import React, { Component } from "react";
import WebView from "react-native-webview";
import { MessageConverter } from "./WebviewMessageHandler";
import { actions, messages } from "./constants";
import { Dimensions, Keyboard, Platform, StyleSheet, View } from "react-native";
import RichTextLinkModal from "./RichTextLinkModal";
const PlatformIOS = Platform.OS === "ios";
const pageSource = PlatformIOS ? require("./editor.html") : { uri: "file:///android_asset/editor.html" };
export default class RichTextEditor extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            selectionChangeListeners: [],
            onChange: [],
            showLinkDialog: false,
            linkInitialUrl: "",
            linkTitle: "",
            linkUrl: "",
            keyboardHeight: 0,
        };
        this.webViewRef = React.createRef();
        this._selectedTextChangeListeners = [];
        this.keyboardEventListeners = [];
        this._onKeyboardWillShow = (event) => {
            console.log("!!!!", event);
            const newKeyboardHeight = event.endCoordinates.height;
            if (this.state.keyboardHeight === newKeyboardHeight) {
                return;
            }
            if (newKeyboardHeight) {
                this.setEditorAvailableHeightBasedOnKeyboardHeight(newKeyboardHeight);
            }
            this.setState({ keyboardHeight: newKeyboardHeight });
        };
        this._onKeyboardWillHide = () => {
            this.setState({ keyboardHeight: 0 });
        };
        this.setEditorAvailableHeightBasedOnKeyboardHeight = (keyboardHeight) => {
            const { top = 0, bottom = 0 } = this.props.contentInset || {};
            const marginTop = parseInt(this.props?.style?.marginTop?.toString() || "0");
            const marginBottom = parseInt(this.props.style?.marginBottom?.toString() || "0");
            const spacing = marginTop + marginBottom + top + bottom;
            const editorAvailableHeight = Dimensions.get("window").height - keyboardHeight - spacing;
            this.setEditorHeight(editorAvailableHeight);
        };
        this.onMessage = (messageEvent) => {
            const { data } = messageEvent.nativeEvent;
            try {
                const message = JSON.parse(data);
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
                        this.props.placeholder && this.setPlaceholder(this.props.placeholder);
                        (this.props.onChange || this.props.onHeightChange) && this.enableOnChange();
                        this.props.onFocus && this.enableOnFocus();
                        this.props.onBlur && this.enableOnBlur();
                        this.props.onInitialized && this.props.onInitialized();
                        this.props.initialHTMLValue && this.setContentHTML(this.props.initialHTMLValue);
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
                        if (this.webViewRef.current) {
                            this.webViewRef.current.setNativeProps({ contentOffset: { y: message.data } });
                        }
                        break;
                    case messages.FOCUSED:
                        this.props.onFocus && this.props.onFocus();
                        break;
                    case messages.BLURRED:
                        this.props.onBlur && this.props.onBlur();
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
                        const height = message.data.height;
                        this.state?.onChange?.map(listener => listener(html));
                        if (this.props.onChange) {
                            this.props.onChange({ html, text });
                        }
                        if (this.props.onHeightChange) {
                            this.props.onHeightChange(height);
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
        };
        this.hideModal = () => {
            this.setState({
                showLinkDialog: false,
                linkInitialUrl: "",
                linkTitle: "",
                linkUrl: "",
            });
        };
        this.handleOnApply = (linkTitle, linkUrl) => {
            if (!this.state.linkInitialUrl) {
                this.insertLink(linkUrl, linkTitle);
            }
            else {
                this.updateLink(linkUrl, linkTitle);
            }
            this.hideModal();
        };
        this.sendAction = (action, data) => {
            const jsToBeExecutedOnPage = MessageConverter({ type: action, data });
            if (this.webViewRef.current) {
                this.webViewRef.current.injectJavaScript(jsToBeExecutedOnPage + ";true;");
            }
        };
        this.init = () => {
            this.sendAction(actions.init);
            this.setPlatform();
            if (this.props.footerHeight) {
                this.setFooterHeight();
            }
        };
        this.showLinkDialog = (optionalTitle = "", optionalUrl = "") => {
            this.setState({
                linkInitialUrl: optionalUrl,
                linkTitle: optionalTitle,
                linkUrl: optionalUrl,
                showLinkDialog: true,
            });
        };
        this.registerToolbar = (listener) => {
            this.setState({
                selectionChangeListeners: [...(this.state.selectionChangeListeners || []), listener],
            });
        };
        this.focus = () => this.sendAction(actions.focusContent);
        this.blur = () => this.sendAction(actions.blurContentEditor);
        this.enableOnChange = () => this.sendAction(actions.enableOnChange);
        this.enableOnFocus = () => this.sendAction(actions.enableOnFocus);
        this.enableOnBlur = () => this.sendAction(actions.enableOnBlur);
        this.setContentHTML = (html) => this.sendAction(actions.setContentHtml, html);
        this.setBold = () => this.sendAction(actions.setBold);
        this.setItalic = () => this.sendAction(actions.setItalic);
        this.setUnderline = () => this.sendAction(actions.setUnderline);
        this.heading1 = () => this.sendAction(actions.heading1);
        this.heading2 = () => this.sendAction(actions.heading2);
        this.heading3 = () => this.sendAction(actions.heading3);
        this.heading4 = () => this.sendAction(actions.heading4);
        this.heading5 = () => this.sendAction(actions.heading5);
        this.heading6 = () => this.sendAction(actions.heading6);
        this.setParagraph = () => this.sendAction(actions.setParagraph);
        this.removeFormat = () => this.sendAction(actions.removeFormat);
        this.alignLeft = () => this.sendAction(actions.alignLeft);
        this.alignCenter = () => this.sendAction(actions.alignCenter);
        this.alignRight = () => this.sendAction(actions.alignRight);
        this.alignFull = () => this.sendAction(actions.alignFull);
        this.insertBulletsList = () => this.sendAction(actions.insertBulletsList);
        this.insertOrderedList = () => this.sendAction(actions.insertOrderedList);
        this.insertLink = (url, title) => this.sendAction(actions.insertLink, { url, title });
        this.updateLink = (url, title) => this.sendAction(actions.updateLink, { url, title });
        this.insertImage = (attributes) => {
            this.sendAction(actions.insertImage, attributes);
            this.prepareInsert();
        };
        this.setSubscript = () => this.sendAction(actions.setSubscript);
        this.setSuperscript = () => this.sendAction(actions.setSuperscript);
        this.setStrikethrough = () => this.sendAction(actions.setStrikethrough);
        this.setHR = () => this.sendAction(actions.setHR);
        this.setIndent = () => this.sendAction(actions.setIndent);
        this.setOutdent = () => this.sendAction(actions.setOutdent);
        this.setBackgroundColor = (color) => this.sendAction(actions.setBackgroundColor, color);
        this.setTextColor = (color) => this.sendAction(actions.setTextColor, color);
        this.setPlaceholder = (placeholder) => this.sendAction(actions.setContentPlaceholder, placeholder);
        this.setCustomCSS = (css) => this.sendAction(actions.setCustomCSS, css);
        this.prepareInsert = () => this.sendAction(actions.prepareInsert);
        this.restoreSelection = () => this.sendAction(actions.restoreSelection);
        this.setEditorHeight = (height) => this.sendAction(actions.setEditorHeight, height);
        this.setFooterHeight = () => this.sendAction(actions.setFooterHeight, this.props.footerHeight);
        this.setPlatform = () => this.sendAction(actions.setPlatform, Platform.OS);
        this.getHtml = async () => {
            return new Promise((resolve, reject) => {
                this.contentResolve = resolve;
                this.contentReject = reject;
                this.sendAction(actions.getContentHtml);
                this.pendingContentHtml = setTimeout(() => {
                    if (this.contentReject) {
                        this.contentReject("timeout");
                    }
                }, 5000);
            });
        };
        this.getSelectedText = async () => {
            return new Promise((resolve, reject) => {
                this.selectedTextResolve = resolve;
                this.selectedTextReject = reject;
                this.sendAction(actions.getSelectedText);
                this.pendingSelectedText = setTimeout(() => {
                    if (this.selectedTextReject) {
                        this.selectedTextReject("timeout");
                    }
                }, 5000);
            });
        };
        this.addSelectedTextChangeListener = (listener) => this._selectedTextChangeListeners.push(listener);
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
    render() {
        return (<View style={styles.flex}>
        <WebView {...this.props} ref={this.webViewRef} keyboardDisplayRequiresUserAction={false} showsHorizontalScrollIndicator={false} onMessage={this.onMessage} source={pageSource} onLoad={this.init}/>
        <RichTextLinkModal visible={this.state.showLinkDialog} keyboardHeight={this.state.keyboardHeight} linkTitle={this.state.linkTitle} linkUrl={this.state.linkUrl} onApply={this.handleOnApply} onHideModal={this.hideModal} onRequestClose={this.hideModal}/>
      </View>);
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
