// Widget Builder with Drag & Drop and Dummy Data
class WidgetBuilder {
    constructor() {
        this.currentWidget = null;
        this.selectedComponent = null;
        this.components = [];
        this.history = [];
        this.historyIndex = -1;
        this.dummyData = this.initializeDummyData();
        this.init();
    }

    init() {
        this.loadWidget();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupCategoryToggles();
        this.updateTitle();
    }

    // Initialize dummy data for widgets
    initializeDummyData() {
        return {
            revenue: {
                current: 24580,
                previous: 21950,
                growth: 12.5,
                monthly: [18500, 19200, 20100, 21950, 23400, 24580],
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
            },
            clients: {
                total: 247,
                active: 189,
                new_this_month: 23,
                retention_rate: 94.2,
                by_program: [
                    { name: 'Weight Loss', count: 89, color: '#4F46E5' },
                    { name: 'Muscle Building', count: 67, color: '#10B981' },
                    { name: 'Nutrition', count: 45, color: '#F59E0B' },
                    { name: 'Wellness', count: 46, color: '#EF4444' }
                ]
            },
            performance: {
                engagement_rate: 89.3,
                session_duration: 24.5,
                app_rating: 4.8,
                uptime: 99.9,
                load_time: 1.2
            },
            activities: [
                { type: 'client_added', message: 'Sarah Johnson joined Weight Loss Pro', time: '2 hours ago', icon: 'fas fa-user-plus' },
                { type: 'rating', message: 'Mike Chen received 5-star rating', time: '4 hours ago', icon: 'fas fa-star' },
                { type: 'update', message: 'Mobile app updated to v2.1.3', time: '1 day ago', icon: 'fas fa-mobile-alt' },
                { type: 'achievement', message: 'Emma Martinez completed her program', time: '2 days ago', icon: 'fas fa-trophy' }
            ],
            coaches: [
                { name: 'Mike Chen', clients: 45, rating: 4.9, specialty: 'Weight Loss' },
                { name: 'Lisa Rodriguez', clients: 38, rating: 4.8, specialty: 'Fitness' },
                { name: 'Alex Thompson', clients: 32, rating: 4.9, specialty: 'Nutrition' }
            ]
        };
    }

    // Load widget from URL parameter or create new
    loadWidget() {
        const urlParams = new URLSearchParams(window.location.search);
        const widgetId = urlParams.get('id');
        
        if (widgetId) {
            const widgets = this.getStoredWidgets();
            this.currentWidget = widgets.find(w => w.id === widgetId);
            
            if (this.currentWidget) {
                this.loadWidgetDefinition();
            }
        }
        
        if (!this.currentWidget) {
            this.currentWidget = {
                id: null,
                name: 'Untitled Widget',
                description: 'Add components to build your widget',
                category: 'analytics',
                status: 'draft',
                definition: {
                    type: 'container',
                    components: [],
                    styling: {
                        background: '#ffffff',
                        padding: '20px',
                        borderRadius: '12px'
                    }
                }
            };
        }
    }

    loadWidgetDefinition() {
        if (this.currentWidget.definition && this.currentWidget.definition.components) {
            this.components = this.currentWidget.definition.components;
            this.renderComponents();
        }
        
        document.getElementById('widget-title').value = this.currentWidget.name;
        document.querySelector('.widget-preview-title').textContent = this.currentWidget.name;
        document.querySelector('.widget-preview-description').textContent = this.currentWidget.description;
    }

