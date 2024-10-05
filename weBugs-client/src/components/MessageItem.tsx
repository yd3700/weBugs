import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ChatItem, Message, User } from '../types/navigation';

type MessageItemProps = {
  item: ChatItem;
  currentUser: User | null;
  otherUser: User | null;
  onCompletionPress: () => void;
  onProfilePress: () => void; // 새로 추가
};

function isMessage(item: ChatItem): item is Message {
  return 'senderId' in item && 'content' in item;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ item, currentUser, otherUser, onCompletionPress, onProfilePress }) => {
  const renderDateSeparator = useCallback((date: string) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateSeparatorText}>{date}</Text>
    </View>
  ), []);

  const renderMessageContent = useCallback((message: Message, isCurrentUser: boolean) => {
    if (message.content === "채집완료" && !isCurrentUser && !message.media) {
      return (
        <TouchableOpacity onPress={onCompletionPress}>
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.completionInstructions}>터치하여 응답</Text>
        </TouchableOpacity>
      );
    } else if (message.media && message.media.url) {
      if (message.media.type === 'photo') {
        return <Image source={{ uri: message.media.url }} style={styles.mediaImage} />;
      } else if (message.media.type === 'video') {
        return (
          <Video
            source={{ uri: message.media.url }}
            style={styles.mediaVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={false}
          />
        );
      }
    }
    return <Text style={styles.messageText}>{message.content}</Text>;
  }, [onCompletionPress]);

  const renderUserInfo = useCallback((user: User | null) => (
    <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
      {user?.profilePicture ? (
        <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholderImage]}>
          <Text>{user?.name?.[0].toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.userName}>{user?.name}</Text>
    </TouchableOpacity>
  ), [onProfilePress]);

  const messageContent = useMemo(() => {
    if (!isMessage(item) || !currentUser) {
      return null;
    }

    const isCurrentUser = item.senderId === currentUser.id;
    const displayTimestamp = item.timestamp && item.timestamp.seconds
      ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const userImage = isCurrentUser ? currentUser.profilePicture : otherUser?.profilePicture;
    const userName = isCurrentUser ? currentUser.name : otherUser?.name;

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUser : styles.otherUser]}>
        {!isCurrentUser && renderUserInfo(otherUser)}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
            {renderMessageContent(item, isCurrentUser)}
          </View>
          <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
            {displayTimestamp}
          </Text>
        </View>
      </View>
    );
  }, [item, currentUser, otherUser, renderUserInfo, renderMessageContent]);

  if ('type' in item && item.type === 'date') {
    return renderDateSeparator(item.date);
  }

  return messageContent;
});

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  currentUser: {
    justifyContent: 'flex-end',
  },
  otherUser: {
    justifyContent: 'flex-start',
  },
  userInfo: {
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  placeholderImage: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  messageContent: {
    maxWidth: '70%',
  },
  messageBubble: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  currentUserBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  currentUserTimestamp: {
    alignSelf: 'flex-end',
  },
  otherUserTimestamp: {
    alignSelf: 'flex-start',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: '#000',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  completionInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  mediaVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});

export default MessageItem;