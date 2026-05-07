import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../../config';
import Icon from '../UI/Icon';

const ChatHeader = ({ currentFriend, isFriendTyping, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-elevation-1 backdrop-blur-sm bg-white/80 dark:bg-neutral-900/80"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Icon name="chevronUp" size="md" className="text-neutral-600 dark:text-neutral-400 rotate-90" />
          </button>

          {currentFriend?.profilePicture && (
            <img
              src={`${API_URL}/${currentFriend.profilePicture}`}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900/30"
            />
          )}

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">
              {currentFriend?.name || currentFriend?.username}
            </h2>
            <motion.p
              key={isFriendTyping ? 'typing' : 'idle'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-neutral-500 dark:text-neutral-400"
            >
              {isFriendTyping ? (
                <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                  <span className="inline-flex">
                    <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  </span>
                  typing
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Active now
                </span>
              )}
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200">
            <Icon name="search" size="md" />
          </button>
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200">
            <Icon name="dots" size="md" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