    // Event Listeners
    setupEventListeners() {
        // Title editing
        const titleInput = document.getElementById('widget-title');
        titleInput.addEventListener('input', () => {
            this.currentWidget.name = titleInput.value;
            document.querySelector('.widget-preview-title').textContent = titleInput.value;
            document.getElementById('widget-name-breadcrumb').textContent = titleInput.value;
        });

        // Toolbar actions
        document.getElementById('save-widget').addEventListener('click', () => this.saveWidget());
        document.getElementById('publish-widget').addEventListener('click', () => this.publishWidget());
        document.getElementById('preview-widget').addEventListener('click', () => this.previewWidget());
        document.getElementById('clear-widget').addEventListener('click', () => this.clearWidget());
        document.getElementById('undo-action').addEventListener('click', () => this.undo());
        document.getElementById('redo-action').addEventListener('click', () => this.redo());

        // Component search
        document.getElementById('component-search').addEventListener('input', (e) => {
            this.filterComponents(e.target.value);
        });

        // Preview modal
        document.getElementById('close-preview-modal').addEventListener('click', () => {
            document.getElementById('preview-modal').style.display = 'none';
        });

        document.getElementById('close-preview').addEventListener('click', () => {
            document.getElementById('preview-modal').style.display = 'none';
        });

        // Device preview buttons
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateDevicePreview(btn.dataset.device);
            });
        });
    }

    // Drag and Drop Setup
    setupDragAndDrop() {
        const widgetContent = document.getElementById('widget-content');
        
        // Initialize Sortable for the widget content area
        if (widgetContent) {
            new Sortable(widgetContent, {
                group: {
                    name: 'components',
                    pull: false,
                    put: true
                },
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onAdd: (evt) => {
                    const componentType = evt.item.dataset.type;
                    if (componentType) {
                        // Remove the empty message if it exists
                        this.hideEmptyMessage();
                        
                        // Add the component at the specific index
                        this.addComponent(componentType, evt.newIndex);
                        
                        // Remove the dragged placeholder element
                        evt.item.remove();
                    }
                },
                onUpdate: (evt) => {
                    this.reorderComponents(evt.oldIndex, evt.newIndex);
                }
            });
        }

        // Make component items in sidebar draggable
        this.setupSidebarDragging();

        // Setup traditional drag and drop as fallback
        this.setupFallbackDragDrop();
        
        // Setup grid cell drag and drop
        this.setupGridCellDragDrop();
    }

    setupSidebarDragging() {
        // Initialize Sortable for each component category
        document.querySelectorAll('.category-components').forEach(category => {
            new Sortable(category, {
                group: {
                    name: 'components',
                    pull: 'clone',
                    put: false
                },
                sort: false,
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen'
            });
        });

        // Also make individual component items draggable for fallback
        document.querySelectorAll('.component-item').forEach(item => {
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    setupFallbackDragDrop() {
        const widgetContent = document.getElementById('widget-content');
        
        if (!widgetContent) return;

        // Handle drag over
        widgetContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            widgetContent.classList.add('drag-over');
        });

        // Handle drag leave
        widgetContent.addEventListener('dragleave', (e) => {
            // Only remove drag-over if we're actually leaving the widget content area
            if (!widgetContent.contains(e.relatedTarget)) {
                widgetContent.classList.remove('drag-over');
            }
        });

        // Handle drop
        widgetContent.addEventListener('drop', (e) => {
            e.preventDefault();
            widgetContent.classList.remove('drag-over');
            
            const componentType = e.dataTransfer.getData('text/plain');
            if (componentType) {
                this.hideEmptyMessage();
                this.addComponent(componentType);
            }
        });
    }

    // Category toggles
    setupCategoryToggles() {
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.parentElement;
                const components = category.querySelector('.category-components');
                const chevron = header.querySelector('.fa-chevron-down, .fa-chevron-up');
                
                if (components.style.display === 'none') {
                    components.style.display = 'block';
                    chevron.className = 'fas fa-chevron-down';
                } else {
                    components.style.display = 'none';
                    chevron.className = 'fas fa-chevron-up';
                }
            });
        });
    }

    // Component Management
    addComponent(type, index = -1) {
        const component = this.createComponent(type);
        
        if (index >= 0) {
            this.components.splice(index, 0, component);
        } else {
            this.components.push(component);
        }
        
        this.renderComponents();
        this.saveToHistory();
        this.hideEmptyMessage();
    }

    createComponent(type) {
        const id = 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const componentTemplates = {
            'kpi-metric': {
                id,
                type: 'kpi-metric',
                props: {
                    value: this.formatCurrency(this.dummyData.revenue.current),
                    label: 'Monthly Revenue',
                    change: `+${this.dummyData.revenue.growth}%`,
                    changeType: 'positive',
                    dataSource: 'revenue.current'
                },
                styling: {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }
            },
            'line-chart': {
                id,
                type: 'line-chart',
                props: {
                    title: 'Revenue Trend',
                    data: this.dummyData.revenue.monthly,
                    labels: this.dummyData.revenue.labels,
                    dataSource: 'revenue.monthly'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            'bar-chart': {
                id,
                type: 'bar-chart',
                props: {
                    title: 'Clients by Program',
                    data: this.dummyData.clients.by_program.map(p => p.count),
                    labels: this.dummyData.clients.by_program.map(p => p.name),
                    colors: this.dummyData.clients.by_program.map(p => p.color),
                    dataSource: 'clients.by_program'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            'pie-chart': {
                id,
                type: 'pie-chart',
                props: {
                    title: 'Program Distribution',
                    data: this.dummyData.clients.by_program.map(p => p.count),
                    labels: this.dummyData.clients.by_program.map(p => p.name),
                    colors: this.dummyData.clients.by_program.map(p => p.color),
                    dataSource: 'clients.by_program'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            'progress-bar': {
                id,
                type: 'progress-bar',
                props: {
                    label: 'Client Retention Rate',
                    value: this.dummyData.clients.retention_rate,
                    target: 100,
                    unit: '%',
                    dataSource: 'clients.retention_rate'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            'button': {
                id,
                type: 'button',
                props: {
                    text: 'Add Client',
                    icon: 'fas fa-user-plus',
                    color: 'primary',
                    action: 'navigate',
                    target: '#'
                },
                styling: {
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                }
            },
            'button-group': {
                id,
                type: 'button-group',
                props: {
                    buttons: [
                        { text: 'Add Client', icon: 'fas fa-user-plus', color: 'primary' },
                        { text: 'Schedule', icon: 'fas fa-calendar', color: 'secondary' },
                        { text: 'Message', icon: 'fas fa-envelope', color: 'success' }
                    ]
                },
                styling: {
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                }
            },
            'text': {
                id,
                type: 'text',
                props: {
                    content: 'Click to edit this text',
                    fontSize: '14px',
                    color: '#333333'
                },
                styling: {
                    padding: '12px',
                    border: '1px dashed #ddd',
                    borderRadius: '6px',
                    minHeight: '40px'
                }
            },
            'heading': {
                id,
                type: 'heading',
                props: {
                    content: 'Widget Heading',
                    level: 'h3',
                    fontSize: '20px',
                    color: '#333333'
                },
                styling: {
                    margin: '0 0 15px 0',
                    fontWeight: '600'
                }
            },
            'activity-feed': {
                id,
                type: 'activity-feed',
                props: {
                    title: 'Recent Activity',
                    activities: this.dummyData.activities.slice(0, 3),
                    dataSource: 'activities'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
            'data-table': {
                id,
                type: 'data-table',
                props: {
                    title: 'Top Coaches',
                    data: this.dummyData.coaches,
                    columns: ['name', 'clients', 'rating', 'specialty'],
                    dataSource: 'coaches'
                },
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }
            },
        };

        return componentTemplates[type] || componentTemplates['text'];
    }

    renderComponents() {
        const widgetContent = document.getElementById('widget-content');
        
        if (this.components.length === 0) {
            this.showEmptyMessage();
            return;
        }

        widgetContent.innerHTML = this.components.map((component, index) => 
            this.renderComponent(component, index)
        ).join('');

        this.attachComponentEvents();
        this.setupGridCellDragDrop();
    }

    renderComponent(component, index) {
        const styling = this.generateStyling(component.styling);
        
        switch (component.type) {
            case 'kpi-metric':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="kpi-metric">
                            <div class="kpi-value">${component.props.value}</div>
                            <div class="kpi-label">${component.props.label}</div>
                            <div class="kpi-change">${component.props.change}</div>
                        </div>
                    </div>
                `;

            case 'line-chart':
            case 'bar-chart':
            case 'pie-chart':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="chart-widget">
                            <div class="chart-title">${component.props.title}</div>
                            <div class="chart-placeholder" id="chart-${component.id}">
                                <canvas width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                `;

            case 'progress-bar':
                const progressPercentage = (component.props.value / component.props.target) * 100;
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="progress-widget">
                            <div class="progress-label">${component.props.label}</div>
                            <div class="progress-bar-container" style="background: #f0f0f0; border-radius: 10px; height: 20px; margin: 10px 0;">
                                <div class="progress-bar-fill" style="background: #4F46E5; height: 100%; border-radius: 10px; width: ${Math.min(progressPercentage, 100)}%; transition: width 0.3s;"></div>
                            </div>
                            <div class="progress-value">${component.props.value}${component.props.unit} / ${component.props.target}${component.props.unit} (${Math.round(progressPercentage)}%)</div>
                        </div>
                    </div>
                `;


            case 'button':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <button class="action-button ${component.props.color}">
                            <i class="${component.props.icon}"></i>
                            ${component.props.text}
                        </button>
                    </div>
                `;

            case 'button-group':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="action-group">
                            ${component.props.buttons.map(btn => `
                                <button class="action-button ${btn.color}">
                                    <i class="${btn.icon}"></i>
                                    ${btn.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'text':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="text-component" contenteditable="true" style="color: ${component.props.color}; font-size: ${component.props.fontSize};">
                            ${component.props.content}
                        </div>
                    </div>
                `;

            case 'heading':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <${component.props.level} contenteditable="true" style="color: ${component.props.color}; font-size: ${component.props.fontSize}; margin: ${component.styling.margin}; font-weight: ${component.styling.fontWeight};">
                            ${component.props.content}
                        </${component.props.level}>
                    </div>
                `;

            case 'activity-feed':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="activity-feed-widget">
                            <h4>${component.props.title}</h4>
                            <div class="activity-list">
                                ${component.props.activities.map(activity => `
                                    <div class="activity-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                                        <i class="${activity.icon}" style="margin-right: 12px; color: #4F46E5;"></i>
                                        <div style="flex: 1;">
                                            <span style="font-size: 14px; color: #333;">${activity.message}</span>
                                            <small style="display: block; color: #666; margin-top: 4px;">${activity.time}</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            case 'data-table':
                // Ensure we have valid data and columns
                const tableData = component.props.data || [];
                const tableColumns = component.props.columns || [];
                
                // If no data, provide fallback
                if (tableData.length === 0 || tableColumns.length === 0) {
                    return `
                        <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                            <div class="component-controls">
                                <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="data-table-widget">
                                <h4>${component.props.title}</h4>
                                <div style="padding: 20px; text-align: center; color: #666; border: 1px dashed #ddd; border-radius: 6px;">
                                    <i class="fas fa-table" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                                    No data available. Select a data source in the Properties panel.
                                </div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="data-table-widget">
                            <h4>${component.props.title}</h4>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        ${tableColumns.map(col => `
                                            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; text-transform: capitalize;">
                                                ${col}
                                            </th>
                                        `).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableData.map(row => `
                                        <tr>
                                            ${tableColumns.map(col => `
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; color: #666;">
                                                    ${row[col] || 'N/A'}
                                                </td>
                                            `).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

            case 'container':
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn" onclick="widgetBuilder.editComponent('${component.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="container-widget" style="min-height: 100px; display: flex; align-items: center; justify-content: center; text-align: center; color: #666;">
                            <div>
                                <i class="fas fa-square" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                                ${component.props.content}
                            </div>
                        </div>
                    </div>
                `;


            default:
                return `
                    <div class="widget-component" data-component-id="${component.id}" data-index="${index}" style="${styling}">
                        <div class="component-controls">
                            <button class="control-btn delete" onclick="widgetBuilder.deleteComponent('${component.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #666;">
                            Unknown component type: ${component.type}
                        </div>
                    </div>
                `;
        }
    }

    generateStyling(styling) {
        return Object.entries(styling)
            .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
            .join('; ');
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    attachComponentEvents() {
        // Add click events for component selection
        document.querySelectorAll('.widget-component').forEach(component => {
            component.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectComponent(component.dataset.componentId);
            });
        });

        // Render charts after DOM update
        setTimeout(() => {
            this.renderCharts();
        }, 100);
    }

    renderCharts() {
        this.components.forEach(component => {
            if (['line-chart', 'bar-chart', 'pie-chart'].includes(component.type)) {
                const canvas = document.querySelector(`#chart-${component.id} canvas`);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    
                    let chartConfig = {
                        type: component.type.replace('-chart', ''),
                        data: {
                            labels: component.props.labels,
                            datasets: [{
                                data: component.props.data,
                                backgroundColor: component.props.colors || ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                                borderColor: component.props.colors || ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                                borderWidth: 2,
                                fill: component.type === 'line-chart' ? false : true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: component.type === 'pie-chart'
                                }
                            },
                            scales: component.type !== 'pie-chart' ? {
                                y: {
                                    beginAtZero: true
                                }
                            } : {}
                        }
                    };

                    new Chart(ctx, chartConfig);
                }
            }
        });
    }

    selectComponent(componentId) {
        // Remove previous selection
        document.querySelectorAll('.widget-component').forEach(comp => {
            comp.classList.remove('selected');
        });

        // Add selection to current component
        const component = document.querySelector(`[data-component-id="${componentId}"]`);
        if (component) {
            component.classList.add('selected');
            this.selectedComponent = this.components.find(c => c.id === componentId);
            this.showComponentProperties();
        }
    }

    showComponentProperties() {
        if (!this.selectedComponent) return;

        const propertiesContent = document.getElementById('properties-content');
        propertiesContent.innerHTML = `
            <div class="property-tabs">
                <button class="property-tab active" data-tab="content">Content</button>
                <button class="property-tab" data-tab="style">Style</button>
                <button class="property-tab" data-tab="data">Data</button>
            </div>
            
            <div class="property-tab-content" id="content-tab">
                ${this.renderContentProperties()}
            </div>
            
            <div class="property-tab-content" id="style-tab" style="display: none;">
                ${this.renderStyleProperties()}
            </div>
            
            <div class="property-tab-content" id="data-tab" style="display: none;">
                ${this.renderDataProperties()}
            </div>
        `;

        // Setup tab switching
        document.querySelectorAll('.property-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.property-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.property-tab-content').forEach(c => c.style.display = 'none');
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).style.display = 'block';
            });
        });

        // Setup property change listeners
        this.setupPropertyListeners();
    }

    renderContentProperties() {
        const component = this.selectedComponent;
        let html = '<div class="property-section"><h4>Content Properties</h4>';

        switch (component.type) {
            case 'kpi-metric':
                html += `
                    <div class="property-group">
                        <label>Value</label>
                        <input type="text" id="prop-value" value="${component.props.value}">
                    </div>
                    <div class="property-group">
                        <label>Label</label>
                        <input type="text" id="prop-label" value="${component.props.label}">
                    </div>
                    <div class="property-group">
                        <label>Change</label>
                        <input type="text" id="prop-change" value="${component.props.change}">
                    </div>
                `;
                break;

            case 'line-chart':
            case 'bar-chart':
            case 'pie-chart':
                html += `
                    <div class="property-group">
                        <label>Title</label>
                        <input type="text" id="prop-title" value="${component.props.title}">
                    </div>
                `;
                break;

            case 'button':
                html += `
                    <div class="property-group">
                        <label>Text</label>
                        <input type="text" id="prop-text" value="${component.props.text}">
                    </div>
                    <div class="property-group">
                        <label>Icon</label>
                        <input type="text" id="prop-icon" value="${component.props.icon}">
                    </div>
                    <div class="property-group">
                        <label>Color</label>
                        <select id="prop-color">
                            <option value="primary" ${component.props.color === 'primary' ? 'selected' : ''}>Primary</option>
                            <option value="secondary" ${component.props.color === 'secondary' ? 'selected' : ''}>Secondary</option>
                            <option value="success" ${component.props.color === 'success' ? 'selected' : ''}>Success</option>
                            <option value="danger" ${component.props.color === 'danger' ? 'selected' : ''}>Danger</option>
                        </select>
                    </div>
                `;
                break;

            case 'grid':
                html += `
                    <div class="property-group">
                        <label>Rows</label>
                        <input type="number" id="prop-rows" value="${component.props.rows}" min="1" max="6">
                        <small>Number of rows in the grid (1-6)</small>
                    </div>
                    <div class="property-group">
                        <label>Columns</label>
                        <input type="number" id="prop-columns" value="${component.props.columns}" min="1" max="6">
                        <small>Number of columns in the grid (1-6)</small>
                    </div>
                    <div class="property-group">
                        <label>Gap</label>
                        <input type="text" id="prop-gap" value="${component.props.gap}">
                        <small>Space between grid cells (e.g., 20px, 1rem)</small>
                    </div>
                `;
                break;

            case 'text':
            case 'heading':
                html += `
                    <div class="property-group">
                        <label>Content</label>
                        <textarea id="prop-content" rows="3">${component.props.content}</textarea>
                    </div>
                    <div class="property-group">
                        <label>Font Size</label>
                        <input type="text" id="prop-fontSize" value="${component.props.fontSize}">
                    </div>
                    <div class="property-group">
                        <label>Color</label>
                        <div class="color-picker-group">
                            <input type="color" id="prop-color-picker" value="${component.props.color}" class="color-picker">
                            <input type="text" id="prop-color" value="${component.props.color}" class="color-input">
                        </div>
                    </div>
                `;
                break;

            default:
                html += '<p>No content properties available for this component.</p>';
        }

        html += '</div>';
        return html;
    }

    renderStyleProperties() {
        const component = this.selectedComponent;
        return `
            <div class="property-section">
                <h4>Style Properties</h4>
                <div class="property-group">
                    <label>Background</label>
                    <input type="text" id="style-background" value="${component.styling.background || ''}">
                </div>
                <div class="property-group">
                    <label>Padding</label>
                    <input type="text" id="style-padding" value="${component.styling.padding || ''}">
                </div>
                <div class="property-group">
                    <label>Border Radius</label>
                    <input type="text" id="style-borderRadius" value="${component.styling.borderRadius || ''}">
                </div>
                <div class="property-group">
                    <label>Border</label>
                    <input type="text" id="style-border" value="${component.styling.border || ''}">
                </div>
                <div class="property-group">
                    <label>Margin</label>
                    <input type="text" id="style-margin" value="${component.styling.margin || ''}">
                </div>
            </div>
        `;
    }

    renderDataProperties() {
        const component = this.selectedComponent;
        let html = `
            <div class="property-section">
                <h4>Data Properties</h4>
                <div class="property-group">
                    <label>Data Source</label>
                    <select id="data-source">
                        <option value="static">Static Data</option>
                        <option value="revenue.current" ${component.props.dataSource === 'revenue.current' ? 'selected' : ''}>Revenue Current</option>
                        <option value="revenue.monthly" ${component.props.dataSource === 'revenue.monthly' ? 'selected' : ''}>Revenue Monthly</option>
                        <option value="clients.total" ${component.props.dataSource === 'clients.total' ? 'selected' : ''}>Total Clients</option>
                        <option value="clients.by_program" ${component.props.dataSource === 'clients.by_program' ? 'selected' : ''}>Clients by Program</option>
                        <option value="activities" ${component.props.dataSource === 'activities' ? 'selected' : ''}>Activities</option>
                        <option value="coaches" ${component.props.dataSource === 'coaches' ? 'selected' : ''}>Coaches</option>
                    </select>
                </div>`;

        // Add target value input for progress bar and gauge components
        if (component.type === 'progress-bar' || component.type === 'gauge') {
            html += `
                <div class="property-group">
                    <label>Target Value</label>
                    <input type="number" id="target-value" value="${component.props.target || 100}" min="1" step="0.1">
                    <small>The target value used to calculate percentage completion</small>
                </div>`;
        }

        html += `
                <div class="property-group">
                    <label>Refresh Interval</label>
                    <select id="refresh-interval">
                        <option value="0">Manual</option>
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="900">15 minutes</option>
                    </select>
                </div>
            </div>
        `;
        
        return html;
    }

    setupPropertyListeners() {
        // Content property listeners
        const setupInputListener = (id, property, isProps = true) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    if (isProps) {
                        this.selectedComponent.props[property] = input.value;
                    } else {
                        this.selectedComponent.styling[property] = input.value;
                    }
                    this.renderComponents();
                });
            }
        };

        // Setup all property listeners
        setupInputListener('prop-value', 'value');
        setupInputListener('prop-label', 'label');
        setupInputListener('prop-change', 'change');
        setupInputListener('prop-title', 'title');
        setupInputListener('prop-text', 'text');
        setupInputListener('prop-icon', 'icon');
        setupInputListener('prop-content', 'content');
        setupInputListener('prop-fontSize', 'fontSize');
        setupInputListener('prop-color', 'color');
        
        // Grid-specific property listeners
        const setupGridListener = (id, property) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    const value = parseInt(input.value) || 1;
                    this.selectedComponent.props[property] = Math.max(1, Math.min(6, value));
                    
                    // Update styling for grid layout
                    if (property === 'rows') {
                        this.selectedComponent.styling.gridTemplateRows = `repeat(${this.selectedComponent.props.rows}, 1fr)`;
                    } else if (property === 'columns') {
                        this.selectedComponent.styling.gridTemplateColumns = `repeat(${this.selectedComponent.props.columns}, 1fr)`;
                    }
                    
                    this.renderComponents();
                });
            }
        };
        
        setupGridListener('prop-rows', 'rows');
        setupGridListener('prop-columns', 'columns');
        setupInputListener('prop-gap', 'gap');

        // Style property listeners
        setupInputListener('style-background', 'background', false);
        setupInputListener('style-padding', 'padding', false);
        setupInputListener('style-borderRadius', 'borderRadius', false);
        setupInputListener('style-border', 'border', false);
        setupInputListener('style-margin', 'margin', false);

        // Data source listener
        const dataSourceSelect = document.getElementById('data-source');
        if (dataSourceSelect) {
            dataSourceSelect.addEventListener('change', () => {
                this.selectedComponent.props.dataSource = dataSourceSelect.value;
                this.updateComponentData(this.selectedComponent);
                this.renderComponents();
            });
        }

        // Color picker sync
        const colorPicker = document.getElementById('prop-color-picker');
        const colorInput = document.getElementById('prop-color');
        if (colorPicker && colorInput) {
            colorPicker.addEventListener('input', () => {
                colorInput.value = colorPicker.value;
                this.selectedComponent.props.color = colorPicker.value;
                this.renderComponents();
            });
        }

        // Target value listener for progress bar and gauge components
        const targetValueInput = document.getElementById('target-value');
        if (targetValueInput) {
            targetValueInput.addEventListener('input', () => {
                const newTarget = parseFloat(targetValueInput.value) || 100;
                this.selectedComponent.props.target = newTarget;
                this.renderComponents();
            });
        }
    }

    // Component Actions
    editComponent(componentId) {
        this.selectComponent(componentId);
    }

    deleteComponent(componentId) {
        if (confirm('Are you sure you want to delete this component?')) {
            this.components = this.components.filter(c => c.id !== componentId);
            this.renderComponents();
            this.saveToHistory();
            
            // Clear properties panel
            document.getElementById('properties-content').innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select a component to edit its properties</p>
                </div>
            `;
        }
    }

    reorderComponents(oldIndex, newIndex) {
        const component = this.components.splice(oldIndex, 1)[0];
        this.components.splice(newIndex, 0, component);
        this.renderComponents();
        this.saveToHistory();
    }

    // Widget Actions
    saveWidget() {
        this.currentWidget.definition.components = this.components;
        this.currentWidget.updated = new Date().toISOString();
        
        if (!this.currentWidget.id) {
            this.currentWidget.id = 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.currentWidget.created = new Date().toISOString();
        }

        const widgets = this.getStoredWidgets();
        const existingIndex = widgets.findIndex(w => w.id === this.currentWidget.id);
        
        if (existingIndex >= 0) {
            widgets[existingIndex] = this.currentWidget;
        } else {
            widgets.push(this.currentWidget);
        }

        this.saveStoredWidgets(widgets);
        this.showNotification('Widget saved successfully!', 'success');
    }

    publishWidget() {
        this.currentWidget.status = 'published';
        this.currentWidget.published = new Date().toISOString();
        this.saveWidget();
        this.showNotification('Widget published successfully!', 'success');
    }

    previewWidget() {
        const modal = document.getElementById('preview-modal');
        const container = document.getElementById('preview-container');
        
        container.innerHTML = `
            <div class="widget-preview-full">
                <div class="widget-header">
                    <h2>${this.currentWidget.name}</h2>
                    <p>${this.currentWidget.description}</p>
                </div>
                <div class="widget-content">
                    ${this.components.map((component, index) => 
                        this.renderComponent(component, index)
                    ).join('')}
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Re-render charts in preview
        setTimeout(() => {
            this.renderCharts();
        }, 100);
    }

    clearWidget() {
        if (confirm('Are you sure you want to clear all components?')) {
            this.components = [];
            this.renderComponents();
            this.saveToHistory();
        }
    }

    // History Management
    saveToHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(this.components)));
        this.historyIndex++;
        
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.components = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderComponents();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.components = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderComponents();
        }
    }

    // Utility Functions
    showEmptyMessage() {
        const widgetContent = document.getElementById('widget-content');
        widgetContent.innerHTML = `
            <div class="empty-widget-message">
                <i class="fas fa-puzzle-piece"></i>
                <h3>Start Building Your Widget</h3>
                <p>Drag components from the left sidebar to add them to your widget</p>
            </div>
        `;
    }

    hideEmptyMessage() {
        const emptyMessage = document.querySelector('.empty-widget-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
    }

    updateTitle() {
        document.title = `${this.currentWidget.name} - Widget Builder`;
    }

    updateDevicePreview(device) {
        const canvas = document.getElementById('widget-canvas');
        canvas.className = `widget-canvas device-${device}`;
    }

    filterComponents(searchTerm) {
        const components = document.querySelectorAll('.component-item');
        components.forEach(component => {
            const text = component.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                component.style.display = 'flex';
            } else {
                component.style.display = 'none';
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    getStoredWidgets() {
        try {
            const stored = localStorage.getItem('phoenix_widgets');
            return stored ? JSON.parse(stored).widgets || [] : [];
        } catch (error) {
            console.error('Error loading widgets:', error);
            return [];
        }
    }

    saveStoredWidgets(widgets) {
        try {
            localStorage.setItem('phoenix_widgets', JSON.stringify({
                widgets: widgets,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving widgets:', error);
        }
    }

    updateComponentData(component) {
        const dataSource = component.props.dataSource;
        
        if (dataSource === 'static') return;
        
        // Parse data source path (e.g., 'revenue.current' or 'clients.by_program')
        const pathParts = dataSource.split('.');
        let data = this.dummyData;
        
        // Navigate through the data object
        for (const part of pathParts) {
            if (data && data[part] !== undefined) {
                data = data[part];
            } else {
                console.warn(`Data source path not found: ${dataSource}`);
                return;
            }
        }
        
        // Update component based on its type and the new data
        switch (component.type) {
            case 'kpi-metric':
                this.updateKPIMetric(component, dataSource, data);
                break;
                
            case 'line-chart':
                this.updateLineChart(component, dataSource, data);
                break;
                
            case 'bar-chart':
                this.updateBarChart(component, dataSource, data);
                break;
                
            case 'pie-chart':
                this.updatePieChart(component, dataSource, data);
                break;
                
            case 'progress-bar':
                this.updateProgressBar(component, dataSource, data);
                break;
                
            case 'gauge':
                this.updateGauge(component, dataSource, data);
                break;
                
            case 'activity-feed':
                this.updateActivityFeed(component, dataSource, data);
                break;
                
            case 'data-table':
                this.updateDataTable(component, dataSource, data);
                break;
        }
        
        this.showNotification(`Component updated with ${dataSource} data`, 'success');
    }

    updateKPIMetric(component, dataSource, data) {
        switch (dataSource) {
            case 'revenue.current':
                component.props.value = this.formatCurrency(data);
                component.props.label = 'Current Revenue';
                component.props.change = `+${this.dummyData.revenue.growth}%`;
                break;
            case 'clients.total':
                component.props.value = data.toString();
                component.props.label = 'Total Clients';
                component.props.change = '+12 this month';
                break;
            case 'clients.by_program':
                const totalClients = data.reduce((sum, program) => sum + program.count, 0);
                component.props.value = totalClients.toString();
                component.props.label = 'Clients by Program';
                component.props.change = '+8.5%';
                break;
            case 'activities':
                component.props.value = data.length.toString();
                component.props.label = 'Recent Activities';
                component.props.change = '+3 today';
                break;
            case 'coaches':
                component.props.value = data.length.toString();
                component.props.label = 'Active Coaches';
                component.props.change = 'All active';
                break;
            default:
                component.props.value = data.toString();
                component.props.label = 'Data Value';
                component.props.change = 'Updated';
        }
    }

    updateLineChart(component, dataSource, data) {
        switch (dataSource) {
            case 'revenue.monthly':
                component.props.data = this.dummyData.revenue.monthly;
                component.props.labels = this.dummyData.revenue.labels;
                component.props.title = 'Revenue Trend';
                break;
            case 'clients.by_program':
                component.props.data = data.map(p => p.count);
                component.props.labels = data.map(p => p.name);
                component.props.title = 'Clients by Program Trend';
                break;
            case 'revenue.current':
                // Create a simple trend from current value
                const currentRevenue = data;
                const trendData = [currentRevenue * 0.8, currentRevenue * 0.9, currentRevenue];
                component.props.data = trendData;
                component.props.labels = ['2 months ago', 'Last month', 'Current'];
                component.props.title = 'Revenue Progress';
                break;
            default:
                component.props.data = Array.isArray(data) ? data : [data];
                component.props.labels = Array.isArray(data) ? data.map((_, i) => `Item ${i + 1}`) : ['Value'];
                component.props.title = 'Data Trend';
        }
    }

    updateBarChart(component, dataSource, data) {
        switch (dataSource) {
            case 'clients.by_program':
                component.props.data = data.map(p => p.count);
                component.props.labels = data.map(p => p.name);
                component.props.colors = data.map(p => p.color);
                component.props.title = 'Clients by Program';
                break;
            case 'revenue.monthly':
                component.props.data = this.dummyData.revenue.monthly;
                component.props.labels = this.dummyData.revenue.labels;
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                component.props.title = 'Monthly Revenue';
                break;
            case 'coaches':
                component.props.data = data.map(coach => coach.clients);
                component.props.labels = data.map(coach => coach.name);
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B'];
                component.props.title = 'Clients per Coach';
                break;
            default:
                component.props.data = Array.isArray(data) ? data.map(item => typeof item === 'object' ? Object.values(item)[0] : item) : [data];
                component.props.labels = Array.isArray(data) ? data.map((_, i) => `Item ${i + 1}`) : ['Value'];
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
                component.props.title = 'Data Comparison';
        }
    }

    updatePieChart(component, dataSource, data) {
        switch (dataSource) {
            case 'clients.by_program':
                component.props.data = data.map(p => p.count);
                component.props.labels = data.map(p => p.name);
                component.props.colors = data.map(p => p.color);
                component.props.title = 'Program Distribution';
                break;
            case 'coaches':
                component.props.data = data.map(coach => coach.clients);
                component.props.labels = data.map(coach => coach.name);
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B'];
                component.props.title = 'Coach Client Distribution';
                break;
            case 'revenue.monthly':
                component.props.data = this.dummyData.revenue.monthly;
                component.props.labels = this.dummyData.revenue.labels;
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                component.props.title = 'Revenue Distribution';
                break;
            default:
                component.props.data = Array.isArray(data) ? data.map(item => typeof item === 'object' ? Object.values(item)[0] : item) : [data];
                component.props.labels = Array.isArray(data) ? data.map((_, i) => `Segment ${i + 1}`) : ['Value'];
                component.props.colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
                component.props.title = 'Data Distribution';
        }
    }

    updateProgressBar(component, dataSource, data) {
        switch (dataSource) {
            case 'clients.total':
                component.props.value = Math.min(data, 300); // Cap at 300 for progress bar
                component.props.max = 300;
                component.props.label = 'Client Goal Progress';
                component.props.unit = ' clients';
                break;
            case 'revenue.current':
                const revenueGoal = 30000;
                component.props.value = Math.min(data, revenueGoal);
                component.props.max = revenueGoal;
                component.props.label = 'Revenue Goal Progress';
                component.props.unit = '';
                break;
            case 'clients.by_program':
                const totalProgramClients = data.reduce((sum, program) => sum + program.count, 0);
                component.props.value = totalProgramClients;
                component.props.max = 300;
                component.props.label = 'Program Enrollment';
                component.props.unit = ' clients';
                break;
            default:
                const numericValue = typeof data === 'number' ? data : parseFloat(data) || 0;
                component.props.value = numericValue;
                component.props.max = Math.max(100, numericValue * 1.2);
                component.props.label = 'Progress';
                component.props.unit = '';
        }
    }

    updateActivityFeed(component, dataSource, data) {
        switch (dataSource) {
            case 'activities':
                component.props.activities = data.slice(0, 5);
                component.props.title = 'Recent Activity';
                break;
            case 'coaches':
                // Convert coaches to activity-like format
                const coachActivities = data.map(coach => ({
                    type: 'coach_update',
                    message: `${coach.name} has ${coach.clients} clients (${coach.rating}★)`,
                    time: 'Active now',
                    icon: 'fas fa-user-tie'
                }));
                component.props.activities = coachActivities.slice(0, 5);
                component.props.title = 'Coach Status';
                break;
            case 'clients.by_program':
                // Convert program data to activity format
                const programActivities = data.map(program => ({
                    type: 'program_update',
                    message: `${program.name}: ${program.count} active clients`,
                    time: 'Updated recently',
                    icon: 'fas fa-users'
                }));
                component.props.activities = programActivities.slice(0, 5);
                component.props.title = 'Program Updates';
                break;
            default:
                component.props.activities = [{
                    type: 'data_update',
                    message: `Data source updated: ${dataSource}`,
                    time: 'Just now',
                    icon: 'fas fa-database'
                }];
                component.props.title = 'Data Updates';
        }
    }

    updateGauge(component, dataSource, data) {
        switch (dataSource) {
            case 'performance.engagement_rate':
                component.props.value = data;
                component.props.target = 100;
                component.props.label = 'Engagement Rate';
                component.props.unit = '%';
                break;
            case 'clients.retention_rate':
                component.props.value = this.dummyData.clients.retention_rate;
                component.props.target = 100;
                component.props.label = 'Client Retention';
                component.props.unit = '%';
                break;
            case 'performance.app_rating':
                component.props.value = this.dummyData.performance.app_rating * 20; // Convert 4.8/5 to percentage
                component.props.target = 100;
                component.props.label = 'App Rating';
                component.props.unit = '%';
                break;
            case 'revenue.current':
                const revenueGoal = 30000;
                component.props.value = (data / revenueGoal) * 100;
                component.props.target = 100;
                component.props.label = 'Revenue Goal';
                component.props.unit = '%';
                break;
            case 'clients.total':
                const clientGoal = 300;
                component.props.value = (data / clientGoal) * 100;
                component.props.target = 100;
                component.props.label = 'Client Goal';
                component.props.unit = '%';
                break;
            default:
                const numericValue = typeof data === 'number' ? data : parseFloat(data) || 0;
                component.props.value = numericValue;
                component.props.target = Math.max(100, numericValue * 1.2);
                component.props.label = 'Performance';
                component.props.unit = '%';
        }
    }

    updateDataTable(component, dataSource, data) {
        switch (dataSource) {
            case 'coaches':
                component.props.data = data;
                component.props.columns = ['name', 'clients', 'rating', 'specialty'];
                component.props.title = 'Coach Performance';
                break;
            case 'clients.by_program':
                // Convert program data to table format
                const programTableData = data.map(program => ({
                    program: program.name,
                    clients: program.count,
                    percentage: `${Math.round((program.count / data.reduce((sum, p) => sum + p.count, 0)) * 100)}%`,
                    status: 'Active'
                }));
                component.props.data = programTableData;
                component.props.columns = ['program', 'clients', 'percentage', 'status'];
                component.props.title = 'Program Statistics';
                break;
            case 'revenue.monthly':
                // Convert monthly revenue array to table format
                const revenueTableData = data.map((amount, index) => ({
                    month: this.dummyData.revenue.labels[index] || `Month ${index + 1}`,
                    revenue: this.formatCurrency(amount),
                    growth: index > 0 ? `${((amount - data[index - 1]) / data[index - 1] * 100).toFixed(1)}%` : 'N/A',
                    status: amount > (data[index - 1] || 0) ? 'Growth' : 'Decline'
                }));
                component.props.data = revenueTableData;
                component.props.columns = ['month', 'revenue', 'growth', 'status'];
                component.props.title = 'Monthly Revenue';
                break;
            case 'activities':
                // Convert activities to table format
                const activityTableData = data.slice(0, 5).map(activity => ({
                    type: activity.type.replace('_', ' ').toUpperCase(),
                    message: activity.message.substring(0, 50) + '...',
                    time: activity.time,
                    status: 'Completed'
                }));
                component.props.data = activityTableData;
                component.props.columns = ['type', 'message', 'time', 'status'];
                component.props.title = 'Activity Log';
                break;
            default:
                // Generic table for other data types
                if (Array.isArray(data)) {
                    // Check if it's an array of objects or primitives
                    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                        component.props.data = data.slice(0, 10);
                        component.props.columns = Object.keys(data[0] || {});
                    } else {
                        // Convert array of primitives to table format
                        const primitiveTableData = data.slice(0, 10).map((value, index) => ({
                            index: index + 1,
                            value: value,
                            type: typeof value
                        }));
                        component.props.data = primitiveTableData;
                        component.props.columns = ['index', 'value', 'type'];
                    }
                } else {
                    component.props.data = [{ value: data, source: dataSource }];
                    component.props.columns = ['value', 'source'];
                }
                component.props.title = 'Data Table';
        }
    }

    // Grid-specific methods
    renderGridCellComponent(cellComponent) {
        // Render a simplified version of the component for grid cells
        switch (cellComponent.type) {
            case 'kpi-metric':
                return `
                    <div class="grid-cell-kpi" style="text-align: center; padding: 5px;">
                        <div style="font-size: 18px; font-weight: bold; color: #4F46E5;">${cellComponent.props.value}</div>
                        <div style="font-size: 10px; color: #666; margin-top: 2px;">${cellComponent.props.label}</div>
                        <div style="font-size: 9px; color: #10B981; margin-top: 1px;">${cellComponent.props.change}</div>
                    </div>
                `;
            case 'line-chart':
            case 'bar-chart':
            case 'pie-chart':
                return `
                    <div class="grid-cell-chart" style="text-align: center; padding: 5px;">
                        <i class="fas fa-chart-${cellComponent.type.includes('line') ? 'line' : cellComponent.type.includes('bar') ? 'bar' : 'pie'}" style="font-size: 24px; color: #4F46E5; margin-bottom: 5px;"></i>
                        <div style="font-size: 10px; color: #666;">${cellComponent.props.title}</div>
                    </div>
                `;
            case 'progress-bar':
                const progressPercentage = (cellComponent.props.value / cellComponent.props.target) * 100;
                return `
                    <div class="grid-cell-progress" style="padding: 5px;">
                        <div style="font-size: 10px; color: #666; margin-bottom: 3px;">${cellComponent.props.label}</div>
                        <div style="background: #f0f0f0; border-radius: 5px; height: 8px;">
                            <div style="background: #4F46E5; height: 100%; border-radius: 5px; width: ${Math.min(progressPercentage, 100)}%;"></div>
                        </div>
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">${Math.round(progressPercentage)}%</div>
                    </div>
                `;
            case 'button':
                return `
                    <div class="grid-cell-button" style="text-align: center; padding: 5px;">
                        <button style="padding: 5px 10px; border: none; border-radius: 4px; background: #4F46E5; color: white; font-size: 10px; cursor: pointer;">
                            <i class="${cellComponent.props.icon}" style="margin-right: 3px;"></i>
                            ${cellComponent.props.text}
                        </button>
                    </div>
                `;
            case 'text':
                return `
                    <div class="grid-cell-text" style="padding: 5px; font-size: 11px; color: #333; text-align: center;">
                        ${cellComponent.props.content.substring(0, 50)}${cellComponent.props.content.length > 50 ? '...' : ''}
                    </div>
                `;
            case 'activity-feed':
                return `
                    <div class="grid-cell-activity" style="padding: 5px;">
                        <div style="font-size: 10px; font-weight: bold; color: #333; margin-bottom: 3px;">${cellComponent.props.title}</div>
                        ${cellComponent.props.activities.slice(0, 2).map(activity => `
                            <div style="font-size: 8px; color: #666; margin-bottom: 2px; display: flex; align-items: center;">
                                <i class="${activity.icon}" style="margin-right: 3px; font-size: 8px;"></i>
                                <span>${activity.message.substring(0, 30)}...</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 'data-table':
                return `
                    <div class="grid-cell-table" style="padding: 5px; text-align: center;">
                        <i class="fas fa-table" style="font-size: 20px; color: #4F46E5; margin-bottom: 3px;"></i>
                        <div style="font-size: 10px; color: #666;">${cellComponent.props.title}</div>
                        <div style="font-size: 9px; color: #999;">${cellComponent.props.data.length} rows</div>
                    </div>
                `;
            default:
                return `
                    <div class="grid-cell-generic" style="text-align: center; padding: 5px; font-size: 10px; color: #666;">
                        <i class="fas fa-cube" style="font-size: 16px; margin-bottom: 3px; display: block;"></i>
                        ${cellComponent.type}
                    </div>
                `;
        }
    }

    removeFromGridCell(gridId, cellIndex) {
        const gridComponent = this.components.find(c => c.id === gridId);
        if (gridComponent && gridComponent.props.cells[cellIndex]) {
            delete gridComponent.props.cells[cellIndex];
            this.renderComponents();
            this.saveToHistory();
            this.showNotification('Component removed from grid cell', 'success');
        }
    }

    addToGridCell(gridId, cellIndex, componentType) {
        const gridComponent = this.components.find(c => c.id === gridId);
        if (gridComponent) {
            // Check if cell is already occupied
            if (gridComponent.props.cells[cellIndex]) {
                this.showNotification('Grid cell is already occupied', 'error');
                return false;
            }

            // Create a new component for the grid cell
            const cellComponent = this.createComponent(componentType);
            gridComponent.props.cells[cellIndex] = cellComponent;
            
            this.renderComponents();
            this.saveToHistory();
            this.showNotification('Component added to grid cell', 'success');
            return true;
        }
        return false;
    }

    setupGridCellDragDrop() {
        // This will be called after components are rendered to setup grid cell drop zones
        setTimeout(() => {
            document.querySelectorAll('.grid-cell.empty').forEach(cell => {
                // Handle drag over
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    cell.style.borderColor = '#4F46E5';
                    cell.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
                });

                // Handle drag leave
                cell.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cell.style.borderColor = '#ddd';
                    cell.style.backgroundColor = '#f8f9fa';
                });

                // Handle drop
                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const componentType = e.dataTransfer.getData('text/plain');
                    const gridId = cell.dataset.gridId;
                    const cellIndex = parseInt(cell.dataset.cellIndex);
                    
                    if (componentType && gridId !== undefined && cellIndex !== undefined) {
                        this.addToGridCell(gridId, cellIndex, componentType);
                    }
                    
                    // Reset styles
                    cell.style.borderColor = '#ddd';
                    cell.style.backgroundColor = '#f8f9fa';
                });
            });
        }, 100);
    }

    showNotification(message, type = 'info') {
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
}

