import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';
import Avatar from '../UI/Avatar';
import Icon from '../UI/Icon';

function SearchUsers({ setRequestSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query.');
      return;
    }

    setLoading(true);
    setError('');

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    try {
      const response = await axios.get(
        `${API_URL}/search-users?query=${query}&userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResults(response.data);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const fromUserId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!fromUserId || !token) {
        setError('User not authenticated. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${API_URL}/send-friend-request`,
        { fromUserId, toUserId: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        toast.success('Friend request sent successfully!');
        // Update the user's status in the results list instead of removing them
        setResults((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, requestStatus: 'sent' } : user
          )
        );
        setRequestSent((prev) => !prev); // Update the pending friend requests list
      } else {
        toast.error(response.data.message); // Show error message from the backend
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      if (err.response) {
        toast.error(err.response.data.message); // Show error message from the backend
      } else {
        toast.error('Failed to send friend request. Please try again.');
      }
    }
  };

  return (
    <div className="w-full relative flex-1 min-w-0">
      <div className="flex flex-row gap-2 items-center">
        <div className="relative flex-1 min-w-0">
             <input
               type="text"
               placeholder="Search..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               className="w-full px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-neutral-200 dark:border-neutral-750 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500"
             />
        </div>
        <button
          onClick={handleSearch}
          className="bg-primary-600 text-white flex items-center justify-center rounded-full hover:bg-primary-700 active:bg-primary-800 active:scale-95 transition-all flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10"
          disabled={loading}
          title="Search users"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Icon name="search" size="md" />
          )}
        </button>
      </div>

      {error && <p className="text-error text-xs absolute top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-1.5 rounded-lg shadow-elevation-1 z-50">{error}</p>}

      {results.length > 0 && (
          <div className="absolute top-full -right-2 sm:right-auto sm:left-0 w-[270px] sm:w-full mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-elevation-3 border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50 max-h-96 overflow-y-auto">
             <div className="p-2 border-b bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Results</span>
                <button onClick={() => setResults([])} className="text-xs text-error hover:text-error/85 font-medium px-2 py-1">Close</button>
             </div>
             <ul className="divide-y divide-neutral-100 dark:divide-neutral-850">
                {results.map((user) => (
                  <li key={user._id} className="flex justify-between items-center p-2 sm:p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition gap-2">
                    <div className="flex items-center min-w-0 flex-1 flex-grow mr-1 sm:mr-2">
                      <Avatar
                        src={user.profilePicture}
                        alt={user.name || user.username}
                        size="w-8 h-8 sm:w-9 sm:h-9"
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 truncate">{user.name || user.username}</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                         if (user.requestStatus === 'none') {
                            handleAddFriend(user._id);
                         }
                      }}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition flex-shrink-0 ${
                        user.requestStatus === 'sent'
                          ? 'bg-neutral-100 text-neutral-450 dark:bg-neutral-800 dark:text-neutral-550'
                          : user.requestStatus === 'received'
                          ? 'bg-warning/15 text-warning dark:bg-warning/25' 
                          : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                      }`}
                      disabled={user.requestStatus === 'sent'}
                    >
                      {user.requestStatus === 'sent' ? 'Sent' : user.requestStatus === 'received' ? 'Received' : 'Add'}
                    </button>
                  </li>
                ))}
             </ul>
          </div>
      )}
    </div>
  );
}

export default SearchUsers;