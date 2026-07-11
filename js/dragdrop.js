/**
 * WebPMaker - Drag and Drop Module
 * Handles file dropping and frame reordering.
 */

window.DragDropHandler = {
  draggedItem: null,
  placeholder: null,

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
    const trashZone = document.getElementById('trashZone');

    if (frameList) {
      // Handle file drops on frameList too
      ['dragenter', 'dragover'].forEach(eventName => {
        frameList.addEventListener(eventName, (e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            frameList.classList.add('drag-over-files');
          }
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        frameList.addEventListener(eventName, (e) => {
          if (e.dataTransfer.types.includes('Files')) {
            frameList.classList.remove('drag-over-files');
          }
        }, false);
      });

      frameList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.frame-item');
        if (item) {
          this.draggedItem = item;
          item.classList.add('dragging');
          
          // Create placeholder
          this.placeholder = document.createElement('div');
          this.placeholder.className = 'frame-placeholder';
          // Set placeholder dimensions to match dragged item
          this.placeholder.style.width = item.offsetWidth + 'px';
          this.placeholder.style.height = item.offsetHeight + 'px';
          // Insert placeholder right after dragged item initially
          item.parentNode.insertBefore(this.placeholder, item.nextSibling);
          
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.dataset.id);
        }
      });

      frameList.addEventListener('dragend', (e) => {
        const item = e.target.closest('.frame-item');
        if (item) {
          item.classList.remove('dragging');
        }
        
        // Remove placeholder
        if (this.placeholder) {
          this.placeholder.remove();
          this.placeholder = null;
        }

        this.draggedItem = null;
        
        // Update frames order based on DOM order
        this.updateOrderFromDOM();
      });

      frameList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(frameList, e.clientX, e.clientY);
        const dragging = document.querySelector('.frame-item.dragging');
        
        if (dragging && this.placeholder) {
          if (afterElement == null) {
            frameList.appendChild(this.placeholder);
          } else {
            frameList.insertBefore(this.placeholder, afterElement);
          }
        }
      });

      frameList.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Case 1: Dropping files from external (Windows)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const afterElement = this.getDragAfterElement(frameList, e.clientX, e.clientY);
          let insertIndex = -1;
          if (afterElement) {
            const items = [...frameList.querySelectorAll('.frame-item')];
            insertIndex = items.indexOf(afterElement);
          }
          this.handleFiles(e.dataTransfer.files, insertIndex);
          return;
        }

        // Case 2: Reordering internal frames
        const dragging = document.querySelector('.frame-item.dragging');
        if (dragging && this.placeholder) {
          // Insert dragged item right before the placeholder
          frameList.insertBefore(dragging, this.placeholder);
        }
      });

      // Trash Zone Events
      if (trashZone) {
        trashZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          trashZone.classList.add('drag-over');
        });

        trashZone.addEventListener('dragleave', () => {
          trashZone.classList.remove('drag-over');
        });

        trashZone.addEventListener('drop', (e) => {
          e.preventDefault();
          trashZone.classList.remove('drag-over');
          
          const id = e.dataTransfer.getData('text/plain');
          if (id) {
            window.FrameManager.removeFrame(parseInt(id));
            // Show a small feedback if UIManager supports it or just let it disappear
          }
        });
      }

      frameList.addEventListener('dragleave', (e) => {
        // Do nothing if leaving to child element
      });
    }
  },

  async handleFiles(files, atIndex = -1) {
    if (files.length === 0) return;
    if (window.UIManager) {
      window.UIManager.showLoadingState(true, 'Cargando imágenes...');
    }
    await window.FrameManager.addFiles(files, atIndex);
    if (window.UIManager) {
      window.UIManager.showLoadingState(false);
    }
  },

  getDragAfterElement(container, x, y) {
    // Get only actual frame items, exclude dragging item and placeholder
    const draggableElements = [...container.querySelectorAll('.frame-item:not(.dragging):not(.frame-placeholder)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      
      // Calculate squared distance (no need for sqrt for comparison)
      const distance = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
      
      // We want to return the element whose center is closest to the mouse
      if (distance < closest.distance) {
        return { distance: distance, element: child };
      } else {
        return closest;
      }
    }, { distance: Number.POSITIVE_INFINITY }).element;
  },

  updateOrderFromDOM() {
    const frameList = document.getElementById('frameList');
    if (!frameList) return;
    const items = [...frameList.querySelectorAll('.frame-item')];
    const orderedIds = items.map(item => item.dataset.id);
    window.FrameManager.reorderFrames(orderedIds);
  }
};
