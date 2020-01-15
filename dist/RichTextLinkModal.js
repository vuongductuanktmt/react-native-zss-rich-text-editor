import React, { useCallback, useMemo, useState } from "react";
import { Modal, PixelRatio, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
const PlatformIOS = Platform.OS === "ios";
const RichTextLinkModal = React.memo(({ visible = false, onRequestClose, keyboardHeight = 0, onHideModal, onApply, linkTitle: initLinkTitle, linkUrl: initLinkUrl, }) => {
    const [linkTitle, setLinkTitle] = useState(initLinkTitle || "");
    const [linkUrl, setLinkUrl] = useState(initLinkUrl || "");
    const innerModalStyle = useMemo(() => {
        return [styles.innerModal, { marginBottom: PlatformIOS ? keyboardHeight : 0 }];
    }, [keyboardHeight]);
    const handleApply = useCallback(() => {
        onApply && onApply(linkTitle, linkUrl);
    }, [linkTitle, linkUrl, onApply]);
    const renderModalButtons = useCallback(() => {
        const insertUpdateDisabled = (linkTitle?.trim().length || 0) <= 0 || (linkUrl?.trim().length || 0) <= 0;
        const containerPlatformStyle = [
            { alignSelf: "stretch", flexDirection: "row" },
            PlatformIOS ? { justifyContent: "space-between" } : { paddingTop: 15 },
        ];
        const buttonPlatformStyle = PlatformIOS ? { flex: 1, height: 45, justifyContent: "center" } : {};
        const cancelBtnTextStyle = [styles.button, { paddingRight: 10 }];
        const upsertBtnTextStyle = [styles.button, { opacity: insertUpdateDisabled ? 0.5 : 1 }];
        return (<View style={containerPlatformStyle}>
          {!PlatformIOS && <View style={styles.flex}/>}
          <TouchableOpacity onPress={onHideModal} style={buttonPlatformStyle}>
            <Text style={cancelBtnTextStyle}>{"Cancel"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} disabled={insertUpdateDisabled} style={buttonPlatformStyle}>
            <Text style={upsertBtnTextStyle}>{initLinkUrl ? "Update" : "Insert"}</Text>
          </TouchableOpacity>
        </View>);
    }, [initLinkUrl, linkTitle, linkUrl, onApply, onHideModal]);
    return (<Modal animationType={"fade"} transparent visible={visible} onRequestClose={onRequestClose}>
        <View style={styles.modal}>
          <View style={innerModalStyle}>
            <Text style={styles.inputTitle}>Title</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} onChangeText={setLinkTitle} value={linkTitle}/>
            </View>
            <Text style={styles.urlLabel}>URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} onChangeText={setLinkUrl} value={linkUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false}/>
            </View>
            {PlatformIOS && <View style={styles.lineSeparator}/>}
            {renderModalButtons()}
          </View>
        </View>
      </Modal>);
});
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
    inputTitle: {
        color: "#4a4a4a",
    },
    urlLabel: {
        color: "#4a4a4a",
        marginTop: 10,
    },
    inputWrapper: {
        marginTop: 5,
        marginBottom: 10,
        borderBottomColor: "#4a4a4a",
        borderBottomWidth: PlatformIOS ? 1 / PixelRatio.get() : 0,
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
    button: {
        fontSize: 16,
        color: "#4a4a4a",
        textAlign: "center",
    },
});
export default RichTextLinkModal;
