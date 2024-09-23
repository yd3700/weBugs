import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Slider from '@react-native-community/slider';

type CompletionModalProps = {
  visible: boolean;
  rating: number;
  onRatingChange: (rating: number) => void;
  onAccept: () => void;
  onReject: () => void;
};

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  rating,
  onRatingChange,
  onAccept,
  onReject,
}) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>채집이 완료되었습니다</Text>
        <Text style={styles.modalSubtitle}>서비스를 평가해주세요</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={rating}
          onValueChange={onRatingChange}
        />
        <Text style={styles.ratingText}>{rating} / 10</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.responseButton, styles.acceptButton]}
            onPress={onAccept}
          >
            <Text style={styles.buttonText}>수락</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseButton, styles.rejectButton]}
            onPress={onReject}
          >
            <Text style={styles.buttonText}>거절</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ratingText: {
    fontSize: 18,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  responseButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CompletionModal;