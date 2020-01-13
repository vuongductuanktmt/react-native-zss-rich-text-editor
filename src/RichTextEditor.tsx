import React, { Component } from "react";
import PropTypes from "prop-types";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { MessageConverter } from "./WebviewMessageHandler";
import { actions, messages } from "./constants";
import {
  Dimensions,
  EmitterSubscription,
  Keyboard,
  Modal,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const PlatformIOS = Platform.OS === "ios";

type PropTypes = {
  initialHTMLValue?: string;
  placeholder?: string;
  onInitialized?: () => {};
  customCSS?: string;
  footerHeight?: number;
  contentInset?: { top?: number; bottom?: number };
  style?: { marginTop?: number; marginBottom?: number };
  onChange?: (html: string, text: string) => {};
};

type StateType = {
  selectionChangeListeners?: any[];
  onChange?: any[];
  showLinkDialog?: boolean;
  linkInitialUrl?: string;
  linkTitle?: string;
  linkUrl?: string;
  keyboardHeight?: number;
};

export default class RichTextEditor<p> extends Component<PropTypes, StateType> {
  static defaultProps = {
    contentInset: {},
    style: {},
  };

  webViewRef: WebView | null = null;

  _selectedTextChangeListeners: any = [];
  keyboardEventListeners: EmitterSubscription[] = [];

  constructor(props: PropTypes) {
    super(props);
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

  _onKeyboardWillShow(event: any) {
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

  setEditorAvailableHeightBasedOnKeyboardHeight(keyboardHeight: number) {
    const { top = 0, bottom = 0 } = this.props.contentInset || {};
    const { marginTop = 0, marginBottom = 0 } = this.props.style || {};
    const spacing = marginTop + marginBottom + top + bottom;

    const editorAvailableHeight = Dimensions.get("window").height - keyboardHeight - spacing;
    this.setEditorHeight(editorAvailableHeight);
  }

  contentResolve?: any;
  contentReject?: any;
  pendingContentHtml?: number;
  selectedTextResolve?: any;
  selectedTextReject?: any;
  pendingSelectedText?: number;

  onMessage(message: WebViewMessageEvent) {
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
          if (this.props.customCSS) {
            this.setCustomCSS(this.props.customCSS);
          }
          this.setContentPlaceholder(this.props.placeholder);
          this.setContentHTML(this.props.initialHTMLValue || "");

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
            // @ts-ignore
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
          const html: string = message.data.html;
          const text: string = message.data.text;
          this.state?.onChange?.map(listener => listener(html));
          if (this.props.onChange) {
            this.props.onChange(html, text);
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
  }

  _renderLinkModal() {
    return (
      <Modal
        animationType={"fade"}
        transparent
        visible={this.state.showLinkDialog}
        onRequestClose={() => this.setState({ showLinkDialog: false })}
      >
        <View style={styles.modal}>
          <View style={[styles.innerModal, { marginBottom: PlatformIOS ? this.state.keyboardHeight : 0 }]}>
            <Text style={styles.inputTitle}>Title</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                onChangeText={text => this.setState({ linkTitle: text })}
                value={this.state.linkTitle}
              />
            </View>
            <Text style={[styles.inputTitle, { marginTop: 10 }]}>URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                onChangeText={text => this.setState({ linkUrl: text })}
                value={this.state.linkUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {PlatformIOS && <View style={styles.lineSeparator} />}
            {this._renderModalButtons()}
          </View>
        </View>
      </Modal>
    );
  }

  _hideModal() {
    this.setState({
      showLinkDialog: false,
      linkInitialUrl: "",
      linkTitle: "",
      linkUrl: "",
    });
  }

  _renderModalButtons() {
    const insertUpdateDisabled =
      (this.state?.linkTitle?.trim().length || 0) <= 0 || (this.state?.linkUrl?.trim().length || 0) <= 0;
    const containerPlatformStyle: ViewStyle[] = [
      { alignSelf: "stretch", flexDirection: "row" },
      PlatformIOS ? { justifyContent: "space-between" } : { paddingTop: 15 },
    ];
    const buttonPlatformStyle: ViewStyle = PlatformIOS ? { flex: 1, height: 45, justifyContent: "center" } : {};
    const cancelBtnTextStyle = [styles.button, { paddingRight: 10 }];
    const upsertBtnTextStyle = [styles.button, { opacity: insertUpdateDisabled ? 0.5 : 1 }];
    return (
      <View style={containerPlatformStyle}>
        {!PlatformIOS && <View style={styles.flex} />}
        <TouchableOpacity onPress={() => this._hideModal()} style={buttonPlatformStyle}>
          <Text style={cancelBtnTextStyle}>{this._upperCaseButtonTextIfNeeded("Cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (this._linkIsNew()) {
              this.insertLink(this.state.linkUrl, this.state.linkTitle);
            } else {
              this.updateLink(this.state.linkUrl, this.state.linkTitle);
            }
            this._hideModal();
          }}
          disabled={insertUpdateDisabled}
          style={buttonPlatformStyle}
        >
          <Text style={upsertBtnTextStyle}>
            {this._upperCaseButtonTextIfNeeded(this._linkIsNew() ? "Insert" : "Update")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  _linkIsNew() {
    return !this.state.linkInitialUrl;
  }

  _upperCaseButtonTextIfNeeded(buttonText: string) {
    return PlatformIOS ? buttonText : buttonText.toUpperCase();
  }

  render() {
    //in release build, external html files in Android can't be required, so they must be placed in the assets folder and accessed via uri
    const pageSource = PlatformIOS ? require("./editor.html") : { uri: "file:///android_asset/editor.html" };
    return (
      <View style={styles.flex}>
        <WebView
          {...this.props}
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
          ref={r => (this.webViewRef = r)}
          onMessage={message => this.onMessage(message)}
          // injectedJavaScript={injectScript}
          source={pageSource}
          onLoad={() => this.init()}
        />
        {this._renderLinkModal()}
      </View>
    );
  }

  escapeJSONString = function(value: string) {
    return value
      .replace(/[\\]/g, "\\\\")
      .replace(/[\"]/g, '\\"')
      .replace(/[\']/g, "\\'")
      .replace(/[\/]/g, "\\/")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      .replace(/[\n]/g, "\\n")
      .replace(/[\r]/g, "\\r")
      .replace(/[\t]/g, "\\t");
  };

  _sendAction(action: string, data?: any) {
    const jsToBeExecutedOnPage = MessageConverter({ type: action, data });
    if (this.webViewRef) {
      this.webViewRef.injectJavaScript(jsToBeExecutedOnPage + ";true;");
    }
  }

  //-------------------------------------------------------------------------------
  //--------------- Public API

  showLinkDialog(optionalTitle: string = "", optionalUrl: string = "") {
    this.setState({
      linkInitialUrl: optionalUrl,
      linkTitle: optionalTitle,
      linkUrl: optionalUrl,
      showLinkDialog: true,
    });
  }

  focusTitle() {
    this._sendAction(actions.focusTitle);
  }

  focusContent() {
    this._sendAction(actions.focusContent);
  }

  registerToolbar(listener: any) {
    this.setState({
      selectionChangeListeners: [...(this.state.selectionChangeListeners || []), listener],
    });
  }

  enableOnChange() {
    this._sendAction(actions.enableOnChange);
  }

  registerContentChangeListener(listener: any) {
    this.setState({
      onChange: [...(this.state.onChange || []), listener],
    });
  }

  setTitleHTML(html: string) {
    this._sendAction(actions.setTitleHtml, html);
  }
  hideTitle() {
    this._sendAction(actions.hideTitle);
  }
  showTitle() {
    this._sendAction(actions.showTitle);
  }
  toggleTitle() {
    this._sendAction(actions.toggleTitle);
  }
  setContentHTML(html: string) {
    this._sendAction(actions.setContentHtml, html);
  }

  blurTitleEditor() {
    this._sendAction(actions.blurTitleEditor);
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

  insertLink(url?: string, title?: string) {
    this._sendAction(actions.insertLink, { url, title });
  }

  updateLink(url?: string, title?: string) {
    this._sendAction(actions.updateLink, { url, title });
  }

  insertImage(attributes: any) {
    this._sendAction(actions.insertImage, attributes);
    this.prepareInsert(); //This must be called BEFORE insertImage. But WebViewBridge uses a stack :/
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

  setBackgroundColor(color: string) {
    this._sendAction(actions.setBackgroundColor, color);
  }

  setTextColor(color: string) {
    this._sendAction(actions.setTextColor, color);
  }

  setContentPlaceholder(placeholder?: string) {
    this._sendAction(actions.setContentPlaceholder, placeholder);
  }

  setCustomCSS(css: string) {
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

  setEditorHeight(height: number) {
    this._sendAction(actions.setEditorHeight, height);
  }

  setFooterHeight() {
    this._sendAction(actions.setFooterHeight, this.props.footerHeight);
  }

  setPlatform() {
    this._sendAction(actions.setPlatform, Platform.OS);
  }

  titleResolve?: any;
  titleReject?: any;
  pendingTitleHtml?: number;

  async getTitleHtml() {
    return new Promise((resolve, reject) => {
      this.titleResolve = resolve;
      this.titleReject = reject;
      this._sendAction(actions.getTitleHtml);

      this.pendingTitleHtml = setTimeout(() => {
        if (this.titleReject) {
          this.titleReject("timeout");
        }
      }, 5000);
    });
  }

  titleTextResolve?: any;
  titleTextReject?: any;
  pendingTitleText?: number;

  async getTitleText() {
    return new Promise((resolve, reject) => {
      this.titleTextResolve = resolve;
      this.titleTextReject = reject;
      this._sendAction(actions.getTitleText);

      this.pendingTitleText = setTimeout(() => {
        if (this.titleTextReject) {
          this.titleTextReject("timeout");
        }
      }, 5000);
    });
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

  titleFocusHandler?: any;

  setTitleFocusHandler(callbackHandler: any) {
    this.titleFocusHandler = callbackHandler;
    this._sendAction(actions.setTitleFocusHandler);
  }

  contentFocusHandler?: () => {} = undefined;

  setContentFocusHandler(callbackHandler: () => {}) {
    this.contentFocusHandler = callbackHandler;
    this._sendAction(actions.setContentFocusHandler);
  }

  addSelectedTextChangeListener(listener: any) {
    this._selectedTextChangeListeners.push(listener);
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  innerModal: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingTop: 20,
    paddingBottom: PlatformIOS ? 0 : 20,
    paddingLeft: 20,
    paddingRight: 20,
    alignSelf: "stretch",
    margin: 40,
    borderRadius: PlatformIOS ? 8 : 2,
  },
  button: {
    fontSize: 16,
    color: "#4a4a4a",
    textAlign: "center",
  },
  inputWrapper: {
    marginTop: 5,
    marginBottom: 10,
    borderBottomColor: "#4a4a4a",
    borderBottomWidth: PlatformIOS ? 1 / PixelRatio.get() : 0,
  },
  inputTitle: {
    color: "#4a4a4a",
  },
  input: {
    height: PlatformIOS ? 20 : 40,
    paddingTop: 0,
  },
  lineSeparator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: "#d5d5d5",
    marginLeft: -20,
    marginRight: -20,
    marginTop: 20,
  },
});
