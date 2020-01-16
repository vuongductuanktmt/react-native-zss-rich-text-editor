import { Component } from "react";
import PropTypes from "prop-types";
import { ViewStyle } from "react-native";
declare type PropTypes = {
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
declare type StateType = {
    editor: any;
    selectedItems: any;
    actions: any;
    dataSet: any;
};
export default class RichTextToolbar extends Component<PropTypes, StateType> {
    static propTypes: {
        getEditor: PropTypes.Validator<(...args: any[]) => any>;
        actions: PropTypes.Requireable<any[]>;
        onPressAddLink: PropTypes.Requireable<(...args: any[]) => any>;
        onPressAddImage: PropTypes.Requireable<(...args: any[]) => any>;
        selectedButtonStyle: PropTypes.Requireable<object>;
        iconTint: PropTypes.Requireable<any>;
        selectedIconTint: PropTypes.Requireable<any>;
        unselectedButtonStyle: PropTypes.Requireable<object>;
        renderAction: PropTypes.Requireable<(...args: any[]) => any>;
        iconMap: PropTypes.Requireable<object>;
    };
    constructor(props: PropTypes);
    getRows(actions: any, selectedItems: any): any;
    componentDidMount(): void;
    setSelectedItems(selectedItems: string[]): void;
    _getButtonSelectedStyle(): ViewStyle;
    _getButtonUnselectedStyle(): ViewStyle;
    _getButtonIcon(action: any): any;
    _defaultRenderAction(action: any, selected: boolean): JSX.Element;
    _renderAction(action: string, selected: boolean): any;
    render(): JSX.Element;
    _onPress(action: string): void;
}
export {};
