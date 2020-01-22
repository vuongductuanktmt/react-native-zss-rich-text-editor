# React Native Rich Text Editor with react-native-webview

> - Visit [forked repo from jb-](https://github.com/jb-/react-native-zss-rich-text-editor)
> - Visit [original repo](https://github.com/wix/react-native-zss-rich-text-editor) 

## Inspirations

The original repo implemented RTE came with a title and a description without the possibility to remote one or the other. My need was to only implement a multiple line text input with WYSIWYG enabled. The other aspect was also to add a property onChange to the component in spirit of the other react native component. 

## What I did
- The RTE is now converted into typescript.
- New property onChange. That return the the html and text value.
- Remove the title. Now it is only one RTE

## Setup and run the examples
```
$ cd example
$ yarn
$ cd ios
$ pod install
$ cd ..
$ react-native run-ios
```

## Installation

* `$ yarn add https://github.com/boreal-is/react-native-zss-rich-text-editor`
* `$ yarn add react-native-webview` (I'm not sure why I have to do this. But if you use this library in your project, you have an error about duplicate view declaration.)
* `$ cd ios; pod install;`

On Android, add the following to the end of your `android/app/build.gradle`
```
project.afterEvaluate {
    apply from: '../../node_modules/react-native-zss-rich-text-editor/htmlCopy.gradle';
    copyEditorHtmlToAppAssets(file('../../node_modules/react-native-zss-rich-text-editor'))
}
```
In release build, external html files in Android can't be required, so they must be placed in the assets folder and accessed via uri

## Usage

## `RichTextEditor`

The editor component. Simply place this component in your view hierarchy to receive a fully functional Rich text Editor.

`RichTextEditor` takes the following optional props:

* `initialHTMLValue`
    
    HTML that will be rendered in the content section on load.
    
* `placeholder`

    Text that will be used as a placeholder when no text is present in the content section.

* `customCSS`

    Any custom CSS styles that you want to inject to the editor.

* `style`

    The style of the view wraped around the web view component
    
* `onInitialized`

    Function called when the rich text is initialised

* `onChange`

    The function called once the content of the rich text append.
    
    `value : { html: string, text: string }`
    ```javascript
    handleOnChange = (value) => this.setState(value);
  
    render () {
        return (
          <RichTextEditor
            initialHTMLValue={this.props.value?.html}
            onChange={this.handleOnChange}
          />
        )
    }
    ```

* `onHeightChange`
    
    This function is called once the height of the web view has changed
    
     `value : { html: string, text: string }`
        
     ```javascript
        handleHeightChange = (height: number) => this.setState({ height });
      
        render () {
            return (
              <View style={{ height : this.state.height }}>
                <RichTextEditor
                  initialHTMLValue={this.props.value?.html}
                  onHeightChange={this.handleHeightChange}
                />
              </View>
            )
        }
     ```
    
* `onFocus`

    This function is called once the rich text is focused

* `onBlur`

    This function is called once the rich text is blurred


`RichTextEditor` also has methods that can be used on its `ref` to  set styling at the current selection or cursor position:

* `showLinkDialog = (optionalTitle: string = "", optionalUrl: string = "") => {}`
* `registerToolbar = (listener: (items: string[]) => void) => {}`
* `focus`
* `blur`
* `enableOnChange`
* `enableOnFocus`
* `enableOnBlur`
* `setContentHTML`
* `setBold`
* `setItalic`
* `setUnderline`
* `heading1`
* `heading2`
* `heading3`
* `heading4`
* `heading5`
* `heading6`
* `setParagraph`
* `removeFormat`
* `alignLeft`
* `alignCenter`
* `alignRight`
* `alignFull`
* `insertBulletsList`
* `insertOrderedList`
* `insertLink = (url?: string, title?: string) => this.sendAction(actions.insertLink, { url, title }) => {}`
* `updateLink = (url?: string, title?: string) => this.sendAction(actions.insertLink, { url, title }) => {}`
* `insertImage = (attributes) => {}`
* `setSubscript`
* `setSuperscript`
* `setStrikethrough`
* `setHR`
* `setIndent`
* `setOutdent`
* `setBackgroundColor = (color: string) => {}`
* `setTextColor = (color: string) => {}`
* `setPlaceholder = (placeholder?: string) => {}`
* `setCustomCSS = (css: string) => {}`
* `prepareInsert`
* `restoreSelection`
* `setEditorHeight = (height: number) => {}`
* `setFooterHeight`
* `setPlatform`
* `getHtml`
* `getSelectedText`
* `addSelectedTextChangeListener = (listener) => {}`

### Example Usage:

```javascript
<View>
   <RichTextEditor
      initialHTMLValue={"Title!!"}
    />
  <View style={ {height: this.state.height} }>
    <RichTextEditor
      initialHTMLValue={"<p>Hello <strong>World</strong></p><p>this is a new paragraph</p><p>this is another new paragraph</p>"}
      onHeightChange={(height) => this.setState({height})}
    />
  </View>
</View>
```

![RichTextEditor](readme/editor.png)

## `RichTextToolbar`

This is a Component that provides a toolbar for easily controlling an editor. It is designed to be used together with a `RichTextEditor` component.

The `RichTextToolbar` has one required property: 

* `getEditor()`

Which must provide a **function** that returns a `ref` to a `RichTextEditor` component. 

This is because the `ref` is not created until after the first render, before which the toolbar is rendered. This means that any `ref` passed directly will inevitably be passed as `undefined`.

Other props supported by the `RichTextToolbar` component are:

* `actions`

	An `array` of `actions` to be provided by this toolbar. The default actions are: 
	* `actions.insertImage`
  	* `actions.setBold`
  	* `actions.setItalic`
  	* `actions.insertBulletsList`
  	* `actions.insertOrderedList`
  	* `actions.insertLink`
 
* `onPressAddLink`
* `onPressAddImage`

	Functions called when the `addLink` or `addImage `actions are tapped. 
	
* `selectedButtonStyle`
* `iconTint`
* `selectedIconTint`
* `unselectedButtonStyle`

	These provide options for styling action buttons.

* `renderAction`

	Altenatively, you can provide a render function that will be used instead of the default, so you can fully control the tollbar design.
	
	
* `iconMap` 

	`RichTextToolbar` comes with default icons for the default actions it renders. To override those, or to add icons for non-default actions, provide them in a dictionary to this prop.
	

### Example Usage:

```javascript
<RichTextToolbar
	getEditor={() => this.richtext}
/>
```

![RichTextEditor](readme/toolbar.png)

![RichTextEditor](readme/toolbar_selected.png)


## `actions`

This is a set of consts of all supported actions. These will be passed in arrays to all callbacks registered with the editor using  the `registerToolbar()` method.

	{
      enableOnChange: "ENABLE_ON_CHANGE",
      enableOnFocus: "ENABLE_ON_FOCUS",
      enableOnBlur: "ENABLE_ON_BLUR",
      setTitleHtml: "SET_TITLE_HTML",
      setContentHtml: "SET_CONTENT_HTML",
      getTitleHtml: "GET_TITLE_HTML",
      getTitleText: "GET_TITLE_TEXT",
      toggleTitle: "TOGGLE_TITLE",
      hideTitle: "HIDE_TITLE",
      showTitle: "SHOW_TITLE",
      getContentHtml: "GET_CONTENT_HTML",
      getSelectedText: "GET_SELECTED_TEXT",
      blurTitleEditor: "BLUR_TITLE_EDITOR",
      blurContentEditor: "BLUR_CONTENT_EDITOR",
      focusTitle: "FOCUS_TITLE",
      focusContent: "FOCUS_CONTENT",
    
      setBold: "bold",
      setItalic: "italic",
      setUnderline: "underline",
      heading1: "h1",
      heading2: "h2",
      heading3: "h3",
      heading4: "h4",
      heading5: "h5",
      heading6: "h6",
      setParagraph: "SET_PARAGRAPH",
      removeFormat: "REMOVE_FORMAT",
      alignLeft: "justifyLeft",
      alignCenter: "justifyCenter",
      alignRight: "justifyRight",
      alignFull: "justifyFull",
      insertBulletsList: "unorderedList",
      insertOrderedList: "orderedList",
      insertLink: "INST_LINK",
      updateLink: "UPDATE_LINK",
      insertImage: "INST_IMAGE",
      setSubscript: "subscript",
      setSuperscript: "superscript",
      setStrikethrough: "strikeThrough",
      setHR: "horizontalRule",
      setIndent: "indent",
      setOutdent: "outdent",
      setTitlePlaceholder: "SET_TITLE_PLACEHOLDER",
      setContentPlaceholder: "SET_CONTENT_PLACEHOLDER",
      setTitleFocusHandler: "SET_TITLE_FOCUS_HANDLER",
      setContentFocusHandler: "SET_CONTENT_FOCUS_HANDLER",
      prepareInsert: "PREPARE_INSERT",
      restoreSelection: "RESTORE_SELECTION",
      setCustomCSS: "SET_CUSTOM_CSS",
      setTextColor: "SET_TEXT_COLOR",
      setBackgroundColor: "SET_BACKGROUND_COLOR",
      init: "ZSSS_INIT",
      setEditorHeight: "SET_EDITOR_HEIGHT",
      setFooterHeight: "SET_FOOTER_HEIGHT",
      setPlatform: "SET_PLATFORM",
    }


## References

* https://github.com/react-native-community/react-native-webview/blob/master/docs/Guide.md#communicating-between-js-and-native
