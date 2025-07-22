// Form List Management
class FormListManager {
    constructor() {
        this.forms = [];
        this.filteredForms = [];
        this.currentFilter = {
            search: '',
            status: '',
            category: '',
            sort: 'updated'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadForms();
        this.renderForms();
    }

    setupEventListeners() {
        // Create new form buttons (there are multiple)
        document.querySelectorAll('[onclick="createNewForm()"]').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', () => {
                this.showCreateModal();
            });
        });

        // Modal close buttons
        document.getElementById('close-create-modal').addEventListener('click', () => {
            this.hideCreateModal();
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Modal cancel buttons
        document.getElementById('cancel-create').addEventListener('click', () => {
            this.hideCreateModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Create form submission
        document.getElementById('create-form-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createForm();
        });

        // Delete confirmation
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteForm();
        });

        // Template selection
        document.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Filter inputs
        document.getElementById('form-search').addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value;
            this.applyFilters();
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.currentFilter.sort = e.target.value;
            this.applyFilters();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section === 'dashboard') {
                    window.location.href = 'index.html';
                } else if (section !== 'builders') {
                    window.location.href = `index.html#${section}`;
                }
            });
        });

        // Initialize chatbot functionality (ensure it doesn't conflict with main script)
        this.initializeChatbot();

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });
    }

    loadForms() {
        // Load saved forms from localStorage
        this.forms = [];
        
        // Get all localStorage keys that start with 'form_'
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('form_') && !key.includes('_autosave')) {
                try {
                    const formData = JSON.parse(localStorage.getItem(key));
                    if (formData && formData.id && formData.name) {
                        // Convert form data to list format
                        const listForm = {
                            id: formData.id,
                            name: formData.name,
                            description: `Form with ${formData.elements ? formData.elements.length : 0} elements`,
                            category: this.getCategoryFromElements(formData.elements || []),
                            status: 'draft', // All saved forms are drafts since we removed auto-save
                            created: formData.createdAt || formData.updatedAt || new Date().toISOString().split('T')[0],
                            updated: formData.updatedAt ? formData.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                            views: 0,
                            submissions: 0,
                            conversion: 0,
                            elements: formData.elements || []
                        };
                        this.forms.push(listForm);
                    }
                } catch (error) {
                    console.error('Error parsing form data:', error);
                }
            }
        }

        // Sort forms by updated date (newest first)
        this.forms.sort((a, b) => new Date(b.updated) - new Date(a.updated));

        this.filteredForms = [...this.forms];
    }

    getCategoryFromElements(elements) {
        // Determine category based on form elements
        if (!elements || elements.length === 0) return 'other';
        
        const hasEmail = elements.some(el => el.type === 'email');
        const hasPhone = elements.some(el => el.type === 'phone');
        const hasRating = elements.some(el => el.type === 'rating');
        const hasFile = elements.some(el => el.type === 'file');
        
        if (hasEmail && hasPhone) return 'contact';
        if (hasRating) return 'survey';
        if (hasFile) return 'registration';
        
        return 'other';
    }

    applyFilters() {
        this.filteredForms = this.forms.filter(form => {
            const matchesSearch = !this.currentFilter.search || 
                form.name.toLowerCase().includes(this.currentFilter.search.toLowerCase()) ||
                form.description.toLowerCase().includes(this.currentFilter.search.toLowerCase());
            
            const matchesStatus = !this.currentFilter.status || form.status === this.currentFilter.status;
            const matchesCategory = !this.currentFilter.category || form.category === this.currentFilter.category;

            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Apply sorting
        this.filteredForms.sort((a, b) => {
            switch (this.currentFilter.sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return new Date(b.created) - new Date(a.created);
                case 'updated':
                    return new Date(b.updated) - new Date(a.updated);
                case 'submissions':
                    return b.submissions - a.submissions;
                default:
                    return new Date(b.updated) - new Date(a.updated);
            }
        });

        this.renderForms();
    }

    renderForms() {
        const formsGrid = document.getElementById('forms-grid');
        
        // Update statistics
        this.updateStatistics();
        
        if (this.filteredForms.length === 0) {
            formsGrid.innerHTML = `
                <div class="no-forms">
                    <i class="fas fa-file-alt"></i>
                    <h3>No forms found</h3>
                    <p>Try adjusting your filters or create a new form to get started.</p>
                    <button class="btn btn-primary create-new-form-btn">
                        <i class="fas fa-plus"></i>
                        Create New Form
                    </button>
                </div>
            `;
            
            // Add event listener to the dynamically created button
            const createBtn = formsGrid.querySelector('.create-new-form-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCreateModal();
                });
            }
            return;
        }

        formsGrid.innerHTML = this.filteredForms.map(form => this.renderFormCard(form)).join('');
        
        // Add event listeners to form cards
        this.attachFormCardListeners();
    }

    updateStatistics() {
        // Calculate statistics from actual forms data
        const totalForms = this.forms.length;
        const totalViews = this.forms.reduce((sum, form) => sum + (form.views || 0), 0);
        const totalSubmissions = this.forms.reduce((sum, form) => sum + (form.submissions || 0), 0);
        const avgConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) : 0;

        // Update the stat cards
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('h3').textContent = totalForms;
            statCards[1].querySelector('h3').textContent = this.formatNumber(totalViews);
            statCards[2].querySelector('h3').textContent = this.formatNumber(totalSubmissions);
            statCards[3].querySelector('h3').textContent = `${avgConversion}%`;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    renderFormCard(form) {
        const statusClass = form.status;
        const statusIcon = form.status === 'published' ? 'fa-check-circle' : 
                          form.status === 'draft' ? 'fa-edit' : 'fa-archive';
        
        const categoryIcon = this.getCategoryIcon(form.category);

        return `
            <div class="form-card" data-form-id="${form.id}" data-status="${form.status}" data-category="${form.category}">
                <div class="form-card-header">
                    <div class="form-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </div>
                    <div class="form-actions">
                        <button class="btn-icon preview-form" title="Preview" data-form-id="${form.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon analytics-form" title="Analytics" data-form-id="${form.id}">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <div class="dropdown">
                            <button class="btn-icon dropdown-toggle" title="More actions" data-form-id="${form.id}">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <button class="dropdown-item duplicate-form" data-form-id="${form.id}">
                                    <i class="fas fa-copy"></i> Duplicate
                                </button>
                                <button class="dropdown-item export-form" data-form-id="${form.id}">
                                    <i class="fas fa-download"></i> Export
                                </button>
                                <button class="dropdown-item archive-form" data-form-id="${form.id}">
                                    <i class="fas fa-archive"></i> Archive
                                </button>
                                <hr>
                                <button class="dropdown-item delete-form-btn text-danger" data-form-id="${form.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-card-content">
                    <div class="form-icon">
                        <i class="fas ${categoryIcon}"></i>
                    </div>
                    <h3>${form.name}</h3>
                    <p>${form.description}</p>
                    <div class="form-meta">
                        <span><i class="fas fa-calendar"></i> Created: ${this.formatDate(form.created)}</span>
                        <span><i class="fas fa-edit"></i> Updated: ${this.formatDate(form.updated)}</span>
                    </div>
                    <div class="form-stats">
                        <div class="stat">
                            <span class="stat-number">${form.views}</span>
                            <span class="stat-label">Views</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${form.submissions}</span>
                            <span class="stat-label">Submissions</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${form.conversion}%</span>
                            <span class="stat-label">Conversion</span>
                        </div>
                    </div>
                </div>
                <div class="form-card-footer">
                    <button class="btn btn-sm btn-outline edit-form" data-form-id="${form.id}">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-primary duplicate-form" data-form-id="${form.id}">
                        <i class="fas fa-copy"></i>
                        Duplicate
                    </button>
                </div>
            </div>
        `;
    }

    attachFormCardListeners() {
        // Edit form buttons
        document.querySelectorAll('.edit-form').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formId = e.target.closest('[data-form-id]').dataset.formId;
                this.editForm(formId);
            });
        });

        // Duplicate form buttons
        document.querySelectorAll('.duplicate-form').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formId = e.target.closest('[data-form-id]').dataset.formId;
                this.duplicateForm(formId);
            });
        });

        // Delete form buttons
        document.querySelectorAll('.delete-form-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formId = e.target.closest('[data-form-id]').dataset.formId;
                this.showDeleteModal(formId);
            });
        });

        // Preview form buttons
        document.querySelectorAll('.preview-form').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formId = e.target.closest('[data-form-id]').dataset.formId;
                this.previewForm(formId);
            });
        });

        // Dropdown toggles
        document.querySelectorAll('.dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.closest('.dropdown');
                const menu = dropdown.querySelector('.dropdown-menu');
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== menu) m.style.display = 'none';
                });
                
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        });
    }

    getCategoryIcon(category) {
        const icons = {
            contact: 'fa-envelope',
            registration: 'fa-user-plus',
            survey: 'fa-poll',
            feedback: 'fa-star',
            assessment: 'fa-heartbeat',
            other: 'fa-file-alt'
        };
        return icons[category] || 'fa-file-alt';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    showCreateModal() {
        document.getElementById('create-form-modal').style.display = 'flex';
        document.getElementById('form-name').focus();
    }

    hideCreateModal() {
        document.getElementById('create-form-modal').style.display = 'none';
        document.getElementById('create-form-form').reset();
        document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.template-option[data-template="blank"]').classList.add('active');
    }

    showDeleteModal(formId) {
        const form = this.forms.find(f => f.id == formId);
        if (form) {
            document.getElementById('delete-form-name').textContent = form.name;
            document.getElementById('delete-form-description').textContent = form.description;
            document.getElementById('delete-form-modal').style.display = 'flex';
            document.getElementById('confirm-delete').dataset.formId = formId;
        }
    }

    hideDeleteModal() {
        document.getElementById('delete-form-modal').style.display = 'none';
    }

    createForm() {
        const formName = document.getElementById('form-name').value.trim();
        const formDescription = document.getElementById('form-description').value.trim();
        const formCategory = document.getElementById('form-category').value;
        const selectedTemplate = document.querySelector('.template-option.active').dataset.template;

        if (!formName) {
            alert('Please enter a form name');
            return;
        }

        // In a real app, this would make an API call
        const newForm = {
            id: Date.now(),
            name: formName,
            description: formDescription || 'No description provided',
            category: formCategory,
            status: 'draft',
            created: new Date().toISOString().split('T')[0],
            updated: new Date().toISOString().split('T')[0],
            views: 0,
            submissions: 0,
            conversion: 0,
            template: selectedTemplate
        };

        this.forms.unshift(newForm);
        this.hideCreateModal();
        this.applyFilters();

        // Navigate to form builder
        setTimeout(() => {
            window.location.href = `form-builder.html?id=${newForm.id}&name=${encodeURIComponent(formName)}`;
        }, 500);
    }

    editForm(formId) {
        const form = this.forms.find(f => f.id == formId);
        if (form) {
            window.location.href = `form-builder.html?id=${formId}&name=${encodeURIComponent(form.name)}`;
        }
    }

    duplicateForm(formId) {
        const form = this.forms.find(f => f.id == formId);
        if (form) {
            const newId = Date.now();
            const duplicatedForm = {
                ...form,
                id: newId,
                name: `${form.name} (Copy)`,
                status: 'draft',
                created: new Date().toISOString().split('T')[0],
                updated: new Date().toISOString().split('T')[0],
                views: 0,
                submissions: 0,
                conversion: 0
            };

            // Save duplicated form to localStorage
            const formData = {
                id: newId,
                name: duplicatedForm.name,
                elements: form.elements || [],
                settings: {
                    theme: 'default',
                    primaryColor: '#4F46E5'
                },
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`form_${newId}`, JSON.stringify(formData));

            this.forms.unshift(duplicatedForm);
            this.applyFilters();
        }
    }

    deleteForm() {
        const formId = document.getElementById('confirm-delete').dataset.formId;
        
        // Remove from localStorage
        localStorage.removeItem(`form_${formId}`);
        
        // Remove from forms array
        this.forms = this.forms.filter(f => f.id != formId);
        this.hideDeleteModal();
        this.applyFilters();
    }

    previewForm(formId) {
        // In a real app, this would open a preview modal or new window
        alert(`Preview form ${formId} - This would open a preview of the form`);
    }

    initializeChatbot() {
        const chatbot = document.getElementById('chatbot');
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotBody = document.getElementById('chatbot-body');
        const chatbotMessages = document.getElementById('chatbot-messages');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotSend = document.getElementById('chatbot-send');
        
        if (!chatbot || !chatbotToggle || !chatbotBody || !chatbotMessages || !chatbotInput || !chatbotSend) {
            return; // Elements not found, skip initialization
        }
        
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
        
        // Send message function
        const sendMessage = () => {
            const message = chatbotInput.value.trim();
            if (!message) return;
            
            // Add user message
            this.addChatMessage(message, 'user');
            chatbotInput.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const response = this.generateFormAIResponse(message);
                this.addChatMessage(response, 'bot');
            }, 1000);
        };
        
        // Event listeners
        chatbotSend.addEventListener('click', sendMessage);
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Add message to chat
    addChatMessage(text, sender) {
        const chatbotMessages = document.getElementById('chatbot-messages');
        if (!chatbotMessages) return;
        
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
    
    // AI Response Generator for Form Builder
    generateFormAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('create') || message.includes('new form')) {
            return "To create a new form, click the 'Create New Form' button. You can choose from templates like Contact Form, Registration Form, or Survey Form, or start with a blank form for complete customization.";
        }
        
        if (message.includes('template')) {
            return "We offer several form templates: Contact Form (name, email, message), Registration Form (personal details), Survey Form (multiple question types), and Blank Form for custom designs. Each template provides a great starting point!";
        }
        
        if (message.includes('edit') || message.includes('modify')) {
            return "To edit a form, click the 'Edit' button on any form card. This will open the Form Builder where you can add fields, customize styling, set validation rules, and configure form settings.";
        }
        
        if (message.includes('duplicate') || message.includes('copy')) {
            return "You can duplicate any form by clicking the 'Duplicate' button. This creates an exact copy that you can then modify without affecting the original form.";
        }
        
        if (message.includes('analytics') || message.includes('stats')) {
            return "Form analytics show views, submissions, and conversion rates. Click the analytics icon on any form card to see detailed performance metrics and submission data.";
        }
        
        if (message.includes('publish') || message.includes('share')) {
            return "Once your form is ready, you can publish it to get a shareable link. Published forms can be embedded on websites or shared directly with your audience.";
        }
        
        if (message.includes('field') || message.includes('element')) {
            return "The Form Builder supports various field types: text inputs, dropdowns, checkboxes, radio buttons, file uploads, date pickers, and more. You can drag and drop elements to build your form.";
        }
        
        return "I can help you with form creation, editing, templates, analytics, and publishing. What specific aspect of form building would you like assistance with?";
    }
}

// Initialize the form list manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FormListManager();
});