// Chatbot functionality for Widget Builder
class WidgetChatbot {
    constructor() {
        this.isCollapsed = false;
        this.isTyping = false;
        this.responses = this.initializeResponses();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotSend = document.getElementById('chatbot-send');

        // Toggle chatbot
        chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Input handling
        chatbotInput.addEventListener('input', () => {
            const hasText = chatbotInput.value.trim().length > 0;
            chatbotSend.disabled = !hasText;
        });

        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        chatbotSend.addEventListener('click', () => {
            this.sendMessage();
        });
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
        const chatbotBody = document.getElementById('chatbot-body');
        const toggleIcon = document.querySelector('#chatbot-toggle i');
        
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            chatbotBody.classList.add('collapsed');
            toggleIcon.className = 'fas fa-plus';
        } else {
            chatbotBody.classList.remove('collapsed');
            toggleIcon.className = 'fas fa-minus';
            // Focus input when opening
            setTimeout(() => {
                document.getElementById('chatbot-input').focus();
            }, 100);
        }
    }

    sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        document.getElementById('chatbot-send').disabled = true;
        
        // Show typing indicator and respond
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
            this.respondToMessage(message);
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">${content}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatbot-messages');
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
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    respondToMessage(userMessage) {
        const response = this.generateResponse(userMessage);
        this.addMessage(response, 'bot');
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for specific keywords and patterns
        for (const [pattern, responses] of Object.entries(this.responses)) {
            if (this.matchesPattern(lowerMessage, pattern)) {
                return this.getRandomResponse(responses);
            }
        }
        
        // Default response
        return this.getRandomResponse(this.responses.default);
    }

    matchesPattern(message, pattern) {
        const keywords = pattern.split('|');
        return keywords.some(keyword => message.includes(keyword.trim()));
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    initializeResponses() {
        return {
            'hello|hi|hey|greetings': [
                "Hello! I'm here to help you build amazing widgets. What would you like to create today?",
                "Hi there! Ready to build some widgets? I can help you choose components and customize them.",
                "Hey! Welcome to the Widget Builder. How can I assist you with your widget creation?"
            ],
            'help|how|what can you do': [
                "I can help you with:\n• Choosing the right components for your widget\n• Explaining how different components work\n• Suggesting layouts and designs\n• Troubleshooting widget issues\n\nWhat specific help do you need?",
                "I'm your Widget Assistant! I can guide you through:\n• Adding and configuring components\n• Customizing styles and properties\n• Understanding data sources\n• Best practices for widget design\n\nWhat would you like to know?",
                "Here's what I can help with:\n• Component selection and usage\n• Widget layout suggestions\n• Property configuration\n• Design tips and tricks\n\nJust ask me anything about widget building!"
            ],
            'component|components|add': [
                "Great question about components! You can drag components from the left sidebar to your widget canvas. Popular components include:\n• KPI Metrics for displaying key numbers\n• Charts for data visualization\n• Buttons for actions\n• Text and headings for content\n\nWhich type of component are you looking for?",
                "Components are the building blocks of your widget! Here are the main categories:\n• Analytics: KPI metrics, charts, progress bars\n• Actions: Buttons and quick actions\n• Display: Text, headings, tables\n• Layout: Containers, grids, spacers\n\nWhat kind of data do you want to display?",
                "To add components, simply drag them from the sidebar to your canvas. Each component can be customized in the Properties panel. What specific component would you like to add?"
            ],
            'chart|graph|data visualization': [
                "Charts are perfect for visualizing data! Available chart types:\n• Line Chart: Great for trends over time\n• Bar Chart: Compare different categories\n• Pie Chart: Show proportions and percentages\n• Progress Bar: Display completion or goals\n\nWhat type of data are you trying to visualize?",
                "For data visualization, I recommend:\n• Line charts for revenue trends\n• Bar charts for comparing programs or coaches\n• Pie charts for client distribution\n• KPI metrics for key numbers\n\nAll charts use dummy data that you can customize. Which chart type interests you?",
                "Charts make your widgets more engaging! You can customize colors, labels, and data sources. The system includes sample data for revenue, clients, and performance metrics. What would you like to chart?"
            ],
            'kpi|metric|number|revenue|clients': [
                "KPI metrics are perfect for highlighting important numbers! They can display:\n• Revenue figures with growth indicators\n• Client counts and retention rates\n• Performance metrics and ratings\n• Any key business metric\n\nThe KPI component includes the value, label, and change indicator. What metric would you like to showcase?",
                "KPI components are great for dashboard widgets! They automatically format numbers and show growth/decline with color coding. You can connect them to data sources like revenue, client counts, or custom metrics. What's your key metric?",
                "Metrics make your widgets informative at a glance! The KPI component supports currency formatting, percentages, and trend indicators. Perfect for showing business performance. Which metric is most important for your widget?"
            ],
            'button|action|click': [
                "Buttons make your widgets interactive! You can add:\n• Single action buttons\n• Button groups for multiple actions\n• Quick action panels\n\nButtons can be styled with different colors (primary, secondary, success) and icons. What action do you want users to take?",
                "Action components let users interact with your widget:\n• Add Client buttons\n• Schedule actions\n• Navigation buttons\n• Custom actions\n\nEach button can have an icon and custom styling. What functionality do you need?",
                "Interactive elements like buttons make widgets more useful! You can customize the text, icon, color, and action. Popular actions include adding clients, scheduling, and navigation. What would you like your button to do?"
            ],
            'style|color|design|customize': [
                "Styling makes your widgets look professional! You can customize:\n• Colors and backgrounds\n• Padding and margins\n• Border radius and borders\n• Fonts and text sizes\n\nSelect any component and use the Properties panel to modify its appearance. What would you like to style?",
                "Great design makes widgets more appealing! The Properties panel has three tabs:\n• Content: Text, values, and data\n• Style: Colors, spacing, and appearance\n• Data: Sources and refresh settings\n\nWhich aspect would you like to customize?",
                "Visual customization is key to great widgets! You can:\n• Change component colors and backgrounds\n• Adjust spacing and layout\n• Modify text styles and sizes\n• Set borders and shadows\n\nWhat design changes are you thinking about?"
            ],
            'data|source|connect|api': [
                "Data sources bring your widgets to life! Currently available:\n• Revenue data (current, monthly trends)\n• Client information (total, by program)\n• Performance metrics (engagement, ratings)\n• Activity feeds and coach data\n\nYou can also use static data for custom content. What data do you want to display?",
                "Connecting data makes widgets dynamic! The system includes sample data for:\n• Financial metrics\n• Client analytics\n• Performance indicators\n• Activity streams\n\nIn the Properties panel, use the Data tab to select sources. Which data interests you most?",
                "Data integration is powerful! While we use sample data for demonstration, real widgets can connect to APIs and databases. The current system shows how different data types work with various components. What kind of data are you working with?"
            ],
            'save|publish|export': [
                "Great question about saving! You can:\n• Save: Stores your widget as a draft\n• Publish: Makes it available for use\n• Preview: See how it looks in full screen\n\nYour widgets are automatically saved to browser storage. Ready to save your current widget?",
                "Widget management options:\n• Save drafts for later editing\n• Publish when ready for production\n• Preview to test appearance\n• Export definitions for sharing\n\nDon't forget to give your widget a descriptive name! What would you like to do with your widget?",
                "Publishing workflow:\n1. Build and test your widget\n2. Save as draft\n3. Preview to verify\n4. Publish when satisfied\n\nPublished widgets can be used in dashboards and applications. Are you ready to publish?"
            ],
            'layout|grid|container|organize': [
                "Layout components help organize your widget:\n• Containers: Group related elements\n• Grids: Arrange items in columns\n• Spacers: Add breathing room\n• Dividers: Separate sections\n\nGood layout makes widgets easier to read and use. How do you want to organize your content?",
                "Widget organization tips:\n• Use containers to group related components\n• Add spacers between sections\n• Consider visual hierarchy\n• Keep important info at the top\n\nWhat layout structure are you aiming for?",
                "Layout best practices:\n• Group similar information together\n• Use consistent spacing\n• Maintain visual balance\n• Consider mobile responsiveness\n\nNeed help organizing your widget components?"
            ],
            'mobile|responsive|device': [
                "Responsive design is important! The widget builder includes:\n• Desktop view (default)\n• Tablet preview\n• Mobile preview\n\nUse the device buttons in the toolbar to test different screen sizes. Your widgets should look good on all devices!",
                "Mobile optimization tips:\n• Keep text readable on small screens\n• Ensure buttons are touch-friendly\n• Stack components vertically on mobile\n• Test with the mobile preview\n\nHow does your widget look on different devices?",
                "Device compatibility matters! The preview modes help you see how widgets adapt to different screen sizes. Components automatically adjust, but you might want to customize spacing for mobile. Want to test your widget on different devices?"
            ],
            'error|problem|issue|not working': [
                "I'm here to help troubleshoot! Common issues:\n• Components not dragging: Try refreshing the page\n• Properties not saving: Check if component is selected\n• Charts not showing: Wait for data to load\n• Styling not applying: Verify CSS syntax\n\nWhat specific problem are you experiencing?",
                "Let's solve this together! Can you describe:\n• What you were trying to do\n• What happened instead\n• Any error messages you saw\n\nI'll help you get back on track!",
                "Troubleshooting steps:\n1. Check if components are properly selected\n2. Verify property values are valid\n3. Try refreshing the page\n4. Clear browser cache if needed\n\nWhat exactly isn't working as expected?"
            ],
            'thank|thanks|appreciate': [
                "You're very welcome! I'm glad I could help with your widget building. Feel free to ask if you need anything else!",
                "Happy to help! Building great widgets is what I'm here for. Don't hesitate to reach out with more questions!",
                "My pleasure! I hope your widget turns out amazing. I'm always here if you need more assistance!"
            ],
            'bye|goodbye|see you': [
                "Goodbye! Happy widget building! Remember, I'm always here when you need help.",
                "See you later! Good luck with your widget project. Feel free to come back anytime!",
                "Farewell! I hope you create some amazing widgets. Don't hesitate to ask for help again!"
            ],
            'default': [
                "That's an interesting question! I'm specialized in helping with widget building. Could you tell me more about what you're trying to accomplish with your widget?",
                "I'd love to help! Can you be more specific about your widget building needs? I can assist with components, styling, data, and layout.",
                "I'm here to help with widget creation! Whether you need help with components, design, or functionality, just let me know what you're working on.",
                "Great question! I specialize in widget building assistance. What specific aspect of widget creation can I help you with today?",
                "I'm your Widget Assistant! I can help with components, styling, data sources, and design. What would you like to know about building widgets?"
            ]
        };
    }
}

// Initialize Widget Builder and Chatbot
let widgetBuilder;
let widgetChatbot;

document.addEventListener('DOMContentLoaded', () => {
    widgetBuilder = new WidgetBuilder();
    widgetChatbot = new WidgetChatbot();
});
