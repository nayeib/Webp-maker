/**
 * WebPMaker - Main Application Controller
 * Coordinates frames management, drag and drop, encoding, and UI rendering.
 */

window.App = {
  currentWebPBlob: null,

  init() {
    console.log("Initializing WebPMaker Persona 5 UI...");
    
    // Initialize UI Manager
    window.UIManager.init();
    
    // Initialize Drag & Drop handlers
    window.DragDropHandler.init();
  },

  async createWebP() {
    const frames = window.FrameManager.frames;
    if (frames.length === 0) return;

    const width = parseInt(document.getElementById('outputWidth').value) || 480;
    const height = parseInt(document.getElementById('outputHeight').value) || 480;
    const duration = window.UIManager.getFrameDuration();
    const quality = parseInt(document.getElementById('quality').value) || 80;

    window.UIManager.showLoadingState(true, 'Iniciando codificación...');

    try {
      const blob = await window.WebPEncoder.encodeAnimatedWebP({
        frames,
        width,
        height,
        duration,
        quality,
        onProgress: (pct) => {
          let progressText = 'Procesando...';
          if (pct < 40) {
            progressText = `Redimensionando frames: ${pct * 2.5}%`;
          } else if (pct >= 50 && pct < 100) {
            progressText = 'Compilando WebP animado...';
          } else if (pct === 100) {
            progressText = '¡Listo!';
          }
          window.UIManager.updateProgress(pct, progressText);
        }
      });

      this.currentWebPBlob = blob;
      window.UIManager.showPreview(blob);
    } catch (err) {
      console.error(err);
      alert('Error durante la creación: ' + err.message);
    } finally {
      window.UIManager.showLoadingState(false);
    }
  },

  downloadWebP() {
    if (!this.currentWebPBlob) return;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(this.currentWebPBlob);
    
    // Generate a default filename
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    a.download = `animated_${dateStr}.webp`;
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
