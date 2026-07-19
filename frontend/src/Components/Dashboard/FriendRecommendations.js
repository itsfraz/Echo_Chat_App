import React, { memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';
import Avatar from '../UI/Avatar';

const FriendRecommendations = memo(() => {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const shouldReduceMotion = useReducedMotion();

  const { data: recommendations = [], isLoading, isError, error } = useQuery({
    queryKey: ['friendRecommendations', userId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/friend-recommendations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!userId && !!token,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (targetUserId) => {
      return axios.post(
        `${API_URL}/send-friend-request`,
        { fromUserId: userId, toUserId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onMutate: async (targetUserId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(['friendRecommendations', userId]);

      // Snapshot the previous value
      const previousRecommendations = queryClient.getQueryData(['friendRecommendations', userId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['friendRecommendations', userId], (old) => 
        old.filter(user => user._id !== targetUserId)
      );

      // Return a context object with the snapshotted value
      return { previousRecommendations };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['friendRecommendations', userId], context.previousRecommendations);
      toast.error('Failed to send friend request. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['friendRecommendations', userId]);
    },
    onSuccess: () => {
       toast.success('Friend request sent successfully!');
    }
  });

  if (isError) {
    return <p className="text-red-500">{error.message || 'Failed to fetch recommendations.'}</p>;
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col items-center text-center shadow-sm h-64 border border-white/20 backdrop-blur-sm">
               <div className="mb-3 w-full flex justify-center">
                 <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
               </div>
               <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse mx-auto"></div>
               <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse mx-auto"></div>
               <div className="mt-auto w-full h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" layout={shouldReduceMotion ? false : "position"}>
          <AnimatePresence>
            {recommendations.map((user) => (
              <motion.div
                key={user._id}
                layout={shouldReduceMotion ? false : "position"}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition border border-neutral-100 dark:border-neutral-700/50"
              >
                 <div className="mb-3">
                   <Avatar
                     src={user.profilePicture}
                     alt={user.name || user.username}
                     size="w-20 h-20"
                     className="border-4 border-white dark:border-neutral-700 shadow-sm"
                   />
                 </div>
                 
                 <h3 className="font-bold text-gray-800 dark:text-neutral-100 text-base mb-1 truncate w-full">{user.name || user.username}</h3>
                 {user.mutualFriends > 0 && (
                     <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">{user.mutualFriends} mutual friends</p>
                 )}
                 
                 <motion.button
                   whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                   whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                   onClick={() => addFriendMutation.mutate(user._id)}
                   disabled={addFriendMutation.isLoading}
                   className="mt-auto w-full bg-blue-100 text-blue-600 dark:bg-primary-900/30 dark:text-primary-400 h-11 px-4 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-primary-900/50 transition flex items-center justify-center"
                 >
                   {addFriendMutation.isLoading ? 'Adding...' : 'Add Friend'}
                 </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="text-gray-500 text-center py-6">No recommendations available right now.</p>
      )}
    </div>
  );
});

export default FriendRecommendations;