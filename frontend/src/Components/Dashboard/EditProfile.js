import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { compressImage } from '../../utils/imageCompressor';

function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [work, setWork] = useState('');
  const [location, setLocation] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(response.data.name);
        setEmail(response.data.email);
        setBio(response.data.bio || '');
        setWork(response.data.work || '');
        setLocation(response.data.location || '');
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, [userId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('bio', bio);
    formData.append('work', work);
    formData.append('location', location);
    
    if (profilePicture) {
      let compressedFile = profilePicture;
      try {
        compressedFile = await compressImage(profilePicture, 256, 256, 0.85);
      } catch (compressErr) {
        console.error('Failed to compress avatar, using original', compressErr);
      }
      formData.append('profilePicture', compressedFile);
    }

    try {
      await axios.put(
        `${API_URL}/edit-profile/${userId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Profile updated successfully');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Bio:</label>
             <textarea
               value={bio}
               onChange={(e) => setBio(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               rows="3"
               placeholder="Tell us about yourself..."
             />
          </div>
          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Work:</label>
             <input
               type="text"
               value={work}
               onChange={(e) => setWork(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Current Job / Company"
             />
          </div>
          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Location:</label>
             <input
               type="text"
               value={location}
               onChange={(e) => setLocation(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="City, Country"
             />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture:</label>
            <input
              type="file"
              onChange={(e) => setProfilePicture(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;