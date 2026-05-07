import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../Services/authService';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFriends } from '../../features/friends/friendsSlice';
import { useTheme } from '../../context/ThemeContext';
import { API_URL } from '../../config';
import Icon from '../UI/Icon';

function FriendsList() {
  const dispatch = useDispatch();
  const { list: friends, loading, error } = useSelector((state) => state.friends);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId && friends.length === 0) {
      dispatch(fetchFriends(userId));
    }
  }, [userId, dispatch, friends.length]);

  const handleFriendClick = async (friend) => {
    try {
      const response = await api.post(`/api/conversations`, {
        senderId: userId,
        receiverId: friend._id,
      });
      navigate(`/chat/${response.data._id}`, { state: { friend } });
    } catch (err) {
      console.error('Error creating or finding conversation:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'
            }`}
          >
            <div className={`w-10 h-10 rounded-full animate-shimmer ${
              theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
            }`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3 w-3/4 rounded animate-shimmer ${
                theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-error"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <div>
      {friends.length > 0 ? (
        <ul className="space-y-1">
          {friends.map((friend, index) => (
            <motion.li
              key={friend._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="list-none"
            >
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFriendClick(friend)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-neutral-800'
                    : 'hover:bg-neutral-100'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {friend.profilePicture ? (
                    <img
                      src={`${API_URL}/${friend.profilePicture}`}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover shadow-elevation-1"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-300'
                    }`}>
                      <Icon name="user" size="sm" className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white dark:border-neutral-900 shadow-elevation-1" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className={`font-medium text-sm truncate ${
                    theme === 'dark' ? 'text-neutral-50' : 'text-neutral-900'
                  }`}>
                    {friend.name}
                  </p>
                  <p className={`text-xs truncate ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    @{friend.username}
                  </p>
                </div>
              </motion.button>
            </motion.li>
          ))}
        </ul>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm text-center py-8 rounded-lg p-4 ${
            theme === 'dark'
              ? 'bg-neutral-800/50 text-neutral-400'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          <Icon name="users" size="lg" className="mx-auto mb-2 opacity-50" />
          <p>No friends yet.</p>
          <p className="text-xs mt-1 opacity-75">Add friends to start chatting!</p>
        </motion.div>
      )}
    </div>
  );
}

export default FriendsList;
