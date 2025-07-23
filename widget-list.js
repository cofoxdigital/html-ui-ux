// Widget List Management
class WidgetManager {
    constructor() {
        this.widgets = this.loadWidgets();
        this.filteredWidgets = [...this.widgets];
        this.init();
    }

    init() {
        this.renderWidgets();
        this.updateStats();
        this.setupEventListeners();
        this.setupFilters();
        
        // Initialize with sample widgets if none exist
        if (this.widgets.length === 0) {
            this.createSampleWidgets();
        }
    }

    // Local Storage Management
    loadWidgets() {
        try {
            const stored = localStorage.getItem('phoenix_widgets');
            return stored ? JSON.parse(stored).widgets || [] : [];
        } catch (error) {
            console.error('Error loading widgets:', error);
            return [];
        }
    }

    saveWidgets() {
        try {
            localStorage.setItem('phoenix_widgets', JSON.stringify({
                widgets: this.widgets,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving widgets:', error);
        }
    }

    // Widget CRUD Operations
    createWidget(widgetData) {
        const widget = {
            id: this.generateId(),
            name: widgetData.name,
            description: widgetData.description,
            category: widgetData.category,
            template: widgetData.template,
            status: 'draft',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            usageCount: 0,
            definition: this.getTemplateDefinition(widgetData.template)
        };

        this.widgets.push(widget);
        this.saveWidgets();
        this.renderWidgets();
        this.updateStats();
        
        return widget;
    }

    updateWidget(id, updates) {
        const index = this.widgets.findIndex(w => w.id === id);
        if (index !== -1) {
            this.widgets[index] = {
                ...this.widgets[index],
                ...updates,
                updated: new Date().toISOString()
            };
            this.saveWidgets();
            this.renderWidgets();
            this.updateStats();
        }
    }

    deleteWidget(id) {
        this.widgets = this.widgets.filter(w => w.id !== id);
        this.saveWidgets();
        this.renderWidgets();
        this.updateStats();
    }

    publishWidget(id) {
        this.updateWidget(id, { 
            status: 'published',
            published: new Date().toISOString()
        });
    }

    duplicateWidget(id) {
        const original = this.widgets.find(w => w.id === id);
        if (original) {
            const duplicate = {
                ...original,
                id: this.generateId(),
                name: `${original.name} (Copy)`,
                status: 'draft',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                usageCount: 0
            };
            this.widgets.push(duplicate);
            this.saveWidgets();
            this.renderWidgets();
            this.updateStats();
        }
    }

    // Template Definitions
    getTemplateDefinition(template) {
        const templates = {
            blank: {
                type: 'container',
                components: [],
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px'
                }
            },
            kpi: {
                type: 'kpi-metric',
                components: [
                    {
                        type: 'metric-value',
                        props: {
                            value: '24,580',
                            label: 'Monthly Revenue',
                            change: '+12.5%',
                            changeType: 'positive'
                        }
                    }
                ],
                styling: {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px'
                }
            },
            chart: {
                type: 'chart-widget',
                components: [
                    {
                        type: 'line-chart',
                        props: {
                            data: [24580, 26200, 28100, 25900, 27800, 29500],
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                            title: 'Revenue Trend'
                        }
                    }
                ],
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            actions: {
                type: 'action-group',
                components: [
                    {
                        type: 'button',
                        props: { text: 'Add Client', icon: 'fas fa-user-plus', color: 'primary' }
                    },
                    {
                        type: 'button',
                        props: { text: 'Schedule', icon: 'fas fa-calendar', color: 'secondary' }
                    },
                    {
                        type: 'button',
                        props: { text: 'Message', icon: 'fas fa-envelope', color: 'success' }
                    }
                ],
                styling: {
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px'
                }
            }
        };

        return templates[template] || templates.blank;
    }

    // Sample Data Creation
    createSampleWidgets() {
        const sampleWidgets = [
            {
                name: 'Revenue Dashboard',
                description: 'Monthly revenue tracking with growth indicators',
                category: 'analytics',
                template: 'kpi'
            },
            {
                name: 'Client Progress Chart',
                description: 'Visual representation of client progress over time',
                category: 'analytics',
                template: 'chart'
            },
            {
                name: 'Quick Actions Panel',
                description: 'Common actions for daily operations',
                category: 'actions',
                template: 'actions'
            },
            {
                name: 'Performance Metrics',
                description: 'Key performance indicators for business health',
                category: 'analytics',
                template: 'kpi'
            }
        ];

        sampleWidgets.forEach(widget => {
            const created = this.createWidget(widget);
            // Publish some widgets
            if (Math.random() > 0.5) {
                this.publishWidget(created.id);
            }
            // Add some usage
            created.usageCount = Math.floor(Math.random() * 10);
        });
    }

    // Utility Functions
    generateId() {
        return 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInHours < 48) return 'Yesterday';
        return this.formatDate(dateString);
    }

    getCategoryIcon(category) {
        const icons = {
            analytics: 'fas fa-chart-line',
            actions: 'fas fa-bolt',
            display: 'fas fa-th-large',
            interactive: 'fas fa-hand-pointer'
        };
        return icons[category] || 'fas fa-puzzle-piece';
    }

    // Rendering Functions
    renderWidgets() {
        const grid = document.getElementById('widgets-grid');
        
        if (this.filteredWidgets.length === 0) {
            grid.innerHTML = `
                <div class="no-widgets">
                    <i class="fas fa-puzzle-piece"></i>
                    <h3>No widgets found</h3>
                    <p>Create your first widget to get started with building interactive dashboard components.</p>
                    <button class="btn btn-primary create-new-widget-btn" onclick="createNewWidget()">
                        <i class="fas fa-plus"></i>
                        Create New Widget
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredWidgets.map(widget => `
            <div class="widget-card" data-widget-id="${widget.id}">
                <div class="widget-card-header">
                    <div class="widget-status ${widget.status}">
                        <i class="fas fa-${widget.status === 'published' ? 'rocket' : 'edit'}"></i>
                        ${widget.status.charAt(0).toUpperCase() + widget.status.slice(1)}
                    </div>
                    <div class="widget-actions">
                        <button class="btn-icon" onclick="editWidget('${widget.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon dropdown-toggle" onclick="toggleWidgetMenu('${widget.id}')" title="More actions">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" id="menu-${widget.id}">
                            <button class="dropdown-item" onclick="duplicateWidget('${widget.id}')">
                                <i class="fas fa-copy"></i> Duplicate
                            </button>
                            <button class="dropdown-item" onclick="exportWidget('${widget.id}')">
                                <i class="fas fa-download"></i> Export
                            </button>
                            ${widget.status === 'draft' ? 
                                `<button class="dropdown-item" onclick="publishWidget('${widget.id}')">
                                    <i class="fas fa-rocket"></i> Publish
                                </button>` : ''
                            }
                            <hr>
                            <button class="dropdown-item text-danger" onclick="deleteWidget('${widget.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
                <div class="widget-card-content">
                    <div class="widget-icon ${widget.category}">
                        <i class="${this.getCategoryIcon(widget.category)}"></i>
                    </div>
                    <h3>${widget.name}</h3>
                    <p>${widget.description}</p>
                    <div class="widget-meta">
                        <span class="widget-category ${widget.category}">${widget.category}</span>
                        <span><i class="fas fa-calendar"></i> Created ${this.formatDate(widget.created)}</span>
                        <span><i class="fas fa-clock"></i> Updated ${this.getTimeAgo(widget.updated)}</span>
                    </div>
                    <div class="widget-stats">
                        <div class="stat">
                            <span class="stat-number">${widget.usageCount}</span>
                            <span class="stat-label">Used</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${widget.definition.components?.length || 0}</span>
                            <span class="stat-label">Components</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${widget.template}</span>
                            <span class="stat-label">Template</span>
                        </div>
                    </div>
                </div>
                <div class="widget-card-footer">
                    <button class="btn btn-outline btn-sm" onclick="previewWidget('${widget.id}')">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="editWidget('${widget.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const totalWidgets = this.widgets.length;
        const publishedWidgets = this.widgets.filter(w => w.status === 'published').length;
        const totalUsage = this.widgets.reduce((sum, w) => sum + w.usageCount, 0);
        
        // Find most popular category
        const categoryCount = this.widgets.reduce((acc, w) => {
            acc[w.category] = (acc[w.category] || 0) + 1;
            return acc;
        }, {});
        const popularCategory = Object.keys(categoryCount).reduce((a, b) => 
            categoryCount[a] > categoryCount[b] ? a : b, 'Analytics'
        );

        document.getElementById('total-widgets').textContent = totalWidgets;
        document.getElementById('published-widgets').textContent = publishedWidgets;
        document.getElementById('widget-usage').textContent = totalUsage;
        document.getElementById('popular-category').textContent = 
            popularCategory.charAt(0).toUpperCase() + popularCategory.slice(1);
    }

    // Event Listeners
    setupEventListeners() {
        // Modal event listeners
        document.getElementById('close-create-modal').addEventListener('click', () => {
            document.getElementById('create-widget-modal').style.display = 'none';
        });

        document.getElementById('cancel-create').addEventListener('click', () => {
            document.getElementById('create-widget-modal').style.display = 'none';
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            document.getElementById('delete-widget-modal').style.display = 'none';
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            document.getElementById('delete-widget-modal').style.display = 'none';
        });

        // Template selection
        document.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.template-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Form submission
        document.getElementById('create-widget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('widget-name').value,
                description: document.getElementById('widget-description').value,
                category: document.getElementById('widget-category').value,
                template: document.querySelector('.template-option.active').dataset.template
            };

            const widget = this.createWidget(formData);
            document.getElementById('create-widget-modal').style.display = 'none';
            
            // Redirect to widget builder
            window.location.href = `widget-builder.html?id=${widget.id}`;
        });

        // Delete confirmation
        document.getElementById('confirm-delete').addEventListener('click', () => {
            const widgetId = document.getElementById('confirm-delete').dataset.widgetId;
            this.deleteWidget(widgetId);
            document.getElementById('delete-widget-modal').style.display = 'none';
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    setupFilters() {
        const searchInput = document.getElementById('widget-search');
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');

        const applyFilters = () => {
            let filtered = [...this.widgets];

            // Search filter
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                filtered = filtered.filter(widget => 
                    widget.name.toLowerCase().includes(searchTerm) ||
                    widget.description.toLowerCase().includes(searchTerm) ||
                    widget.category.toLowerCase().includes(searchTerm)
                );
            }

            // Status filter
            const statusValue = statusFilter.value;
            if (statusValue) {
                filtered = filtered.filter(widget => widget.status === statusValue);
            }

            // Category filter
            const categoryValue = categoryFilter.value;
            if (categoryValue) {
                filtered = filtered.filter(widget => widget.category === categoryValue);
            }

            // Sort
            const sortValue = sortFilter.value;
            filtered.sort((a, b) => {
                switch (sortValue) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'created':
                        return new Date(b.created) - new Date(a.created);
                    case 'usage':
                        return b.usageCount - a.usageCount;
                    case 'updated':
                    default:
                        return new Date(b.updated) - new Date(a.updated);
                }
            });

            this.filteredWidgets = filtered;
            this.renderWidgets();
        };

        searchInput.addEventListener('input', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        categoryFilter.addEventListener('change', applyFilters);
        sortFilter.addEventListener('change', applyFilters);
    }
}

// Global Functions
function createNewWidget() {
    document.getElementById('create-widget-modal').style.display = 'flex';
    document.getElementById('widget-name').focus();
}

function editWidget(id) {
    window.location.href = `widget-builder.html?id=${id}`;
}

function deleteWidget(id) {
    const widget = widgetManager.widgets.find(w => w.id === id);
    if (widget) {
        document.getElementById('delete-widget-name').textContent = widget.name;
        document.getElementById('delete-widget-description').textContent = widget.description;
        document.getElementById('confirm-delete').dataset.widgetId = id;
        document.getElementById('delete-widget-modal').style.display = 'flex';
    }
}

function duplicateWidget(id) {
    widgetManager.duplicateWidget(id);
    toggleWidgetMenu(id); // Close the menu
}

function publishWidget(id) {
    widgetManager.publishWidget(id);
    toggleWidgetMenu(id); // Close the menu
}

function previewWidget(id) {
    // TODO: Implement widget preview
    console.log('Preview widget:', id);
}

function exportWidget(id) {
    const widget = widgetManager.widgets.find(w => w.id === id);
    if (widget) {
        const dataStr = JSON.stringify(widget, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${widget.name.replace(/\s+/g, '_')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
    toggleWidgetMenu(id); // Close the menu
}

function importWidget() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const widget = JSON.parse(e.target.result);
                    // Remove ID to create new widget
                    delete widget.id;
                    widget.name = `${widget.name} (Imported)`;
                    widgetManager.createWidget(widget);
                } catch (error) {
                    alert('Error importing widget: Invalid file format');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function toggleWidgetMenu(id) {
    const menu = document.getElementById(`menu-${id}`);
    const isVisible = menu.style.display === 'block';
    
    // Close all menus
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
    
    // Toggle current menu
    menu.style.display = isVisible ? 'none' : 'block';
}

// AI Chatbot Functionality
class WidgetChatbot {
    constructor() {
        this.isMinimized = false;
        this.isTyping = false;
        this.responses = {
            // Widget-specific responses
            widget: [
                "Widgets are reusable dashboard components that display data and provide interactive functionality. They can show KPIs, charts, forms, or action buttons.",
                "You can create widgets using our drag-and-drop builder. Choose from templates like KPI metrics, charts, action panels, or start with a blank widget.",
                "Widgets help you build interactive dashboards quickly. Each widget can be customized with different data sources, styling, and behaviors."
            ],
            create: [
                "To create a new widget, click the 'Create New Widget' button. Choose a template (KPI, Chart, Actions, or Blank) and customize it with your data.",
                "Start by selecting a widget template that matches your needs. KPI widgets are great for metrics, Chart widgets for data visualization, and Action widgets for interactive buttons.",
                "The widget creation process is simple: 1) Choose a template, 2) Configure your data source, 3) Customize the styling, 4) Test and publish!"
            ],
            template: [
                "We offer several widget templates: KPI Metrics (for displaying key numbers), Chart Widgets (for data visualization), Action Panels (for interactive buttons), and Blank widgets (for custom designs).",
                "KPI templates are perfect for showing metrics like revenue, user counts, or performance indicators. Chart templates support line charts, bar charts, and pie charts.",
                "Action templates create button groups for common operations like 'Add Client', 'Send Message', or 'Generate Report'. Choose based on your dashboard needs."
            ],
            data: [
                "Widgets can connect to various data sources including APIs, databases, CSV files, or static data. Configure data connections in the widget builder.",
                "You can bind widget components to dynamic data sources. For example, connect a KPI widget to your sales API to show real-time revenue numbers.",
                "Data binding is flexible - use REST APIs, GraphQL endpoints, or upload CSV files. The widget will automatically refresh when data changes."
            ],
            style: [
                "Customize widget appearance with our styling options: colors, fonts, spacing, borders, and backgrounds. Each template has pre-designed themes you can modify.",
                "Widget styling supports CSS customization, color themes, responsive layouts, and brand consistency. Make widgets match your company's design system.",
                "Use the visual editor to adjust colors, typography, spacing, and layout. Preview changes in real-time before publishing your widget."
            ],
            publish: [
                "Publishing makes your widget available for use in dashboards. Draft widgets are only visible to you, while published widgets can be shared with your team.",
                "Before publishing, test your widget thoroughly. Check data connections, verify styling, and ensure it works on different screen sizes.",
                "Published widgets appear in the widget library where team members can add them to their dashboards. You can unpublish or update widgets anytime."
            ],
            analytics: [
                "Analytics widgets display data visualizations like charts, graphs, and metrics. They're perfect for showing trends, comparisons, and key performance indicators.",
                "Use analytics widgets to create dashboards that track business metrics, user engagement, sales performance, or any data-driven insights your team needs.",
                "Analytics widgets support real-time data updates, interactive filtering, and drill-down capabilities for deeper data exploration."
            ],
            actions: [
                "Action widgets provide interactive buttons and controls for common operations. They can trigger workflows, open forms, send notifications, or navigate to other pages.",
                "Create action widgets for frequently used functions like 'Add New Client', 'Generate Report', 'Send Email', or 'Schedule Meeting'.",
                "Action widgets can be configured with custom logic, API calls, form submissions, or navigation actions. They make dashboards more interactive and functional."
            ],
            help: [
                "I can help you with widget creation, data binding, styling, publishing, and troubleshooting. Ask me about specific widget types or features you'd like to implement.",
                "Need assistance with widget building? I can guide you through templates, data connections, styling options, or publishing workflows.",
                "I'm here to help with all aspects of widget development. Whether you're a beginner or advanced user, I can provide guidance and best practices."
            ],
            default: [
                "I'm here to help you build amazing widgets! Ask me about widget templates, data connections, styling, or any other widget-related questions.",
                "I can assist with widget creation, customization, and publishing. What specific aspect of widget building would you like to know more about?",
                "Feel free to ask about widget types, data integration, design options, or troubleshooting. I'm your widget building assistant!"
            ]
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleChatbot());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + C to toggle chatbot
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.toggleChatbot();
            }
        });
    }

    toggleChatbot() {
        const chatbot = document.getElementById('chatbot');
        const body = document.getElementById('chatbot-body');
        const toggle = document.getElementById('chatbot-toggle');
        
        if (!chatbot || !body || !toggle) return;

        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            body.style.display = 'none';
            toggle.innerHTML = '<i class="fas fa-plus"></i>';
            chatbot.style.height = 'auto';
        } else {
            body.style.display = 'flex';
            toggle.innerHTML = '<i class="fas fa-minus"></i>';
            chatbot.style.height = '400px';
        }
    }

    sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate response after delay
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000);
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${content}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Pattern matching for widget-specific responses
        if (lowerMessage.includes('widget') && (lowerMessage.includes('what') || lowerMessage.includes('explain'))) {
            return this.getRandomResponse('widget');
        }
        
        if (lowerMessage.includes('create') || lowerMessage.includes('new') || lowerMessage.includes('build')) {
            return this.getRandomResponse('create');
        }
        
        if (lowerMessage.includes('template') || lowerMessage.includes('type')) {
            return this.getRandomResponse('template');
        }
        
        if (lowerMessage.includes('data') || lowerMessage.includes('connect') || lowerMessage.includes('source')) {
            return this.getRandomResponse('data');
        }
        
        if (lowerMessage.includes('style') || lowerMessage.includes('design') || lowerMessage.includes('color') || lowerMessage.includes('theme')) {
            return this.getRandomResponse('style');
        }
        
        if (lowerMessage.includes('publish') || lowerMessage.includes('share') || lowerMessage.includes('deploy')) {
            return this.getRandomResponse('publish');
        }
        
        if (lowerMessage.includes('analytics') || lowerMessage.includes('chart') || lowerMessage.includes('graph') || lowerMessage.includes('metric')) {
            return this.getRandomResponse('analytics');
        }
        
        if (lowerMessage.includes('action') || lowerMessage.includes('button') || lowerMessage.includes('interactive')) {
            return this.getRandomResponse('actions');
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('guide')) {
            return this.getRandomResponse('help');
        }
        
        return this.getRandomResponse('default');
    }

