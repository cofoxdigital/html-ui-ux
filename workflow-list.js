// Workflow List Management
let workflows = [];
let filteredWorkflows = [];
let currentWorkflowId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWorkflows();
    setupEventListeners();
});

function setupEventListeners() {
    // Search
    document.getElementById('workflow-search').addEventListener('input', filterWorkflows);
    
    // Filters
    document.getElementById('status-filter').addEventListener('change', filterWorkflows);
    document.getElementById('category-filter').addEventListener('change', filterWorkflows);
    document.getElementById('sort-filter').addEventListener('change', sortWorkflows);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn') && !e.target.closest('.dropdown-menu')) {
            closeAllDropdowns();
        }
    });
}

function loadWorkflows() {
    workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    filterWorkflows();
}

function filterWorkflows() {
    const searchTerm = document.getElementById('workflow-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchTerm) ||
                            (workflow.description && workflow.description.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || workflow.status === statusFilter;
        const matchesCategory = !categoryFilter || workflow.category === categoryFilter;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });
    
    sortWorkflows();
}

function sortWorkflows() {
    const sortBy = document.getElementById('sort-filter').value;
    
    filteredWorkflows.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'created':
                return new Date(b.created || 0) - new Date(a.created || 0);
            case 'modified':
            default:
                return new Date(b.lastModified || b.created || 0) - new Date(a.lastModified || a.created || 0);
        }
    });
    
    renderWorkflows();
}

