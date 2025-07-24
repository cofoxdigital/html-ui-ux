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

// Handle button clicks for team management
document.addEventListener('DOMContentLoaded', function() {
    // Handle Invite Coach button
    const inviteCoachButtons = document.querySelectorAll('.btn-primary:has(i.fa-user-plus)');
    inviteCoachButtons.forEach(button => {
        if (button.textContent.includes('Invite Coach')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showInviteCoachModal();
            });
        }
    });

    // Handle Manage Roles button
    const manageRolesButtons = document.querySelectorAll('.btn-secondary:has(i.fa-users-cog)');
    manageRolesButtons.forEach(button => {
        if (button.textContent.includes('Manage Roles')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showManageRolesModal();
            });
        }
    });
});

// Function to show Invite Coach modal
function showInviteCoachModal() {
    const modalHTML = `
        <div class="modal-overlay" id="invite-coach-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Invite New Coach</h2>
                    <button class="modal-close" onclick="closeModal('invite-coach-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" class="form-input" placeholder="Enter coach's full name">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" class="form-input" placeholder="coach@example.com">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select class="form-select">
                            <option>Senior Coach</option>
                            <option>Fitness Coach</option>
                            <option>Nutrition Specialist</option>
                            <option>Wellness Coach</option>
                            <option>Assistant Coach</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Specialization</label>
                        <input type="text" class="form-input" placeholder="e.g., Strength Training, Yoga, Weight Loss">
                    </div>
                    <div class="form-group">
                        <label>Message (Optional)</label>
                        <textarea class="form-input" rows="3" placeholder="Add a personal message to the invitation"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="closeModal('invite-coach-modal')">Cancel</button>
                        <button class="btn btn-primary" onclick="sendInvitation()">
                            <i class="fas fa-paper-plane"></i>
                            Send Invitation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Function to show Manage Roles modal
function showManageRolesModal() {
    const modalHTML = `
        <div class="modal-overlay" id="manage-roles-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Manage Team Roles</h2>
                    <button class="modal-close" onclick="closeModal('manage-roles-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="roles-management">
                        <h3>Current Roles</h3>
                        <div class="roles-list">
                            <div class="role-item">
                                <strong>Senior Coach</strong>
                                <p>Full access to all client management features</p>
                                <span class="permissions">Permissions: All</span>
                            </div>
                            <div class="role-item">
                                <strong>Fitness Coach</strong>
                                <p>Can manage assigned clients and create workout plans</p>
                                <span class="permissions">Permissions: Client Management, Workout Plans</span>
                            </div>
                            <div class="role-item">
                                <strong>Nutrition Specialist</strong>
                                <p>Can manage nutrition plans and dietary consultations</p>
                                <span class="permissions">Permissions: Nutrition Plans, Client Consultations</span>
                            </div>
                            <div class="role-item">
                                <strong>Wellness Coach</strong>
                                <p>Can manage wellness programs and mindfulness sessions</p>
                                <span class="permissions">Permissions: Wellness Programs, Session Management</span>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-outline" onclick="closeModal('manage-roles-modal')">Close</button>
                            <button class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Create New Role
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Function to close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Function to send invitation
function sendInvitation() {
    showNotification('Invitation sent successfully!', 'success');
    closeModal('invite-coach-modal');
}

// Make functions globally available
window.showInviteCoachModal = showInviteCoachModal;
window.showManageRolesModal = showManageRolesModal;
window.closeModal = closeModal;
window.sendInvitation = sendInvitation;

// Initialize charts when analytics section is shown
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && !revenueCtx.chart) {
        revenueCtx.chart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Monthly Revenue',
                    data: [18500, 19200, 20800, 21500, 23200, 24580],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Engagement Chart
    const engagementCtx = document.getElementById('engagementChart');
    if (engagementCtx && !engagementCtx.chart) {
        engagementCtx.chart = new Chart(engagementCtx, {
            type: 'doughnut',
            data: {
                labels: ['Daily Active', 'Weekly Active', 'Monthly Active', 'Inactive'],
                datasets: [{
                    data: [89, 7, 3, 1],
                    backgroundColor: [
                        '#4f46e5',
                        '#7c3aed',
                        '#a78bfa',
                        '#e0e7ff'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx && !performanceCtx.chart) {
        performanceCtx.chart = new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: ['Load Time', 'Response Time', 'Error Rate', 'Uptime'],
                datasets: [{
                    label: 'Current',
                    data: [1.2, 0.8, 0.1, 99.9],
                    backgroundColor: '#4f46e5',
                    borderRadius: 4
                }, {
                    label: 'Target',
                    data: [1.5, 1.0, 0.5, 99.5],
                    backgroundColor: '#e0e7ff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Coach Performance Chart
    const coachCtx = document.getElementById('coachChart');
    if (coachCtx && !coachCtx.chart) {
        coachCtx.chart = new Chart(coachCtx, {
            type: 'radar',
            data: {
                labels: ['Client Satisfaction', 'Retention Rate', 'Goal Achievement', 'Response Time', 'Session Quality'],
                datasets: [{
                    label: 'Team Average',
                    data: [4.8, 4.6, 4.7, 4.5, 4.9],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Update the showSection function to initialize charts when analytics is shown
const originalShowSection = window.showSection;
window.showSection = function(sectionId) {
    originalShowSection(sectionId);
    
    if (sectionId === 'analytics') {
        // Small delay to ensure DOM is ready
        setTimeout(initializeCharts, 100);
    }
};

// Update record counts based on actual data
function updateRecordCounts() {
    // Count clients from the table
    const clientRows = document.querySelectorAll('#clients tbody tr');
    const clientCount = clientRows.length;
    const clientCountElement = document.getElementById('clients-count');
    if (clientCountElement) {
        clientCountElement.textContent = clientCount;
    }
    
    // Count team members from the cards
    const teamCards = document.querySelectorAll('#team .team-card');
    const teamCount = teamCards.length;
    const teamCountElement = document.getElementById('team-count');
    if (teamCountElement) {
        teamCountElement.textContent = teamCount;
    }
}

// Call updateRecordCounts when DOM is loaded
document.addEventListener('DOMContentLoaded', updateRecordCounts);
