import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../../Services/authService';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SocketContext from '../../context/SocketContext';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../UI/Icon';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageCompressor';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentFriend, setCurrentFriend] = useState(null);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= 768);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const { socket } = useContext(SocketContext);
  const { theme } = useTheme();
  const userId = localStorage.getItem('userId');
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriendDetails = async () => {
      if (currentChat) {
        const friendId = currentChat.members.find((member) => member !== userId);
        if (friendId) {
          if (location.state?.friend && location.state.friend._id === friendId) {
            setCurrentFriend(location.state.friend);
          } else {
            try {
              const res = await api.get(`/user/${friendId}`);
              setCurrentFriend(res.data);
            } catch (err) {
              console.error('Error fetching friend details:', err);
            }
          }
        }
      }
    };
    fetchFriendDetails();
  }, [currentChat, userId, location.state]);

  useEffect(() => {
    const getConversations = async () => {
      setConversationsLoading(true);
      try {
        const res = await api.get(`/api/conversations/${userId}`);
        setConversations(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setConversationsLoading(false);
      }
    };
    getConversations();
  }, [userId]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const selectedConversation = conversations.find((conv) => conv._id === conversationId);
      if (selectedConversation) {
        if (currentChat?._id !== selectedConversation._id) {
          setMessages([]); // Clear messages immediately to avoid flashing stale data
          setCurrentChat(selectedConversation);
        }
      } else if (location.state?.friend) {
        if (currentChat?._id !== conversationId) {
          setMessages([]); // Clear messages immediately to avoid flashing stale data
          const newConversation = {
            _id: conversationId,
            members: [userId, location.state.friend._id],
            friendData: location.state.friend,
          };
          setCurrentChat(newConversation);
        }
      }
    }
  }, [conversationId, conversations, location.state, userId, currentChat?._id]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
        if (currentChat?._id === message.conversationId) {
          setMessages((prev) => [...prev, message]);
          socket.emit('mark-messages-read', { conversationId: message.conversationId, userId });
        } else {
          socket.emit('message-delivered', { messageId: message._id });
        }
      };

      const handleTyping = ({ conversationId, userId: typerId }) => {
        if (currentChat?._id === conversationId && typerId !== userId) {
          setIsFriendTyping(true);
        }
      };

      const handleStopTyping = ({ conversationId, userId: typerId }) => {
        if (currentChat?._id === conversationId && typerId !== userId) {
          setIsFriendTyping(false);
        }
      };

      const handleMessageStatusUpdate = (updatedMessage) => {
        if (currentChat?._id === updatedMessage.conversationId) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
          );
        }
      };

      const handleMessagesRead = ({ conversationId }) => {
        if (currentChat?._id === conversationId) {
          setMessages((prev) => prev.map((msg) => ({ ...msg, status: 'read' })));
        }
      };

      socket.on('receive-message', handleReceiveMessage);
      socket.on('typing', handleTyping);
      socket.on('stop-typing', handleStopTyping);
      socket.on('message-status-update', handleMessageStatusUpdate);
      socket.on('messages-read', handleMessagesRead);

      return () => {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('typing', handleTyping);
        socket.off('stop-typing', handleStopTyping);
        socket.off('message-status-update', handleMessageStatusUpdate);
        socket.off('messages-read', handleMessagesRead);
      };
    }
  }, [socket, currentChat, userId]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${currentChat?._id}`);
        setMessages(res.data);

        if (socket && currentChat?._id) {
          socket.emit('mark-messages-read', { conversationId: currentChat._id, userId });
        }
      } catch (err) {
        console.log(err);
      }
    };
    if (currentChat) {
      getMessages();
      socket.emit('join-chat', currentChat._id);
    }
  }, [currentChat, socket, userId]);

  const handleTyping = () => {
    if (currentChat) {
      socket.emit('typing', { conversationId: currentChat._id, userId });

      if (typingTimeout) clearTimeout(typingTimeout);

      const timeout = setTimeout(() => {
        socket.emit('stop-typing', { conversationId: currentChat._id, userId });
      }, 3000);

      setTypingTimeout(timeout);
    }
  };

  const handleSendMessage = async (text, image) => {
    let imagePath = '';

    if (image) {
      let compressedFile = image;
      try {
        compressedFile = await compressImage(image, 1200, 1200, 0.8);
      } catch (compressErr) {
        console.error('Image compression failed, uploading original', compressErr);
      }

      const formData = new FormData();
      formData.append('image', compressedFile);
      try {
        const res = await api.post(`/api/chat/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imagePath = res.data.filePath;
      } catch (err) {
        console.error('Image upload failed', err);
        toast.error('Failed to upload image');
        return;
      }
    }

    const message = {
      conversationId: currentChat._id,
      sender: userId,
      text,
      image: imagePath,
    };

    socket.emit('send-message', message);
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex h-dvh ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
              onClick={() => setShowSidebar(false)}
              className="md:hidden fixed inset-0 bg-black z-50 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={shouldReduceMotion ? { duration: 0.05 } : { type: 'spring', damping: 25, stiffness: 200 }}
              className={`md:hidden fixed inset-y-0 left-0 w-[280px] sm:w-[320px] z-50 shadow-elevation-3 border-r ${
                theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
              } flex flex-col`}
            >
              <ConversationList
                conversations={conversations}
                setCurrentChat={(chat) => {
                  navigate(`/chat/${chat._id}`);
                  setShowSidebar(false);
                }}
                currentChat={currentChat}
                isLoading={conversationsLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Conversations List */}
      <motion.div
        initial={false}
        animate={{ width: showSidebar ? 320 : 0, opacity: showSidebar ? 1 : 0 }}
        transition={shouldReduceMotion ? { duration: 0.05 } : { type: 'spring', stiffness: 300, damping: 30 }}
        className={`hidden md:block relative border-r ${
          theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
        } overflow-hidden`}
      >
        <ConversationList
          conversations={conversations}
          setCurrentChat={(chat) => navigate(`/chat/${chat._id}`)}
          currentChat={currentChat}
          isLoading={conversationsLoading}
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {currentChat ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChat._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <ChatHeader
                currentFriend={currentFriend}
                isFriendTyping={isFriendTyping}
                onBack={() => navigate('/dashboard')}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
              />
              <MessageList messages={messages} currentFriend={currentFriend} />
              <MessageInput handleSendMessage={handleSendMessage} onTyping={handleTyping} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex-1 flex flex-col items-center justify-center relative ${
              theme === 'dark' ? 'bg-neutral-900' : 'bg-white'
            }`}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="md:hidden absolute top-4 left-4 h-11 w-11 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
              title="Go to Dashboard"
            >
              <Icon name="arrow-left" size="lg" />
            </button>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              theme === 'dark'
                ? 'bg-primary-900/30'
                : 'bg-primary-100'
            }`}>
              <Icon name="send" size="xl" className={theme === 'dark' ? 'text-primary-400' : 'text-primary-600'} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-neutral-50' : 'text-neutral-900'
            }`}>
              Select a conversation
            </h2>
            <p className={`${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
            } text-center max-w-xs`}>
              Choose a friend from the list to start messaging
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Chat;
