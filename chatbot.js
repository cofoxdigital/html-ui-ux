// Unified Chatbot Component with Persistent Chat History
class PhoenixChatbot {
    constructor() {
        this.chatHistory = this.loadChatHistory();
        this.isCollapsed = this.loadCollapsedState();
        this.initialized = false;
    }

    // Initialize the chatbot
    init() {
        if (this.initialized) return;
        
        this.createChatbotHTML();
        this.attachEventListeners();
        this.restoreChatHistory();
        this.restoreCollapsedState();
        
        // Show welcome message only if chat history is empty
        if (this.chatHistory.length === 0) {
            setTimeout(() => {
                this.addMessage("Welcome to your Phoenix Enterprise Assistant! I'm here to help you with all aspects of the platform - from building forms and workflows to managing pages and widgets. How can I assist you today?", 'bot');
            }, 1000);
        }
        
        this.initialized = true;
    }

    // Create the chatbot HTML structure
    createChatbotHTML() {
        // Remove any existing chatbot
        const existingChatbot = document.getElementById('chatbot');
        if (existingChatbot) {
            existingChatbot.remove();
        }

        const chatbotHTML = `
            <div id="chatbot" class="chatbot">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fas fa-robot"></i>
                        <span>Phoenix AI Assistant</span>
                    </div>
                    <button class="chatbot-toggle" id="chatbot-toggle">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                <div class="chatbot-body" id="chatbot-body">
                    <div class="chatbot-messages" id="chatbot-messages">
                        <!-- Messages will be added here -->
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chatbot-input" placeholder="Ask me anything...">
                        <button id="chatbot-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    // Attach event listeners
    attachEventListeners() {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotSend = document.getElementById('chatbot-send');
        const chatbotInput = document.getElementById('chatbot-input');

        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', () => this.toggleChatbot());
        }

        if (chatbotSend) {
            chatbotSend.addEventListener('click', () => this.sendMessage());
        }

        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    // Toggle chatbot collapsed state
    toggleChatbot() {
        const chatbotBody = document.getElementById('chatbot-body');
        const chatbotToggle = document.getElementById('chatbot-toggle');
        
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            chatbotBody.classList.add('collapsed');
            chatbotToggle.innerHTML = '<i class="fas fa-plus"></i>';
        } else {
            chatbotBody.classList.remove('collapsed');
            chatbotToggle.innerHTML = '<i class="fas fa-minus"></i>';
        }
        
        // Save collapsed state
        localStorage.setItem('phoenixChatbotCollapsed', this.isCollapsed);
    }

    // Send message
    sendMessage() {
        const chatbotInput = document.getElementById('chatbot-input');
        const message = chatbotInput.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        chatbotInput.value = '';
        
        // Generate and add bot response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 1000);
    }

    // Add message to chat
    addMessage(text, sender) {
        const chatbotMessages = document.getElementById('chatbot-messages');
        
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
        
        // Save to chat history
        this.chatHistory.push({ text, sender, timestamp: new Date().toISOString() });
        this.saveChatHistory();
    }

    // Generate AI response based on context
    generateResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const currentPage = window.location.pathname.split('/').pop();
        
        // Context-aware responses based on current page
        if (currentPage.includes('form')) {
            return this.getFormBuilderResponse(message);
        } else if (currentPage.includes('workflow')) {
            return this.getWorkflowResponse(message);
        } else if (currentPage.includes('widget')) {
            return this.getWidgetResponse(message);
        } else if (currentPage.includes('page')) {
            return this.getPageBuilderResponse(message);
        }
        
        // General responses
        if (message.includes('help') || message.includes('what can')) {
            return "I can help you with:\n• Building forms, workflows, pages, and widgets\n• Managing your dashboard and clients\n• Understanding platform features\n• Best practices and tips\n\nWhat specific area would you like to explore?";
        }
        
        if (message.includes('form')) {
            return "Forms are essential for data collection. You can:\n• Create custom forms with drag-and-drop\n• Add various field types (text, dropdown, date, etc.)\n• Set up validation rules\n• Connect forms to workflows\n\nWould you like to create a new form or learn about form features?";
        }
        
        if (message.includes('workflow')) {
            return "Workflows automate your business processes. You can:\n• Create visual workflows with triggers and actions\n• Connect forms, pages, and widgets\n• Set up conditional logic\n• Automate notifications and data processing\n\nWhat type of workflow are you looking to build?";
        }
        
        if (message.includes('widget')) {
            return "Widgets are reusable components for your pages. Available widgets include:\n• Charts and graphs\n• Data tables\n• Custom buttons\n• Media players\n• Interactive elements\n\nWhat kind of widget do you need?";
        }
        
        if (message.includes('page')) {
            return "Pages are where everything comes together. You can:\n• Design responsive layouts\n• Embed forms and widgets\n• Create landing pages\n• Build complete web applications\n\nWhat type of page are you creating?";
        }
        
        return "I'm here to help you make the most of Phoenix Enterprise. You can ask me about forms, workflows, pages, widgets, or any other platform features. What would you like to know?";
    }

    // Form Builder specific responses
    getFormBuilderResponse(message) {
        if (message.includes('field') || message.includes('add')) {
            return "To add form fields:\n1. Drag fields from the left panel\n2. Drop them into your form\n3. Click on a field to configure its properties\n4. Set validation rules as needed\n\nAvailable field types include text, email, dropdown, checkbox, radio, date picker, and more.";
        }
        
        if (message.includes('validation')) {
            return "Form validation ensures data quality:\n• Required fields: Make fields mandatory\n• Email validation: Ensure proper email format\n• Number ranges: Set min/max values\n• Custom patterns: Use regex for specific formats\n• Error messages: Customize validation feedback";
        }
        
        if (message.includes('submit') || message.includes('save')) {
            return "Form submissions can be handled in multiple ways:\n• Save to database: Store form data\n• Email notifications: Send submissions via email\n• Trigger workflows: Start automated processes\n• Redirect users: Send to thank you pages\n\nConfigure these in the form settings.";
        }
        
        return "I can help you build effective forms. Try asking about:\n• Adding form fields\n• Setting up validation\n• Handling submissions\n• Form styling and layout\n• Connecting to workflows";
    }

    // Workflow specific responses
    getWorkflowResponse(message) {
        if (message.includes('trigger')) {
            return "Workflow triggers start your automation:\n• Form Submit: When a form is submitted\n• Page Load: When a page loads\n• Button Click: On button interaction\n• Schedule: At specific times\n• Data Change: When data updates\n\nDrag a trigger from the left panel to start.";
        }
        
        if (message.includes('action')) {
            return "Actions define what happens in your workflow:\n• Send Email: Notify users\n• Update Data: Modify records\n• Navigate: Redirect users\n• Show/Hide: Control visibility\n• Calculate: Perform computations\n\nConnect actions to triggers with flow lines.";
        }
        
        if (message.includes('condition') || message.includes('logic')) {
            return "Add logic to make smart workflows:\n• If/Else: Branch based on conditions\n• Switch: Multiple path options\n• Loop: Repeat actions\n• Wait: Add delays\n\nUse these to create dynamic, responsive automations.";
        }
        
        return "Workflows automate your processes. Ask me about:\n• Setting up triggers\n• Adding actions\n• Conditional logic\n• Testing workflows\n• Best practices";
    }

    // Widget specific responses
    getWidgetResponse(message) {
        if (message.includes('chart') || message.includes('graph')) {
            return "Chart widgets visualize your data:\n• Line charts: Show trends over time\n• Bar charts: Compare categories\n• Pie charts: Display proportions\n• Gauge charts: Show single metrics\n\nConfigure data sources in widget settings.";
        }
        
        if (message.includes('table') || message.includes('grid')) {
            return "Table widgets display structured data:\n• Sortable columns\n• Filterable rows\n• Pagination support\n• Action buttons\n• Responsive design\n\nConnect to your data sources for dynamic content.";
        }
        
        if (message.includes('custom') || message.includes('create')) {
            return "Creating custom widgets:\n1. Choose a widget type\n2. Configure data sources\n3. Customize appearance\n4. Set up interactions\n5. Save for reuse\n\nWidgets can be embedded in any page.";
        }
        
        return "Widgets enhance your pages with interactive elements. Ask about:\n• Chart types\n• Data tables\n• Custom widgets\n• Widget configuration\n• Embedding in pages";
    }

    // Page Builder specific responses
    getPageBuilderResponse(message) {
        if (message.includes('layout') || message.includes('design')) {
            return "Design responsive page layouts:\n• Drag-and-drop sections\n• Adjust column widths\n• Set spacing and padding\n• Mobile-responsive design\n• Custom CSS support\n\nStart with a template or blank canvas.";
        }
        
        if (message.includes('embed') || message.includes('add')) {
            return "Embed components in your pages:\n• Forms: Collect user data\n• Widgets: Display information\n• Buttons: Add interactions\n• Images: Visual content\n• Custom HTML: Advanced features\n\nDrag components from the sidebar.";
        }
        
        if (message.includes('publish') || message.includes('preview')) {
            return "Publishing your pages:\n1. Preview: Test on different devices\n2. Save: Store your changes\n3. Publish: Make live\n4. Share: Get public URL\n5. Embed: Use in other sites\n\nAlways preview before publishing.";
        }
        
        return "Page Builder lets you create complete web experiences. Ask about:\n• Page layouts\n• Adding components\n• Responsive design\n• Publishing pages\n• SEO settings";
    }

    // Save chat history to localStorage
    saveChatHistory() {
        localStorage.setItem('phoenixChatHistory', JSON.stringify(this.chatHistory));
    }

    // Load chat history from localStorage
    loadChatHistory() {
        const saved = localStorage.getItem('phoenixChatHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // Load collapsed state from localStorage
    loadCollapsedState() {
        const saved = localStorage.getItem('phoenixChatbotCollapsed');
        return saved === 'true';
    }

    // Restore chat history to UI
    restoreChatHistory() {
        const chatbotMessages = document.getElementById('chatbot-messages');
        chatbotMessages.innerHTML = '';
        
        this.chatHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}-message`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = msg.sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = `<p>${msg.text}</p>`;
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
            
            chatbotMessages.appendChild(messageDiv);
        });
        
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Restore collapsed state
    restoreCollapsedState() {
        if (this.isCollapsed) {
            const chatbotBody = document.getElementById('chatbot-body');
            const chatbotToggle = document.getElementById('chatbot-toggle');
            
            chatbotBody.classList.add('collapsed');
            chatbotToggle.innerHTML = '<i class="fas fa-plus"></i>';
        }
    }

    // Clear chat history
    clearHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
        const chatbotMessages = document.getElementById('chatbot-messages');
        chatbotMessages.innerHTML = '';
        
        // Show welcome message again
        setTimeout(() => {
            this.addMessage("Chat history cleared. How can I help you today?", 'bot');
        }, 500);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.phoenixChatbot = new PhoenixChatbot();
    window.phoenixChatbot.init();
});

// Also initialize on page navigation (for single-page apps)
window.addEventListener('load', () => {
    if (!window.phoenixChatbot) {
        window.phoenixChatbot = new PhoenixChatbot();
        window.phoenixChatbot.init();
    }
});
