/**
 * Compresses an image file client-side using HTML5 Canvas.
 * 
 * @param {File} file The original file object.
 * @param {number} maxWidth The maximum allowed width.
 * @param {number} maxHeight The maximum allowed height.
 * @param {number} quality The compression quality (0.0 to 1.0).
 * @returns {Promise<File>} A promise resolving to a compressed File object.
 */
export const compressImage = (file, maxWidth, maxHeight, quality = 0.8) => {
  return new Promise((resolve) => {
    // If the file is not an image, return it immediately
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to Blob/File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
