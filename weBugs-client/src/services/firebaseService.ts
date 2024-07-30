// src/services/firebaseService.ts
import { firestore, firebase } from '../../firebaseConfig';

// 서비스 매칭 함수
const matchService = async (requestId: string, providerId: string) => {
  try {
    await firestore.collection('matches').add({
      requestId,
      providerId,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log('서비스 매칭 성공');
  } catch (error) {
    console.error('서비스 매칭 실패:', error);
  }
};

// 기타 Firebase 관련 함수들...

export { matchService };
