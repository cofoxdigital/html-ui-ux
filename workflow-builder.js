// Workflow Builder - Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas
    const canvas = new WorkflowCanvas('workflow-canvas');
    
    // Current workflow data
    let currentWorkflow = {
        id: null,
        name: 'New Workflow',
        description: '',
        status: 'draft',
        nodes: [],
        connections: []
    };

    // Initialize UI
    initializeUI();
    setupEventListeners();
    loadWorkflowFromParams();

    function initializeUI() {
        // Set initial workflow name
        document.getElementById('workflow-title').value = currentWorkflow.name;
        document.getElementById('workflow-name-breadcrumb').textContent = currentWorkflow.name;

        // Setup node palette drag
        document.querySelectorAll('.node-item').forEach(item => {
            item.addEventListener('dragstart', handleNodeDragStart);
        });

        // Setup category toggles
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', toggleCategory);
        });

        // Setup node search
        document.getElementById('node-search').addEventListener('input', filterNodes);
    }

    function setupEventListeners() {
        // Canvas events
        canvas.container.addEventListener('workflow-node-selected', handleNodeSelected);
        canvas.container.addEventListener('workflow-selection-cleared', handleSelectionCleared);
        canvas.container.addEventListener('workflow-node-added', handleNodeAdded);
        canvas.container.addEventListener('workflow-node-deleted', handleNodeDeleted);
        canvas.container.addEventListener('workflow-connection-created', handleConnectionCreated);
        canvas.container.addEventListener('workflow-connection-deleted', handleConnectionDeleted);

        // Toolbar buttons
        document.getElementById('zoom-in').addEventListener('click', () => canvas.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => canvas.zoomOut());
        document.getElementById('zoom-fit').addEventListener('click', () => canvas.zoomToFit());
        document.getElementById('undo-action').addEventListener('click', handleUndo);
        document.getElementById('redo-action').addEventListener('click', handleRedo);
        document.getElementById('clear-canvas').addEventListener('click', handleClearCanvas);
        document.getElementById('auto-layout').addEventListener('click', () => canvas.autoLayout());
        document.getElementById('toggle-grid').addEventListener('click', handleToggleGrid);

        // Header buttons
        document.getElementById('workflow-title').addEventListener('input', handleWorkflowNameChange);
        document.getElementById('test-workflow').addEventListener('click', handleTestWorkflow);
        document.getElementById('save-workflow').addEventListener('click', handleSaveWorkflow);
        document.getElementById('publish-workflow').addEventListener('click', handlePublishWorkflow);
        document.getElementById('preview-workflow').addEventListener('click', handlePreviewWorkflow);

        // Test modal
        document.getElementById('close-test-modal').addEventListener('click', closeTestModal);
        document.getElementById('run-test').addEventListener('click', runWorkflowTest);
    }

    function loadWorkflowFromParams() {
        const params = new URLSearchParams(window.location.search);
        const workflowId = params.get('id');
        
        if (workflowId) {
            loadWorkflow(workflowId);
        }
    }

    function loadWorkflow(workflowId) {
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        const workflow = workflows.find(w => w.id === workflowId);
        
        if (workflow) {
            currentWorkflow = workflow;
            document.getElementById('workflow-title').value = workflow.name;
            document.getElementById('workflow-name-breadcrumb').textContent = workflow.name;
            
            // Import workflow to canvas
            canvas.importWorkflow({
                nodes: workflow.nodes || [],
                connections: workflow.connections || []
            });
        }
    }

    // Node palette handlers
    function handleNodeDragStart(e) {
        const nodeType = e.target.dataset.nodeType;
        const nodeSubtype = e.target.dataset.nodeSubtype;
        
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('node-type', nodeType);
        e.dataTransfer.setData('node-subtype', nodeSubtype);
    }

    function toggleCategory(e) {
        const header = e.currentTarget;
        const category = header.parentElement;
        const nodes = category.querySelector('.category-nodes');
        
        header.classList.toggle('collapsed');
        nodes.classList.toggle('collapsed');
    }

    function filterNodes(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        document.querySelectorAll('.node-item').forEach(item => {
            const label = item.querySelector('span').textContent.toLowerCase();
            const category = item.closest('.node-category');
            
            if (label.includes(searchTerm)) {
                item.style.display = 'flex';
                category.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        // Hide empty categories
        document.querySelectorAll('.node-category').forEach(category => {
            const visibleNodes = category.querySelectorAll('.node-item:not([style*="display: none"])');
            if (visibleNodes.length === 0) {
                category.style.display = 'none';
            }
        });
    }

    // Canvas event handlers
    function handleNodeSelected(e) {
        const nodeId = e.detail.nodeId;
        const node = canvas.nodes.get(nodeId);
        
        if (node) {
            showNodeProperties(node);
        }
    }

    function handleSelectionCleared() {
        showDefaultProperties();
    }

    function handleNodeAdded(e) {
        // Auto-save on changes
        autoSave();
    }

    function handleNodeDeleted(e) {
        autoSave();
    }

    function handleConnectionCreated(e) {
        autoSave();
    }

    function handleConnectionDeleted(e) {
        autoSave();
    }

    // Properties panel
    function showNodeProperties(node) {
        const propertiesContent = document.getElementById('properties-content');
        
        let propertiesHTML = `
            <div class="node-properties">
                <h4>${getNodeLabel(node)} Properties</h4>
        `;

        switch (node.type) {
            case 'trigger':
                propertiesHTML += renderTriggerProperties(node);
                break;
            case 'action':
                propertiesHTML += renderActionProperties(node);
                break;
            case 'logic':
                propertiesHTML += renderLogicProperties(node);
                break;
            case 'data':
                propertiesHTML += renderDataProperties(node);
                break;
        }

        propertiesHTML += '</div>';
        propertiesContent.innerHTML = propertiesHTML;

        // Setup property change handlers
        setupPropertyHandlers(node);
    }

    function renderTriggerProperties(node) {
        let html = '';
        
        switch (node.subtype) {
            case 'form_submit':
                html = `
                    <div class="property-group">
                        <label>Form</label>
                        <select id="prop-formId" data-property="formId">
                            <option value="">Select a form...</option>
                            ${getFormOptions(node.config.formId)}
                        </select>
                        <div class="property-help">Select which form submission will trigger this workflow</div>
                    </div>
                `;
                break;
            case 'page_load':
                html = `
                    <div class="property-group">
                        <label>Page</label>
                        <select id="prop-pageId" data-property="pageId">
                            <option value="">Select a page...</option>
                            ${getPageOptions(node.config.pageId)}
                        </select>
                        <div class="property-help">Select which page load will trigger this workflow</div>
                    </div>
                `;
                break;
            case 'button_click':
                html = `
                    <div class="property-group">
                        <label>Button ID</label>
                        <input type="text" id="prop-buttonId" data-property="buttonId" 
                               value="${node.config.buttonId || ''}" 
                               placeholder="e.g., submit-btn">
                        <div class="property-help">Enter the ID of the button element</div>
                    </div>
                `;
                break;
            case 'timer':
                html = `
                    <div class="property-group">
                        <label>Interval (ms)</label>
                        <input type="number" id="prop-interval" data-property="interval" 
                               value="${node.config.interval || 1000}" 
                               min="100" step="100">
                        <div class="property-help">How often to trigger (in milliseconds)</div>
                    </div>
                `;
                break;
            case 'data_change':
                html = `
                    <div class="property-group">
                        <label>Storage Key</label>
                        <input type="text" id="prop-storageKey" data-property="storageKey" 
                               value="${node.config.storageKey || ''}" 
                               placeholder="e.g., user_data">
                        <div class="property-help">LocalStorage key to monitor for changes</div>
                    </div>
                `;
                break;
        }
        
        return html;
    }

    function renderActionProperties(node) {
        let html = '';
        
        switch (node.subtype) {
            case 'navigate':
                html = `
                    <div class="property-group">
                        <label>Navigate To</label>
                        <select id="prop-pageId" data-property="pageId">
                            <option value="">Select a page...</option>
                            ${getPageOptions(node.config.pageId)}
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Delay (ms)</label>
                        <input type="number" id="prop-delay" data-property="delay" 
                               value="${node.config.delay || 0}" 
                               min="0" step="100">
                        <div class="property-help">Optional delay before navigation</div>
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="prop-passData" data-property="passData" 
                                   ${node.config.passData ? 'checked' : ''}>
                            Pass workflow data to page
                        </label>
                    </div>
                `;
                break;
            case 'show_message':
                html = `
                    <div class="property-group">
                        <label>Message</label>
                        <textarea id="prop-message" data-property="message" 
                                  placeholder="Enter message text...">${node.config.message || ''}</textarea>
                        <div class="property-help">Use {{variable}} to insert dynamic values</div>
                    </div>
                    <div class="property-group">
                        <label>Type</label>
                        <select id="prop-type" data-property="type">
                            <option value="info" ${node.config.type === 'info' ? 'selected' : ''}>Info</option>
                            <option value="success" ${node.config.type === 'success' ? 'selected' : ''}>Success</option>
                            <option value="warning" ${node.config.type === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="error" ${node.config.type === 'error' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Duration (ms)</label>
                        <input type="number" id="prop-duration" data-property="duration" 
                               value="${node.config.duration || 3000}" 
                               min="1000" step="500">
                    </div>
                `;
                break;
            case 'update_widget':
                html = `
                    <div class="property-group">
                        <label>Widget</label>
                        <select id="prop-widgetId" data-property="widgetId">
                            <option value="">Select a widget...</option>
                            ${getWidgetOptions(node.config.widgetId)}
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Data Mapping</label>
                        <div id="data-mapping-container">
                            ${renderDataMapping(node.config.dataMapping || {})}
                        </div>
                        <button class="btn btn-sm" onclick="addDataMapping()">
                            <i class="fas fa-plus"></i> Add Mapping
                        </button>
                    </div>
                `;
                break;
            case 'save_data':
                html = `
                    <div class="property-group">
                        <label>Storage Key</label>
                        <input type="text" id="prop-storageKey" data-property="storageKey" 
                               value="${node.config.storageKey || ''}" 
                               placeholder="e.g., form_submissions">
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="prop-append" data-property="append" 
                                   ${node.config.append ? 'checked' : ''}>
                            Append to existing data (array)
                        </label>
                    </div>
                    <div class="property-group">
                        <label>Data Mapping</label>
                        <div id="data-mapping-container">
                            ${renderDataMapping(node.config.dataMapping || {})}
                        </div>
                        <button class="btn btn-sm" onclick="addDataMapping()">
                            <i class="fas fa-plus"></i> Add Mapping
                        </button>
                    </div>
                `;
                break;
            case 'delete_data':
                html = `
                    <div class="property-group">
                        <label>Storage Key</label>
                        <input type="text" id="prop-storageKey" data-property="storageKey" 
                               value="${node.config.storageKey || ''}" 
                               placeholder="e.g., temp_data">
                        <div class="property-help">LocalStorage key to delete</div>
                    </div>
                `;
                break;
            case 'set_variable':
                html = `
                    <div class="property-group">
                        <label>Variable Name</label>
                        <input type="text" id="prop-name" data-property="name" 
                               value="${node.config.name || ''}" 
                               placeholder="e.g., userName">
                    </div>
                    <div class="property-group">
                        <label>Value</label>
                        <input type="text" id="prop-value" data-property="value" 
                               value="${node.config.value || ''}" 
                               placeholder="e.g., {{trigger.form.name}}">
                        <div class="property-help">Use {{path}} for dynamic values</div>
                    </div>
                    <div class="property-group">
                        <label>Scope</label>
                        <select id="prop-scope" data-property="scope">
                            <option value="workflow" ${node.config.scope === 'workflow' ? 'selected' : ''}>Workflow</option>
                            <option value="global" ${node.config.scope === 'global' ? 'selected' : ''}>Global</option>
                        </select>
                    </div>
                `;
                break;
            case 'show_element':
                html = `
                    <div class="property-group">
                        <label>Element ID</label>
                        <input type="text" id="prop-elementId" data-property="elementId" 
                               value="${node.config.elementId || ''}" 
                               placeholder="e.g., success-message">
                    </div>
                    <div class="property-group">
                        <label>Action</label>
                        <select id="prop-action" data-property="action">
                            <option value="show" ${node.config.action === 'show' ? 'selected' : ''}>Show</option>
                            <option value="hide" ${node.config.action === 'hide' ? 'selected' : ''}>Hide</option>
                            <option value="toggle" ${node.config.action === 'toggle' ? 'selected' : ''}>Toggle</option>
                        </select>
                    </div>
                `;
                break;
        }
        
        return html;
    }

    function renderLogicProperties(node) {
        let html = '';
        
        switch (node.subtype) {
            case 'condition':
                html = `
                    <div class="property-group">
                        <label>Condition Logic</label>
                        <select id="prop-operator" data-property="operator">
                            <option value="AND" ${node.config.operator === 'AND' ? 'selected' : ''}>All conditions (AND)</option>
                            <option value="OR" ${node.config.operator === 'OR' ? 'selected' : ''}>Any condition (OR)</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Conditions</label>
                        <div class="condition-builder" id="conditions-container">
                            ${renderConditions(node.config.conditions || [])}
                        </div>
                        <button class="btn btn-sm" onclick="addCondition()">
                            <i class="fas fa-plus"></i> Add Condition
                        </button>
                    </div>
                `;
                break;
            case 'wait':
                html = `
                    <div class="property-group">
                        <label>Wait Duration (ms)</label>
                        <input type="number" id="prop-duration" data-property="duration" 
                               value="${node.config.duration || 1000}" 
                               min="0" step="100">
                        <div class="property-help">Pause workflow execution</div>
                    </div>
                `;
                break;
        }
        
        return html;
    }

    function renderDataProperties(node) {
        let html = '';
        
        switch (node.subtype) {
            case 'transform':
                html = `
                    <div class="property-group">
                        <label>Input Data</label>
                        <input type="text" id="prop-input" data-property="input" 
                               value="${node.config.input || ''}" 
                               placeholder="e.g., {{trigger.form.email}}">
                    </div>
                    <div class="property-group">
                        <label>Transformations</label>
                        <div id="transformations-container">
                            ${renderTransformations(node.config.transformations || [])}
                        </div>
                        <button class="btn btn-sm" onclick="addTransformation()">
                            <i class="fas fa-plus"></i> Add Transformation
                        </button>
                    </div>
                    <div class="property-group">
                        <label>Output Variable</label>
                        <input type="text" id="prop-outputVariable" data-property="outputVariable" 
                               value="${node.config.outputVariable || ''}" 
                               placeholder="e.g., processedEmail">
                    </div>
                `;
                break;
        }
        
        return html;
    }

    // Helper functions for property rendering
    function getFormOptions(selectedId) {
        // Try phoenix_forms first, then fall back to forms
        const phoenixForms = JSON.parse(localStorage.getItem('phoenix_forms') || '{}');
        let forms = phoenixForms.forms || [];
        
        // If no phoenix_forms, try regular forms
        if (forms.length === 0) {
            forms = JSON.parse(localStorage.getItem('forms') || '[]');
        }
        
        return forms
            .filter(f => f.status === 'published')
            .map(f => `<option value="${f.id}" ${f.id === selectedId ? 'selected' : ''}>${f.name}</option>`)
            .join('');
    }

    function getPageOptions(selectedId) {
        // Get all page keys from localStorage
        const pages = [];
        const pageIds = new Set(); // To avoid duplicates
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('page_')) {
                try {
                    const page = JSON.parse(localStorage.getItem(key));
                    if (page && page.status === 'published' && !pageIds.has(page.id)) {
                        pages.push(page);
                        pageIds.add(page.id);
                    }
                } catch (e) {
                    console.error('Error parsing page:', key, e);
                }
            }
        }
        
        // Also check regular pages array
        const regularPages = JSON.parse(localStorage.getItem('pages') || '[]');
        regularPages.filter(p => p.status === 'published' && !pageIds.has(p.id)).forEach(p => {
            pages.push(p);
            pageIds.add(p.id);
        });
        
        return pages
            .map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.title || p.name}</option>`)
            .join('');
    }

    function getWidgetOptions(selectedId) {
        // Try phoenix_widgets first, then fall back to widgets
        const phoenixWidgets = JSON.parse(localStorage.getItem('phoenix_widgets') || '{}');
        let widgets = phoenixWidgets.widgets || [];
        
        // If no phoenix_widgets, try regular widgets
        if (widgets.length === 0) {
            widgets = JSON.parse(localStorage.getItem('widgets') || '[]');
        }
        
        return widgets
            .filter(w => w.status === 'published')
            .map(w => `<option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.name}</option>`)
            .join('');
    }

    function renderDataMapping(mapping) {
        let html = '';
        for (const [key, value] of Object.entries(mapping)) {
            html += `
                <div class="condition-row">
                    <input type="text" placeholder="Field name" value="${key}" data-mapping-key>
                    <input type="text" placeholder="Value or {{variable}}" value="${value}" data-mapping-value>
                    <button class="btn-icon" onclick="removeMapping(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        return html;
    }

    function renderConditions(conditions) {
        let html = '';
        conditions.forEach((condition, index) => {
            html += `
                <div class="condition-row" data-condition-index="${index}">
                    <input type="text" placeholder="Left value" value="${condition.left || ''}" data-condition-left>
                    <select data-condition-operator>
                        <option value="==" ${condition.operator === '==' ? 'selected' : ''}>=</option>
                        <option value="!=" ${condition.operator === '!=' ? 'selected' : ''}>≠</option>
                        <option value=">" ${condition.operator === '>' ? 'selected' : ''}>></option>
                        <option value="<" ${condition.operator === '<' ? 'selected' : ''}><</option>
                        <option value=">=" ${condition.operator === '>=' ? 'selected' : ''}>≥</option>
                        <option value="<=" ${condition.operator === '<=' ? 'selected' : ''}>≤</option>
                        <option value="contains" ${condition.operator === 'contains' ? 'selected' : ''}>contains</option>
                        <option value="is_empty" ${condition.operator === 'is_empty' ? 'selected' : ''}>is empty</option>
                    </select>
                    <input type="text" placeholder="Right value" value="${condition.right || ''}" 
                           data-condition-right ${condition.operator === 'is_empty' ? 'disabled' : ''}>
                    <button class="btn-icon" onclick="removeCondition(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        return html;
    }

    function renderTransformations(transformations) {
        let html = '';
        transformations.forEach((transform, index) => {
            html += `
                <div class="condition-row" data-transform-index="${index}">
                    <select data-transform-type>
                        <option value="uppercase" ${transform.type === 'uppercase' ? 'selected' : ''}>Uppercase</option>
                        <option value="lowercase" ${transform.type === 'lowercase' ? 'selected' : ''}>Lowercase</option>
                        <option value="trim" ${transform.type === 'trim' ? 'selected' : ''}>Trim</option>
                        <option value="number" ${transform.type === 'number' ? 'selected' : ''}>To Number</option>
                        <option value="string" ${transform.type === 'string' ? 'selected' : ''}>To String</option>
                    </select>
                    <button class="btn-icon" onclick="removeTransformation(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        return html;
    }

    function setupPropertyHandlers(node) {
        // Handle simple property changes
        document.querySelectorAll('[data-property]').forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.dataset.property;
                let value = e.target.value;
                
                // Handle different input types
                if (e.target.type === 'checkbox') {
                    value = e.target.checked;
                } else if (e.target.type === 'number') {
                    value = parseInt(value) || 0;
                }
                
                // Update node config
                node.config[property] = value;
                
                // Update node display
                updateNodeDisplay(node);
                
                // Auto-save
                autoSave();
            });
        });

        // Handle complex properties (conditions, mappings, etc.)
        setupComplexPropertyHandlers(node);
    }

    function setupComplexPropertyHandlers(node) {
        // Data mapping handlers
        if (document.getElementById('data-mapping-container')) {
            updateDataMappingHandlers(node);
        }

        // Condition handlers
        if (document.getElementById('conditions-container')) {
            updateConditionHandlers(node);
        }

        // Transformation handlers
        if (document.getElementById('transformations-container')) {
            updateTransformationHandlers(node);
        }
    }

    function updateDataMappingHandlers(node) {
        const container = document.getElementById('data-mapping-container');
        container.addEventListener('input', (e) => {
            const mapping = {};
            container.querySelectorAll('.condition-row').forEach(row => {
                const key = row.querySelector('[data-mapping-key]').value;
                const value = row.querySelector('[data-mapping-value]').value;
                if (key) {
                    mapping[key] = value;
                }
            });
            node.config.dataMapping = mapping;
            autoSave();
        });
    }

    function updateConditionHandlers(node) {
        const container = document.getElementById('conditions-container');
        container.addEventListener('change', (e) => {
            const conditions = [];
            container.querySelectorAll('.condition-row').forEach(row => {
                const condition = {
                    left: row.querySelector('[data-condition-left]').value,
                    operator: row.querySelector('[data-condition-operator]').value,
                    right: row.querySelector('[data-condition-right]').value
                };
                conditions.push(condition);
            });
            node.config.conditions = conditions;
            autoSave();
        });
    }

    function updateTransformationHandlers(node) {
        const container = document.getElementById('transformations-container');
        container.addEventListener('change', (e) => {
            const transformations = [];
            container.querySelectorAll('.condition-row').forEach(row => {
                const transform = {
                    type: row.querySelector('[data-transform-type]').value
                };
                transformations.push(transform);
            });
            node.config.transformations = transformations;
            autoSave();
        });
    }

    function updateNodeDisplay(node) {
        const nodeEl = document.getElementById(node.id);
        if (nodeEl) {
            const body = nodeEl.querySelector('.node-body');
            body.innerHTML = canvas.renderNodeBody(node);
        }
    }

    function showDefaultProperties() {
        const propertiesContent = document.getElementById('properties-content');
        propertiesContent.innerHTML = `
            <div class="no-selection">
                <i class="fas fa-mouse-pointer"></i>
                <p>Select a node to edit its properties</p>
            </div>
        `;
    }

    // Global functions for property editors
    window.addDataMapping = function() {
        const container = document.getElementById('data-mapping-container');
        const row = document.createElement('div');
        row.className = 'condition-row';
        row.innerHTML = `
            <input type="text" placeholder="Field name" data-mapping-key>
            <input type="text" placeholder="Value or {{variable}}" data-mapping-value>
            <button class="btn-icon" onclick="removeMapping(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    };

    window.removeMapping = function(button) {
        button.closest('.condition-row').remove();
        // Trigger update
        const event = new Event('input', { bubbles: true });
        document.getElementById('data-mapping-container').dispatchEvent(event);
    };

    window.addCondition = function() {
        const container = document.getElementById('conditions-container');
        const index = container.children.length;
        const row = document.createElement('div');
        row.className = 'condition-row';
        row.dataset.conditionIndex = index;
        row.innerHTML = `
            <input type="text" placeholder="Left value" data-condition-left>
            <select data-condition-operator>
                <option value="==">=</option>
                <option value="!=">≠</option>
                <option value=">">></option>
                <option value="<"><</option>
                <option value=">=">≥</option>
                <option value="<=">≤</option>
                <option value="contains">contains</option>
                <option value="is_empty">is empty</option>
            </select>
            <input type="text" placeholder="Right value" data-condition-right>
            <button class="btn-icon" onclick="removeCondition(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    };

    window.removeCondition = function(index) {
        const container = document.getElementById('conditions-container');
        container.querySelector(`[data-condition-index="${index}"]`).remove();
        // Trigger update
        const event = new Event('change', { bubbles: true });
        container.dispatchEvent(event);
    };

    window.addTransformation = function() {
        const container = document.getElementById('transformations-container');
        const index = container.children.length;
        const row = document.createElement('div');
        row.className = 'condition-row';
        row.dataset.transformIndex = index;
        row.innerHTML = `
            <select data-transform-type>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="trim">Trim</option>
                <option value="number">To Number</option>
                <option value="string">To String</option>
            </select>
            <button class="btn-icon" onclick="removeTransformation(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    };

    window.removeTransformation = function(index) {
        const container = document.getElementById('transformations-container');
        container.querySelector(`[data-transform-index="${index}"]`).remove();
        // Trigger update
        const event = new Event('change', { bubbles: true });
        container.dispatchEvent(event);
    };

    // Workflow management
    function handleWorkflowNameChange(e) {
        currentWorkflow.name = e.target.value;
        document.getElementById('workflow-name-breadcrumb').textContent = e.target.value;
        autoSave();
    }

    function handleClearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            canvas.clear();
            autoSave();
        }
    }

    function handleToggleGrid() {
        const enabled = canvas.toggleGrid();
        const button = document.getElementById('toggle-grid');
        button.innerHTML = `<i class="fas fa-${enabled ? 'border-all' : 'border-none'}"></i>`;
    }

    // Undo/Redo functionality
    const history = {
        states: [],
        currentIndex: -1,
        maxStates: 50
    };

    function saveState() {
        const state = {
            nodes: canvas.exportWorkflow().nodes,
            connections: canvas.exportWorkflow().connections
        };
        
        // Remove any states after current index
        history.states = history.states.slice(0, history.currentIndex + 1);
        
        // Add new state
        history.states.push(state);
        
        // Limit history size
        if (history.states.length > history.maxStates) {
            history.states.shift();
        } else {
            history.currentIndex++;
        }
        
        updateUndoRedoButtons();
    }

    function handleUndo() {
        if (history.currentIndex > 0) {
            history.currentIndex--;
            const state = history.states[history.currentIndex];
            canvas.importWorkflow(state);
            updateUndoRedoButtons();
        }
    }

    function handleRedo() {
        if (history.currentIndex < history.states.length - 1) {
            history.currentIndex++;
            const state = history.states[history.currentIndex];
            canvas.importWorkflow(state);
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        document.getElementById('undo-action').disabled = history.currentIndex <= 0;
        document.getElementById('redo-action').disabled = history.currentIndex >= history.states.length - 1;
    }

    // Auto-save functionality
    let autoSaveTimeout;
    function autoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveWorkflow(true);
        }, 1000);
    }

    function saveWorkflow(isAutoSave = false) {
        // Get current workflow data from canvas
        const canvasData = canvas.exportWorkflow();
        currentWorkflow.nodes = canvasData.nodes;
        currentWorkflow.connections = canvasData.connections;
        currentWorkflow.lastModified = new Date().toISOString();
        
        // Generate ID if new
        if (!currentWorkflow.id) {
            currentWorkflow.id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Load existing workflows
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        
        // Find and update or add
        const index = workflows.findIndex(w => w.id === currentWorkflow.id);
        if (index >= 0) {
            workflows[index] = currentWorkflow;
        } else {
            workflows.push(currentWorkflow);
        }
        
        // Save
        localStorage.setItem('workflows', JSON.stringify(workflows));
        
        if (!isAutoSave) {
            showNotification('Workflow saved successfully', 'success');
        }
        
        // Update URL if new workflow
        if (!window.location.search.includes('id=')) {
            const newUrl = `${window.location.pathname}?id=${currentWorkflow.id}`;
            window.history.replaceState({}, '', newUrl);
        }
    }

    function handleSaveWorkflow() {
        saveWorkflow(false);
    }

    function handlePublishWorkflow() {
        if (!currentWorkflow.name || currentWorkflow.name === 'New Workflow') {
            showNotification('Please give your workflow a name before publishing', 'warning');
            document.getElementById('workflow-title').focus();
            return;
        }
        
        // Validate workflow has at least one trigger
        const hasTrigger = Array.from(canvas.nodes.values()).some(node => node.type === 'trigger');
        if (!hasTrigger) {
            showNotification('Workflow must have at least one trigger node', 'warning');
            return;
        }
        
        // Save and publish
        currentWorkflow.status = 'published';
        saveWorkflow(false);
        
        // Register with workflow engine
        workflowEngine.registerWorkflow(currentWorkflow);
        
        showNotification('Workflow published successfully!', 'success');
        
        // Update button states
        document.getElementById('publish-workflow').innerHTML = '<i class="fas fa-check"></i> Published';
        document.getElementById('publish-workflow').classList.add('published');
    }

    // Test functionality
    function handleTestWorkflow() {
        const modal = document.getElementById('test-modal');
        modal.classList.add('show');
        
        // Clear previous test data
        document.getElementById('test-data').value = '{}';
        document.getElementById('test-results').innerHTML = '';
        
        // Show available variables based on trigger nodes
        updateTestDataHelp();
    }

    function closeTestModal() {
        document.getElementById('test-modal').classList.remove('show');
    }

    function updateTestDataHelp() {
        const triggers = Array.from(canvas.nodes.values()).filter(node => node.type === 'trigger');
        const helpContainer = document.getElementById('test-data-help');
        
        if (triggers.length === 0) {
            helpContainer.innerHTML = '<p>No trigger nodes found. Add a trigger node to test the workflow.</p>';
            return;
        }
        
        let helpHTML = '<p>Available test data based on your triggers:</p><ul>';
        
        triggers.forEach(trigger => {
            switch (trigger.subtype) {
                case 'form_submit':
                    helpHTML += '<li>Form Submit: <code>{ "formId": "...", "form": { "field1": "value1", ... } }</code></li>';
                    break;
                case 'page_load':
                    helpHTML += '<li>Page Load: <code>{ "pageId": "..." }</code></li>';
                    break;
                case 'button_click':
                    helpHTML += '<li>Button Click: <code>{ "buttonId": "..." }</code></li>';
                    break;
                case 'data_change':
                    helpHTML += '<li>Data Change: <code>{ "key": "...", "oldValue": ..., "newValue": ... }</code></li>';
                    break;
            }
        });
        
        helpHTML += '</ul>';
        helpContainer.innerHTML = helpHTML;
    }

    async function runWorkflowTest() {
        const testDataInput = document.getElementById('test-data').value;
        const resultsContainer = document.getElementById('test-results');
        
        try {
            const testData = JSON.parse(testDataInput);
            
            // Clear previous results
            resultsContainer.innerHTML = '<div class="test-log"><i class="fas fa-spinner fa-spin"></i> Running workflow...</div>';
            
            // Create temporary workflow for testing
            const testWorkflow = {
                ...currentWorkflow,
                nodes: canvas.exportWorkflow().nodes,
                connections: canvas.exportWorkflow().connections
            };
            
            // Register workflow temporarily
            workflowEngine.registerWorkflow(testWorkflow);
            
            // Run test
            const logs = await workflowEngine.testWorkflow(testWorkflow.id, testData);
            
            // Display results
            displayTestResults(logs);
            
        } catch (error) {
            resultsContainer.innerHTML = `
                <div class="test-log error">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    function displayTestResults(logs) {
        const resultsContainer = document.getElementById('test-results');
        let html = '';
        
        logs.forEach(log => {
            const icon = log.level === 'error' ? 'exclamation-circle' : 
                         log.level === 'success' ? 'check-circle' : 'info-circle';
            
            html += `
                <div class="test-log ${log.level}">
                    <div class="log-header">
                        <i class="fas fa-${icon}"></i>
                        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                        <strong>${log.message}</strong>
                    </div>
                    ${log.data && Object.keys(log.data).length > 0 ? `
                        <div class="log-data">
                            <pre>${JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html || '<div class="test-log">No logs generated</div>';
    }

    // Helper functions
    function getNodeLabel(node) {
        return canvas.getNodeLabel(node);
    }

    function showNotification(message, type = 'info', duration = 3000) {
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
        }, duration);
    }

    // Preview functionality
    function handlePreviewWorkflow() {
        // Save current workflow state
        saveWorkflow(true);
        
        // Get current workflow data from canvas
        const canvasData = canvas.exportWorkflow();
        currentWorkflow.nodes = canvasData.nodes;
        currentWorkflow.connections = canvasData.connections;
        
        // Validate workflow has at least one trigger
        const triggers = Array.from(canvas.nodes.values()).filter(node => node.type === 'trigger');
        if (triggers.length === 0) {
            showNotification('Workflow must have at least one trigger node to preview', 'warning');
            return;
        }
        
        // Find the first trigger node
        const firstTrigger = triggers[0];
        
        // Temporarily register workflow for preview
        const previewWorkflow = {
            ...currentWorkflow,
            id: currentWorkflow.id || `preview_${Date.now()}`,
            status: 'preview'
        };
        
        // Store preview workflow in sessionStorage
        sessionStorage.setItem('previewWorkflow', JSON.stringify(previewWorkflow));
        sessionStorage.setItem('previewMode', 'true');
        
        // Register with workflow engine
        workflowEngine.registerWorkflow(previewWorkflow);
        
        // Navigate based on trigger type
        let targetUrl = '';
        
        switch (firstTrigger.subtype) {
            case 'form_submit':
                // Find the page containing this form
                const formId = firstTrigger.config.formId;
                if (!formId) {
                    showNotification('Please select a form in the trigger node', 'warning');
                    return;
                }
                
                // Look for a page that contains this form
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('page_')) {
                        try {
                            const page = JSON.parse(localStorage.getItem(key));
                            if (page && page.content && page.content.includes(formId)) {
                                targetUrl = `page-viewer.html?id=${page.id}&preview=true`;
                                break;
                            }
                        } catch (e) {
                            console.error('Error parsing page:', e);
                        }
                    }
                }
                
                if (!targetUrl) {
                    showNotification('Could not find a page containing the selected form', 'warning');
                    return;
                }
                break;
                
            case 'page_load':
                const pageId = firstTrigger.config.pageId;
                if (!pageId) {
                    showNotification('Please select a page in the trigger node', 'warning');
                    return;
                }
                targetUrl = `page-viewer.html?id=${pageId}&preview=true`;
                break;
                
            case 'button_click':
                const buttonId = firstTrigger.config.buttonId;
                if (!buttonId) {
                    showNotification('Please specify a button ID in the trigger node', 'warning');
                    return;
                }
                
                // Look for a page that contains this button
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('page_')) {
                        try {
                            const page = JSON.parse(localStorage.getItem(key));
                            if (page && page.content && page.content.includes(`id="${buttonId}"`)) {
                                targetUrl = `page-viewer.html?id=${page.id}&preview=true`;
                                break;
                            }
                        } catch (e) {
                            console.error('Error parsing page:', e);
                        }
                    }
                }
                
                if (!targetUrl) {
                    showNotification('Could not find a page containing the specified button', 'warning');
                    return;
                }
                break;
                
            case 'timer':
                showNotification('Timer triggers will start automatically in preview mode', 'info');
                targetUrl = `page-viewer.html?preview=true&timer=${firstTrigger.config.interval || 1000}`;
                break;
                
            case 'data_change':
                showNotification('Data change triggers will activate when the specified data changes', 'info');
                targetUrl = `page-viewer.html?preview=true&dataKey=${firstTrigger.config.storageKey || ''}`;
                break;
                
            default:
                showNotification('Unknown trigger type', 'error');
                return;
        }
        
        // Open preview in new tab
        window.open(targetUrl, '_blank');
        showNotification('Preview opened in new tab', 'success');
    }

    // Initialize with empty state
    saveState();
});
