// Form Builder with Drag & Drop Functionality
class FormBuilder {
    constructor() {
        this.formElements = [];
        this.selectedElement = null;
        this.formId = null;
        this.formName = '';
        this.undoStack = [];
        this.redoStack = [];
        this.zoomLevel = 100;
        this.currentDevice = 'desktop';
        
        this.init();
    }

    init() {
        this.parseUrlParams();
        this.setupEventListeners();
        this.initializeDragAndDrop();
        this.setupCategoryToggle();
        this.loadFormData();
    }

    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.formId = urlParams.get('id');
        this.formName = urlParams.get('name') || 'Untitled Form';
        
        // Update UI with form name
        document.getElementById('form-title').value = this.formName;
        document.getElementById('form-name-breadcrumb').textContent = this.formName;
        document.querySelector('.form-preview-title').textContent = this.formName;
    }

    setupEventListeners() {
        // Form title editing
        const formTitleInput = document.getElementById('form-title');
        formTitleInput.addEventListener('input', (e) => {
            this.formName = e.target.value || 'Untitled Form';
            document.getElementById('form-name-breadcrumb').textContent = this.formName;
            document.querySelector('.form-preview-title').textContent = this.formName;
        });

        // Header actions
        document.getElementById('preview-form').addEventListener('click', () => this.previewForm());
        document.getElementById('save-form').addEventListener('click', () => this.saveForm());
        document.getElementById('publish-form').addEventListener('click', () => this.publishForm());

        // Toolbar actions
        document.getElementById('undo-action').addEventListener('click', () => this.undo());
        document.getElementById('redo-action').addEventListener('click', () => this.redo());
        document.getElementById('clear-form').addEventListener('click', () => this.clearForm());

        // Device preview buttons
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentDevice = btn.dataset.device;
                this.updateDevicePreview();
            });
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());

        // Element search
        document.getElementById('element-search').addEventListener('input', (e) => {
            this.filterElements(e.target.value);
        });

        // Modal controls
        this.setupModalControls();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveForm();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.previewForm();
                        break;
                }
            }
            
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteElement(this.selectedElement.id);
            }
        });
    }

    setupModalControls() {
        // Preview modal
        document.getElementById('close-preview-modal').addEventListener('click', () => {
            document.getElementById('preview-modal').style.display = 'none';
        });

        document.getElementById('close-preview').addEventListener('click', () => {
            document.getElementById('preview-modal').style.display = 'none';
        });

        // Settings modal
        document.getElementById('close-settings-modal').addEventListener('click', () => {
            document.getElementById('form-settings-modal').style.display = 'none';
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    initializeDragAndDrop() {
        // Setup click to add functionality for sidebar elements
        document.querySelectorAll('.form-element').forEach(element => {
            // Remove draggable attribute to disable dragging
            element.draggable = false;
            
            // Add click to add functionality
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const elementType = element.dataset.type;
                if (elementType) {
                    this.addFormElement(elementType);
                }
            });
        });

        // Initialize sortable for reordering existing elements
        this.initializeSortable();
    }

    initializeSortable() {
        const formFields = document.getElementById('form-fields');
        
        // Destroy existing sortable instance if it exists
        if (this.sortable) {
            this.sortable.destroy();
        }

        // Only initialize sortable if there are form elements
        if (this.formElements.length > 0) {
            this.sortable = Sortable.create(formFields, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                handle: '.drag-handle', // Use specific drag handle
                onUpdate: (evt) => {
                    this.reorderElements(evt.oldIndex, evt.newIndex);
                }
            });
        }
    }

    setupCategoryToggle() {
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.parentElement;
                const elements = category.querySelector('.category-elements');
                const chevron = header.querySelector('.fas.fa-chevron-down');
                
                category.classList.toggle('active');
                
                if (category.classList.contains('active')) {
                    elements.style.maxHeight = elements.scrollHeight + 'px';
                    chevron.style.transform = 'rotate(0deg)';
                } else {
                    elements.style.maxHeight = '0';
                    chevron.style.transform = 'rotate(-90deg)';
                }
            });
        });
    }

    addFormElement(type, index = -1) {
        const elementId = 'element_' + Date.now();
        const element = this.createElement(type, elementId);
        
        if (index >= 0) {
            this.formElements.splice(index, 0, element);
        } else {
            this.formElements.push(element);
        }
        
        this.saveState();
        this.renderForm();
        this.selectElement(elementId);
    }

    createElement(type, id) {
        const baseElement = {
            id: id,
            type: type,
            label: this.getDefaultLabel(type),
            placeholder: this.getDefaultPlaceholder(type),
            required: false,
            width: '100%',
            cssClass: '',
            helpText: ''
        };

        switch (type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'password':
                return {
                    ...baseElement,
                    maxLength: '',
                    pattern: '',
                    defaultValue: ''
                };

            case 'textarea':
                return {
                    ...baseElement,
                    rows: 4,
                    maxLength: '',
                    defaultValue: ''
                };

            case 'number':
                return {
                    ...baseElement,
                    min: '',
                    max: '',
                    step: '1',
                    defaultValue: ''
                };

            case 'select':
                return {
                    ...baseElement,
                    options: [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' },
                        { value: 'option3', label: 'Option 3' }
                    ],
                    multiple: false
                };

            case 'radio':
            case 'checkbox':
                return {
                    ...baseElement,
                    options: [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' },
                        { value: 'option3', label: 'Option 3' }
                    ],
                    inline: false
                };

            case 'date':
            case 'time':
            case 'datetime':
                return {
                    ...baseElement,
                    min: '',
                    max: '',
                    defaultValue: ''
                };

            case 'file':
                return {
                    ...baseElement,
                    accept: '',
                    multiple: false,
                    maxSize: '10MB'
                };

            case 'rating':
                return {
                    ...baseElement,
                    maxRating: 5,
                    icon: 'star',
                    defaultValue: 0
                };

            case 'slider':
                return {
                    ...baseElement,
                    min: 0,
                    max: 100,
                    step: 1,
                    defaultValue: 50
                };

            case 'heading':
                return {
                    id: id,
                    type: type,
                    text: 'Heading Text',
                    level: 'h2',
                    alignment: 'left',
                    cssClass: ''
                };

            case 'paragraph':
                return {
                    id: id,
                    type: type,
                    text: 'This is a paragraph of text. You can edit this content in the properties panel.',
                    alignment: 'left',
                    cssClass: ''
                };

            case 'divider':
                return {
                    id: id,
                    type: type,
                    style: 'solid',
                    thickness: '1px',
                    color: '#e5e7eb',
                    margin: '20px'
                };

            case 'spacer':
                return {
                    id: id,
                    type: type,
                    height: '20px'
                };

            default:
                return baseElement;
        }
    }

    getDefaultLabel(type) {
        const labels = {
            text: 'Text Input',
            textarea: 'Textarea',
            email: 'Email Address',
            phone: 'Phone Number',
            number: 'Number',
            password: 'Password',
            select: 'Select Option',
            radio: 'Radio Buttons',
            checkbox: 'Checkboxes',
            toggle: 'Toggle Switch',
            date: 'Date',
            time: 'Time',
            datetime: 'Date & Time',
            file: 'File Upload',
            rating: 'Rating',
            slider: 'Slider',
            signature: 'Signature'
        };
        return labels[type] || 'Form Field';
    }

    getDefaultPlaceholder(type) {
        const placeholders = {
            text: 'Enter text...',
            textarea: 'Enter your message...',
            email: 'Enter your email address...',
            phone: 'Enter your phone number...',
            number: 'Enter a number...',
            password: 'Enter your password...'
        };
        return placeholders[type] || '';
    }

    renderForm() {
        const formFields = document.getElementById('form-fields');
        
        if (this.formElements.length === 0) {
            formFields.innerHTML = `
                <div class="empty-form-message">
                    <i class="fas fa-mouse-pointer"></i>
                    <h3>Start Building Your Form</h3>
                    <p>Click on elements from the left sidebar to add them to your form</p>
                </div>
            `;
            // Destroy sortable when no elements
            if (this.sortable) {
                this.sortable.destroy();
                this.sortable = null;
            }
            return;
        }

        formFields.innerHTML = this.formElements.map(element => this.renderElement(element)).join('');
        
        // Add click listeners to form elements
        formFields.querySelectorAll('.form-field-wrapper').forEach(wrapper => {
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectElement(wrapper.dataset.elementId);
            });
        });

        // Add delete buttons
        formFields.querySelectorAll('.delete-element').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteElement(btn.dataset.elementId);
            });
        });

        // Initialize sortable for drag and drop reordering
        this.initializeSortable();
    }

    renderElement(element) {
        let fieldHtml = '';
        
        switch (element.type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'password':
            case 'number':
                fieldHtml = `
                    <input type="${element.type}" 
                           placeholder="${element.placeholder}" 
                           ${element.required ? 'required' : ''}
                           class="form-input ${element.cssClass}"
                           style="width: ${element.width}">
                `;
                break;

            case 'textarea':
                fieldHtml = `
                    <textarea placeholder="${element.placeholder}" 
                              rows="${element.rows}"
                              ${element.required ? 'required' : ''}
                              class="form-textarea ${element.cssClass}"
                              style="width: ${element.width}"></textarea>
                `;
                break;

            case 'select':
                fieldHtml = `
                    <select ${element.required ? 'required' : ''} 
                            ${element.multiple ? 'multiple' : ''}
                            class="form-select ${element.cssClass}"
                            style="width: ${element.width}">
                        ${element.options.map(opt => 
                            `<option value="${opt.value}">${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
                break;

            case 'radio':
                fieldHtml = `
                    <div class="radio-group ${element.inline ? 'inline' : ''}">
                        ${element.options.map((opt, index) => `
                            <label class="radio-label">
                                <input type="radio" name="${element.id}" value="${opt.value}" 
                                       ${element.required && index === 0 ? 'required' : ''}>
                                <span class="radio-custom"></span>
                                ${opt.label}
                            </label>
                        `).join('')}
                    </div>
                `;
                break;

            case 'checkbox':
                fieldHtml = `
                    <div class="checkbox-group ${element.inline ? 'inline' : ''}">
                        ${element.options.map(opt => `
                            <label class="checkbox-label">
                                <input type="checkbox" name="${element.id}[]" value="${opt.value}">
                                <span class="checkbox-custom"></span>
                                ${opt.label}
                            </label>
                        `).join('')}
                    </div>
                `;
                break;

            case 'date':
            case 'time':
            case 'datetime-local':
                fieldHtml = `
                    <input type="${element.type === 'datetime' ? 'datetime-local' : element.type}" 
                           ${element.required ? 'required' : ''}
                           class="form-input ${element.cssClass}"
                           style="width: ${element.width}">
                `;
                break;

            case 'file':
                fieldHtml = `
                    <input type="file" 
                           ${element.accept ? `accept="${element.accept}"` : ''}
                           ${element.multiple ? 'multiple' : ''}
                           ${element.required ? 'required' : ''}
                           class="form-file ${element.cssClass}"
                           style="width: ${element.width}">
                `;
                break;

            case 'rating':
                fieldHtml = `
                    <div class="rating-field">
                        ${Array.from({length: element.maxRating}, (_, i) => `
                            <i class="fas fa-star rating-star" data-rating="${i + 1}"></i>
                        `).join('')}
                    </div>
                `;
                break;

            case 'slider':
                fieldHtml = `
                    <input type="range" 
                           min="${element.min}" 
                           max="${element.max}" 
                           step="${element.step}"
                           value="${element.defaultValue}"
                           class="form-slider ${element.cssClass}"
                           style="width: ${element.width}">
                    <div class="slider-value">${element.defaultValue}</div>
                `;
                break;

            case 'heading':
                return `
                    <div class="form-field-wrapper heading-wrapper" data-element-id="${element.id}">
                        <div class="drag-handle" title="Drag to reorder">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <${element.level} class="form-heading ${element.cssClass}" 
                                          style="text-align: ${element.alignment}">
                            ${element.text}
                        </${element.level}>
                        <div class="element-controls">
                            <button class="btn-icon delete-element" data-element-id="${element.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

            case 'paragraph':
                return `
                    <div class="form-field-wrapper paragraph-wrapper" data-element-id="${element.id}">
                        <div class="drag-handle" title="Drag to reorder">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <p class="form-paragraph ${element.cssClass}" 
                           style="text-align: ${element.alignment}">
                            ${element.text}
                        </p>
                        <div class="element-controls">
                            <button class="btn-icon delete-element" data-element-id="${element.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

            case 'divider':
                return `
                    <div class="form-field-wrapper divider-wrapper" data-element-id="${element.id}">
                        <div class="drag-handle" title="Drag to reorder">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <hr class="form-divider ${element.cssClass}" 
                            style="border-style: ${element.style}; 
                                   border-width: ${element.thickness}; 
                                   border-color: ${element.color};
                                   margin: ${element.margin} 0;">
                        <div class="element-controls">
                            <button class="btn-icon delete-element" data-element-id="${element.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

            case 'spacer':
                return `
                    <div class="form-field-wrapper spacer-wrapper" data-element-id="${element.id}">
                        <div class="drag-handle" title="Drag to reorder">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <div class="form-spacer ${element.cssClass}" 
                             style="height: ${element.height}; background: transparent;">
                            <div class="spacer-indicator">Spacer (${element.height})</div>
                        </div>
                        <div class="element-controls">
                            <button class="btn-icon delete-element" data-element-id="${element.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
        }

        return `
            <div class="form-field-wrapper" data-element-id="${element.id}">
                <div class="drag-handle" title="Drag to reorder">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="form-field">
                    ${element.label ? `<label class="form-label">${element.label}${element.required ? ' *' : ''}</label>` : ''}
                    ${fieldHtml}
                    ${element.helpText ? `<div class="form-help-text">${element.helpText}</div>` : ''}
                </div>
                <div class="element-controls">
                    <button class="btn-icon delete-element" data-element-id="${element.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    selectElement(elementId) {
        // Remove previous selection
        document.querySelectorAll('.form-field-wrapper').forEach(wrapper => {
            wrapper.classList.remove('selected');
        });

        // Add selection to current element
        const wrapper = document.querySelector(`[data-element-id="${elementId}"]`);
        if (wrapper) {
            wrapper.classList.add('selected');
            this.selectedElement = this.formElements.find(el => el.id === elementId);
            this.renderProperties();
        }
    }

    selectElementWithoutPropertiesUpdate(elementId) {
        // Remove previous selection
        document.querySelectorAll('.form-field-wrapper').forEach(wrapper => {
            wrapper.classList.remove('selected');
        });

        // Add selection to current element
        const wrapper = document.querySelector(`[data-element-id="${elementId}"]`);
        if (wrapper) {
            wrapper.classList.add('selected');
            this.selectedElement = this.formElements.find(el => el.id === elementId);
            // Don't call renderProperties() to avoid losing focus on input fields
        }
    }

    renderProperties() {
        const propertiesContent = document.getElementById('properties-content');
        
        if (!this.selectedElement) {
            propertiesContent.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select an element to edit its properties</p>
                </div>
            `;
            return;
        }

        const element = this.selectedElement;
        let propertiesHtml = `
            <div class="properties-section">
                <h4>General</h4>
                <div class="form-group">
                    <label>Element ID</label>
                    <input type="text" value="${element.id}" readonly class="form-input disabled">
                </div>
        `;

        // Add type-specific properties
        if (element.type !== 'divider' && element.type !== 'spacer') {
            if (element.label !== undefined) {
                propertiesHtml += `
                    <div class="form-group">
                        <label>Label</label>
                        <input type="text" value="${element.label}" class="form-input" data-property="label">
                    </div>
                `;
            }

            if (element.placeholder !== undefined) {
                propertiesHtml += `
                    <div class="form-group">
                        <label>Placeholder</label>
                        <input type="text" value="${element.placeholder}" class="form-input" data-property="placeholder">
                    </div>
                `;
            }

            if (element.required !== undefined) {
                propertiesHtml += `
                    <div class="form-group">
                        <label>Required</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="required-${element.id}" ${element.required ? 'checked' : ''} data-property="required">
                            <label for="required-${element.id}"></label>
                        </div>
                    </div>
                `;
            }
        }

        // Add specific properties based on element type
        switch (element.type) {
            case 'heading':
                propertiesHtml += `
                    <div class="form-group">
                        <label>Text</label>
                        <input type="text" value="${element.text}" class="form-input" data-property="text">
                    </div>
                    <div class="form-group">
                        <label>Heading Level</label>
                        <select class="form-select" data-property="level">
                            <option value="h1" ${element.level === 'h1' ? 'selected' : ''}>H1</option>
                            <option value="h2" ${element.level === 'h2' ? 'selected' : ''}>H2</option>
                            <option value="h3" ${element.level === 'h3' ? 'selected' : ''}>H3</option>
                            <option value="h4" ${element.level === 'h4' ? 'selected' : ''}>H4</option>
                            <option value="h5" ${element.level === 'h5' ? 'selected' : ''}>H5</option>
                            <option value="h6" ${element.level === 'h6' ? 'selected' : ''}>H6</option>
                        </select>
                    </div>
                `;
                break;

            case 'paragraph':
                propertiesHtml += `
                    <div class="form-group">
                        <label>Text</label>
                        <textarea class="form-textarea" data-property="text">${element.text}</textarea>
                    </div>
                `;
                break;

            case 'select':
            case 'radio':
            case 'checkbox':
                propertiesHtml += `
                    <div class="form-group">
                        <label>Options</label>
                        <div class="options-editor">
                            ${element.options.map((opt, index) => `
                                <div class="option-row">
                                    <input type="text" value="${opt.value}" placeholder="Value" class="option-value" data-index="${index}">
                                    <input type="text" value="${opt.label}" placeholder="Label" class="option-label" data-index="${index}">
                                    <button class="btn-icon remove-option" data-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                            <button class="btn btn-sm btn-outline add-option">
                                <i class="fas fa-plus"></i> Add Option
                            </button>
                        </div>
                    </div>
                `;
                break;
        }

        propertiesHtml += `
            </div>
            <div class="properties-section">
                <h4>Styling</h4>
                <div class="form-group">
                    <label>CSS Class</label>
                    <input type="text" value="${element.cssClass || ''}" class="form-input" data-property="cssClass">
                </div>
            </div>
        `;

        propertiesContent.innerHTML = propertiesHtml;

        // Add event listeners to property inputs
        this.attachPropertyListeners();
    }

    attachPropertyListeners() {
        const propertiesContent = document.getElementById('properties-content');
        
        // Text inputs and textareas
        propertiesContent.querySelectorAll('input[data-property], textarea[data-property], select[data-property]').forEach(input => {
            // For checkboxes (toggle switches), use change event
            if (input.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    const property = e.target.dataset.property;
                    const value = e.target.checked;
                    this.updateElementProperty(property, value);
                });
            } else {
                // For other inputs, use input event
                input.addEventListener('input', (e) => {
                    const property = e.target.dataset.property;
                    const value = e.target.value;
                    this.updateElementProperty(property, value);
                });
            }
        });

        // Options editor
        propertiesContent.querySelectorAll('.option-value, .option-label').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateOption(e.target);
            });
        });

        propertiesContent.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeOption(parseInt(e.target.dataset.index));
            });
        });

        const addOptionBtn = propertiesContent.querySelector('.add-option');
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', () => {
                this.addOption();
            });
        }
    }

    updateElementProperty(property, value) {
        if (this.selectedElement) {
            this.selectedElement[property] = value;
            this.renderForm();
            this.selectElementWithoutPropertiesUpdate(this.selectedElement.id); // Maintain selection without re-rendering properties
        }
    }

    updateOption(input) {
        const index = parseInt(input.dataset.index);
        const isValue = input.classList.contains('option-value');
        const property = isValue ? 'value' : 'label';
        
        if (this.selectedElement && this.selectedElement.options) {
            this.selectedElement.options[index][property] = input.value;
            // Only re-render the form, don't re-render properties to avoid losing focus
            this.renderForm();
            // Re-select the element but don't re-render properties
            this.selectElementWithoutPropertiesUpdate(this.selectedElement.id);
        }
    }

    addOption() {
        if (this.selectedElement && this.selectedElement.options) {
            const newIndex = this.selectedElement.options.length + 1;
            this.selectedElement.options.push({
                value: `option${newIndex}`,
                label: `Option ${newIndex}`
            });
            this.renderProperties();
            this.renderForm();
            this.selectElement(this.selectedElement.id);
        }
    }

    removeOption(index) {
        if (this.selectedElement && this.selectedElement.options && this.selectedElement.options.length > 1) {
            this.selectedElement.options.splice(index, 1);
            this.renderProperties();
            this.renderForm();
            this.selectElement(this.selectedElement.id);
        }
    }

    deleteElement(elementId) {
        this.formElements = this.formElements.filter(el => el.id !== elementId);
        this.selectedElement = null;
        this.saveState();
        this.renderForm();
        this.renderProperties();
    }

    reorderElements(oldIndex, newIndex) {
        const element = this.formElements.splice(oldIndex, 1)[0];
        this.formElements.splice(newIndex, 0, element);
        this.saveState();
    }

    clearForm() {
        if (confirm('Are you sure you want to clear the entire form? This action cannot be undone.')) {
            this.formElements = [];
            this.selectedElement = null;
            this.saveState();
            this.renderForm();
            this.renderProperties();
        }
    }

    saveState() {
        this.undoStack.push(JSON.stringify(this.formElements));
        this.redoStack = []; // Clear redo stack when new action is performed
        
        // Limit undo stack size
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.formElements = JSON.parse(previousState);
            this.selectedElement = null;
            this.renderForm();
            this.renderProperties();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.formElements = JSON.parse(nextState);
            this.selectedElement = null;
            this.renderForm();
            this.renderProperties();
        }
    }

    zoomIn() {
        if (this.zoomLevel < 200) {
            this.zoomLevel += 10;
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 50) {
            this.zoomLevel -= 10;
            this.updateZoom();
        }
    }

    updateZoom() {
        const canvas = document.getElementById('form-canvas');
        canvas.style.transform = `scale(${this.zoomLevel / 100})`;
        document.querySelector('.zoom-level').textContent = `${this.zoomLevel}%`;
    }

    updateDevicePreview() {
        const canvas = document.getElementById('form-canvas');
        canvas.className = `form-canvas device-${this.currentDevice}`;
    }

    filterElements(searchTerm) {
        const elements = document.querySelectorAll('.form-element');
        elements.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    previewForm() {
        const previewContainer = document.getElementById('preview-container');
        const formHtml = this.generateFormHtml();
        previewContainer.innerHTML = formHtml;
        document.getElementById('preview-modal').style.display = 'flex';
    }

    generateFormHtml() {
        return `
            <form class="preview-form">
                <div class="form-header">
                    <h2>${this.formName}</h2>
                    <p>Form preview - all fields are functional</p>
                </div>
                ${this.formElements.map(element => this.renderElement(element)).join('')}
                <div class="form-footer">
                    <button type="submit" class="btn btn-primary">Submit Form</button>
                </div>
            </form>
        `;
    }

    saveForm() {
        // In a real application, this would save to a backend
        const formData = {
            id: this.formId,
            name: this.formName,
            fields: this.formElements, // Changed from 'elements' to 'fields' to match page editor
            type: 'custom', // Add form type
            status: 'draft', // Default status is draft
            settings: {
                theme: 'default',
                primaryColor: '#4F46E5'
            },
            submitText: 'Submit Form',
            createdAt: localStorage.getItem(`form_${this.formId}_created`) || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage for demo purposes
        localStorage.setItem(`form_${this.formId}`, JSON.stringify(formData));
        localStorage.setItem(`form_${this.formId}_created`, formData.createdAt);
        
        // Also update the forms list in phoenix_forms
        this.updateFormsList(formData);
        
        // Show success message
        this.showNotification('Form saved successfully!', 'success');
    }

    publishForm() {
        // Create form data with published status
        const formData = {
            id: this.formId,
            name: this.formName,
            fields: this.formElements, // Changed from 'elements' to 'fields' to match page editor
            type: 'custom', // Add form type
            status: 'published', // Set status to published
            settings: {
                theme: 'default',
                primaryColor: '#4F46E5'
            },
            submitText: 'Submit Form',
            createdAt: localStorage.getItem(`form_${this.formId}_created`) || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem(`form_${this.formId}`, JSON.stringify(formData));
        localStorage.setItem(`form_${this.formId}_created`, formData.createdAt);
        
        // Update the forms list in phoenix_forms
        this.updateFormsList(formData);
        
        // Show success message
        this.showNotification('Form published successfully!', 'success');
    }

    updateFormsList(formData) {
        try {
            // Get existing forms list
            let formsData = localStorage.getItem('phoenix_forms');
            let forms = [];
            
            if (formsData) {
                const parsed = JSON.parse(formsData);
                forms = parsed.forms || [];
            }
            
            // Find if form already exists
            const existingIndex = forms.findIndex(f => f.id === formData.id);
            
            if (existingIndex >= 0) {
                // Update existing form
                forms[existingIndex] = formData;
            } else {
                // Add new form
                forms.push(formData);
            }
            
            // Save back to localStorage
            localStorage.setItem('phoenix_forms', JSON.stringify({
                forms: forms,
                lastUpdated: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Error updating forms list:', error);
        }
    }

    loadFormData() {
        if (this.formId) {
            const savedForm = localStorage.getItem(`form_${this.formId}`);
            if (savedForm) {
                const formData = JSON.parse(savedForm);
                // Support both 'fields' (new) and 'elements' (old) for backward compatibility
                this.formElements = formData.fields || formData.elements || [];
                this.renderForm();
            }
        }
        
        // Initialize with empty state for undo/redo
        this.saveState();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
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
}

// Initialize the form builder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FormBuilder();
});
