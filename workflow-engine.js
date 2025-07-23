// Workflow Engine - Runtime execution for workflows
class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.runningInstances = new Map();
        this.eventListeners = new Map();
        this.variables = this.initializeVariables();
        this.debugMode = false;
        this.executionLogs = [];
    }

    initializeVariables() {
        // Load existing workflow data from localStorage
        const savedData = localStorage.getItem('workflow_data');
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        return {
            global: {},
            workflows: {},
            sessions: {}
        };
    }

    saveVariables() {
        localStorage.setItem('workflow_data', JSON.stringify(this.variables));
    }

    // Register a workflow for execution
    registerWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
        
        // Register event listeners for triggers
        workflow.nodes.forEach(node => {
            if (node.type === 'trigger') {
                this.registerTrigger(workflow.id, node);
            }
        });
    }

    // Register trigger listeners
    registerTrigger(workflowId, triggerNode) {
        // Use the appropriate ID based on trigger type
        let triggerId = 'global';
        if (triggerNode.config) {
            if (triggerNode.config.formId) triggerId = triggerNode.config.formId;
            else if (triggerNode.config.pageId) triggerId = triggerNode.config.pageId;
            else if (triggerNode.config.buttonId) triggerId = triggerNode.config.buttonId;
            else if (triggerNode.config.storageKey) triggerId = triggerNode.config.storageKey;
            else if (triggerNode.config.id) triggerId = triggerNode.config.id;
        }
        
        const key = `${triggerNode.subtype}_${triggerId}`;
        
        console.log(`[WorkflowEngine] Registering trigger: ${key}`, {
            workflowId,
            triggerNode,
            triggerId,
            key
        });
        
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        
        this.eventListeners.get(key).push({
            workflowId,
            nodeId: triggerNode.id,
            config: {
                ...triggerNode.config,
                type: triggerNode.subtype  // Add the type field that matchesTriggerConditions expects
            }
        });
    }

    // Trigger a workflow based on an event
    async trigger(eventType, eventData = {}) {
        // Use the appropriate ID based on event type
        let eventId = eventData.id || 'global';
        if (eventType === 'form_submit' && eventData.formId) {
            eventId = eventData.formId;
        } else if (eventType === 'page_load' && eventData.pageId) {
            eventId = eventData.pageId;
        } else if (eventType === 'button_click' && eventData.buttonId) {
            eventId = eventData.buttonId;
        } else if (eventType === 'data_change' && eventData.key) {
            eventId = eventData.key;
        }
        
        const key = `${eventType}_${eventId}`;
        const listeners = this.eventListeners.get(key) || [];
        
        console.log(`[WorkflowEngine] Trigger called: ${eventType}`, eventData);
        console.log(`[WorkflowEngine] Looking for key: ${key}`);
        console.log(`[WorkflowEngine] Found ${listeners.length} listeners`);
        console.log(`[WorkflowEngine] All registered listeners:`, Array.from(this.eventListeners.keys()));
        
        for (const listener of listeners) {
            // Check if trigger conditions match
            if (this.matchesTriggerConditions(listener.config, eventData)) {
                console.log(`[WorkflowEngine] Executing workflow: ${listener.workflowId}`);
                await this.executeWorkflow(listener.workflowId, {
                    triggerNodeId: listener.nodeId,
                    eventData
                });
            }
        }
    }

    matchesTriggerConditions(config, eventData) {
        // Check specific trigger conditions
        switch (config.type) {
            case 'form_submit':
                return config.formId === eventData.formId;
            case 'page_load':
                return config.pageId === eventData.pageId;
            case 'button_click':
                return config.buttonId === eventData.buttonId;
            case 'data_change':
                return config.storageKey === eventData.key;
            default:
                return true;
        }
    }

    // Execute a workflow
    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            console.error(`Workflow ${workflowId} not found`);
            return;
        }

        // Create execution instance
        const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const instance = {
            id: instanceId,
            workflowId,
            startTime: new Date(),
            context: {
                ...context,
                variables: {
                    ...this.variables.global,
                    ...(this.variables.workflows[workflowId] || {}),
                    trigger: context.eventData || {}
                }
            },
            currentNodeId: context.triggerNodeId || this.findStartNode(workflow),
            executedNodes: new Set(),
            logs: []
        };

        this.runningInstances.set(instanceId, instance);

        try {
            await this.executeNode(instance, instance.currentNodeId);
        } catch (error) {
            this.logExecution(instance, 'error', `Workflow execution failed: ${error.message}`, { error });
        } finally {
            this.runningInstances.delete(instanceId);
            this.saveVariables();
        }
    }

    findStartNode(workflow) {
        // Find the first trigger node
        const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
        return triggerNode ? triggerNode.id : workflow.nodes[0]?.id;
    }

    async executeNode(instance, nodeId) {
        if (!nodeId || instance.executedNodes.has(nodeId)) {
            return;
        }

        const workflow = this.workflows.get(instance.workflowId);
        const node = workflow.nodes.find(n => n.id === nodeId);
        
        if (!node) {
            this.logExecution(instance, 'error', `Node ${nodeId} not found`);
            return;
        }

        instance.executedNodes.add(nodeId);
        this.logExecution(instance, 'info', `Executing ${node.type} node: ${node.subtype}`, { node });

        try {
            let nextNodeIds = [];

            switch (node.type) {
                case 'trigger':
                    // Triggers are entry points, just continue to outputs
                    nextNodeIds = node.outputs || [];
                    break;

                case 'action':
                    await this.executeAction(instance, node);
                    nextNodeIds = node.outputs || [];
                    break;

                case 'logic':
                    nextNodeIds = await this.executeLogic(instance, node);
                    break;

                case 'data':
                    await this.executeDataOperation(instance, node);
                    nextNodeIds = node.outputs || [];
                    break;
            }

            // Execute next nodes
            for (const nextNodeId of nextNodeIds) {
                await this.executeNode(instance, nextNodeId);
            }

        } catch (error) {
            this.logExecution(instance, 'error', `Node execution failed: ${error.message}`, { node, error });
            throw error;
        }
    }

    async executeAction(instance, node) {
        switch (node.subtype) {
            case 'navigate':
                await this.actionNavigate(instance, node.config);
                break;
            case 'show_message':
                await this.actionShowMessage(instance, node.config);
                break;
            case 'update_widget':
                await this.actionUpdateWidget(instance, node.config);
                break;
            case 'save_data':
                await this.actionSaveData(instance, node.config);
                break;
            case 'delete_data':
                await this.actionDeleteData(instance, node.config);
                break;
            case 'set_variable':
                await this.actionSetVariable(instance, node.config);
                break;
            case 'show_element':
                await this.actionShowElement(instance, node.config);
                break;
        }
    }

    async executeLogic(instance, node) {
        switch (node.subtype) {
            case 'condition':
                return await this.logicCondition(instance, node);
            case 'switch':
                return await this.logicSwitch(instance, node);
            case 'loop':
                return await this.logicLoop(instance, node);
            case 'wait':
                await this.logicWait(instance, node.config);
                return node.outputs || [];
        }
    }

    async executeDataOperation(instance, node) {
        switch (node.subtype) {
            case 'transform':
                await this.dataTransform(instance, node.config);
                break;
            case 'calculate':
                await this.dataCalculate(instance, node.config);
                break;
            case 'filter':
                await this.dataFilter(instance, node.config);
                break;
            case 'merge':
                await this.dataMerge(instance, node.config);
                break;
        }
    }

    // Action implementations
    async actionNavigate(instance, config) {
        const pageId = this.resolveValue(config.pageId, instance.context);
        const passData = config.passData;
        
        // Check if we're in test mode
        if (instance.context.testMode) {
            // In test mode, just log the navigation without actually navigating
            this.logExecution(instance, 'success', `[TEST MODE] Would navigate to page: ${pageId}`, {
                pageId,
                passData,
                url: `page-viewer.html?id=${pageId}`
            });
            return;
        }
        
        if (passData) {
            // Store navigation data
            sessionStorage.setItem('workflow_navigation_data', JSON.stringify({
                workflowId: instance.workflowId,
                data: instance.context.variables
            }));
        }

        // Navigate to page
        if (config.delay) {
            setTimeout(() => {
                window.location.href = `page-viewer.html?id=${pageId}`;
            }, config.delay);
        } else {
            window.location.href = `page-viewer.html?id=${pageId}`;
        }

        this.logExecution(instance, 'success', `Navigating to page: ${pageId}`);
    }

    async actionShowMessage(instance, config) {
        const message = this.resolveValue(config.message, instance.context);
        const type = config.type || 'info';
        const duration = config.duration || 3000;

        this.showNotification(message, type, duration);
        this.logExecution(instance, 'success', `Showed message: ${message}`);
    }

    async actionUpdateWidget(instance, config) {
        const widgetId = this.resolveValue(config.widgetId, instance.context);
        const data = this.resolveDataMapping(config.dataMapping, instance.context);

        // Get existing widget data
        const widgetData = JSON.parse(localStorage.getItem('widget_dynamic_data') || '{}');
        
        // Update widget data
        widgetData[widgetId] = {
            ...widgetData[widgetId],
            ...data,
            lastUpdated: new Date().toISOString()
        };

        // Save updated data
        localStorage.setItem('widget_dynamic_data', JSON.stringify(widgetData));

        // Trigger storage event for widget updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'widget_dynamic_data',
            newValue: JSON.stringify(widgetData),
            url: window.location.href
        }));

        this.logExecution(instance, 'success', `Updated widget: ${widgetId}`, { data });
    }

    async actionSaveData(instance, config) {
        const key = this.resolveValue(config.storageKey, instance.context);
        const data = this.resolveDataMapping(config.dataMapping || config.data, instance.context);
        const append = config.append || false;

        if (append) {
            // Append to existing array
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(existing)) {
                existing.push(data);
                localStorage.setItem(key, JSON.stringify(existing));
            }
        } else {
            // Overwrite data
            localStorage.setItem(key, JSON.stringify(data));
        }

        this.logExecution(instance, 'success', `Saved data to: ${key}`, { data });
    }

    async actionDeleteData(instance, config) {
        const key = this.resolveValue(config.storageKey, instance.context);
        localStorage.removeItem(key);
        this.logExecution(instance, 'success', `Deleted data: ${key}`);
    }

    async actionSetVariable(instance, config) {
        const name = config.name;
        const value = this.resolveValue(config.value, instance.context);
        const scope = config.scope || 'workflow';

        if (scope === 'global') {
            this.variables.global[name] = value;
        } else {
            if (!this.variables.workflows[instance.workflowId]) {
                this.variables.workflows[instance.workflowId] = {};
            }
            this.variables.workflows[instance.workflowId][name] = value;
        }

        instance.context.variables[name] = value;
        this.saveVariables();

        this.logExecution(instance, 'success', `Set variable ${name} = ${value}`);
    }

    async actionShowElement(instance, config) {
        const elementId = this.resolveValue(config.elementId, instance.context);
        const action = config.action || 'show';
        
        const element = document.getElementById(elementId);
        if (element) {
            if (action === 'show') {
                element.style.display = 'block';
            } else if (action === 'hide') {
                element.style.display = 'none';
            } else if (action === 'toggle') {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }

        this.logExecution(instance, 'success', `${action} element: ${elementId}`);
    }

    // Logic implementations
    async logicCondition(instance, node) {
        const conditions = node.config.conditions || [];
        const operator = node.config.operator || 'AND';
        
        let result = operator === 'AND';
        
        for (const condition of conditions) {
            const leftValue = this.resolveValue(condition.left, instance.context);
            const rightValue = this.resolveValue(condition.right, instance.context);
            const conditionResult = this.evaluateCondition(leftValue, condition.operator, rightValue);
            
            if (operator === 'AND') {
                result = result && conditionResult;
            } else {
                result = result || conditionResult;
            }
        }

        this.logExecution(instance, 'info', `Condition evaluated to: ${result}`);

        // Return appropriate output based on condition result
        if (result && node.outputs.true) {
            return [node.outputs.true];
        } else if (!result && node.outputs.false) {
            return [node.outputs.false];
        }
        
        return [];
    }

    evaluateCondition(left, operator, right) {
        switch (operator) {
            case '==': return left == right;
            case '!=': return left != right;
            case '>': return left > right;
            case '<': return left < right;
            case '>=': return left >= right;
            case '<=': return left <= right;
            case 'contains': return String(left).includes(String(right));
            case 'starts_with': return String(left).startsWith(String(right));
            case 'ends_with': return String(left).endsWith(String(right));
            case 'is_empty': return !left || left === '';
            case 'is_not_empty': return !!left && left !== '';
            default: return false;
        }
    }

    async logicWait(instance, config) {
        const duration = this.resolveValue(config.duration, instance.context);
        await new Promise(resolve => setTimeout(resolve, duration));
        this.logExecution(instance, 'info', `Waited for ${duration}ms`);
    }

    // Data operation implementations
    async dataTransform(instance, config) {
        const input = this.resolveValue(config.input, instance.context);
        const transformations = config.transformations || [];
        
        let result = input;
        for (const transform of transformations) {
            result = this.applyTransformation(result, transform);
        }

        if (config.outputVariable) {
            instance.context.variables[config.outputVariable] = result;
        }

        this.logExecution(instance, 'success', 'Data transformed', { input, result });
    }

    async dataCalculate(instance, config) {
        const calculations = config.calculations || {};
        const results = {};

        for (const [key, formula] of Object.entries(calculations)) {
            results[key] = this.evaluateFormula(formula, instance.context);
        }

        if (config.outputVariable) {
            instance.context.variables[config.outputVariable] = results;
        }

        this.logExecution(instance, 'success', 'Calculations completed', { results });
    }

    // Helper methods
    resolveValue(template, context) {
        if (typeof template !== 'string') return template;
        
        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            return this.getValueByPath(context.variables, path.trim());
        });
    }

    resolveDataMapping(mapping, context) {
        const result = {};
        
        for (const [key, value] of Object.entries(mapping)) {
            result[key] = this.resolveValue(value, context);
        }
        
        return result;
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    applyTransformation(value, transform) {
        switch (transform.type) {
            case 'uppercase': return String(value).toUpperCase();
            case 'lowercase': return String(value).toLowerCase();
            case 'trim': return String(value).trim();
            case 'number': return Number(value);
            case 'string': return String(value);
            case 'json_parse': return JSON.parse(value);
            case 'json_stringify': return JSON.stringify(value);
            default: return value;
        }
    }

    evaluateFormula(formula, context) {
        // Simple formula evaluation (in production, use a proper expression parser)
        let result = formula;
        
        // Replace variables
        result = this.resolveValue(result, context);
        
        // Basic operations
        if (result.includes('COUNT(')) {
            const match = result.match(/COUNT\(([^)]+)\)/);
            if (match) {
                const arrayPath = match[1];
                const array = this.getValueByPath(context.variables, arrayPath);
                result = Array.isArray(array) ? array.length : 0;
            }
        }
        
        return result;
    }

    // Logging and debugging
    logExecution(instance, level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            instanceId: instance.id,
            level,
            message,
            data
        };

        instance.logs.push(logEntry);
        this.executionLogs.push(logEntry);

        if (this.debugMode) {
            console.log(`[Workflow ${instance.workflowId}] ${message}`, data);
        }

        // Emit log event for UI updates
        window.dispatchEvent(new CustomEvent('workflow-log', { detail: logEntry }));
    }

    // UI Helper
    showNotification(message, type = 'info', duration = 3000) {
        // Add notification styles if not already present
        if (!document.getElementById('workflow-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'workflow-notification-styles';
            style.textContent = `
                .notification {
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
                    max-width: 400px;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .notification.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .notification.info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                
                .notification.warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
            `;
            document.head.appendChild(style);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
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

    // Test mode execution
    async testWorkflow(workflowId, testData = {}) {
        this.debugMode = true;
        this.executionLogs = [];
        
        const context = {
            eventData: testData,
            testMode: true
        };
        
        await this.executeWorkflow(workflowId, context);
        
        this.debugMode = false;
        return this.executionLogs;
    }
}

// Create global instance
const workflowEngine = new WorkflowEngine();

// Initialize event listeners for browser events
document.addEventListener('DOMContentLoaded', () => {
    // Listen for form submit events
    window.addEventListener('formSubmit', (event) => {
        const { formId, data } = event.detail;
        workflowEngine.trigger('form_submit', {
            id: formId,
            formId: formId,
            data: data
        });
    });

    // Listen for page load events
    const pageId = new URLSearchParams(window.location.search).get('id');
    if (pageId) {
        workflowEngine.trigger('page_load', {
            id: pageId,
            pageId: pageId
        });
    }

    // Listen for button click events
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[id]');
        if (button && button.id) {
            workflowEngine.trigger('button_click', {
                id: button.id,
                buttonId: button.id
            });
        }
    });

    // Listen for storage events (data changes)
    window.addEventListener('storage', (event) => {
        if (event.key) {
            workflowEngine.trigger('data_change', {
                id: event.key,
                key: event.key,
                oldValue: event.oldValue,
                newValue: event.newValue
            });
        }
    });
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    window.dispatchEvent(new Event('DOMContentLoaded'));
}
