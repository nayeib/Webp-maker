/**
 * WebPMaker - Drag and Drop Module
 * Handles file dropping and frame reordering.
 */

window.DragDropHandler = {
  draggedItem: null,

  init() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    // File Input Click
    dropZone.addEventListener('click', () => fileInput.click());

    // File Input Change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      fileInput.value = ''; // Reset so same files can be uploaded again
    });

    // Drag and Drop Events on Dropzone
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFiles(files);
    }, false);

    // Reordering drag events on frame list container
    const frameList = document.getElementById('frameList');
    if (frameList) {
      frameList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.frame-item');
        if (item) {
          this.draggedItem = item;
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.dataset.id);
        }
      });

      frameList.addEventListener('dragend', (e) => {
        const item = e.target.closest('.frame-item');
        if (item) {
          item.classList.remove('dragging');
        }
        this.draggedItem = null;
        
        // Update frames order based on DOM order
        this.updateOrderFromDOM();
      });

      frameList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(frameList, e.clientY);
        const dragging = document.querySelector('.frame-item.dragging');
        if (dragging) {
          if (afterElement == null) {
            frameList.appendChild(dragging);
          } else {
            frameList.insertBefore(dragging, afterElement);
          }
        }
      });
    }
  },

  async handleFiles(files) {
    if (files.length === 0) return;
    if (window.UIManager) {
      window.UIManager.showLoadingState(true, 'Cargando imágenes...');
    }
    await window.FrameManager.addFiles(files);
    if (window.UIManager) {
      window.UIManager.showLoadingState(false);
    }
  },

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.frame-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  updateOrderFromDOM() {
    const frameList = document.getElementById('frameList');
    if (!frameList) return;
    const items = [...frameList.querySelectorAll('.frame-item')];
    const orderedIds = items.map(item => item.dataset.id);
    window.FrameManager.reorderFrames(orderedIds);
  }
};
