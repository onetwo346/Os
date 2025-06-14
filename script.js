// App Store and Window Management System
let zIndexCounter = 1000;

function getNextZIndex() {
    return ++zIndexCounter;
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize draggable windows and icons
    initializeDraggableElements();
    
    // Initialize desktop icons
    initializeDesktopIcons();
    
    // Initialize App Store
    initializeAppStore();
    
    // Load previously installed apps
    loadInstalledApps();

    // Make all popups draggable
    initializePopupDragging();
});

// Professional Drag System
function initializeDraggableElements() {
    let dragging = false;
    let currentElement = null;
    let startX, startY, elementX, elementY;
    let zIndex = 1000;

    // Initialize all draggable elements
    function initElement(element) {
        const handle = element.classList.contains('window') ? 
            element.querySelector('.title-bar') : element;
        
        // Prevent text selection
        element.style.userSelect = 'none';
        element.style.position = 'absolute';
        
        // Set initial position if not set
        if (!element.style.left) {
            element.style.left = '0px';
            element.style.top = '0px';
        }

        // Mouse events for drag handle
        handle.addEventListener('mousedown', onMouseDown);
        handle.style.cursor = element.classList.contains('window') ? 'move' : 'grab';
    }

    // Initialize existing elements
    document.querySelectorAll('.window, .icon.draggable').forEach(initElement);

    // Mouse event handlers
    function onMouseDown(e) {
        if (e.button !== 0) return; // Left click only
        
        // Find the draggable parent
        currentElement = e.target.closest('.window, .icon.draggable');
        if (!currentElement) return;

        dragging = true;
        currentElement.style.zIndex = ++zIndex;

        // Get initial positions
        startX = e.clientX;
        startY = e.clientY;
        elementX = currentElement.offsetLeft;
        elementY = currentElement.offsetTop;

        // Add active state
        currentElement.classList.add('dragging');
        if (!currentElement.classList.contains('window')) {
            currentElement.style.cursor = 'grabbing';
        }

        // Prevent any default drag behaviors
        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!dragging || !currentElement) return;

        // Calculate new position
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        
        let newX = elementX + dx;
        let newY = elementY + dy;

        // Apply boundary constraints
        const maxX = window.innerWidth - currentElement.offsetWidth;
        const maxY = window.innerHeight - currentElement.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Apply new position with hardware acceleration
        currentElement.style.transform = `translate3d(0,0,0)`;
        currentElement.style.left = `${newX}px`;
        currentElement.style.top = `${newY}px`;
    }

    function onMouseUp(e) {
        if (!currentElement) return;
        
        // Reset states
        dragging = false;
        currentElement.classList.remove('dragging');
        
        if (!currentElement.classList.contains('window')) {
            currentElement.style.cursor = 'grab';
        }
        
        // Prevent click events if we've dragged
        const hasMoved = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
        if (hasMoved) {
            // Add a one-time click interceptor
            const preventNextClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                document.removeEventListener('click', preventNextClick, true);
            };
            document.addEventListener('click', preventNextClick, true);
        }
        
        currentElement = null;
    }

    // Add global event listeners
    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);

    // Handle dynamically added elements
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.classList && 
                    (node.classList.contains('window') || 
                     node.classList.contains('icon') && 
                     node.classList.contains('draggable'))) {
                    initElement(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Draggable Window Functionality
function initializeDesktopIcons() {
    const icons = document.querySelectorAll('.icon.draggable');
    icons.forEach(icon => {
        // No need to add event listeners here, handled by initializeDraggableElements
    });
}

// App Store Implementation
function initializePopupDragging() {
    const popups = document.querySelectorAll('.popup, .notification, .window');
    popups.forEach(popup => {
        if (!popup.classList.contains('draggable-initialized')) {
            makeDraggable(popup);
            popup.classList.add('draggable-initialized');
        }
    });
}

function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    element.addEventListener('mousedown', e => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === element || element.contains(e.target)) {
            isDragging = true;
            element.style.zIndex = getNextZIndex();
        }
    });

    document.addEventListener('mousemove', e => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });

    document.addEventListener('mouseup', () => {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    });
}

function addNotification(message) {
    const list = document.getElementById('notification-list');
    const notif = document.createElement('div');
    notif.className = 'notification draggable';
    notif.innerText = message;
    list.prepend(notif);
    makeDraggable(notif);
    setTimeout(() => notif.remove(), 8000);
}

function initializeAppStore() {
    const appList = document.getElementById('app-list');
    if (!appList) return;

    // Clear existing content
    appList.innerHTML = '';
    
    // Add apps to the store
    apps.forEach(app => {
        const div = document.createElement('div');
        div.className = `app-item ${app.category}`;
        div.innerHTML = `
            <img src="${app.icon}" alt="${app.name} icon">
            <h3>${app.name}</h3>
            <p>${app.desc}</p>
            <button onclick="installApp('${app.id}')">Install</button>
        `;
        appList.appendChild(div);
    });

    // Initialize filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.app-item').forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function generateAppStoreItems() {
    const apps = [
        { name: 'Calculator', icon: 'https://img.icons8.com/nolan/64/calculator.png' },
        { name: 'Notes', icon: 'https://img.icons8.com/nolan/64/notes.png' },
        { name: 'Calendar', icon: 'https://img.icons8.com/nolan/64/calendar.png' },
        { name: 'Weather', icon: 'https://img.icons8.com/nolan/64/weather.png' },
        { name: 'Music', icon: 'https://img.icons8.com/nolan/64/music.png' },
        { name: 'Games', icon: 'https://img.icons8.com/nolan/64/game.png' }
    ];

    return apps.map(app => `
        <div class="app-item">
            <img src="${app.icon}" alt="${app.name}">
            <p>${app.name}</p>
        </div>
    `).join('');
}
