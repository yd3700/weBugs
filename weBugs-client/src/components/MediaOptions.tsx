import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import commonStyles from '../styles/commonStyles'

type MediaOptionsProps = {
  visible: boolean;
  onClose: () => void;
  onCameraCapture: () => void;
  onMediaSelect: () => void;
  onCompleteCollection: () => void;
  isCollector: boolean;
};

const MediaOptions: React.FC<MediaOptionsProps> = ({
  visible,
  onClose,
  onCameraCapture,
  onMediaSelect,
  onCompleteCollection,
  isCollector,
}) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.optionButton} onPress={onCameraCapture}>
          <Text style={styles.optionText}>카메라</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={onMediaSelect}>
          <Text style={styles.optionText}>앨범 선택</Text>
        </TouchableOpacity>
        {isCollector && (
          <TouchableOpacity style={styles.optionButton} onPress={onCompleteCollection}>
            <Text style={styles.optionText}>채집 완료</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  ...commonStyles,
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  optionButton: {
    backgroundColor: '#50B498',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E85C0D',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MediaOptions;