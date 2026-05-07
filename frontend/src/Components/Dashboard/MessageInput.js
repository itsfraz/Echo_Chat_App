import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Icon from '../UI/Icon';

const MessageInput = ({ handleSendMessage, onTyping }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() || image) {
      handleSendMessage(text, image);
      setText('');
      setImage(null);
      setImagePreview(null);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-elevation-2 p-4"
    >
      {imagePreview && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center gap-2">
            <div className="relative group">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg shadow-elevation-1"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 bg-error text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
              >
                <span className="text-xs font-bold">×</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Image selected</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 shadow-elevation-1 hover:shadow-elevation-2"
        >
          <Icon name="image" size="md" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Type a message..."
            className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 dark:placeholder-neutral-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-primary-500 focus:outline-none transition-all duration-200 resize-none max-h-24"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <p className="text-xs text-neutral-400 mt-1 px-4">Shift + Enter for new line</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim() && !image}
          className="flex-shrink-0 p-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-elevation-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-elevation-1 transition-all duration-200 shadow-elevation-2"
        >
          <Icon name="send" size="md" />
        </motion.button>
      </form>
    </motion.div>
  );
};

export default MessageInput;
