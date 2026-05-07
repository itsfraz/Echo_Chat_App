import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../../config';
import Icon from '../UI/Icon';

const MessageList = ({ messages, currentFriend }) => {
  const userId = localStorage.getItem('userId');
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 flex flex-col">
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <Icon name="send" size="xl" className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Say hello to {currentFriend?.name}!
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
            Start a conversation and connect with your friends in real-time.
          </p>
        </motion.div>
      )}

      {messages.map((message, index) => {
        const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
        const isSender = String(senderId) === String(userId);

        return (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`flex ${isSender ? 'justify-end' : 'justify-start'} gap-2 group`}
          >
            {!isSender && currentFriend?.profilePicture && (
              <img
                src={`${API_URL}/${currentFriend.profilePicture}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}

            <div className={`max-w-xs px-4 py-3 rounded-2xl transition-all duration-200 ${
              isSender
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-none shadow-elevation-2 hover:shadow-elevation-3'
                : 'bg-neutral-100 text-neutral-900 rounded-bl-none shadow-elevation-1 dark:bg-neutral-800 dark:text-neutral-50 hover:shadow-elevation-2'
            }`}>
              {message.image && (
                <img
                  src={`${API_URL}/${message.image}`}
                  alt="shared"
                  className="max-w-full rounded-lg mb-2 max-h-60 transition-transform hover:scale-105"
                />
              )}
              {message.text && (
                <p className="text-sm leading-relaxed break-words">{message.text}</p>
              )}
              <div className={`text-xs mt-2 flex items-center justify-end gap-1 transition-all ${
                isSender
                  ? 'text-blue-100'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isSender && (
                  <span className="font-semibold">
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && <span className="text-white">✓✓</span>}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
