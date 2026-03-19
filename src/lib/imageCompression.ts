/**
 * Image compression utility for reducing Base64 image size
 * Reduces maximum width to 1024px, converts to JPEG format with quality 0.8
 */

/**
 * Compresses a Base64 image using HTML Canvas
 * @param base64Image - The Base64 encoded image string
 * @returns Promise<string> - The compressed Base64 image string
 */
export async function compressImage(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      const maxWidth = 1024;
      let { width, height } = img;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw image on canvas with new dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality 0.8
      try {
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Start loading the image
    img.src = base64Image;
  });
}

/**
 * Compresses an image file to Base64
 * @param file - The image file to compress
 * @returns Promise<string> - The compressed Base64 image string
 */
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const base64Image = e.target?.result as string;
        const compressedImage = await compressImage(base64Image);
        resolve(compressedImage);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
