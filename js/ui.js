/**
 * WebPMaker - UI Manager Module
 * Manages all DOM rendering, state updates, and event listeners.
 */

window.UIManager = {
  originalRatio: 1,
  keepRatioActive: true,
  frameZoom: 100,

  init() {
    // Modal Help Event Listeners
    const btnHelp = document.getElementById('btnHelp');
    const btnCloseHelp = document.getElementById('btnCloseHelp');
    const helpModalOverlay = document.getElementById('helpModalOverlay');

    const toggleHelpModal = (show) => {
      if (show) {
        helpModalOverlay.classList.add('show');
      } else {
        helpModalOverlay.classList.remove('show');
      }
    };

    if (btnHelp) {
      btnHelp.addEventListener('click', () => toggleHelpModal(true));
    }
    if (btnCloseHelp) {
      btnCloseHelp.addEventListener('click', () => toggleHelpModal(false));
    }
    if (helpModalOverlay) {
      helpModalOverlay.addEventListener('click', (e) => {
        if (e.target === helpModalOverlay) toggleHelpModal(false);
      });
    }

    // Event listeners for speed settings
    const btnSpeedModeFps = document.getElementById('btnSpeedModeFps');
    const btnSpeedModeMs = document.getElementById('btnSpeedModeMs');
    const fpsSpeedContainer = document.getElementById('fpsSpeedContainer');
    const msSpeedContainer = document.getElementById('msSpeedContainer');
    const fpsSlider = document.getElementById('fpsSlider');
    const fpsValue = document.getElementById('fpsValue');
    const msSlider = document.getElementById('msSlider');
    const msValue = document.getElementById('msValue');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');

    if (btnSpeedModeFps && btnSpeedModeMs) {
      btnSpeedModeFps.addEventListener('click', () => {
        btnSpeedModeFps.classList.add('active');
        btnSpeedModeMs.classList.remove('active');
        if (fpsSpeedContainer) fpsSpeedContainer.style.display = 'block';
        if (msSpeedContainer) msSpeedContainer.style.display = 'none';
      });

      btnSpeedModeMs.addEventListener('click', () => {
        btnSpeedModeMs.classList.add('active');
        btnSpeedModeFps.classList.remove('active');
        if (fpsSpeedContainer) fpsSpeedContainer.style.display = 'none';
        if (msSpeedContainer) msSpeedContainer.style.display = 'block';
      });
    }

    if (fpsSlider && fpsValue) {
      fpsSlider.addEventListener('input', (e) => {
        const fps = parseFloat(e.target.value);
        const ms = (1000 / fps).toFixed(1);
        fpsValue.textContent = `${fps} FPS (${ms}ms)`;
      });
    }

    if (msSlider && msValue) {
      msSlider.addEventListener('input', (e) => {
        msValue.textContent = `${e.target.value}ms`;
      });
    }

    if (qualityInput && qualityValue) {
      qualityInput.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
      });
    }

    // Loop selection buttons
    const btnLoopInfinite = document.getElementById('btnLoopInfinite');
    const btnLoopOnce = document.getElementById('btnLoopOnce');
    const loopCountGroup = document.getElementById('loopCountGroup');

    if (btnLoopInfinite && btnLoopOnce) {
      btnLoopInfinite.addEventListener('click', () => {
        btnLoopInfinite.classList.add('active');
        btnLoopOnce.classList.remove('active');
        if (loopCountGroup) loopCountGroup.style.display = 'none';
      });

      btnLoopOnce.addEventListener('click', () => {
        btnLoopOnce.classList.add('active');
        btnLoopInfinite.classList.remove('active');
        if (loopCountGroup) loopCountGroup.style.display = 'flex';
      });
    }

    // Keep Ratio and Dimensions
    const outputWidth = document.getElementById('outputWidth');
    const outputHeight = document.getElementById('outputHeight');
    const btnKeepRatio = document.getElementById('btnKeepRatio');

    if (btnKeepRatio) {
      btnKeepRatio.addEventListener('click', () => {
        this.keepRatioActive = !this.keepRatioActive;
        btnKeepRatio.classList.toggle('active', this.keepRatioActive);
        
        // Recalculate aspect ratio based on current first frame
        const dims = window.FrameManager.getAverageDimensions();
        this.originalRatio = dims.width / dims.height;
        
        if (this.keepRatioActive) {
          outputHeight.value = Math.round(outputWidth.value / this.originalRatio);
        }
      });
    }

    if (outputWidth && outputHeight) {
      outputWidth.addEventListener('input', () => {
        if (this.keepRatioActive && this.originalRatio) {
          outputHeight.value = Math.round(outputWidth.value / this.originalRatio);
        }
      });

      outputHeight.addEventListener('input', () => {
        if (this.keepRatioActive && this.originalRatio) {
          outputWidth.value = Math.round(outputHeight.value * this.originalRatio);
        }
      });
    }

    // Header buttons
    const btnClearAll = document.getElementById('btnClearAll');
    const btnReverse = document.getElementById('btnReverse');

    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        window.FrameManager.clearAll();
      });
    }

    if (btnReverse) {
      btnReverse.addEventListener('click', () => {
        window.FrameManager.reverseOrder();
      });
    }

    // Frame zoom control
    const frameZoom = document.getElementById('frameZoom');
    if (frameZoom) {
      frameZoom.addEventListener('input', (e) => {
        this.frameZoom = parseInt(e.target.value);
        this.updateFrameList();
      });
    }

    // Fixed action bar buttons
    const btnScrollTop = document.getElementById('btnScrollTop');
    const btnClearFixed = document.getElementById('btnClearFixed');
    const btnScrollBottom = document.getElementById('btnScrollBottom');

    if (btnScrollTop) {
      btnScrollTop.addEventListener('click', () => {
        document.getElementById('headerSection').scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (btnClearFixed) {
      btnClearFixed.addEventListener('click', () => {
        window.FrameManager.clearAll();
      });
    }
    if (btnScrollBottom) {
      btnScrollBottom.addEventListener('click', () => {
        document.getElementById('actionBarSection').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Create & Download Buttons
    const btnCreate = document.getElementById('btnCreate');
    const btnDownload = document.getElementById('btnDownload');

    if (btnCreate) {
      btnCreate.addEventListener('click', () => window.App.createWebP());
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => window.App.downloadWebP());
    }

    this.updateFrameList();
  },

  updateFrameList() {
    const frameList = document.getElementById('frameList');
    const frameEmpty = document.getElementById('frameEmpty');
    const frameCount = document.getElementById('frameCount');
    const btnCreate = document.getElementById('btnCreate');
    const inputSizeLabel = document.getElementById('inputSize');

    if (!frameList) return;

    const frames = window.FrameManager.frames;

    // Calculate total effective frames including duplicates
    const totalEffectiveFrames = frames.reduce((sum, f) => sum + (f.duplicateCount || 1), 0);

    // Update count
    if (frameCount) {
      frameCount.textContent = `${frames.length} (${totalEffectiveFrames})`;
    }

    // Toggle empty state
    if (frameEmpty) {
      frameEmpty.style.display = frames.length === 0 ? 'block' : 'none';
    }

    // Clear existing frames except the empty placeholder
    const existingItems = frameList.querySelectorAll('.frame-item');
    existingItems.forEach(item => item.remove());

    // Update Input resolution inputs if first frame is added
    if (frames.length > 0) {
      const outputWidth = document.getElementById('outputWidth');
      const outputHeight = document.getElementById('outputHeight');
      
      // Auto-set resolution to first frame's resolution if current is default or just starting
      if (frames.length === 1 && outputWidth && outputHeight) {
        outputWidth.value = frames[0].width;
        outputHeight.value = frames[0].height;
        this.originalRatio = frames[0].width / frames[0].height;
      }
    }

    // Enable/disable conversion button
    if (btnCreate) {
      btnCreate.disabled = frames.length === 0;
    }

    // Calculate zoomed item width
    const baseItemWidth = 100;
    const zoomedWidth = Math.round(baseItemWidth * (this.frameZoom / 100));

    // Render new frame list
    frames.forEach((frame, index) => {
      const item = document.createElement('div');
      item.className = 'frame-item';
      item.draggable = true;
      item.dataset.id = frame.id;
      item.style.width = `${zoomedWidth}px`;

      // Card structure
      item.innerHTML = `
        <div class="frame-thumb-container">
          <img class="frame-thumb" src="${frame.thumbnailUrl}" alt="${frame.name}" draggable="false">
          <span class="frame-index-badge">${index + 1}</span>
          <button class="frame-remove-btn" title="Quitar Frame" onclick="event.stopPropagation(); window.FrameManager.removeFrame(${frame.id});">
            ×
          </button>
        </div>
        <div class="frame-info">
          <span class="frame-name" title="${frame.name}">${frame.name}</span>
          <span class="frame-details">${frame.width}×${frame.height} • ${this.formatBytes(frame.size)}</span>
        </div>
        <div class="frame-duplicate-controls">
          <button class="frame-duplicate-btn" onclick="event.stopPropagation(); window.FrameManager.decrementDuplicate(${frame.id});" title="Reducir repeticiones">
            &lt;
          </button>
          <span class="frame-duplicate-count">${frame.duplicateCount}</span>
          <button class="frame-duplicate-btn" onclick="event.stopPropagation(); window.FrameManager.incrementDuplicate(${frame.id});" title="Aumentar repeticiones">
            &gt;
          </button>
        </div>
        <button class="frame-copy-btn" onclick="event.stopPropagation(); window.FrameManager.duplicateFrame(${frame.id});" title="Duplicar como nuevo frame">
          📋 Duplicar
        </button>
      `;

      frameList.appendChild(item);
    });

    // Update input stats
    if (inputSizeLabel) {
      const totalSize = window.FrameManager.getTotalInputSize();
      inputSizeLabel.textContent = totalSize > 0 ? this.formatBytes(totalSize) : '--';
    }
  },

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  showLoadingState(isLoading, message = 'Procesando...') {
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const btnCreate = document.getElementById('btnCreate');

    if (progressContainer && progressFill && progressText) {
      if (isLoading) {
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = message;
        if (btnCreate) btnCreate.disabled = true;
      } else {
        progressContainer.style.display = 'none';
        if (btnCreate) btnCreate.disabled = window.FrameManager.frames.length === 0;
      }
    }
  },

  updateProgress(percentage, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = text || `${percentage}%`;
  },

  showPreview(blob) {
    const previewEmpty = document.getElementById('previewEmpty');
    const previewImage = document.getElementById('previewImage');
    const btnDownload = document.getElementById('btnDownload');
    const outputSize = document.getElementById('outputSize');
    const reductionLabel = document.getElementById('reduction');

    if (blob) {
      const url = URL.createObjectURL(blob);
      if (previewImage) {
        previewImage.src = url;
        previewImage.style.display = 'block';
      }
      if (previewEmpty) {
        previewEmpty.style.display = 'none';
      }
      if (btnDownload) {
        btnDownload.style.display = 'inline-flex';
      }

      // Update output stats
      if (outputSize) {
        outputSize.textContent = this.formatBytes(blob.size);
      }

      // Calculate reduction
      if (reductionLabel) {
        const inputSize = window.FrameManager.getTotalInputSize();
        if (inputSize > 0) {
          const pct = ((inputSize - blob.size) / inputSize) * 100;
          reductionLabel.textContent = `${pct > 0 ? '-' : '+'}${Math.abs(pct).toFixed(1)}%`;
        }
      }
    } else {
      if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
      }
      if (previewEmpty) {
        previewEmpty.style.display = 'block';
      }
      if (btnDownload) {
        btnDownload.style.display = 'none';
      }
      if (outputSize) {
        outputSize.textContent = '--';
      }
      if (reductionLabel) {
        reductionLabel.textContent = '--';
      }
    }
  },

  getFrameDuration() {
    const btnSpeedModeFps = document.getElementById('btnSpeedModeFps');
    const isFps = btnSpeedModeFps && btnSpeedModeFps.classList.contains('active');
    
    if (isFps) {
      const fps = parseFloat(document.getElementById('fpsSlider').value) || 10;
      return Math.round(1000 / fps);
    } else {
      return parseInt(document.getElementById('msSlider').value) || 100;
    }
  }
};
