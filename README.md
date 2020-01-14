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
$ cd newExample
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

## References

* https://github.com/react-native-community/react-native-webview/blob/master/docs/Guide.md#communicating-between-js-and-native