function renderWorkflows() {
    const grid = document.getElementById('workflows-grid');
    
    if (filteredWorkflows.length === 0) {
        grid.innerHTML = `
            <div class="no-workflows">
                <i class="fas fa-project-diagram"></i>
                <h3>No workflows yet</h3>
                <p>Create your first workflow to automate processes across your pages, forms, and widgets.</p>
                <button class="btn btn-primary create-new-workflow-btn" onclick="createNewWorkflow()">
                    <i class="fas fa-plus"></i> Create Your First Workflow
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredWorkflows.map(workflow => {
        const nodeCount = workflow.nodes ? workflow.nodes.length : 0;
        const connectionCount = workflow.connections ? workflow.connections.length : 0;
        const triggerCount = workflow.nodes ? workflow.nodes.filter(n => n.type === 'trigger').length : 0;
        const actionCount = workflow.nodes ? workflow.nodes.filter(n => n.type === 'action').length : 0;
        const executionsToday = Math.floor(Math.random() * 100); // Placeholder for demo
        
        return `
            <div class="workflow-card">
                <div class="workflow-card-header">
                    <span class="workflow-status ${workflow.status}">
                        <i class="fas fa-${workflow.status === 'published' ? 'check-circle' : 'circle'}"></i>
                        ${workflow.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <div class="workflow-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); editWorkflow('${workflow.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); duplicateWorkflow('${workflow.id}')" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); deleteWorkflow('${workflow.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="workflow-card-content">
                    <div class="workflow-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <h3>${escapeHtml(workflow.name)}</h3>
                    <p>${workflow.description ? escapeHtml(workflow.description) : 'No description provided'}</p>
                    <div class="workflow-meta">
                        <span><i class="fas fa-folder"></i> ${workflow.category || 'Other'}</span>
                        <span><i class="fas fa-clock"></i> ${workflow.lastModified ? 
                            `Updated ${formatDate(workflow.lastModified)}` : 
                            `Created ${formatDate(workflow.created)}`}</span>
                    </div>
                </div>
                <div class="workflow-stats">
                    <div class="stat">
                        <span class="stat-number">${nodeCount}</span>
                        <span class="stat-label">Nodes</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${triggerCount}</span>
                        <span class="stat-label">Triggers</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${executionsToday}</span>
                        <span class="stat-label">Runs Today</span>
                    </div>
                </div>
                <div class="workflow-card-footer">
                    <button class="btn btn-sm btn-primary" onclick="openWorkflow('${workflow.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); testWorkflow('${workflow.id}')">
                        <i class="fas fa-play"></i> Test
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getWorkflowPreview(workflow) {
    if (!workflow.nodes || workflow.nodes.length === 0) {
        return '<em>No nodes added yet</em>';
    }
    
    // Get trigger nodes
    const triggers = workflow.nodes.filter(n => n.type === 'trigger');
    if (triggers.length === 0) {
        return '<em>No triggers defined</em>';
    }
    
    // Build a simple flow preview
    let preview = '<div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">';
    
    triggers.forEach((trigger, index) => {
        if (index > 0) preview += '<span style="color: #999;">|</span>';
        
        const icon = getNodeIcon(trigger);
        const label = getNodeLabel(trigger);
        
        preview += `
            <span class="node-count">
                <i class="${icon}" style="font-size: 0.875rem;"></i>
                ${label}
            </span>
        `;
        
        // Show what follows this trigger
        const connectedNodes = getConnectedNodes(workflow, trigger.id);
        if (connectedNodes.length > 0) {
            preview += '<i class="fas fa-arrow-right" style="color: #999; font-size: 0.75rem;"></i>';
            preview += `<span style="color: #666;">${connectedNodes.length} steps</span>`;
        }
    });
    
    preview += '</div>';
    return preview;
}

function getConnectedNodes(workflow, nodeId) {
    const connected = [];
    const visited = new Set();
    
    function traverse(id) {
        if (visited.has(id)) return;
        visited.add(id);
        
        const node = workflow.nodes.find(n => n.id === id);
        if (!node) return;
        
        // Find connections from this node
        const outputs = Array.isArray(node.outputs) ? node.outputs : 
                       (node.outputs?.true || node.outputs?.false ? 
                        [node.outputs.true, node.outputs.false].filter(Boolean) : []);
        
        outputs.forEach(targetId => {
            if (targetId && !visited.has(targetId)) {
                connected.push(targetId);
                traverse(targetId);
            }
        });
    }
    
    // Start traversal from the given node's outputs
    const startNode = workflow.nodes.find(n => n.id === nodeId);
    if (startNode) {
        const outputs = Array.isArray(startNode.outputs) ? startNode.outputs : 
                       (startNode.outputs?.true || startNode.outputs?.false ? 
                        [startNode.outputs.true, startNode.outputs.false].filter(Boolean) : []);
        
        outputs.forEach(targetId => {
            if (targetId) {
                connected.push(targetId);
                traverse(targetId);
            }
        });
    }
    
    return connected;
}

function getNodeIcon(node) {
    const icons = {
        trigger: {
            form_submit: 'fas fa-wpforms',
            page_load: 'fas fa-file',
            button_click: 'fas fa-mouse',
            timer: 'fas fa-clock',
            data_change: 'fas fa-database'
        },
        action: {
            navigate: 'fas fa-directions',
            show_message: 'fas fa-comment',
            update_widget: 'fas fa-chart-line',
            save_data: 'fas fa-database',
            delete_data: 'fas fa-trash',
            set_variable: 'fas fa-code',
            show_element: 'fas fa-eye'
        },
        logic: {
            condition: 'fas fa-code-branch',
            switch: 'fas fa-random',
            loop: 'fas fa-redo',
            wait: 'fas fa-pause'
        },
        data: {
            transform: 'fas fa-exchange-alt',
            calculate: 'fas fa-calculator',
            filter: 'fas fa-filter',
            merge: 'fas fa-object-group'
        }
    };
    
    return icons[node.type]?.[node.subtype] || 'fas fa-cube';
}

function getNodeLabel(node) {
    const labels = {
        trigger: {
            form_submit: 'Form Submit',
            page_load: 'Page Load',
            button_click: 'Button Click',
            timer: 'Timer',
            data_change: 'Data Change'
        },
        action: {
            navigate: 'Navigate',
            show_message: 'Show Message',
            update_widget: 'Update Widget',
            save_data: 'Save Data',
            delete_data: 'Delete Data',
            set_variable: 'Set Variable',
            show_element: 'Show/Hide'
        },
        logic: {
            condition: 'If/Else',
            switch: 'Switch',
            loop: 'Loop',
            wait: 'Wait'
        },
        data: {
            transform: 'Transform',
            calculate: 'Calculate',
            filter: 'Filter',
            merge: 'Merge'
        }
    };
    
    return labels[node.type]?.[node.subtype] || 'Node';
}

function showWorkflowMenu(event, workflowId) {
    event.stopPropagation();
    closeAllDropdowns();
    
    currentWorkflowId = workflowId;
    const menu = document.getElementById('dropdown-menu');
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.right - menu.offsetWidth}px`;
    menu.classList.add('show');
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
}

function createNewWorkflow() {
    const modal = document.getElementById('create-workflow-modal');
    if (!modal) {
        console.error('Create workflow modal not found');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Reset form
    const form = document.getElementById('create-workflow-form');
    if (form) {
        form.reset();
    }
    
    // Set up template selection
    const templateOptions = modal.querySelectorAll('.template-option');
    templateOptions.forEach(option => {
        option.addEventListener('click', function() {
            templateOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Handle form submission
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            
            const name = document.getElementById('workflow-name').value;
            const description = document.getElementById('workflow-description').value;
            const category = document.getElementById('workflow-category').value;
            const activeTemplate = modal.querySelector('.template-option.active');
            const template = activeTemplate ? activeTemplate.dataset.template : 'blank';
            
            const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Save basic workflow info
            const newWorkflow = {
                id: workflowId,
                name: name,
                description: description,
                category: category,
                template: template,
                status: 'draft',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                nodes: [],
                connections: []
            };
            
            workflows.push(newWorkflow);
            localStorage.setItem('workflows', JSON.stringify(workflows));
            
            // Close modal and redirect to builder
            modal.style.display = 'none';
            window.location.href = `workflow-builder.html?id=${workflowId}`;
        };
    }
    
    // Handle cancel
    const cancelBtn = document.getElementById('cancel-create');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Handle close button
    const closeBtn = document.getElementById('close-create-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
}

function importWorkflow() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const workflow = JSON.parse(event.target.result);
                
                // Generate new ID for imported workflow
                workflow.id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                workflow.name = `${workflow.name} (Imported)`;
                workflow.status = 'draft';
                workflow.created = new Date().toISOString();
                workflow.lastModified = new Date().toISOString();
                
                workflows.push(workflow);
                localStorage.setItem('workflows', JSON.stringify(workflows));
                
                showNotification('Workflow imported successfully', 'success');
                loadWorkflows();
            } catch (error) {
                showNotification('Failed to import workflow. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function testWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    showNotification(`Testing workflow: ${workflow.name}`, 'info');
    
    // Simulate test execution
    setTimeout(() => {
        showNotification('Workflow test completed successfully!', 'success');
    }, 2000);
}

function openWorkflow(workflowId) {
    window.location.href = `workflow-builder.html?id=${workflowId}`;
}

function editWorkflow(workflowId) {
    openWorkflow(workflowId);
}

function duplicateWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const duplicate = {
        ...workflow,
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${workflow.name} (Copy)`,
        status: 'draft',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    workflows.push(duplicate);
    localStorage.setItem('workflows', JSON.stringify(workflows));
    
    showNotification('Workflow duplicated successfully', 'success');
    loadWorkflows();
}

function exportWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Workflow exported successfully', 'success');
}

function deleteWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    if (confirm(`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`)) {
        workflows = workflows.filter(w => w.id !== workflowId);
        localStorage.setItem('workflows', JSON.stringify(workflows));
        
        showNotification('Workflow deleted successfully', 'success');
        loadWorkflows();
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification styles if not already present
if (!document.querySelector('style[data-notification-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification-styles', 'true');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 10000;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.success i {
            color: #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #f44336;
        }
        
        .notification.error i {
            color: #f44336;
        }
        
        .notification.info {
            border-left: 4px solid #2196F3;
        }
        
        .notification.info i {
            color: #2196F3;
        }
    `;
    document.head.appendChild(style);
}

// Make functions globally accessible
window.createNewWorkflow = createNewWorkflow;
window.importWorkflow = importWorkflow;
window.openWorkflow = openWorkflow;
window.editWorkflow = editWorkflow;
window.duplicateWorkflow = duplicateWorkflow;
window.deleteWorkflow = deleteWorkflow;
window.testWorkflow = testWorkflow;
window.exportWorkflow = exportWorkflow;

// Chatbot functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatbot = document.getElementById('chatbot');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    
    let isCollapsed = false;
    
    // Toggle chatbot
    if (chatbotToggle) {
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
    }
    
    // Send message
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const response = generateWorkflowResponse(message);
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
    
    // AI Response Generator for Workflows
    function generateWorkflowResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('create') || message.includes('new workflow')) {
            return "To create a new workflow, click the 'Create New Workflow' button at the top of the page. You can choose from templates like Form Submission, User Onboarding, or start with a blank workflow. Each workflow consists of triggers (what starts it), actions (what it does), and logic (how it decides).";
        }
        
        if (message.includes('trigger')) {
            return "Triggers are events that start a workflow. Available triggers include:\n• Form Submit - When a form is submitted\n• Page Load - When a page loads\n• Button Click - When a button is clicked\n• Timer - At scheduled intervals\n• Data Change - When data is modified";
        }
        
        if (message.includes('action')) {
            return "Actions are operations performed by the workflow. You can:\n• Navigate to different pages\n• Show messages to users\n• Update widget data\n• Save or delete data\n• Set variables\n• Show or hide page elements";
        }
        
        if (message.includes('logic') || message.includes('condition')) {
            return "Logic nodes control the flow of your workflow:\n• If/Else - Make decisions based on conditions\n• Switch - Multiple path branching\n• Loop - Repeat actions\n• Wait - Add delays between actions\n\nThese help create dynamic, intelligent workflows.";
        }
        
        if (message.includes('connect') || message.includes('link')) {
            return "To connect nodes in the workflow builder:\n1. Click on the output port of a node\n2. Drag to the input port of another node\n3. Release to create the connection\n\nConnections show the flow of execution from triggers through actions.";
        }
        
        if (message.includes('test') || message.includes('debug')) {
            return "You can test workflows before publishing:\n1. Save your workflow first\n2. Click the 'Test' button\n3. The workflow will run in test mode\n4. Check the console for execution logs\n\nThis helps ensure your workflow works correctly.";
        }
        
        if (message.includes('import') || message.includes('export')) {
            return "Workflows can be imported and exported:\n• Export: Click the menu on any workflow card and select 'Export'\n• Import: Click 'Import Workflow' button and select a JSON file\n\nThis allows sharing workflows between projects.";
        }
        
        if (message.includes('help') || message.includes('what can')) {
            return "I can help you with:\n• Creating and managing workflows\n• Understanding triggers, actions, and logic\n• Connecting nodes and building flows\n• Testing and debugging workflows\n• Best practices for automation\n\nWhat would you like to know more about?";
        }
        
        return "I can help you build powerful workflows to automate your business processes. You can ask me about creating workflows, available triggers and actions, connecting nodes, or any specific automation scenario you have in mind. What would you like to know?";
    }
    
    // Event listeners
    if (chatbotSend) {
        chatbotSend.addEventListener('click', sendMessage);
    }
    
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
