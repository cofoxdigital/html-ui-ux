// Search Results Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Sample data for search functionality
    const searchData = {
        clients: [
            {
                id: 1,
                name: "Sarah Johnson",
                email: "sarah@email.com",
                program: "Weight Loss Pro",
                status: "Active",
                coach: "Mike Chen",
                avatar: "https://placehold.co/60x60/10B981/FFFFFF?text=SJ",
                type: "client"
            },
            {
                id: 2,
                name: "David Wilson",
                email: "david@email.com",
                program: "Muscle Building",
                status: "Active",
                coach: "Lisa Rodriguez",
                avatar: "https://placehold.co/60x60/3B82F6/FFFFFF?text=DW",
                type: "client"
            },
            {
                id: 3,
                name: "Emma Martinez",
                email: "emma@email.com",
                program: "Nutrition Plan",
                status: "Active",
                coach: "Alex Thompson",
                avatar: "https://placehold.co/60x60/F59E0B/FFFFFF?text=EM",
                type: "client"
            },
            {
                id: 4,
                name: "James Brown",
                email: "james@email.com",
                program: "Strength Training",
                status: "Active",
                coach: "Mike Chen",
                avatar: "https://placehold.co/60x60/EF4444/FFFFFF?text=JB",
                type: "client"
            },
            {
                id: 5,
                name: "Maria Garcia",
                email: "maria@email.com",
                program: "Yoga & Wellness",
                status: "Active",
                coach: "Lisa Rodriguez",
                avatar: "https://placehold.co/60x60/8B5CF6/FFFFFF?text=MG",
                type: "client"
            }
        ],
        coaches: [
            {
                id: 1,
                name: "Mike Chen",
                role: "Senior Coach",
                email: "mike@phoenix.com",
                clients: 45,
                rating: 4.9,
                status: "Active",
                avatar: "https://placehold.co/60x60/10B981/FFFFFF?text=MC",
                type: "coach"
            },
            {
                id: 2,
                name: "Lisa Rodriguez",
                role: "Fitness Coach",
                email: "lisa@phoenix.com",
                clients: 38,
                rating: 4.8,
                status: "Active",
                avatar: "https://placehold.co/60x60/3B82F6/FFFFFF?text=LR",
                type: "coach"
            },
            {
                id: 3,
                name: "Alex Thompson",
                role: "Nutrition Specialist",
                email: "alex@phoenix.com",
                clients: 32,
                rating: 4.9,
                status: "Active",
                avatar: "https://placehold.co/60x60/F59E0B/FFFFFF?text=AT",
                type: "coach"
            },
            {
                id: 4,
                name: "Sarah Kim",
                role: "Wellness Coach",
                email: "sarah.k@phoenix.com",
                clients: 28,
                rating: 4.7,
                status: "Active",
                avatar: "https://placehold.co/60x60/EF4444/FFFFFF?text=SK",
                type: "coach"
            }
        ],
        pages: [
            {
                id: 1,
                name: "Landing Page",
                type: "Marketing Page",
                status: "Published",
                lastModified: "2024-07-15",
                url: "/landing",
                category: "page"
            },
            {
                id: 2,
                name: "About Us",
                type: "Content Page",
                status: "Published",
                lastModified: "2024-07-10",
                url: "/about",
                category: "page"
            },
            {
                id: 3,
                name: "Contact Form",
                type: "Form Page",
                status: "Published",
                lastModified: "2024-07-12",
                url: "/contact",
                category: "page"
            },
            {
                id: 4,
                name: "Pricing Page",
                type: "Sales Page",
                status: "Draft",
                lastModified: "2024-07-16",
                url: "/pricing",
                category: "page"
            }
        ],
        apps: [
            {
                id: 1,
                name: "FitLife Mobile App",
                type: "Mobile App",
                platform: "iOS & Android",
                status: "Published",
                downloads: 1247,
                rating: 4.8,
                category: "app"
            },
            {
                id: 2,
                name: "Client Portal",
                type: "Web App",
                platform: "Web",
                status: "Active",
                users: 247,
                uptime: 99.9,
                category: "app"
            },
            {
                id: 3,
                name: "Coach Dashboard",
                type: "Admin App",
                platform: "Web",
                status: "Active",
                users: 12,
                uptime: 99.8,
                category: "app"
            }
        ],
        websites: [
            {
                id: 1,
                name: "FitLife Website",
                type: "Business Website",
                domain: "fitlife-coaching.com",
                status: "Live",
                visitors: 5432,
                conversion: 12,
                category: "website"
            },
            {
                id: 2,
                name: "Blog Site",
                type: "Content Website",
                domain: "blog.fitlife-coaching.com",
                status: "Live",
                visitors: 2156,
                conversion: 8,
                category: "website"
            },
            {
                id: 3,
                name: "Landing Page Site",
                type: "Marketing Website",
                domain: "join.fitlife-coaching.com",
                status: "Live",
                visitors: 1890,
                conversion: 15,
                category: "website"
            }
        ],
        workflows: [
            {
                id: 1,
                name: "Client Onboarding",
                type: "Automation Workflow",
                status: "Active",
                triggers: 45,
                success_rate: 92,
                category: "workflow"
            },
            {
                id: 2,
                name: "Payment Reminder",
                type: "Email Workflow",
                status: "Active",
                triggers: 23,
                success_rate: 88,
                category: "workflow"
            },
            {
                id: 3,
                name: "Progress Check-in",
                type: "Notification Workflow",
                status: "Active",
                triggers: 67,
                success_rate: 95,
                category: "workflow"
            },
            {
                id: 4,
                name: "Coach Assignment",
                type: "Assignment Workflow",
                status: "Draft",
                triggers: 0,
                success_rate: 0,
                category: "workflow"
            }
        ],
        other: [
            {
                id: 1,
                name: "Analytics Dashboard",
                type: "Report",
                category: "other",
                description: "Monthly performance analytics"
            },
            {
                id: 2,
                name: "API Documentation",
                type: "Documentation",
                category: "other",
                description: "Developer API reference"
            },
            {
                id: 3,
                name: "Training Materials",
                type: "Resource",
                category: "other",
                description: "Coach training resources"
            }
        ]
    };

    // Get search query from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || '';
    
    // Initialize search
    if (searchQuery) {
        document.getElementById('global-search').value = searchQuery;
        performSearch(searchQuery);
    }

    // Search functionality
    document.getElementById('global-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                performSearch(query);
                // Update URL without page reload
                const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
                window.history.pushState({}, '', newUrl);
            }
        }
    });

    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterResults(filter);
        });
    });

    // Notifications functionality
    const notificationsTrigger = document.getElementById('notifications-trigger');
    const notificationsPopup = document.getElementById('notifications-popup');
    const closeNotifications = document.getElementById('close-notifications');

    notificationsTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationsPopup.style.display = notificationsPopup.style.display === 'none' ? 'block' : 'none';
    });

    closeNotifications.addEventListener('click', function() {
        notificationsPopup.style.display = 'none';
    });

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationsPopup.contains(e.target) && !notificationsTrigger.contains(e.target)) {
            notificationsPopup.style.display = 'none';
        }
    });

    // Search function
    function performSearch(query) {
        const results = {
            clients: [],
            coaches: [],
            pages: [],
            apps: [],
            websites: [],
            workflows: [],
            other: []
        };

        const searchTerm = query.toLowerCase();

        // Search clients
        results.clients = searchData.clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm) ||
            client.program.toLowerCase().includes(searchTerm) ||
            client.coach.toLowerCase().includes(searchTerm)
        );

        // Search coaches
        results.coaches = searchData.coaches.filter(coach => 
            coach.name.toLowerCase().includes(searchTerm) ||
            coach.role.toLowerCase().includes(searchTerm) ||
            coach.email.toLowerCase().includes(searchTerm)
        );

        // Search pages
        results.pages = searchData.pages.filter(page => 
            page.name.toLowerCase().includes(searchTerm) ||
            page.type.toLowerCase().includes(searchTerm) ||
            page.url.toLowerCase().includes(searchTerm)
        );

        // Search apps
        results.apps = searchData.apps.filter(app => 
            app.name.toLowerCase().includes(searchTerm) ||
            app.type.toLowerCase().includes(searchTerm) ||
            app.platform.toLowerCase().includes(searchTerm)
        );

        // Search websites
        results.websites = searchData.websites.filter(website => 
            website.name.toLowerCase().includes(searchTerm) ||
            website.type.toLowerCase().includes(searchTerm) ||
            website.domain.toLowerCase().includes(searchTerm)
        );

        // Search workflows
        results.workflows = searchData.workflows.filter(workflow => 
            workflow.name.toLowerCase().includes(searchTerm) ||
            workflow.type.toLowerCase().includes(searchTerm)
        );

        // Search other
        results.other = searchData.other.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.type.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );

        displayResults(results, query);
    }

    // Display search results
    function displayResults(results, query) {
        // Update search info
        document.getElementById('search-query').textContent = `"${query}"`;
        
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        document.getElementById('results-count').textContent = `${totalResults} results found`;

        // Display each section
        displayClientsResults(results.clients);
        displayCoachesResults(results.coaches);
        displayPagesResults(results.pages);
        displayAppsResults(results.apps);
        displayWebsitesResults(results.websites);
        displayWorkflowsResults(results.workflows);
        displayOtherResults(results.other);

        // Show/hide no results message
        const noResults = document.getElementById('no-results');
        if (totalResults === 0) {
            noResults.style.display = 'block';
            document.querySelector('.search-results').style.display = 'none';
        } else {
            noResults.style.display = 'none';
            document.querySelector('.search-results').style.display = 'block';
        }
    }

    // Display clients results
    function displayClientsResults(clients) {
        const container = document.getElementById('clients-results');
        const section = document.getElementById('clients-section');
        const count = document.getElementById('clients-count');
        
        count.textContent = `${clients.length} result${clients.length !== 1 ? 's' : ''}`;
        
        if (clients.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = clients.map(client => `
            <div class="result-card client-card">
                <div class="result-header">
                    <img src="${client.avatar}" alt="${client.name}" class="result-avatar">
                    <div class="result-info">
                        <h3>${client.name}</h3>
                        <p>${client.email}</p>
                        <span class="result-meta">${client.program} • Coach: ${client.coach}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${client.status.toLowerCase()}">${client.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="viewClient(${client.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display coaches results
    function displayCoachesResults(coaches) {
        const container = document.getElementById('coaches-results');
        const section = document.getElementById('coaches-section');
        const count = document.getElementById('coaches-count');
        
        count.textContent = `${coaches.length} result${coaches.length !== 1 ? 's' : ''}`;
        
        if (coaches.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = coaches.map(coach => `
            <div class="result-card coach-card">
                <div class="result-header">
                    <img src="${coach.avatar}" alt="${coach.name}" class="result-avatar">
                    <div class="result-info">
                        <h3>${coach.name}</h3>
                        <p>${coach.role}</p>
                        <span class="result-meta">${coach.clients} clients • ${coach.rating} ⭐</span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${coach.status.toLowerCase()}">${coach.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="viewCoach(${coach.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display pages results
    function displayPagesResults(pages) {
        const container = document.getElementById('pages-results');
        const section = document.getElementById('pages-section');
        const count = document.getElementById('pages-count');
        
        count.textContent = `${pages.length} result${pages.length !== 1 ? 's' : ''}`;
        
        if (pages.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = pages.map(page => `
            <div class="result-card page-card">
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="result-info">
                        <h3>${page.name}</h3>
                        <p>${page.type}</p>
                        <span class="result-meta">${page.url} • Modified: ${formatDate(page.lastModified)}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${page.status.toLowerCase()}">${page.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="editPage(${page.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display apps results
    function displayAppsResults(apps) {
        const container = document.getElementById('apps-results');
        const section = document.getElementById('apps-section');
        const count = document.getElementById('apps-count');
        
        count.textContent = `${apps.length} result${apps.length !== 1 ? 's' : ''}`;
        
        if (apps.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = apps.map(app => `
            <div class="result-card app-card">
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-${app.type === 'Mobile App' ? 'mobile-alt' : 'desktop'}"></i>
                    </div>
                    <div class="result-info">
                        <h3>${app.name}</h3>
                        <p>${app.type} • ${app.platform}</p>
                        <span class="result-meta">
                            ${app.downloads ? `${app.downloads} downloads` : `${app.users} users`} • 
                            ${app.rating ? `${app.rating} ⭐` : `${app.uptime}% uptime`}
                        </span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="manageApp(${app.id})">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display websites results
    function displayWebsitesResults(websites) {
        const container = document.getElementById('websites-results');
        const section = document.getElementById('websites-section');
        const count = document.getElementById('websites-count');
        
        count.textContent = `${websites.length} result${websites.length !== 1 ? 's' : ''}`;
        
        if (websites.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = websites.map(website => `
            <div class="result-card website-card">
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="result-info">
                        <h3>${website.name}</h3>
                        <p>${website.type}</p>
                        <span class="result-meta">${website.domain} • ${website.visitors} visitors • ${website.conversion}% conversion</span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${website.status.toLowerCase()}">${website.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="manageWebsite(${website.id})">
                        <i class="fas fa-external-link-alt"></i> Visit
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display workflows results
    function displayWorkflowsResults(workflows) {
        const container = document.getElementById('workflows-results');
        const section = document.getElementById('workflows-section');
        const count = document.getElementById('workflows-count');
        
        count.textContent = `${workflows.length} result${workflows.length !== 1 ? 's' : ''}`;
        
        if (workflows.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = workflows.map(workflow => `
            <div class="result-card workflow-card">
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div class="result-info">
                        <h3>${workflow.name}</h3>
                        <p>${workflow.type}</p>
                        <span class="result-meta">${workflow.triggers} triggers • ${workflow.success_rate}% success rate</span>
                    </div>
                </div>
                <div class="result-actions">
                    <span class="status ${workflow.status.toLowerCase()}">${workflow.status}</span>
                    <button class="btn btn-sm btn-primary" onclick="editWorkflow(${workflow.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display other results
    function displayOtherResults(other) {
        const container = document.getElementById('other-results');
        const section = document.getElementById('other-section');
        const count = document.getElementById('other-count');
        
        count.textContent = `${other.length} result${other.length !== 1 ? 's' : ''}`;
        
        if (other.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = other.map(item => `
            <div class="result-card other-card">
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="result-info">
                        <h3>${item.name}</h3>
                        <p>${item.type}</p>
                        ${item.description ? `<span class="result-meta">${item.description}</span>` : ''}
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewItem(${item.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter results by category
    function filterResults(filter) {
        const sections = document.querySelectorAll('.search-section');
        
        if (filter === 'all') {
            sections.forEach(section => section.style.display = 'block');
        } else {
            sections.forEach(section => {
                const sectionId = section.id.replace('-section', '');
                if (sectionId === filter) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }
    }

    // Utility functions
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Navigation function
    window.navigateTo = function(url) {
        window.location.href = url;
    };

    // Placeholder action functions
    window.viewClient = function(id) {
        window.location.href = `index.html#clients`;
    };

    window.viewCoach = function(id) {
        window.location.href = `index.html#team`;
    };

    window.editPage = function(id) {
        window.location.href = `page-editor.html?id=${id}`;
    };

    window.manageApp = function(id) {
        window.location.href = `index.html#apps`;
    };

    window.manageWebsite = function(id) {
        window.location.href = `index.html#apps`;
    };

    window.editWorkflow = function(id) {
        alert('Workflow editor coming soon!');
    };

    window.viewItem = function(id) {
        alert('Item viewer coming soon!');
    };
});
