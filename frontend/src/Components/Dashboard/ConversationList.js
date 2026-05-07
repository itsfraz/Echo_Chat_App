import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../UI/Icon';

const ConversationList = ({ conversations, setCurrentChat, currentChat, isLoading }) => {
  const [users, setUsers] = useState({});
  const { theme } = useTheme();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUsers = async () => {
      const newUsers = {};
      for (const conversation of conversations) {
        const friendId = conversation.members.find((member) => member !== userId);
        if (friendId) {
          if (conversation.friendData) {
            newUsers[friendId] = conversation.friendData;
          } else if (!users[friendId]) {
            try {
              const response = await axios.get(`${API_URL}/user/${friendId}`);
              newUsers[friendId] = response.data;
            } catch (err) {
              console.error('Error fetching user:', err);
            }
          }
        }
      }
      setUsers((prevUsers) => ({ ...prevUsers, ...newUsers }));
    };

    fetchUsers();
  }, [conversations, userId, users]);

  return (
    <div className={`h-full flex flex-col ${
      theme === 'dark' ? 'bg-neutral-900' : 'bg-white'
    }`}>
      <div className={`px-6 py-4 border-b ${
        theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
      }`}>
        <h2 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-neutral-50' : 'text-neutral-900'
        }`}>
          Messages
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg mx-2 ${
                theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full animate-shimmer ${
                theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
              }`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-3/4 rounded animate-shimmer ${
                  theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
                }`} />
                <div className={`h-3 w-1/2 rounded animate-shimmer ${
                  theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
                }`} />
              </div>
            </motion.div>
          ))
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'
            }`}>
              <Icon name="send" size="xl" className={theme === 'dark' ? 'text-neutral-600' : 'text-neutral-400'} />
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              No conversations yet
            </p>
          </motion.div>
        ) : (
          conversations.map((conversation, index) => {
            const friendId = conversation.members.find((member) => member !== userId);
            const friend = users[friendId];

            if (!friend) {
              return (
                <motion.div
                  key={conversation._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg mx-2 ${
                    theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full animate-shimmer ${
                    theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
                  }`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-3/4 rounded animate-shimmer ${
                      theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
                    }`} />
                  </div>
                </motion.div>
              );
            }

            const isSelected = currentChat?._id === conversation._id;

            return (
              <motion.button
                key={conversation._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                onClick={() => setCurrentChat(conversation)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mx-2 transition-all duration-200 relative group ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-primary-900/40 border border-primary-700/50'
                      : 'bg-primary-100/50 border border-primary-200'
                    : theme === 'dark'
                      ? 'hover:bg-neutral-800'
                      : 'hover:bg-neutral-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {friend?.profilePicture ? (
                    <img
                      src={`${API_URL}/${friend.profilePicture}`}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover shadow-elevation-1"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-300'
                    }`}>
                      <Icon name="user" size="md" className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white dark:border-neutral-900 shadow-elevation-1" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className={`font-semibold text-sm truncate ${
                    isSelected
                      ? theme === 'dark'
                        ? 'text-primary-100'
                        : 'text-primary-900'
                      : theme === 'dark'
                        ? 'text-neutral-50'
                        : 'text-neutral-900'
                  }`}>
                    {friend?.name || friend?.username}
                  </h3>
                  <p className={`text-xs truncate ${
                    isSelected
                      ? theme === 'dark'
                        ? 'text-primary-300/70'
                        : 'text-primary-800/70'
                      : theme === 'dark'
                        ? 'text-neutral-400'
                        : 'text-neutral-500'
                  }`}>
                    @{friend?.username}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-r bg-primary-600"
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
