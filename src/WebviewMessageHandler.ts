import { actions, messages } from "./constants";

export type MessageConverterAction = { type: string; data: any };

export const MessageConverter = (action: MessageConverterAction) => {
  switch (action.type) {
    case `${actions.init}`:
      return "zss_editor.init();";
    case `${actions.setPlatform}`:
      return `zss_editor.setPlatform('${action.data}');`;
    case `${actions.enableOnChange}`:
      return "zss_editor.enableOnChange()";
    case `${actions.enableOnFocus}`:
      return "zss_editor.enableOnFocus()";
    case `${actions.enableOnBlur}`:
      return "zss_editor.enableOnBlur()";
    case `${actions.setContentHtml}`:
      return `zss_editor.setContentHTML('${escape(action.data)}');`;
    case `${actions.blurContentEditor}`:
      return `zss_editor.blurContentEditor();`;
    case `${actions.setBold}`:
      return `zss_editor.setBold();`;
    case `${actions.setItalic}`:
      return `zss_editor.setItalic();`;
    case `${actions.setUnderline}`:
      return `zss_editor.setUnderline();`;
    case `${actions.heading1}`:
      return `zss_editor.setHeading('h1');`;
    case `${actions.heading2}`:
      return `zss_editor.setHeading('h2');`;
    case `${actions.heading3}`:
      return `zss_editor.setHeading('h3');`;
    case `${actions.heading4}`:
      return `zss_editor.setHeading('h4');`;
    case `${actions.heading5}`:
      return `zss_editor.setHeading('h5');`;
    case `${actions.heading6}`:
      return `zss_editor.setHeading('h6');`;
    case `${actions.setParagraph}`:
      return `zss_editor.setParagraph();`;
    case `${actions.removeFormat}`:
      return `zss_editor.removeFormating();`;
    case `${actions.alignLeft}`:
      return `zss_editor.setJustifyLeft();`;
    case `${actions.alignCenter}`:
      return `zss_editor.setJustifyCenter();`;
    case `${actions.alignRight}`:
      return `zss_editor.setJustifyRight();`;
    case `${actions.alignFull}`:
      return `zss_editor.setJustifyFull();`;
    case `${actions.insertBulletsList}`:
      return `zss_editor.setUnorderedList();`;
    case `${actions.insertOrderedList}`:
      return `zss_editor.setOrderedList();`;
    case `${actions.insertLink}`:
      return `zss_editor.insertLink('${action.data.url}, ${action.data.title}');`;
    case `${actions.updateLink}`:
      return `zss_editor.updateLink('${action.data.url}, ${action.data.title}');`;
    case `${actions.insertImage}`:
      return `zss_editor.insertImage('${action.data}');`;
    case `${actions.setSubscript}`:
      return `zss_editor.setSubscript();`;
    case `${actions.setSuperscript}`:
      return `zss_editor.setSuperscript();`;
    case `${actions.setStrikethrough}`:
      return `zss_editor.setStrikeThrough();`;
    case `${actions.setHR}`:
      return `zss_editor.setHorizontalRule();`;
    case `${actions.setIndent}`:
      return `zss_editor.setIndent();`;
    case `${actions.setOutdent}`:
      return `zss_editor.setOutdent();`;
    case `${actions.setContentPlaceholder}`:
      return `zss_editor.setContentPlaceholder('${action.data}');`;
    case `${actions.focusContent}`:
      return `zss_editor.focusContent();`;
    case `${actions.prepareInsert}`:
      return `zss_editor.prepareInsert();`;
    case `${actions.restoreSelection}`:
      return `zss_editor.restorerange();`;
    case `${actions.setCustomCSS}`:
      return `zss_editor.setCustomCSS('${action.data}');`;
    case `${actions.setTextColor}`:
      return `zss_editor.setTextColor('${action.data}');`;
    case `${actions.setBackgroundColor}`:
      return `zss_editor.setBackgroundColor('${action.data}');`;
    case `${actions.setEditorHeight}`:
      return `zss_editor.setEditorHeight('${action.data}');`;
    case `${actions.setFooterHeight}`:
      return `zss_editor.setFooterHeight('${action.data}');`;
    case `${actions.setContentFocusHandler}`:
      return `zss_editor.setContentFocusHandler();`;
    case `${actions.getContentHtml}`:
      return `var html = zss_editor.getContentHTML();
      ReactNativeWebView.postMessage(JSON.stringify({type: '${messages.CONTENT_HTML_RESPONSE}', data: html}));`;
    case `${actions.getSelectedText}`:
      return `var selectedText = getSelection().toString();
      ReactNativeWebView.postMessage(JSON.stringify({type: '${messages.SELECTED_TEXT_RESPONSE}', data: selectedText}));`;
  }
};
