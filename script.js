// Enhanced Dashboard with Full CRUD Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Data Management
    let dashboardData = {
        revenue: 24580,
        revenueGrowth: 12.5,
        retention: 94,
        retentionGrowth: 1.8,
        clients: [
            {
                id: 1,
                name: "Sarah Johnson",
                email: "sarah@email.com",
                program: "Weight Loss Pro",
                status: "Active",
                joinDate: "2024-01-15",
                progress: 75,
                coach: "Mike Chen",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
            },
            {
                id: 2,
                name: "David Wilson",
                email: "david@email.com",
                program: "Muscle Building",
                status: "Active",
                joinDate: "2024-02-20",
                progress: 45,
                coach: "Lisa Rodriguez",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            },
            {
                id: 3,
                name: "Emma Martinez",
                email: "emma@email.com",
                program: "Nutrition Plan",
                status: "Active",
                joinDate: "2024-03-10",
                progress: 90,
                coach: "Alex Thompson",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
            }
        ],
        team: [
            {
                id: 1,
                name: "Mike Chen",
                role: "Senior Coach",
                email: "mike@phoenix.com",
                clients: 45,
                rating: 4.9,
                joinDate: "2023-01-15",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            },
            {
                id: 2,
                name: "Alex Thompson",
                role: "Nutrition Specialist",
                email: "alex@phoenix.com",
                clients: 32,
                rating: 4.9,
                joinDate: "2023-03-20",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
            },
            {
                id: 3,
                name: "Lisa Rodriguez",
                role: "Fitness Coach",
                email: "lisa@phoenix.com",
                clients: 38,
                rating: 4.8,
                joinDate: "2023-02-10",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
            }
        ],
        apps: [
            {
                id: 1,
                name: "FitLife Mobile App",
                type: "Mobile App",
                status: "Published",
                downloads: 1247,
                rating: 4.8,
                lastUpdated: "2024-07-10"
            },
            {
                id: 2,
                name: "FitLife Website",
                type: "Website",
                status: "Live",
                visitors: 5432,
                conversion: 12,
                lastUpdated: "2024-07-15"
            },
            {
                id: 3,
                name: "Client Portal",
                type: "Web App",
                status: "Active",
                users: 247,
                uptime: 99.9,
                lastUpdated: "2024-07-16"
            }
        ]
    };

    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const currentSectionSpan = document.getElementById('current-section');
    
    // Navigation switching
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Render section content
                renderSectionContent(sectionId);
            }
            
            // Update breadcrumb
            const sectionName = this.querySelector('span').textContent;
            currentSectionSpan.textContent = sectionName;
        });
    });

    // Section Content Rendering
    function renderSectionContent(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'clients':
                renderClients();
                break;
            case 'team':
                renderTeam();
                break;
            case 'my-apps':
                renderMyApps();
                break;
            case 'builders':
                renderBuilders();
                break;
            case 'analytics':
                renderAnalytics();
                break;
            case 'settings':
                renderSettings();
                break;
            case 'audit':
                renderAudit();
                break;
        }
    }

    // Dashboard Rendering
    function renderDashboard() {
        const section = document.getElementById('dashboard');
        section.innerHTML = `
            <div class="dashboard-header">
                <h1>Business Overview</h1>
                <div class="dashboard-actions">
                    <button class="btn btn-primary" onclick="addClient()">
                        <i class="fas fa-plus"></i> Add Client
                    </button>
                    <button class="btn btn-secondary" onclick="inviteCoach()">
                        <i class="fas fa-user-plus"></i> Invite Coach
                    </button>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon revenue">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="metric-content">
                        <h3>${formatCurrency(dashboardData.revenue)}</h3>
                        <p>Monthly Revenue</p>
                        <span class="metric-change positive">+${dashboardData.revenueGrowth}%</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon clients">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metric-content">
                        <h3>${dashboardData.clients.length}</h3>
                        <p>Active Clients</p>
                        <span class="metric-change positive">+5 this week</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon retention">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="metric-content">
                        <h3>${dashboardData.retention}%</h3>
                        <p>Retention Rate</p>
                        <span class="metric-change positive">+${dashboardData.retentionGrowth}%</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon team">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="metric-content">
                        <h3>${dashboardData.team.length}</h3>
                        <p>Team Members</p>
                        <span class="metric-change neutral">No change</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-widgets">
                <div class="widget">
                    <h3>Recent Activity</h3>
                    <div class="activity-list">
                        <div class="activity-item">
                            <i class="fas fa-user-plus"></i>
                            <span>New client Sarah Johnson joined Weight Loss Pro</span>
                            <small>2 hours ago</small>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-star"></i>
                            <span>Mike Chen received 5-star rating from David Wilson</span>
                            <small>4 hours ago</small>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-mobile-alt"></i>
                            <span>FitLife Mobile App updated to version 2.1</span>
                            <small>1 day ago</small>
                        </div>
                    </div>
                </div>
                
                <div class="widget">
                    <h3>Quick Stats</h3>
                    <div class="stats-grid">
                        <div class="stat">
                            <span class="stat-value">89%</span>
                            <span class="stat-label">Engagement Rate</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">4.8</span>
                            <span class="stat-label">Avg Rating</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">24min</span>
                            <span class="stat-label">Session Time</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">99.9%</span>
                            <span class="stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Clients Rendering
    function renderClients() {
        const section = document.getElementById('clients');
        section.innerHTML = `
            <div class="section-header">
                <h1>Client Management</h1>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="addClient()">
                        <i class="fas fa-plus"></i> Add Client
                    </button>
                    <button class="btn btn-secondary" onclick="exportClients()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
            
            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients..." id="client-search">
                </div>
                <select id="program-filter">
                    <option value="">All Programs</option>
                    <option value="Weight Loss Pro">Weight Loss Pro</option>
                    <option value="Muscle Building">Muscle Building</option>
                    <option value="Nutrition Plan">Nutrition Plan</option>
                </select>
                <select id="status-filter">
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            
            <div class="clients-table">
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Program</th>
                            <th>Coach</th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clients-tbody">
                        ${renderClientsTable()}
                    </tbody>
                </table>
            </div>
        `;
        
        // Add event listeners for filters
        document.getElementById('client-search').addEventListener('input', filterClients);
        document.getElementById('program-filter').addEventListener('change', filterClients);
        document.getElementById('status-filter').addEventListener('change', filterClients);
    }

    function renderClientsTable() {
        return dashboardData.clients.map(client => `
            <tr>
                <td>
                    <div class="client-info">
                        <img src="${client.avatar}" alt="${client.name}" class="client-avatar">
                        <div>
                            <strong>${client.name}</strong>
                            <small>${client.email}</small>
                        </div>
                    </div>
                </td>
                <td>${client.program}</td>
                <td>${client.coach}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${client.progress}%"></div>
                        <span>${client.progress}%</span>
                    </div>
                </td>
                <td><span class="status ${client.status.toLowerCase()}">${client.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editClient(${client.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="viewClient(${client.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteClient(${client.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Team Rendering
    function renderTeam() {
        const section = document.getElementById('team');
        section.innerHTML = `
            <div class="section-header">
                <h1>Team Management</h1>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="inviteCoach()">
                        <i class="fas fa-user-plus"></i> Invite Coach
                    </button>
                    <button class="btn btn-secondary" onclick="manageRoles()">
                        <i class="fas fa-cog"></i> Manage Roles
                    </button>
                </div>
            </div>
            
            <div class="team-grid">
                ${dashboardData.team.map(member => `
                    <div class="team-card">
                        <div class="team-card-header">
                            <img src="${member.avatar}" alt="${member.name}" class="team-avatar">
                            <div class="team-actions">
                                <button class="btn-icon" onclick="editTeamMember(${member.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" onclick="removeTeamMember(${member.id})" title="Remove">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="team-info">
                            <h3>${member.name}</h3>
                            <p class="role">${member.role}</p>
                            <p class="email">${member.email}</p>
                        </div>
                        <div class="team-stats">
                            <div class="stat">
                                <i class="fas fa-users"></i>
                                <span>${member.clients} clients</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-star"></i>
                                <span>${member.rating} rating</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-calendar"></i>
                                <span>Since ${formatDate(member.joinDate)}</span>
                            </div>
                        </div>
                        <div class="team-status">
                            <span class="status ${member.status.toLowerCase()}">${member.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // CRUD Functions for Clients
    window.addClient = function() {
        showModal('Add New Client', `
            <form id="client-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="client-name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="client-email" required>
                </div>
                <div class="form-group">
                    <label>Program</label>
                    <select id="client-program" required>
                        <option value="">Select Program</option>
                        <option value="Weight Loss Pro">Weight Loss Pro</option>
                        <option value="Muscle Building">Muscle Building</option>
                        <option value="Nutrition Plan">Nutrition Plan</option>
                        <option value="Strength Training">Strength Training</option>
                        <option value="Yoga & Wellness">Yoga & Wellness</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Assign Coach</label>
                    <select id="client-coach" required>
                        <option value="">Select Coach</option>
                        ${dashboardData.team.map(coach => `<option value="${coach.name}">${coach.name} - ${coach.role}</option>`).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Client</button>
                </div>
            </form>
        `);

        document.getElementById('client-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const newClient = {
                id: Date.now(),
                name: document.getElementById('client-name').value,
                email: document.getElementById('client-email').value,
                program: document.getElementById('client-program').value,
                coach: document.getElementById('client-coach').value,
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0],
                progress: 0,
                avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`
            };
            
            dashboardData.clients.push(newClient);
            closeModal();
            renderClients();
            showNotification('Client added successfully!', 'success');
        });
    };

    window.editClient = function(clientId) {
        const client = dashboardData.clients.find(c => c.id === clientId);
        if (!client) return;

        showModal('Edit Client', `
            <form id="edit-client-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="edit-client-name" value="${client.name}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="edit-client-email" value="${client.email}" required>
                </div>
                <div class="form-group">
                    <label>Program</label>
                    <select id="edit-client-program" required>
                        <option value="Weight Loss Pro" ${client.program === 'Weight Loss Pro' ? 'selected' : ''}>Weight Loss Pro</option>
                        <option value="Muscle Building" ${client.program === 'Muscle Building' ? 'selected' : ''}>Muscle Building</option>
                        <option value="Nutrition Plan" ${client.program === 'Nutrition Plan' ? 'selected' : ''}>Nutrition Plan</option>
                        <option value="Strength Training" ${client.program === 'Strength Training' ? 'selected' : ''}>Strength Training</option>
                        <option value="Yoga & Wellness" ${client.program === 'Yoga & Wellness' ? 'selected' : ''}>Yoga & Wellness</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Coach</label>
                    <select id="edit-client-coach" required>
                        ${dashboardData.team.map(coach => `<option value="${coach.name}" ${client.coach === coach.name ? 'selected' : ''}>${coach.name} - ${coach.role}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-client-status" required>
                        <option value="Active" ${client.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${client.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Client</button>
                </div>
            </form>
        `);

        document.getElementById('edit-client-form').addEventListener('submit', function(e) {
            e.preventDefault();
            client.name = document.getElementById('edit-client-name').value;
            client.email = document.getElementById('edit-client-email').value;
            client.program = document.getElementById('edit-client-program').value;
            client.coach = document.getElementById('edit-client-coach').value;
            client.status = document.getElementById('edit-client-status').value;
            
            closeModal();
            renderClients();
            showNotification('Client updated successfully!', 'success');
        });
    };

    window.deleteClient = function(clientId) {
        if (confirm('Are you sure you want to delete this client?')) {
            dashboardData.clients = dashboardData.clients.filter(c => c.id !== clientId);
            renderClients();
            showNotification('Client deleted successfully!', 'success');
        }
    };

    window.viewClient = function(clientId) {
        const client = dashboardData.clients.find(c => c.id === clientId);
        if (!client) return;

        showModal('Client Details', `
            <div class="client-details">
                <div class="client-header">
                    <img src="${client.avatar}" alt="${client.name}" class="client-avatar-large">
                    <div class="client-info">
                        <h2>${client.name}</h2>
                        <p>${client.email}</p>
                        <span class="status ${client.status.toLowerCase()}">${client.status}</span>
                    </div>
                </div>
                <div class="client-stats">
                    <div class="stat">
                        <label>Program</label>
                        <span>${client.program}</span>
                    </div>
                    <div class="stat">
                        <label>Coach</label>
                        <span>${client.coach}</span>
                    </div>
                    <div class="stat">
                        <label>Progress</label>
                        <span>${client.progress}%</span>
                    </div>
                    <div class="stat">
                        <label>Join Date</label>
                        <span>${formatDate(client.joinDate)}</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="editClient(${client.id})">Edit Client</button>
                </div>
            </div>
        `);
    };

    // CRUD Functions for Team
    window.inviteCoach = function() {
        showModal('Invite New Coach', `
            <form id="coach-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="coach-name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="coach-email" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="coach-role" required>
                        <option value="">Select Role</option>
                        <option value="Senior Coach">Senior Coach</option>
                        <option value="Fitness Coach">Fitness Coach</option>
                        <option value="Nutrition Specialist">Nutrition Specialist</option>
                        <option value="Wellness Coach">Wellness Coach</option>
                        <option value="Personal Trainer">Personal Trainer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Client Capacity</label>
                    <input type="number" id="coach-capacity" min="1" max="100" value="30" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Send Invitation</button>
                </div>
            </form>
        `);

        document.getElementById('coach-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const newCoach = {
                id: Date.now(),
                name: document.getElementById('coach-name').value,
                email: document.getElementById('coach-email').value,
                role: document.getElementById('coach-role').value,
                clients: 0,
                rating: 0,
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face`
            };
            
            dashboardData.team.push(newCoach);
            closeModal();
            renderTeam();
            showNotification('Coach invitation sent successfully!', 'success');
        });
    };

    window.editTeamMember = function(memberId) {
        const member = dashboardData.team.find(m => m.id === memberId);
        if (!member) return;

        showModal('Edit Team Member', `
            <form id="edit-member-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="edit-member-name" value="${member.name}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="edit-member-email" value="${member.email}" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="edit-member-role" required>
                        <option value="Senior Coach" ${member.role === 'Senior Coach' ? 'selected' : ''}>Senior Coach</option>
                        <option value="Fitness Coach" ${member.role === 'Fitness Coach' ? 'selected' : ''}>Fitness Coach</option>
                        <option value="Nutrition Specialist" ${member.role === 'Nutrition Specialist' ? 'selected' : ''}>Nutrition Specialist</option>
                        <option value="Wellness Coach" ${member.role === 'Wellness Coach' ? 'selected' : ''}>Wellness Coach</option>
                        <option value="Personal Trainer" ${member.role === 'Personal Trainer' ? 'selected' : ''}>Personal Trainer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-member-status" required>
                        <option value="Active" ${member.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${member.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Member</button>
                </div>
            </form>
        `);

        document.getElementById('edit-member-form').addEventListener('submit', function(e) {
            e.preventDefault();
            member.name = document.getElementById('edit-member-name').value;
            member.email = document.getElementById('edit-member-email').value;
            member.role = document.getElementById('edit-member-role').value;
            member.status = document.getElementById('edit-member-status').value;
            
            closeModal();
            renderTeam();
            showNotification('Team member updated successfully!', 'success');
        });
    };

    window.removeTeamMember = function(memberId) {
        if (confirm('Are you sure you want to remove this team member?')) {
            dashboardData.team = dashboardData.team.filter(m => m.id !== memberId);
            renderTeam();
            showNotification('Team member removed successfully!', 'success');
        }
    };

    // Modal Functions
    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window.closeModal = function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    };

    // Notification Function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Filter Functions
    function filterClients() {
        const searchTerm = document.getElementById('client-search').value.toLowerCase();
        const programFilter = document.getElementById('program-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        const filteredClients = dashboardData.clients.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchTerm) ||
                                client.email.toLowerCase().includes(searchTerm);
            const matchesProgram = !programFilter || client.program === programFilter;
            const matchesStatus = !statusFilter || client.status === statusFilter;
            
            return matchesSearch && matchesProgram && matchesStatus;
        });
        
        // Update table with filtered results
        document.getElementById('clients-tbody').innerHTML = filteredClients.map(client => `
            <tr>
                <td>
                    <div class="client-info">
                        <img src="${client.avatar}" alt="${client.name}" class="client-avatar">
                        <div>
                            <strong>${client.name}</strong>
                            <small>${client.email}</small>
                        </div>
                    </div>
                </td>
                <td>${client.program}</td>
                <td>${client.coach}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${client.progress}%"></div>
                        <span>${client.progress}%</span>
                    </div>
                </td>
                <td><span class="status ${client.status.toLowerCase()}">${client.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editClient(${client.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="viewClient(${client.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteClient(${client.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Additional Functions
    window.exportClients = function() {
        const csvContent = "data:text/csv;charset=utf-8," + 
            "Name,Email,Program,Coach,Progress,Status,Join Date\n" +
            dashboardData.clients.map(client => 
                `${client.name},${client.email},${client.program},${client.coach},${client.progress}%,${client.status},${client.joinDate}`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "clients_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Client data exported successfully!', 'success');
    };

    window.manageRoles = function() {
        showModal('Manage Roles & Permissions', `
            <div class="roles-management">
                <h3>Available Roles</h3>
                <div class="roles-list">
                    <div class="role-item">
                        <strong>Senior Coach</strong>
                        <p>Full access to all client management features</p>
                        <span class="permissions">Permissions: All</span>
                    </div>
                    <div class="role-item">
                        <strong>Fitness Coach</strong>
                        <p>Access to fitness programs and client progress</p>
                        <span class="permissions">Permissions: Client Management, Progress Tracking</span>
                    </div>
                    <div class="role-item">
                        <strong>Nutrition Specialist</strong>
                        <p>Access to nutrition plans and dietary tracking</p>
                        <span class="permissions">Permissions: Nutrition Plans, Diet Tracking</span>
                    </div>
                    <div class="role-item">
                        <strong>Wellness Coach</strong>
                        <p>Access to wellness programs and mental health</p>
                        <span class="permissions">Permissions: Wellness Programs, Mental Health</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="createCustomRole()">Create Custom Role</button>
                </div>
            </div>
        `);
    };

    // Utility Functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    function formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    // Render remaining sections (simplified for now)
    function renderMyApps() {
        const section = document.getElementById('my-apps');
        section.innerHTML = `
            <div class="section-header">
                <h1>My Apps & Websites</h1>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="createApp()">
                        <i class="fas fa-plus"></i> Create New App
                    </button>
                    <button class="btn btn-secondary" onclick="createWebsite()">
                        <i class="fas fa-globe"></i> Create Website
                    </button>
                </div>
            </div>
            <div class="apps-grid">
                ${dashboardData.apps.map(app => `
                    <div class="app-card">
                        <div class="app-header">
                            <div class="app-icon">
                                <i class="fas fa-${app.type === 'Mobile App' ? 'mobile-alt' : app.type === 'Website' ? 'globe' : 'desktop'}"></i>
                            </div>
                            <div class="app-actions">
                                <button class="btn-icon" onclick="editApp(${app.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" onclick="deleteApp(${app.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="app-info">
                            <h3>${app.name}</h3>
                            <p class="app-type">${app.type}</p>
                            <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                        </div>
                        <div class="app-stats">
                            ${app.downloads ? `
                                <div class="stat">
                                    <span class="stat-value">${formatNumber(app.downloads)}</span>
                                    <span class="stat-label">Downloads</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${app.rating}</span>
                                    <span class="stat-label">Rating</span>
                                </div>
                            ` : app.visitors ? `
                                <div class="stat">
                                    <span class="stat-value">${formatNumber(app.visitors)}</span>
                                    <span class="stat-label">Visitors</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${app.conversion}%</span>
                                    <span class="stat-label">Conversion</span>
                                </div>
                            ` : `
                                <div class="stat">
                                    <span class="stat-value">${formatNumber(app.users)}</span>
                                    <span class="stat-label">Users</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${app.uptime}%</span>
                                    <span class="stat-label">Uptime</span>
                                </div>
                            `}
                        </div>
                        <div class="app-footer">
                            <small>Updated ${formatDate(app.lastUpdated)}</small>
                            <button class="btn btn-outline" onclick="launchApp(${app.id})">
                                <i class="fas fa-external-link-alt"></i> Launch
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderBuilders() {
        const section = document.getElementById('builders');
        const builders = [
            {
                name: 'Form Builder',
                icon: 'fas fa-wpforms',
                description: 'Design custom forms and surveys for data collection'
            },
            {
                name: 'Workflow Builder',
                icon: 'fas fa-project-diagram',
                description: 'Automate business processes with visual workflows'
            },
            {
                name: 'Page Builder',
                icon: 'fas fa-file-alt',
                description: 'Create landing pages and marketing content'
            },
            {
                name: 'Widget Builder',
                icon: 'fas fa-puzzle-piece',
                description: 'Build custom widgets and interactive components'
            },
            {
                name: 'Table Builder',
                icon: 'fas fa-table',
                description: 'Create dynamic tables and data displays'
            }
        ];

        section.innerHTML = `
            <div class="section-header">
                <h1>Component Builder Tools</h1>
                <p>Build and customize individual components, forms, pages, and widgets with our intuitive drag-and-drop tools.</p>
            </div>
            <div class="builders-grid">
                ${builders.map(builder => `
                    <div class="builder-card">
                        <div class="builder-icon">
                            <i class="${builder.icon}"></i>
                        </div>
                        <h3>${builder.name}</h3>
                        <p>${builder.description}</p>
                        <button class="btn btn-primary" onclick="launchBuilder('${builder.name}')">
                            <i class="fas fa-rocket"></i> Launch Builder
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderAnalytics() {
        const section = document.getElementById('analytics');
        section.innerHTML = `
            <div class="section-header">
                <h1>Analytics & Reports</h1>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="createReport()">
                        <i class="fas fa-plus"></i> Create Report
                    </button>
                    <button class="btn btn-secondary" onclick="exportAnalytics()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
            <div class="analytics-content">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3>Monthly Recurring Revenue</h3>
                        <div class="big-metric">
                            <span class="value">${formatCurrency(dashboardData.revenue)}</span>
                            <span class="change positive">+${dashboardData.revenueGrowth}%</span>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <h3>Client Engagement</h3>
                        <div class="big-metric">
                            <span class="value">89%</span>
                            <span class="change positive">+3%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSettings() {
        const section = document.getElementById('settings');
        section.innerHTML = `
            <div class="section-header">
                <h1>Settings</h1>
                <p>Manage your account, security, and business preferences.</p>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Profile Information</h3>
                    <form class="settings-form">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" value="John Doe" id="profile-name">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" value="john@phoenix.com" id="profile-email">
                        </div>
                        <button type="button" class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
                    </form>
                </div>
            </div>
        `;
    }

    function renderAudit() {
        const section = document.getElementById('audit');
        section.innerHTML = `
            <div class="section-header">
                <h1>Audit & Security Logs</h1>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="exportAuditLogs()">
                        <i class="fas fa-download"></i> Export Logs
                    </button>
                </div>
            </div>
            <div class="audit-table">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2024-07-17 16:25:00</td>
                            <td>John Doe</td>
                            <td>Client Added</td>
                            <td><span class="status success">Success</span></td>
                        </tr>
                        <tr>
                            <td>2024-07-17 15:45:00</td>
                            <td>Mike Chen</td>
                            <td>Login</td>
                            <td><span class="status success">Success</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // Placeholder functions for buttons
    window.createApp = () => showNotification('App creation feature coming soon!', 'info');
    window.createWebsite = () => showNotification('Website creation feature coming soon!', 'info');
    window.editApp = () => showNotification('App editing feature coming soon!', 'info');
    window.deleteApp = () => showNotification('App deletion feature coming soon!', 'info');
    window.launchApp = () => showNotification('App launched successfully!', 'success');
    window.launchBuilder = (name) => {
        if (name === 'Page Builder') {
            window.location.href = 'pages.html';
        } else if (name === 'Form Builder') {
            window.location.href = 'form-list.html';
        } else if (name === 'Widget Builder') {
            window.location.href = 'widget-list.html';
        } else if (name === 'Workflow Builder') {
            window.location.href = 'workflow-list.html';
        } else {
            showNotification(`${name} launched successfully!`, 'success');
        }
    };
    window.createReport = () => showNotification('Report creation feature coming soon!', 'info');
    window.exportAnalytics = () => showNotification('Analytics exported successfully!', 'success');
    window.saveProfile = () => showNotification('Profile saved successfully!', 'success');
    window.exportAuditLogs = () => showNotification('Audit logs exported successfully!', 'success');
    window.createCustomRole = () => showNotification('Custom role creation feature coming soon!', 'info');

    // Global Search Functionality
    const globalSearchInput = document.querySelector('.search-box input');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    // Redirect to search results page with query
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            }
        });

        // Add search icon click functionality
        const searchIcon = document.querySelector('.search-box i');
        if (searchIcon) {
            searchIcon.addEventListener('click', function() {
                const query = globalSearchInput.value.trim();
                if (query) {
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
    }

    // Notifications functionality
    const notificationsTrigger = document.getElementById('notifications-trigger');
    const notificationsPopup = document.getElementById('notifications-popup');
    const closeNotifications = document.getElementById('close-notifications');

    if (notificationsTrigger && notificationsPopup) {
        notificationsTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPopup.style.display = notificationsPopup.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (closeNotifications) {
        closeNotifications.addEventListener('click', function() {
            notificationsPopup.style.display = 'none';
        });
    }

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationsPopup && notificationsTrigger && 
            !notificationsPopup.contains(e.target) && 
            !notificationsTrigger.contains(e.target)) {
            notificationsPopup.style.display = 'none';
        }
    });

    // Initialize dashboard
    renderDashboard();

    // Chatbot functionality
    const chatbot = document.getElementById('chatbot');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    
    let isCollapsed = false;
    
    // Toggle chatbot
    chatbotToggle.addEventListener('click', function() {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            chatbotBody.classList.add('collapsed');
            this.innerHTML = '<i class="fas fa-plus"></i>';
        } else {
            chatbotBody.classList.remove('collapsed');
            this.innerHTML = '<i class="fas fa-minus"></i>';
        }
    });
    
    // Send message
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const response = generateAIResponse(message);
            addMessage(response, 'bot');
        }, 1000);
    }
    
    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${text}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // AI Response Generator
    function generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('client') || message.includes('add')) {
            return "To add a new client, click the 'Add Client' button in the Clients section. You'll need to enter their basic information, assign a coach, select a program, and set up their initial goals.";
        }
        
        if (message.includes('team') || message.includes('coach')) {
            return "To invite a new coach, go to the Team section and click 'Invite Coach'. Enter their email, assign their role, set permissions, and define their client capacity.";
        }
        
        return "I can help you with client management, team coordination, analytics, and more. What would you like to know?";
    }
    
    // Event listeners
    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize with welcome message
    setTimeout(() => {
        addMessage("Welcome to your Phoenix Enterprise Coach Dashboard! I'm here to help you manage your coaching business. You can ask me about clients, team management, analytics, or any features you'd like to explore.", 'bot');
    }, 1000);
});
