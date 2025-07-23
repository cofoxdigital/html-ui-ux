// Workflow Canvas - Visual flow designer for workflows
class WorkflowCanvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = document.getElementById('workflow-connections');
        this.canvasContent = document.getElementById('canvas-content');
        
        this.nodes = new Map();
        this.connections = new Map();
        this.selectedNode = null;
        this.selectedConnection = null;
        
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.isPanning = false;
        this.isConnecting = false;
        this.connectionStart = null;
        
        this.gridEnabled = true;
        this.gridSize = 20;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.updateTransform();
    }

    setupEventListeners() {
        // Canvas pan and zoom
        this.container.addEventListener('wheel', (e) => this.handleWheel(e));
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Connection context menu
        this.svg.addEventListener('contextmenu', (e) => this.handleConnectionContextMenu(e));
        
        // Click outside to deselect
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container || e.target === this.canvasContent) {
                this.deselectAll();
            }
        });
    }

    setupDragAndDrop() {
        // Handle drop from palette
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const nodeType = e.dataTransfer.getData('node-type');
            const nodeSubtype = e.dataTransfer.getData('node-subtype');
            
            if (nodeType && nodeSubtype) {
                const rect = this.container.getBoundingClientRect();
                const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
                const y = (e.clientY - rect.top - this.pan.y) / this.zoom;
                
                this.addNode({
                    type: nodeType,
                    subtype: nodeSubtype,
                    position: this.snapToGrid({ x, y })
                });
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Delete selected node or connection
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedNode) {
                    this.deleteNode(this.selectedNode);
                } else if (this.selectedConnection) {
                    this.deleteConnection(this.selectedConnection);
                }
            }
            
            // Select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
        });
    }

    // Node management
    addNode(config) {
        const node = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: config.type,
            subtype: config.subtype,
            position: config.position || { x: 100, y: 100 },
            config: config.config || this.getDefaultConfig(config.type, config.subtype),
            outputs: []
        };

        this.nodes.set(node.id, node);
        this.renderNode(node);
        this.selectNode(node.id);
        
        // Hide empty message
        const emptyMessage = this.canvasContent.querySelector('.empty-canvas-message');
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }

        // Emit node added event
        this.emitEvent('node-added', { node });
        
        return node;
    }

    renderNode(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = `workflow-node node-${node.type}`;
        nodeEl.id = node.id;
        nodeEl.style.left = `${node.position.x}px`;
        nodeEl.style.top = `${node.position.y}px`;
        
        const icon = this.getNodeIcon(node);
        const label = this.getNodeLabel(node);
        
        nodeEl.innerHTML = `
            <div class="node-header">
                <i class="${icon}"></i>
                <span>${label}</span>
            </div>
            <div class="node-body">
                ${this.renderNodeBody(node)}
            </div>
            <div class="node-ports">
                <div class="port port-in" data-port="in" data-node-id="${node.id}"></div>
                ${this.renderOutputPorts(node)}
            </div>
        `;

        this.canvasContent.appendChild(nodeEl);
        
        // Make node draggable
        this.makeNodeDraggable(nodeEl);
        
        // Setup port events
        this.setupPortEvents(nodeEl);
        
        // Setup node click
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });
    }

    renderNodeBody(node) {
        let body = '';
        
        if (node.config.description) {
            body += `<div class="node-description">${node.config.description}</div>`;
        }
        
        // Add config summary based on node type
        const summary = this.getConfigSummary(node);
        if (summary) {
            body += `<div class="node-config-summary">${summary}</div>`;
        }
        
        return body;
    }

    renderOutputPorts(node) {
        if (node.type === 'logic' && node.subtype === 'condition') {
            return `
                <div class="port port-out port-out-true" data-port="out-true" data-node-id="${node.id}" title="True"></div>
                <div class="port port-out port-out-false" data-port="out-false" data-node-id="${node.id}" title="False"></div>
            `;
        }
        
        return `<div class="port port-out" data-port="out" data-node-id="${node.id}"></div>`;
    }

    makeNodeDraggable(nodeEl) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const handleDragStart = (e) => {
            if (e.target.classList.contains('port')) return;
            
            isDragging = true;
            nodeEl.classList.add('dragging');
            
            const rect = nodeEl.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            startX = e.clientX;
            startY = e.clientY;
            initialX = (rect.left - containerRect.left - this.pan.x) / this.zoom;
            initialY = (rect.top - containerRect.top - this.pan.y) / this.zoom;
            
            e.preventDefault();
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            
            const dx = (e.clientX - startX) / this.zoom;
            const dy = (e.clientY - startY) / this.zoom;
            
            const newPos = this.snapToGrid({
                x: initialX + dx,
                y: initialY + dy
            });
            
            nodeEl.style.left = `${newPos.x}px`;
            nodeEl.style.top = `${newPos.y}px`;
            
            // Update node position
            const node = this.nodes.get(nodeEl.id);
            if (node) {
                node.position = newPos;
                this.updateConnections(nodeEl.id);
            }
        };

        const handleDragEnd = () => {
            if (isDragging) {
                isDragging = false;
                nodeEl.classList.remove('dragging');
                this.emitEvent('node-moved', { nodeId: nodeEl.id });
            }
        };

        nodeEl.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }

    setupPortEvents(nodeEl) {
        const ports = nodeEl.querySelectorAll('.port');
        
        ports.forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startConnection(port);
            });
            
            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                this.endConnection(port);
            });
        });
    }

    // Connection management
    startConnection(port) {
        if (port.classList.contains('port-in')) return; // Can only start from output ports
        
        this.isConnecting = true;
        this.connectionStart = {
            nodeId: port.dataset.nodeId,
            port: port.dataset.port
        };
        
        // Create temporary connection line
        this.tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempConnection.setAttribute('class', 'workflow-connection temp');
        this.tempConnection.setAttribute('fill', 'none');
        this.tempConnection.setAttribute('stroke', '#999');
        this.tempConnection.setAttribute('stroke-width', '2');
        this.tempConnection.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(this.tempConnection);
        
        // Update temp connection on mouse move
        const handleMouseMove = (e) => {
            if (!this.isConnecting) return;
            
            const rect = this.container.getBoundingClientRect();
            const endX = (e.clientX - rect.left - this.pan.x) / this.zoom;
            const endY = (e.clientY - rect.top - this.pan.y) / this.zoom;
            
            const startPos = this.getPortPosition(this.connectionStart.nodeId, this.connectionStart.port);
            this.updateTempConnection(startPos, { x: endX, y: endY });
        };
        
        const handleMouseUp = () => {
            if (this.isConnecting && !this.connectionEnd) {
                // Cancelled connection
                this.cancelConnection();
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    endConnection(port) {
        if (!this.isConnecting) return;
        if (!port.classList.contains('port-in')) return; // Can only end on input ports
        
        const targetNodeId = port.dataset.nodeId;
        const targetPort = port.dataset.port;
        
        // Don't allow self-connections
        if (targetNodeId === this.connectionStart.nodeId) {
            this.cancelConnection();
            return;
        }
        
        // Check if connection already exists
        const existingConnection = Array.from(this.connections.values()).find(conn => 
            conn.target === targetNodeId && conn.targetPort === targetPort
        );
        
        if (existingConnection) {
            this.cancelConnection();
            return;
        }
        
        // Create connection
        const connection = {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: this.connectionStart.nodeId,
            sourcePort: this.connectionStart.port,
            target: targetNodeId,
            targetPort: targetPort
        };
        
        this.connections.set(connection.id, connection);
        this.renderConnection(connection);
        
        // Update node outputs
        const sourceNode = this.nodes.get(this.connectionStart.nodeId);
        if (sourceNode) {
            if (this.connectionStart.port === 'out-true') {
                sourceNode.outputs.true = targetNodeId;
            } else if (this.connectionStart.port === 'out-false') {
                sourceNode.outputs.false = targetNodeId;
            } else {
                sourceNode.outputs.push(targetNodeId);
            }
        }
        
        // Clean up
        this.cancelConnection();
        
        // Emit connection created event
        this.emitEvent('connection-created', { connection });
    }

    cancelConnection() {
        this.isConnecting = false;
        this.connectionStart = null;
        
        if (this.tempConnection) {
            this.svg.removeChild(this.tempConnection);
            this.tempConnection = null;
        }
    }

    renderConnection(connection) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        path.setAttribute('class', 'connection-group');
        path.setAttribute('data-connection-id', connection.id);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'workflow-connection');
        line.setAttribute('id', connection.id);
        
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('class', 'connection-arrow');
        
        path.appendChild(line);
        path.appendChild(arrow);
        this.svg.appendChild(path);
        
        this.updateConnection(connection.id);
        
        // Setup connection events
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(connection.id);
        });
    }

    updateConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        const startPos = this.getPortPosition(connection.source, connection.sourcePort);
        const endPos = this.getPortPosition(connection.target, connection.targetPort);
        
        const path = this.svg.querySelector(`#${connectionId}`);
        const arrow = path.parentElement.querySelector('.connection-arrow');
        
        if (path && startPos && endPos) {
            const d = this.calculatePath(startPos, endPos);
            path.setAttribute('d', d);
            
            // Update arrow position
            const arrowPoints = this.calculateArrowPoints(startPos, endPos);
            arrow.setAttribute('points', arrowPoints);
        }
    }

    updateConnections(nodeId) {
        this.connections.forEach((connection, id) => {
            if (connection.source === nodeId || connection.target === nodeId) {
                this.updateConnection(id);
            }
        });
    }

    updateTempConnection(start, end) {
        if (this.tempConnection) {
            const d = this.calculatePath(start, end);
            this.tempConnection.setAttribute('d', d);
        }
    }

    calculatePath(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.abs(dx);
        const offset = Math.min(distance * 0.5, 100);
        
        return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${end.x - offset} ${end.y}, ${end.x} ${end.y}`;
    }

    calculateArrowPoints(start, end) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 10;
        const arrowWidth = 6;
        
        const tip = { x: end.x - 5, y: end.y };
        const base1 = {
            x: tip.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
            y: tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
        };
        const base2 = {
            x: tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
            y: tip.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
        };
        
        return `${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`;
    }

    getPortPosition(nodeId, portType) {
        const nodeEl = document.getElementById(nodeId);
        if (!nodeEl) return null;
        
        const port = nodeEl.querySelector(`[data-port="${portType}"]`);
        if (!port) return null;
        
        const nodeRect = nodeEl.getBoundingClientRect();
        const portRect = port.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        return {
            x: (portRect.left + portRect.width / 2 - containerRect.left - this.pan.x) / this.zoom,
            y: (portRect.top + portRect.height / 2 - containerRect.top - this.pan.y) / this.zoom
        };
    }

    // Selection management
    selectNode(nodeId) {
        this.deselectAll();
        
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) {
            nodeEl.classList.add('selected');
            this.selectedNode = nodeId;
            this.emitEvent('node-selected', { nodeId });
        }
    }

    selectConnection(connectionId) {
        this.deselectAll();
        
        const connectionEl = document.getElementById(connectionId);
        if (connectionEl) {
            connectionEl.classList.add('selected');
            this.selectedConnection = connectionId;
            this.emitEvent('connection-selected', { connectionId });
        }
    }

    deselectAll() {
        // Deselect nodes
        document.querySelectorAll('.workflow-node.selected').forEach(node => {
            node.classList.remove('selected');
        });
        this.selectedNode = null;
        
        // Deselect connections
        document.querySelectorAll('.workflow-connection.selected').forEach(conn => {
            conn.classList.remove('selected');
        });
        this.selectedConnection = null;
        
        this.emitEvent('selection-cleared');
    }

    selectAll() {
        document.querySelectorAll('.workflow-node').forEach(node => {
            node.classList.add('selected');
        });
    }

    // Delete operations
    deleteNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Remove connections
        const connectionsToDelete = [];
        this.connections.forEach((connection, id) => {
            if (connection.source === nodeId || connection.target === nodeId) {
                connectionsToDelete.push(id);
            }
        });
        
        connectionsToDelete.forEach(id => this.deleteConnection(id));
        
        // Remove node element
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) {
            nodeEl.remove();
        }
        
        // Remove from nodes map
        this.nodes.delete(nodeId);
        
        // Show empty message if no nodes
        if (this.nodes.size === 0) {
            const emptyMessage = this.canvasContent.querySelector('.empty-canvas-message');
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
        }
        
        this.emitEvent('node-deleted', { nodeId });
    }

    deleteConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        // Update source node outputs
        const sourceNode = this.nodes.get(connection.source);
        if (sourceNode) {
            if (connection.sourcePort === 'out-true') {
                delete sourceNode.outputs.true;
            } else if (connection.sourcePort === 'out-false') {
                delete sourceNode.outputs.false;
            } else {
                sourceNode.outputs = sourceNode.outputs.filter(id => id !== connection.target);
            }
        }
        
        // Remove connection element
        const connectionGroup = this.svg.querySelector(`[data-connection-id="${connectionId}"]`);
        if (connectionGroup) {
            connectionGroup.remove();
        }
        
        // Remove from connections map
        this.connections.delete(connectionId);
        
        this.emitEvent('connection-deleted', { connectionId });
    }

    // Pan and zoom
    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * delta));
        
        // Zoom towards mouse position
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.pan.x = x - (x - this.pan.x) * (newZoom / this.zoom);
        this.pan.y = y - (y - this.pan.y) * (newZoom / this.zoom);
        
        this.zoom = newZoom;
        this.updateTransform();
        this.emitEvent('zoom-changed', { zoom: this.zoom });
    }

    handleMouseDown(e) {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
            this.isPanning = true;
            this.panStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            this.pan.x = e.clientX - this.panStart.x;
            this.pan.y = e.clientY - this.panStart.y;
            this.updateTransform();
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
        }
    }

    handleConnectionContextMenu(e) {
        if (e.target.classList.contains('workflow-connection')) {
            e.preventDefault();
            
            const connectionId = e.target.id;
            this.selectConnection(connectionId);
            
            const menu = document.getElementById('connection-menu');
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;
            menu.classList.add('show');
            
            // Hide menu on click outside
            const hideMenu = () => {
                menu.classList.remove('show');
                document.removeEventListener('click', hideMenu);
            };
            
            setTimeout(() => {
                document.addEventListener('click', hideMenu);
            }, 0);
            
            // Handle menu actions
            menu.querySelector('[data-action="delete"]').onclick = () => {
                this.deleteConnection(connectionId);
                hideMenu();
            };
        }
    }

    updateTransform() {
        this.canvasContent.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
        this.svg.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
        
        // Update zoom level display
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    // Utility methods
    snapToGrid(position) {
        if (!this.gridEnabled) return position;
        
        return {
            x: Math.round(position.x / this.gridSize) * this.gridSize,
            y: Math.round(position.y / this.gridSize) * this.gridSize
        };
    }

    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        this.container.classList.toggle('no-grid', !this.gridEnabled);
        return this.gridEnabled;
    }

    zoomIn() {
        this.zoom = Math.min(3, this.zoom * 1.2);
        this.updateTransform();
    }

    zoomOut() {
        this.zoom = Math.max(0.1, this.zoom / 1.2);
        this.updateTransform();
    }

    zoomToFit() {
        if (this.nodes.size === 0) return;
        
        // Calculate bounding box of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + 200); // Approximate node width
            maxY = Math.max(maxY, node.position.y + 100); // Approximate node height
        });
        
        const padding = 50;
        const bbox = {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };
        
        const containerRect = this.container.getBoundingClientRect();
        const scaleX = containerRect.width / bbox.width;
        const scaleY = containerRect.height / bbox.height;
        
        this.zoom = Math.min(1, Math.min(scaleX, scaleY));
        this.pan.x = -bbox.x * this.zoom + (containerRect.width - bbox.width * this.zoom) / 2;
        this.pan.y = -bbox.y * this.zoom + (containerRect.height - bbox.height * this.zoom) / 2;
        
        this.updateTransform();
    }

    autoLayout() {
        // Simple auto-layout algorithm
        const visited = new Set();
        const levels = new Map();
        
        // Find start nodes (triggers)
        const startNodes = Array.from(this.nodes.values()).filter(node => node.type === 'trigger');
        
        if (startNodes.length === 0 && this.nodes.size > 0) {
            startNodes.push(Array.from(this.nodes.values())[0]);
        }
        
        // BFS to assign levels
        const queue = startNodes.map(node => ({ node, level: 0 }));
        
        while (queue.length > 0) {
            const { node, level } = queue.shift();
            
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level).push(node);
            
            // Add connected nodes to queue
            const outputs = Array.isArray(node.outputs) ? node.outputs : 
                          (node.outputs.true || node.outputs.false ? 
                           [node.outputs.true, node.outputs.false].filter(Boolean) : []);
            
            outputs.forEach(targetId => {
                const targetNode = this.nodes.get(targetId);
                if (targetNode && !visited.has(targetId)) {
                    queue.push({ node: targetNode, level: level + 1 });
                }
            });
        }
        
        // Position nodes
        const horizontalSpacing = 250;
        const verticalSpacing = 150;
        
        levels.forEach((nodes, level) => {
            const x = level * horizontalSpacing + 50;
            nodes.forEach((node, index) => {
                const y = index * verticalSpacing + 50;
                node.position = { x, y };
                
                const nodeEl = document.getElementById(node.id);
                if (nodeEl) {
                    nodeEl.style.left = `${x}px`;
                    nodeEl.style.top = `${y}px`;
                }
            });
        });
        
        // Update all connections
        this.connections.forEach((connection, id) => {
            this.updateConnection(id);
        });
        
        this.zoomToFit();
        this.emitEvent('layout-applied');
    }

    clear() {
        // Remove all nodes
        this.nodes.forEach((node, id) => {
            const nodeEl = document.getElementById(id);
            if (nodeEl) nodeEl.remove();
        });
        this.nodes.clear();
        
        // Remove all connections
        this.svg.innerHTML = '';
        this.connections.clear();
        
        // Reset selection
        this.selectedNode = null;
        this.selectedConnection = null;
        
        // Show empty message
        const emptyMessage = this.canvasContent.querySelector('.empty-canvas-message');
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        
        this.emitEvent('canvas-cleared');
    }

    // Helper methods
    getNodeIcon(node) {
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

    getNodeLabel(node) {
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
                show_element: 'Show/Hide Element'
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

    getDefaultConfig(type, subtype) {
        const configs = {
            trigger: {
                form_submit: { formId: '', description: 'Triggers when a form is submitted' },
                page_load: { pageId: '', description: 'Triggers when a page loads' },
                button_click: { buttonId: '', description: 'Triggers on button click' },
                timer: { interval: 1000, description: 'Triggers at intervals' },
                data_change: { storageKey: '', description: 'Triggers when data changes' }
            },
            action: {
                navigate: { pageId: '', delay: 0 },
                show_message: { message: '', type: 'info', duration: 3000 },
                update_widget: { widgetId: '', dataMapping: {} },
                save_data: { storageKey: '', dataMapping: {}, append: false },
                delete_data: { storageKey: '' },
                set_variable: { name: '', value: '', scope: 'workflow' },
                show_element: { elementId: '', action: 'show' }
            },
            logic: {
                condition: { conditions: [], operator: 'AND' },
                switch: { variable: '', cases: [] },
                loop: { items: '', variable: 'item' },
                wait: { duration: 1000 }
            },
            data: {
                transform: { input: '', transformations: [], outputVariable: '' },
                calculate: { calculations: {}, outputVariable: '' },
                filter: { input: '', conditions: [], outputVariable: '' },
                merge: { inputs: [], outputVariable: '' }
            }
        };
        
        return configs[type]?.[subtype] || {};
    }

    getConfigSummary(node) {
        const config = node.config;
        
        switch (node.subtype) {
            case 'form_submit':
                return config.formId ? `Form: ${config.formId}` : 'No form selected';
            case 'page_load':
                return config.pageId ? `Page: ${config.pageId}` : 'No page selected';
            case 'button_click':
                return config.buttonId ? `Button: ${config.buttonId}` : 'No button selected';
            case 'timer':
                return `Every ${config.interval}ms`;
            case 'navigate':
                if (config.pageId) {
                    // Try to get page title from localStorage
                    const pageData = localStorage.getItem(`page_${config.pageId}`);
                    if (pageData) {
                        try {
                            const page = JSON.parse(pageData);
                            return `To: ${page.title || page.name || config.pageId}`;
                        } catch (e) {
                            // Fall back to page ID if parsing fails
                        }
                    }
                    return `To: ${config.pageId}`;
                }
                return 'No page selected';
            case 'show_message':
                return config.message || 'No message set';
            case 'update_widget':
                return config.widgetId || 'No widget selected';
            case 'save_data':
                return config.storageKey || 'No key set';
            case 'set_variable':
                return config.name ? `${config.name} = ${config.value}` : 'No variable set';
            case 'wait':
                return `${config.duration}ms`;
            default:
                return '';
        }
    }

    // Export/Import
    exportWorkflow() {
        const workflow = {
            nodes: Array.from(this.nodes.values()),
            connections: Array.from(this.connections.values())
        };
        
        return workflow;
    }

    importWorkflow(workflow) {
        this.clear();
        
        // Import nodes
        workflow.nodes.forEach(nodeData => {
            const node = {
                ...nodeData,
                outputs: nodeData.outputs || []
            };
            this.nodes.set(node.id, node);
            this.renderNode(node);
        });
        
        // Import connections
        workflow.connections.forEach(connData => {
            this.connections.set(connData.id, connData);
            this.renderConnection(connData);
        });
        
        this.zoomToFit();
    }

    // Event emitter
    emitEvent(eventName, data = {}) {
        const event = new CustomEvent(`workflow-${eventName}`, { detail: data });
        this.container.dispatchEvent(event);
    }
}
