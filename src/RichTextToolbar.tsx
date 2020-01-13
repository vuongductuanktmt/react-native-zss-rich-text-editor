import React, { Component } from "react";
import PropTypes from "prop-types";
import { FlatList, View, TouchableOpacity, Image, StyleSheet, ViewStyle } from "react-native";
import { actions } from "./constants";

const defaultActions = [
  actions.insertImage,
  actions.setBold,
  actions.setItalic,
  actions.insertBulletsList,
  actions.insertOrderedList,
  actions.insertLink,
];

function getDefaultIcon() {
  const texts: { [key: string]: any } = {};
  texts[actions.insertImage] = require("../img/icon_format_media.png");
  texts[actions.setBold] = require("../img/icon_format_bold.png");
  texts[actions.setItalic] = require("../img/icon_format_italic.png");
  texts[actions.insertBulletsList] = require("../img/icon_format_ul.png");
  texts[actions.insertOrderedList] = require("../img/icon_format_ol.png");
  texts[actions.insertLink] = require("../img/icon_format_link.png");
  return texts;
}

type PropTypes = {
  getEditor: any;
  actions: any;
  onPressAddLink: any;
  onPressAddImage: any;
  selectedButtonStyle: any;
  iconTint: any;
  selectedIconTint: any;
  unselectedButtonStyle: any;
  renderAction: any;
  iconMap: any;
  style: ViewStyle;
};

type StateType = {
  editor: any;
  selectedItems: any;
  actions: any;
  dataSet: any;
};

export default class RichTextToolbar extends Component<PropTypes, StateType> {
  static propTypes = {
    getEditor: PropTypes.func.isRequired,
    actions: PropTypes.array,
    onPressAddLink: PropTypes.func,
    onPressAddImage: PropTypes.func,
    selectedButtonStyle: PropTypes.object,
    iconTint: PropTypes.any,
    selectedIconTint: PropTypes.any,
    unselectedButtonStyle: PropTypes.object,
    renderAction: PropTypes.func,
    iconMap: PropTypes.object,
  };

  constructor(props: PropTypes) {
    super(props);
    const actions = this.props.actions ? this.props.actions : defaultActions;
    this.state = {
      editor: undefined,
      selectedItems: [],
      actions,
      dataSet: this.getRows(actions, []),
    };
  }

  getRows(actions: any, selectedItems: any) {
    return actions.map((action: any) => {
      return { action, selected: selectedItems.includes(action) };
    });
  }

  componentDidMount() {
    const editor = this.props.getEditor();
    if (!editor) {
      throw new Error("Toolbar has no editor!");
    } else {
      editor.registerToolbar((selectedItems: any) => this.setSelectedItems(selectedItems));
      this.setState({ editor });
    }
  }

  setSelectedItems(selectedItems: any) {
    if (selectedItems !== this.state.selectedItems) {
      this.setState({
        selectedItems,
        dataSet: this.getRows(this.state.actions, selectedItems),
      });
    }
  }

  _getButtonSelectedStyle(): ViewStyle {
    return this.props.selectedButtonStyle ? this.props.selectedButtonStyle : styles.defaultSelectedButton;
  }

  _getButtonUnselectedStyle(): ViewStyle {
    return this.props.unselectedButtonStyle ? this.props.unselectedButtonStyle : styles.defaultUnselectedButton;
  }

  _getButtonIcon(action: any) {
    if (this.props.iconMap && this.props.iconMap[action]) {
      return this.props.iconMap[action];
    } else if (getDefaultIcon()[action]) {
      return getDefaultIcon()[action];
    } else {
      return undefined;
    }
  }

  _defaultRenderAction(action: any, selected: boolean) {
    const icon = this._getButtonIcon(action);
    const btnStyle: ViewStyle[] = [
      { height: 50, width: 50, justifyContent: "center" },
      selected ? this._getButtonSelectedStyle() : this._getButtonUnselectedStyle(),
    ];
    return (
      <TouchableOpacity key={action} style={btnStyle} onPress={() => this._onPress(action)}>
        {icon ? (
          <Image source={icon} style={{ tintColor: selected ? this.props.selectedIconTint : this.props.iconTint }} />
        ) : null}
      </TouchableOpacity>
    );
  }

  _renderAction(action: string, selected: boolean) {
    return this.props.renderAction
      ? this.props.renderAction(action, selected)
      : this._defaultRenderAction(action, selected);
  }

  render() {
    const viewStyle: ViewStyle[] = [{ height: 50, backgroundColor: "#D3D3D3", alignItems: "center" }, this.props.style];
    return (
      <View style={viewStyle}>
        <FlatList
          data={this.state.dataSet}
          numColumns={this.state.actions.length}
          renderItem={(item: any) => this._renderAction(item.item.action, item.item.selected)}
        />
      </View>
    );
  }

  _onPress(action: string) {
    switch (action) {
      case actions.setBold:
      case actions.setItalic:
      case actions.insertBulletsList:
      case actions.insertOrderedList:
      case actions.setUnderline:
      case actions.heading1:
      case actions.heading2:
      case actions.heading3:
      case actions.heading4:
      case actions.heading5:
      case actions.heading6:
      case actions.setParagraph:
      case actions.removeFormat:
      case actions.alignLeft:
      case actions.alignCenter:
      case actions.alignRight:
      case actions.alignFull:
      case actions.setSubscript:
      case actions.setSuperscript:
      case actions.setStrikethrough:
      case actions.setHR:
      case actions.setIndent:
      case actions.setOutdent:
        this.state.editor._sendAction(action);
        break;
      case actions.insertLink:
        this.state.editor.prepareInsert();
        if (this.props.onPressAddLink) {
          this.props.onPressAddLink();
        } else {
          this.state.editor.getSelectedText().then((selectedText: string) => {
            this.state.editor.showLinkDialog(selectedText);
          });
        }
        break;
      case actions.insertImage:
        this.state.editor.prepareInsert();
        if (this.props.onPressAddImage) {
          this.props.onPressAddImage();
        }
        break;
    }
  }
}

const styles = StyleSheet.create({
  defaultSelectedButton: {
    backgroundColor: "red",
  },
  defaultUnselectedButton: {},
});
