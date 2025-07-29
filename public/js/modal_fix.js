// Function to maintain modal size during zoom
function fixModalZoom() {
    const modal = document.getElementById('modal').querySelector('div');
    
    // Reset any zoom effects
    if (modal) {
        const currentZoom = window.devicePixelRatio;
        if (currentZoom !== 1) {
            // Counter the browser zoom
            modal.style.transform = `scale(${1/currentZoom})`;
        } else {
            modal.style.transform = 'scale(1)';
        }
    }
}

// Set up listeners
window.addEventListener('resize', fixModalZoom);
window.addEventListener('DOMContentLoaded', fixModalZoom);

// Fix zoom when modal is displayed
const originalDisplay = document.getElementById('modal').style.display;
Object.defineProperty(document.getElementById('modal').style, 'display', {
    set: function(value) {
        this._display = value;
        if (value === 'flex') {
            setTimeout(fixModalZoom, 0);
        }
    },
    get: function() {
        return this._display;
    }
});
