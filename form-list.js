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
        // Create new form button
        document.getElementById('create-new-form').addEventListener('click', () => {
            this.showCreateModal();
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

        // Create form button
        document.getElementById('create-form-btn').addEventListener('click', () => {
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

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    loadForms() {
        // Sample form data - in a real app, this would come from an API
        this.forms = [
            {
                id: 1,
                name: 'Contact Us Form',
                description: 'General contact form for client inquiries and support requests',
                category: 'contact',
                status: 'published',
                created: '2025-01-15',
                updated: '2025-01-20',
                views: 247,
                submissions: 89,
                conversion: 36
            },
            {
                id: 2,
                name: 'Client Registration',
                description: 'New client onboarding form with health assessment and goals',
                category: 'registration',
                status: 'published',
                created: '2025-01-10',
                updated: '2025-01-18',
                views: 432,
                submissions: 156,
                conversion: 36
            },
            {
                id: 3,
                name: 'Client Satisfaction Survey',
                description: 'Post-session feedback form to measure client satisfaction and improvement areas',
                category: 'survey',
                status: 'draft',
                created: '2025-01-19',
                updated: '2025-01-20',
                views: 0,
                submissions: 0,
                conversion: 0
            },
            {
                id: 4,
                name: 'Health Assessment Form',
                description: 'Comprehensive health and fitness assessment for new clients',
                category: 'survey',
                status: 'published',
                created: '2025-01-08',
                updated: '2025-01-16',
                views: 568,
                submissions: 347,
                conversion: 61
            }
        ];

        this.filteredForms = [...this.forms];
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
        
        if (this.filteredForms.length === 0) {
            formsGrid.innerHTML = `
                <div class="no-forms">
                    <i class="fas fa-file-alt"></i>
                    <h3>No forms found</h3>
                    <p>Try adjusting your filters or create a new form to get started.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('create-new-form').click()">
                        <i class="fas fa-plus"></i>
                        Create New Form
                    </button>
                </div>
            `;
            return;
        }

        formsGrid.innerHTML = this.filteredForms.map(form => this.renderFormCard(form)).join('');
        
        // Add event listeners to form cards
        this.attachFormCardListeners();
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
            const duplicatedForm = {
                ...form,
                id: Date.now(),
                name: `${form.name} (Copy)`,
                status: 'draft',
                created: new Date().toISOString().split('T')[0],
                updated: new Date().toISOString().split('T')[0],
                views: 0,
                submissions: 0,
                conversion: 0
            };

            this.forms.unshift(duplicatedForm);
            this.applyFilters();
        }
    }

    deleteForm() {
        const formId = document.getElementById('confirm-delete').dataset.formId;
        this.forms = this.forms.filter(f => f.id != formId);
        this.hideDeleteModal();
        this.applyFilters();
    }

    previewForm(formId) {
        // In a real app, this would open a preview modal or new window
        alert(`Preview form ${formId} - This would open a preview of the form`);
    }
}

// Initialize the form list manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FormListManager();
});
