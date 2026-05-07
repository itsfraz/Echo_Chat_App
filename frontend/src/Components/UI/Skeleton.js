import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  count = 1,
  circle = false,
  rounded = true
}) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.1,
          }}
          className={`${width} ${height} ${
            circle ? 'rounded-full' : rounded ? 'rounded-lg' : ''
          } bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 ${className}`}
        />
      ))}
    </>
  );
};

// Profile Skeleton
export const ProfileSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
  >
    <div className="flex flex-col items-center">
      <Skeleton circle width="w-24" height="h-24" className="mb-4" />
      <Skeleton width="w-40" height="h-6" className="mb-2" />
      <Skeleton width="w-32" height="h-4" className="mb-4" />
      <Skeleton width="w-48" height="h-4" count={2} />
    </div>
  </motion.div>
);

// Message Skeleton
export const MessageSkeleton = ({ isUser = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
  >
    {!isUser && <Skeleton circle width="w-8" height="h-8" />}
    <div className={`space-y-2 flex-1 ${isUser ? 'max-w-xs ml-auto' : 'max-w-xs'}`}>
      <Skeleton width="w-64" height="h-4" rounded />
      <Skeleton width="w-48" height="h-4" rounded />
    </div>
  </motion.div>
);

// Card Skeleton
export const CardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
  >
    <Skeleton width="w-1/3" height="h-6" />
    <div className="space-y-3">
      <Skeleton width="w-full" height="h-4" count={3} />
    </div>
  </motion.div>
);

// List Item Skeleton
export const ListItemSkeleton = ({ count = 5 }) => (
  <div className="space-y-2">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className="flex items-center gap-3 p-3 rounded-lg"
      >
        <Skeleton circle width="w-12" height="h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
      </motion.div>
    ))}
  </div>
);

// Chat Header Skeleton
export const ChatHeaderSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 p-4"
  >
    <Skeleton circle width="w-12" height="h-12" />
    <div className="flex-1 space-y-2">
      <Skeleton width="w-1/3" height="h-5" />
      <Skeleton width="w-1/4" height="h-3" />
    </div>
  </motion.div>
);

// Full Page Skeleton
export const PageSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >
    <Skeleton width="w-1/2" height="h-8" />
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </motion.div>
);

export default Skeleton;
