import React, { Component, RefObject } from "react";
import PropTypes from "prop-types";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { MessageConverter } from "./WebviewMessageHandler";
import { actions, messages } from "./constants";
import { Dimensions, EmitterSubscription, Keyboard, Platform, StyleSheet, View, ViewStyle } from "react-native";
import RichTextLinkModal from "./RichTextLinkModal";

const PlatformIOS = Platform.OS === "ios";
//in release build, external html files in Android can't be required, so they must be placed in the assets folder and accessed via uri
const pageSource = PlatformIOS ? require("./editor.html") : { uri: "file:///android_asset/editor.html" };

export type RichTextValue = {
  html: string;
  text: string;
};

type PropTypes = {
  initialHTMLValue?: string;
  placeholder?: string;
  onInitialized?: () => void;
  customCSS?: string;
  footerHeight?: number;
  contentInset?: { top?: number; bottom?: number };
  style?: ViewStyle;
  onChange?: (value: RichTextValue) => void;
  onHeightChange?: (height: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

type StateType = {
  selectionChangeListeners?: ((items: string[]) => void)[];
  onChange?: any[];
  showLinkDialog: boolean;
  linkInitialUrl?: string;
  linkTitle?: string;
  linkUrl?: string;
  keyboardHeight?: number;
};

export default class RichTextEditor extends Component<PropTypes, StateType> {
  static defaultProps = {
    contentInset: {},
  };

  state: StateType = {
    selectionChangeListeners: [],
    onChange: [],
    showLinkDialog: false,
    linkInitialUrl: "",
    linkTitle: "",
    linkUrl: "",
    keyboardHeight: 0,
  };

  webViewRef: RefObject<WebView> = React.createRef();

  _selectedTextChangeListeners: any = [];
  keyboardEventListeners: EmitterSubscription[] = [];

  componentDidMount() {
    if (PlatformIOS) {
      this.keyboardEventListeners = [
        Keyboard.addListener("keyboardWillShow", this._onKeyboardWillShow),
        Keyboard.addListener("keyboardWillHide", this._onKeyboardWillHide),
      ];
    } else {
      this.keyboardEventListeners = [
        Keyboard.addListener("keyboardDidShow", this._onKeyboardWillShow),
        Keyboard.addListener("keyboardDidHide", this._onKeyboardWillHide),
      ];
    }
  }

  componentWillUnmount() {
    this.keyboardEventListeners.forEach(eventListener => eventListener.remove());
  }

  _onKeyboardWillShow = (event: any) => {
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

  _onKeyboardWillHide = () => {
    this.setState({ keyboardHeight: 0 });
  };

  setEditorAvailableHeightBasedOnKeyboardHeight = (keyboardHeight: number) => {
    const { top = 0, bottom = 0 } = this.props.contentInset || {};
    const marginTop = parseInt(this.props?.style?.marginTop?.toString() || "0");
    const marginBottom = parseInt(this.props.style?.marginBottom?.toString() || "0");
    const spacing = marginTop + marginBottom + top + bottom;
    const editorAvailableHeight = Dimensions.get("window").height - keyboardHeight - spacing;
    this.setEditorHeight(editorAvailableHeight);
  };

  contentResolve?: (value?: unknown) => void;
  contentReject?: (reason?: any) => void;
  pendingContentHtml?: number;
  selectedTextResolve?: (value?: unknown) => void;
  selectedTextReject?: (reason?: any) => void;
  pendingSelectedText?: number;

  onMessage = (messageEvent: WebViewMessageEvent) => {
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
            // @ts-ignore
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
          const items: string[] = message.data.items;
          this.state.selectionChangeListeners?.map(listener => {
            listener(items);
          });
          break;
        }
        case messages.CONTENT_CHANGE: {
          const html: string = message.data.html;
          const text: string = message.data.text;
          const height: number = message.data.height;
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
          this._selectedTextChangeListeners.forEach((listener: any) => {
            listener(selectedText);
          });
          break;
        }
      }
    } catch (e) {
      //alert('NON JSON MESSAGE');
    }
  };

  hideModal = () => {
    this.setState({
      showLinkDialog: false,
      linkInitialUrl: "",
      linkTitle: "",
      linkUrl: "",
    });
  };

  handleOnApply = (linkTitle: string, linkUrl: string) => {
    if (!this.state.linkInitialUrl) {
      this.insertLink(linkUrl, linkTitle);
    } else {
      this.updateLink(linkUrl, linkTitle);
    }
    this.hideModal();
  };

  sendAction = (action: string, data?: any) => {
    const jsToBeExecutedOnPage = MessageConverter({ type: action, data });
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(jsToBeExecutedOnPage + ";true;");
    }
  };

  init = () => {
    this.sendAction(actions.init);
    this.setPlatform();
    if (this.props.footerHeight) {
      this.setFooterHeight();
    }
  };

  render() {
    return (
      <View style={styles.flex}>
        <WebView
          {...this.props}
          ref={this.webViewRef}
          keyboardDisplayRequiresUserAction={false}
          showsHorizontalScrollIndicator={false}
          onMessage={this.onMessage}
          source={pageSource}
          onLoad={this.init}
        />
        <RichTextLinkModal
          visible={this.state.showLinkDialog}
          keyboardHeight={this.state.keyboardHeight}
          linkTitle={this.state.linkTitle}
          linkUrl={this.state.linkUrl}
          onApply={this.handleOnApply}
          onHideModal={this.hideModal}
          onRequestClose={this.hideModal}
        />
      </View>
    );
  }

  // ======================================== Public API ========================================>

  showLinkDialog = (optionalTitle: string = "", optionalUrl: string = "") => {
    this.setState({
      linkInitialUrl: optionalUrl,
      linkTitle: optionalTitle,
      linkUrl: optionalUrl,
      showLinkDialog: true,
    });
  };

  registerToolbar = (listener: (items: string[]) => void) => {
    this.setState({
      selectionChangeListeners: [...(this.state.selectionChangeListeners || []), listener],
    });
  };

  focus = () => this.sendAction(actions.focusContent);
  blur = () => this.sendAction(actions.blurContentEditor);
  enableOnChange = () => this.sendAction(actions.enableOnChange);
  enableOnFocus = () => this.sendAction(actions.enableOnFocus);
  enableOnBlur = () => this.sendAction(actions.enableOnBlur);
  setContentHTML = (html: string) => this.sendAction(actions.setContentHtml, html);
  setBold = () => this.sendAction(actions.setBold);
  setItalic = () => this.sendAction(actions.setItalic);
  setUnderline = () => this.sendAction(actions.setUnderline);
  heading1 = () => this.sendAction(actions.heading1);
  heading2 = () => this.sendAction(actions.heading2);
  heading3 = () => this.sendAction(actions.heading3);
  heading4 = () => this.sendAction(actions.heading4);
  heading5 = () => this.sendAction(actions.heading5);
  heading6 = () => this.sendAction(actions.heading6);
  setParagraph = () => this.sendAction(actions.setParagraph);
  removeFormat = () => this.sendAction(actions.removeFormat);
  alignLeft = () => this.sendAction(actions.alignLeft);
  alignCenter = () => this.sendAction(actions.alignCenter);
  alignRight = () => this.sendAction(actions.alignRight);
  alignFull = () => this.sendAction(actions.alignFull);
  insertBulletsList = () => this.sendAction(actions.insertBulletsList);
  insertOrderedList = () => this.sendAction(actions.insertOrderedList);
  insertLink = (url?: string, title?: string) => this.sendAction(actions.insertLink, { url, title });
  updateLink = (url?: string, title?: string) => this.sendAction(actions.updateLink, { url, title });

  insertImage = (attributes: any) => {
    this.sendAction(actions.insertImage, attributes);
    this.prepareInsert(); //This must be called BEFORE insertImage. But WebViewBridge uses a stack :/
  };

  setSubscript = () => this.sendAction(actions.setSubscript);
  setSuperscript = () => this.sendAction(actions.setSuperscript);
  setStrikethrough = () => this.sendAction(actions.setStrikethrough);
  setHR = () => this.sendAction(actions.setHR);
  setIndent = () => this.sendAction(actions.setIndent);
  setOutdent = () => this.sendAction(actions.setOutdent);
  setBackgroundColor = (color: string) => this.sendAction(actions.setBackgroundColor, color);
  setTextColor = (color: string) => this.sendAction(actions.setTextColor, color);
  setPlaceholder = (placeholder?: string) => this.sendAction(actions.setContentPlaceholder, placeholder);
  setCustomCSS = (css: string) => this.sendAction(actions.setCustomCSS, css);
  prepareInsert = () => this.sendAction(actions.prepareInsert);
  restoreSelection = () => this.sendAction(actions.restoreSelection);
  setEditorHeight = (height: number) => this.sendAction(actions.setEditorHeight, height);
  setFooterHeight = () => this.sendAction(actions.setFooterHeight, this.props.footerHeight);
  setPlatform = () => this.sendAction(actions.setPlatform, Platform.OS);

  getHtml = async () => {
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

  getSelectedText = async () => {
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

  addSelectedTextChangeListener = (listener: any) => this._selectedTextChangeListeners.push(listener);
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