    getRandomResponse(category) {
        const responses = this.responses[category] || this.responses.default;
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Navigation functionality
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Navigate based on section
            switch(section) {
                case 'dashboard':
                    window.location.href = 'index.html';
                    break;
                case 'clients':
                    // TODO: Navigate to clients page
                    console.log('Navigate to clients');
                    break;
                case 'team':
                    // TODO: Navigate to team page
                    console.log('Navigate to team');
                    break;
                case 'apps':
                    // TODO: Navigate to apps page
                    console.log('Navigate to apps');
                    break;
                case 'builders':
                    // Stay on current page (widget list)
                    break;
                case 'platform':
                    // TODO: Navigate to platform builder
                    console.log('Navigate to platform builder');
                    break;
                case 'analytics':
                    // TODO: Navigate to analytics
                    console.log('Navigate to analytics');
                    break;
                case 'settings':
                    // TODO: Navigate to settings
                    console.log('Navigate to settings');
                    break;
                case 'audit':
                    // TODO: Navigate to audit
                    console.log('Navigate to audit');
                    break;
                default:
                    console.log('Unknown section:', section);
            }
        });
    });
}

// Initialize Widget Manager
let widgetManager;
let widgetChatbot;

document.addEventListener('DOMContentLoaded', () => {
    widgetManager = new WidgetManager();
    widgetChatbot = new WidgetChatbot();
    setupNavigation();
});
