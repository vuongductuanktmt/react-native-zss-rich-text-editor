import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RichTextEditor} from 'react-native-zss-rich-text-editor';

class RichTextExample extends Component {
  constructor(props) {
    super(props);
    this.getHTML = this.getHTML.bind(this);
    this.setFocusHandlers = this.setFocusHandlers.bind(this);
  }

  state = {
    html: '',
    text: '',
  };

  onChange = (html, text) => {
    this.setState({html, text});
  };

  render() {
    return (
      <View style={styles.container}>
        <RichTextEditor
          ref={r => (this.richtext = r)}
          style={styles.richText}
          initialHTMLValue={`<p>Paragraph one.</p><p>Paragraph two. <strong>Strong text</strong></p><ul><li>item one</li><li>item two</li><li>item three</li></ul><p>Something at the end.</p>`}
          editorInitializedCallback={() => this.onEditorInitialized()}
          onChange={this.onChange}
        />
        <Text style={styles.ouputs}>{this.state.html}</Text>
        <Text style={styles.ouputs}>{this.state.text}</Text>
      </View>
    );
  }

  onEditorInitialized() {
    this.setFocusHandlers();
    this.getHTML();
  }

  async getHTML() {
    const contentHtml = await this.richtext.getHtml();
    //alert(titleHtml + ' ' + contentHtml)
  }

  setFocusHandlers() {
    this.richtext.setContentFocusHandler(() => {
      //alert('content focus');
    });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 40,
  },
  richText: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  ouputs: {
    backgroundColor: '#f5f5f5',
    color: '#000000',
    height: 200,
    width: '100%',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000000',
  },
});

export default RichTextExample;
