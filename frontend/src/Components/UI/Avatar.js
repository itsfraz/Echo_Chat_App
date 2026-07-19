import React, { useState } from 'react';
import { API_URL } from '../../config';

const Avatar = ({ src, alt, size = "w-10 h-10", className = "" }) => {
  const [error, setError] = useState(false);
  
  // A clean SVG placeholder avatar for users without a profile picture
  const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

  // Normalize path if it contains backslashes (Windows upload bug fix for existing records)
  const normalizedSrc = src ? src.replace(/\\/g, '/') : null;
  const imageSrc = normalizedSrc 
    ? (normalizedSrc.startsWith('http') ? normalizedSrc : `${API_URL}/${normalizedSrc}`)
    : defaultAvatar;

  return (
    <img
      src={error ? defaultAvatar : imageSrc}
      alt={alt || "Avatar"}
      onError={() => setError(true)}
      className={`rounded-full object-cover ${size} ${className}`}
      loading="lazy"
    />
  );
};

export default Avatar;
