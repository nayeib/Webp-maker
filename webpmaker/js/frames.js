/**
 * WebPMaker - Frame Manager Module
 * Manages the list of input PNG frames.
 */

window.FrameManager = {
  frames: [], // Array of { id, file, name, size, img, width, height, imageData, duplicateCount }
  nextId: 1,

  async addFiles(fileList) {
    const validFiles = Array.from(fileList).filter(file => 
      file.type === 'image/png' || 
      file.type === 'image/webp' || 
      file.type === 'image/gif'
    );
    if (validFiles.length === 0) return [];

    const loadedFrames = [];
    
    for (const file of validFiles) {
      try {
        const frameData = await this.loadFrameData(file);
        const frame = {
          id: this.nextId++,
          file,
          name: file.name,
          size: file.size,
          duplicateCount: 1,
          ...frameData
        };
        this.frames.push(frame);
        loadedFrames.push(frame);
      } catch (err) {
        console.error('Error loading file:', file.name, err);
      }
    }
    
    this.triggerChange();
    return loadedFrames;
  },

  incrementDuplicate(id) {
    const frame = this.frames.find(f => f.id === id);
    if (frame) {
      frame.duplicateCount++;
      this.triggerChange();
    }
  },

  decrementDuplicate(id) {
    const frame = this.frames.find(f => f.id === id);
    if (frame && frame.duplicateCount > 1) {
      frame.duplicateCount--;
      this.triggerChange();
    }
  },

  duplicateFrame(id) {
    const frameIndex = this.frames.findIndex(f => f.id === id);
    if (frameIndex === -1) return;

    const originalFrame = this.frames[frameIndex];
    const newFrame = {
      id: this.nextId++,
      file: originalFrame.file,
      name: originalFrame.name,
      size: originalFrame.size,
      width: originalFrame.width,
      height: originalFrame.height,
      thumbnailUrl: originalFrame.thumbnailUrl,
      duplicateCount: 1
    };

    this.frames.splice(frameIndex + 1, 0, newFrame);
    this.triggerChange();
  },

  loadFrameData(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        // Generate a small thumbnail to save memory and avoid broken images
        const thumbCanvas = document.createElement('canvas');
        const maxThumbDim = 120;
        let thumbWidth = img.naturalWidth;
        let thumbHeight = img.naturalHeight;
        
        if (thumbWidth > thumbHeight) {
          if (thumbWidth > maxThumbDim) {
            thumbHeight = Math.round(thumbHeight * (maxThumbDim / thumbWidth));
            thumbWidth = maxThumbDim;
          }
        } else {
          if (thumbHeight > maxThumbDim) {
            thumbWidth = Math.round(thumbWidth * (maxThumbDim / thumbHeight));
            thumbHeight = maxThumbDim;
          }
        }
        
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        const thumbnailUrl = thumbCanvas.toDataURL('image/png');
        
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        URL.revokeObjectURL(url);
        
        resolve({
          width,
          height,
          thumbnailUrl
        });
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      
      img.src = url;
    });
  },

  removeFrame(id) {
    this.frames = this.frames.filter(f => f.id !== id);
    this.triggerChange();
  },

  clearAll() {
    this.frames = [];
    this.nextId = 1;
    this.triggerChange();
  },

  reverseOrder() {
    this.frames.reverse();
    this.triggerChange();
  },

  reorderFrames(orderedIds) {
    // orderedIds is an array of strings/numbers representing the IDs in the new order
    const idMap = new Map(this.frames.map(f => [String(f.id), f]));
    const newFrames = [];
    
    for (const id of orderedIds) {
      const frame = idMap.get(String(id));
      if (frame) {
        newFrames.push(frame);
      }
    }
    
    // Add any remaining frames that weren't in orderedIds (just in case)
    for (const frame of this.frames) {
      if (!newFrames.includes(frame)) {
        newFrames.push(frame);
      }
    }
    
    this.frames = newFrames;
    this.triggerChange();
  },

  getTotalInputSize() {
    return this.frames.reduce((sum, f) => sum + (f.size * (f.duplicateCount || 1)), 0);
  },

  getAverageDimensions() {
    if (this.frames.length === 0) return { width: 480, height: 480 };
    // Let's use the first frame's dimensions as default
    return {
      width: this.frames[0].width,
      height: this.frames[0].height
    };
  },

  triggerChange() {
    // Notify UI that frames updated
    if (window.UIManager && typeof window.UIManager.updateFrameList === 'function') {
      window.UIManager.updateFrameList();
    }
  }
};
