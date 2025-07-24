// Navigation functionality for Phoenix Enterprise Platform

// Function to show a specific section
function showSection(sectionId) {
    // Hide all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }
    
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
}

// Handle navigation menu clicks
document.addEventListener('DOMContentLoaded', function() {
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // If we're on index.html, show the section
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                showSection(section);
                // Update URL hash without page reload
                window.history.pushState(null, '', `#${section}`);
            } else {
                // Navigate to index.html with the section hash
                window.location.href = `index.html#${section}`;
            }
        });
    });
    
    // Handle initial page load with hash
    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
            showSection(hash);
        } else if (!hash && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
            // Show dashboard by default
            showSection('dashboard');
        }
    }
    
    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle initial load
    handleHashChange();

    // Handle notifications popup
    const notificationsTrigger = document.getElementById('notifications-trigger');
    const notificationsPopup = document.getElementById('notifications-popup');
    const closeNotifications = document.getElementById('close-notifications');

    if (notificationsTrigger && notificationsPopup) {
        notificationsTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPopup.style.display = notificationsPopup.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (closeNotifications && notificationsPopup) {
        closeNotifications.addEventListener('click', function() {
            notificationsPopup.style.display = 'none';
        });
    }

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationsPopup && !notificationsPopup.contains(e.target) && e.target !== notificationsTrigger) {
            notificationsPopup.style.display = 'none';
        }
    });

    // Handle search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Handle user profile dropdown (if needed in future)
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            // Future implementation for user profile dropdown
        });
    }

    // Set active navigation item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentHash = window.location.hash.substring(1);
    
    navItems.forEach(item => {
        const section = item.dataset.section;
        
        // Check if this is the active section
        if (currentPage === 'index.html') {
            if ((!currentHash && section === 'dashboard') || currentHash === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        } else {
            // For other pages, check if it's a builder page
            if (section === 'builders' && (
                currentPage.includes('form-') || 
                currentPage.includes('widget-') || 
                currentPage.includes('workflow-') || 
                currentPage.includes('page')
            )) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
});

// Utility function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        background: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };
    
    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.color = textColors[type] || textColors.info;
    notification.style.border = `1px solid ${colors[type] || colors.info}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Export for use in other scripts
window.showNotification = showNotification;
