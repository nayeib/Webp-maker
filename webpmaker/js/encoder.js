/**
 * WebPMaker - WebP Encoder Module
 * Handles WebP animation encoding using wasm-webp.
 */

window.WebPEncoder = {
  lib: null,

  async init() {
    if (this.lib) return;
    try {
      // Import the wasm-webp library from unpkg ESM
      const moduleUrl = 'https://unpkg.com/wasm-webp/dist/esm/index.js';
      this.lib = await import(moduleUrl);
      console.log('wasm-webp library successfully loaded.');
    } catch (err) {
      console.error('Failed to load wasm-webp from CDN:', err);
      throw new Error('No se pudo cargar la librería WebP WASM desde el CDN.');
    }
  },

  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  },

  async encodeAnimatedWebP(options) {
    await this.init();

    const {
      frames,
      width,
      height,
      duration, // default duration if not custom
      quality,
      onProgress
    } = options;

    if (!frames || frames.length === 0) {
      throw new Error('No hay frames para codificar.');
    }

    const encodedFrames = [];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');

    // Calculate total "effective" frames (including duplicates)
    const totalEffectiveFrames = frames.reduce((sum, frame) => sum + (frame.duplicateCount || 1), 0);
    let processedCount = 0;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      let img;
      try {
        img = await this.loadImageFromFile(frame.file);
      } catch (err) {
        console.error('Error loading image for frame', frame.name, err);
        throw new Error(`Error al procesar el frame ${frame.name}: ${err.message}`);
      }
      
      // Clear canvas to preserve transparency
      ctx.clearRect(0, 0, width, height);
      
      // Draw image to output size (maintaining aspect ratio or fitting)
      ctx.drawImage(img, 0, 0, width, height);
      
      const imgData = ctx.getImageData(0, 0, width, height);
      const frameData = new Uint8Array(imgData.data);
      
      // Add frame multiple times based on duplicateCount
      for (let d = 0; d < (frame.duplicateCount || 1); d++) {
        encodedFrames.push({
          data: frameData,
          duration: duration,
          config: {
            lossless: quality === 100 ? 1 : 0,
            quality: quality
          }
        });
        processedCount++;
        if (onProgress) {
          onProgress(Math.round((processedCount / totalEffectiveFrames) * 45));
        }
      }

      // Clear source to release memory
      img.src = '';
    }

    if (onProgress) {
      onProgress(50); // 50% start compilation
    }

    // Run the animation encoder (hasAlpha = true to keep transparency)
    const webpBuffer = await this.lib.encodeAnimation(width, height, true, encodedFrames);

    if (onProgress) {
      onProgress(100);
    }

    if (!webpBuffer) {
      throw new Error('Error al codificar el WebP animado.');
    }

    return new Blob([webpBuffer], { type: 'image/webp' });
  }
};
