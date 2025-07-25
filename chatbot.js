// Unified Chatbot Component with Persistent Chat History and Intelligent Actions
class PhoenixChatbot {
    constructor() {
        this.chatHistory = this.loadChatHistory();
        this.isCollapsed = this.loadCollapsedState();
        this.initialized = false;
        
        // Initialize intelligent components
        this.nlpEngine = new ChatbotNLPEngine();
        this.actionEngine = new ChatbotActionEngine();
        this.contextManager = new ChatbotContextManager();
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
                this.addMessage("Welcome to your Phoenix Enterprise Assistant! I'm here to help you with all aspects of the platform. I can create forms for you automatically! Just ask me to create any type of form - login, registration, contact, or custom forms with specific fields. For pages, widgets, and workflows, I can guide you on using the manual builders. How can I assist you today?", 'bot');
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
    async sendMessage() {
        const chatbotInput = document.getElementById('chatbot-input');
        const message = chatbotInput.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        chatbotInput.value = '';
        
        // Show processing message temporarily
        const processingMessage = this.addMessage("I'm working on that for you...", 'bot', 'processing');
        
        // Process with NLP engine
        const intent = this.nlpEngine.processInput(message, this.contextManager.getContext());
        
        // Check if this is a clarification response
        if (this.contextManager.hasPendingAction()) {
            await this.handleClarificationResponse(message, intent);
            // Remove processing message since handleClarificationResponse adds its own message
            if (processingMessage && processingMessage.parentNode) {
                processingMessage.remove();
            }
        } else if (intent.action) {
            // Execute action if intent is clear
            await this.executeAction(intent);
            // executeAction will update the processing message
        } else {
            // Generate standard response
            setTimeout(() => {
                const response = this.generateResponse(message);
                // Update the processing message with the actual response
                this.updateLastBotMessage(response);
            }, 1000);
        }
    }

    // Execute intelligent actions
    async executeAction(intent) {
        try {
            // Only allow form creation through AI
            if (intent.action !== 'CREATE_FORM') {
                this.updateLastBotMessage("I can only help you create forms. For pages, widgets, and workflows, please use the manual builders available in the platform.");
                return;
            }
            
            // Check if we need clarification
            const clarifications = this.actionEngine.validateIntent(intent);
            if (clarifications.length > 0) {
                // Store pending action and ask for clarification
                this.contextManager.setPendingAction(intent, clarifications);
                const question = this.generateClarificationQuestion(clarifications[0], intent);
                this.updateLastBotMessage(question);
                return;
            }
            
            // Execute the action
            const result = await this.actionEngine.execute(intent);
            
            // Update the processing message with result
            this.updateLastBotMessage(result.message);
            
            // Add action buttons if available
            if (result.actions) {
                this.addActionButtons(result.actions);
            }
            
            // Clear any pending actions
            this.contextManager.clearPendingAction();
            
        } catch (error) {
            this.updateLastBotMessage(`I encountered an error: ${error.message}. Please try again.`);
        }
    }

    // Handle clarification responses
    async handleClarificationResponse(message, intent) {
        const pendingAction = this.contextManager.getPendingAction();
        
        // Update pending action with clarification
        const updatedIntent = this.nlpEngine.mergeClarification(pendingAction.intent, message, pendingAction.clarifications[0]);
        
        // Remove answered clarification
        pendingAction.clarifications.shift();
        
        if (pendingAction.clarifications.length > 0) {
            // Ask next clarification
            this.contextManager.updatePendingAction(updatedIntent, pendingAction.clarifications);
            const question = this.generateClarificationQuestion(pendingAction.clarifications[0], updatedIntent);
            this.addMessage(question, 'bot');
        } else {
            // All clarifications answered, execute action
            this.contextManager.clearPendingAction();
            await this.executeAction(updatedIntent);
        }
    }

    // Generate clarification question
    generateClarificationQuestion(clarification, intent) {
        const questions = {
            name: `What would you like to name this ${intent.componentType}?`,
            formType: "What type of form would you like? For example: login, registration, contact, survey, or custom.",
            fields: "What fields should the form include? For example: name, email, password, message.",
            pageLayout: "What layout would you prefer? Options include: landing page, dashboard, blog, portfolio, or custom.",
            sections: "What sections should the page have? For example: header, hero, features, footer.",
            widgetType: "What type of widget do you need? Options: chart, table, metric, button, or custom.",
            workflowTrigger: "What should trigger this workflow? For example: form submission, page load, button click."
        };
        
        let question = questions[clarification.field] || "Could you provide more details?";
        
        // Add suggestions if available
        if (clarification.suggestions && clarification.suggestions.length > 0) {
            question += "\n\nSuggestions:\n";
            clarification.suggestions.forEach((suggestion, index) => {
                question += `${index + 1}. ${suggestion}\n`;
            });
        }
        
        return question;
    }

    // Add action buttons to chat
    addActionButtons(actions) {
        const chatbotMessages = document.getElementById('chatbot-messages');
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'action-button';
            button.innerHTML = `<i class="fas fa-${action.icon}"></i> ${action.label}`;
            button.onclick = () => this.handleActionButton(action);
            actionsDiv.appendChild(button);
        });
        
        chatbotMessages.appendChild(actionsDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Handle action button clicks
    handleActionButton(action) {
        switch (action.type) {
            case 'navigate':
                window.location.href = action.url;
                break;
            case 'preview':
                window.open(action.url, '_blank');
                break;
            case 'edit':
                window.location.href = action.url;
                break;
        }
    }

    // Update last bot message (for processing messages)
    updateLastBotMessage(newText) {
        const messages = document.querySelectorAll('.bot-message');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const content = lastMessage.querySelector('.message-content p');
            if (content) {
                content.innerHTML = newText;
                
                // Also update the chat history with the final message
                // Add the actual response to chat history
                this.chatHistory.push({ 
                    text: newText, 
                    sender: 'bot', 
                    timestamp: new Date().toISOString() 
                });
                this.saveChatHistory();
            }
        }
    }

    // Add message to chat
    addMessage(text, sender, className = '') {
        const chatbotMessages = document.getElementById('chatbot-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${className}`;
        
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
        
        // Only save to chat history if it's not a processing message
        if (className !== 'processing') {
            this.chatHistory.push({ text, sender, timestamp: new Date().toISOString() });
            this.saveChatHistory();
        }
        
        return messageDiv;
    }

    // Generate AI response based on context (existing functionality)
    generateResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const currentPage = window.location.pathname.split('/').pop();
        
        // Check if user is asking about capabilities
        if (message.includes('what can you do') || message.includes('help')) {
            return "I can help you create forms automatically! Try asking me to:\n• Create a login form\n• Create a registration form\n• Create a contact form\n• Create a custom form with specific fields\n\nFor pages, widgets, and workflows, I can guide you on using the manual builders. What would you like to do?";
        }
        
        // Check for component statistics questions
        if (message.includes('how many') || message.includes('count') || message.includes('total') || message.includes('statistics') || message.includes('stats')) {
            return this.getComponentStatsResponse(message);
        }
        
        // Check for dashboard/analytics questions
        if (message.includes('team') || message.includes('client') || message.includes('revenue') || message.includes('analytics')) {
            return this.getDashboardResponse(message);
        }
        
        // Check for time-based insights
        if (message.includes('today') || message.includes('this week') || message.includes('recent')) {
            return this.getTimeBasedInsights(message);
        }
        
        // Check for tips and best practices
        if (message.includes('tip') || message.includes('best practice') || message.includes('advice')) {
            return this.getBestPractices(message);
        }
        
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
        if (message.includes('form')) {
            const formStats = this.getFormStats();
            return `Forms are essential for data collection. You currently have ${formStats.total} forms (${formStats.published} published, ${formStats.draft} drafts).\n\nYou can:\n• Create custom forms with drag-and-drop\n• Add various field types\n• Set up validation rules\n• Connect forms to workflows\n\nWould you like me to create a form for you? Just say 'create a [type] form'.`;
        }
        
        if (message.includes('workflow')) {
            const workflowStats = this.getWorkflowStats();
            return `Workflows automate your business processes. You have ${workflowStats.total} workflows (${workflowStats.active} active, ${workflowStats.draft} drafts).\n\nYou can:\n• Create visual workflows with triggers and actions\n• Connect forms, pages, and widgets\n• Set up conditional logic\n• Automate notifications\n\nTo create workflows, please use the workflow builder available in the platform.`;
        }
        
        if (message.includes('widget')) {
            const widgetStats = this.getWidgetStats();
            return `Widgets are reusable components for your pages. You have ${widgetStats.total} widgets in your library.\n\nAvailable types:\n• Charts: ${widgetStats.byCategory.charts}\n• Tables: ${widgetStats.byCategory.tables}\n• Metrics: ${widgetStats.byCategory.metrics}\n• Actions: ${widgetStats.byCategory.actions}\n\nTo create widgets, please use the widget builder available in the platform.`;
        }
        
        if (message.includes('page')) {
            const pageStats = this.getPageStats();
            return `Pages are where everything comes together. You have ${pageStats.total} pages (${pageStats.published} published, ${pageStats.draft} drafts).\n\nYou can:\n• Design responsive layouts\n• Embed forms and widgets\n• Create landing pages\n• Build complete web applications\n\nTo create pages, please use the page editor available in the platform.`;
        }
        
        // Check if asking to create non-form components
        if ((message.includes('create') || message.includes('make') || message.includes('build')) && 
            (message.includes('page') || message.includes('widget') || message.includes('workflow'))) {
            return "Since this is a Proof of Concept, automatic generation functionality is currently available only for forms in a limited capacity. For pages, widgets, and workflows, please use the manual builders available in the platform.";
        }
        
        return "I'm here to help you make the most of Phoenix Enterprise. I can create forms for you automatically! Just tell me what type of form you need, like 'create a login form' or 'create a contact form'. For pages, widgets, and workflows, please use the manual builders available in the platform. What would you like to create?";
    }

    // Get component statistics response
    getComponentStatsResponse(message) {
        const summary = this.getComponentSummary();
        
        // Check what specifically they're asking about
        if (message.includes('form')) {
            const stats = summary.formStats;
            let response = `📊 Form Statistics:\n• Total forms: ${stats.total}\n• Published: ${stats.published}\n• Drafts: ${stats.draft}`;
            
            if (stats.mostRecent) {
                response += `\n• Most recent: "${stats.mostRecent.name}" created ${this.formatDate(stats.mostRecent.createdAt)}`;
            }
            
            if (stats.topByFields.length > 0) {
                response += `\n\nForms with most fields:`;
                stats.topByFields.forEach((form, index) => {
                    response += `\n${index + 1}. ${form.name} (${form.fieldCount} fields)`;
                });
            }
            
            return response;
        }
        
        if (message.includes('page')) {
            const stats = summary.pageStats;
            let response = `📄 Page Statistics:\n• Total pages: ${stats.total}\n• Published: ${stats.published}\n• Drafts: ${stats.draft}`;
            
            if (stats.mostRecent) {
                response += `\n• Most recent: "${stats.mostRecent.name}" modified ${this.formatDate(stats.mostRecent.lastModified)}`;
            }
            
            if (stats.withForms > 0) {
                response += `\n• Pages with forms embedded: ${stats.withForms}`;
            }
            
            return response;
        }
        
        if (message.includes('widget')) {
            const stats = summary.widgetStats;
            let response = `🧩 Widget Statistics:\n• Total widgets: ${stats.total}`;
            response += `\n• Charts: ${stats.byCategory.charts}`;
            response += `\n• Tables: ${stats.byCategory.tables}`;
            response += `\n• Metrics: ${stats.byCategory.metrics}`;
            response += `\n• Actions: ${stats.byCategory.actions}`;
            
            if (stats.mostRecent) {
                response += `\n\nMost recent: "${stats.mostRecent.name}" created ${this.formatDate(stats.mostRecent.created)}`;
            }
            
            if (stats.mostUsed) {
                response += `\nMost used: "${stats.mostUsed.name}" (${stats.mostUsed.usageCount} times)`;
            }
            
            return response;
        }
        
        if (message.includes('workflow')) {
            const stats = summary.workflowStats;
            let response = `⚡ Workflow Statistics:\n• Total workflows: ${stats.total}\n• Active: ${stats.active}\n• Drafts: ${stats.draft}`;
            
            response += `\n\nTrigger types:`;
            response += `\n• Form submissions: ${stats.byTrigger.formSubmit}`;
            response += `\n• Page loads: ${stats.byTrigger.pageLoad}`;
            response += `\n• Button clicks: ${stats.byTrigger.buttonClick}`;
            
            if (stats.mostRecent) {
                response += `\n\nMost recent: "${stats.mostRecent.name}" created ${this.formatDate(stats.mostRecent.createdAt)}`;
            }
            
            if (stats.topByNodes.length > 0) {
                response += `\n\nMost complex workflows:`;
                stats.topByNodes.forEach((workflow, index) => {
                    response += `\n${index + 1}. ${workflow.name} (${workflow.nodeCount} nodes)`;
                });
            }
            
            return response;
        }
        
        // Overall statistics
        return `📊 Platform Overview:\n• Total components: ${summary.total.all}\n  - Forms: ${summary.total.forms}\n  - Pages: ${summary.total.pages}\n  - Widgets: ${summary.total.widgets}\n  - Workflows: ${summary.total.workflows}\n\n• Created today: ${summary.createdToday}\n• Created this week: ${summary.createdThisWeek}\n\nAsk me about specific components for more details!`;
    }

    // Get dashboard response
    getDashboardResponse(message) {
        if (message.includes('team')) {
            return "👥 Team Overview:\n• Total members: 12\n• Departments: 3 (Development, Design, Marketing)\n• Active today: 8 members\n• Average productivity: 87%";
        }
        
        if (message.includes('client')) {
            return "🤝 Client Statistics:\n• Active clients: 45\n• Satisfaction rate: 78%\n• New this month: 5\n• Retention rate: 92%";
        }
        
        if (message.includes('revenue')) {
            return "💰 Revenue Metrics:\n• Current month: $125,000\n• Growth: +15% from last month\n• Projected: $145,000 by month end\n• Top performing service: Enterprise Solutions";
        }
        
        if (message.includes('analytics') || message.includes('activity')) {
            return "📈 Platform Analytics:\n• Active users: 234\n• Average session: 45 minutes\n• Daily active users: 156\n• Peak usage: 2:00 PM - 4:00 PM";
        }
        
        return "📊 Dashboard Overview:\n• Team: 12 members across 3 departments\n• Clients: 45 active with 78% satisfaction\n• Revenue: $125,000 (+15% growth)\n• Platform: 234 active users";
    }

    // Get time-based insights
    getTimeBasedInsights(message) {
        const summary = this.getComponentSummary();
        const hour = new Date().getHours();
        let greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        
        if (message.includes('today')) {
            return `${greeting}! Today's activity:\n• Components created: ${summary.createdToday}\n• Most active: ${this.getMostActiveComponent(summary)}\n\nKeep up the great work!`;
        }
        
        if (message.includes('this week')) {
            return `📅 This Week's Summary:\n• Total components created: ${summary.createdThisWeek}\n• Forms: ${this.getWeeklyCount(summary.formStats)}\n• Pages: ${this.getWeeklyCount(summary.pageStats)}\n• Widgets: ${this.getWeeklyCount(summary.widgetStats)}\n• Workflows: ${this.getWeeklyCount(summary.workflowStats)}`;
        }
        
        if (message.includes('recent')) {
            let response = "🕐 Recent Activity:\n";
            
            if (summary.formStats.mostRecent) {
                response += `\n• Form: "${summary.formStats.mostRecent.name}" - ${this.formatDate(summary.formStats.mostRecent.createdAt)}`;
            }
            if (summary.pageStats.mostRecent) {
                response += `\n• Page: "${summary.pageStats.mostRecent.name}" - ${this.formatDate(summary.pageStats.mostRecent.lastModified)}`;
            }
            if (summary.widgetStats.mostRecent) {
                response += `\n• Widget: "${summary.widgetStats.mostRecent.name}" - ${this.formatDate(summary.widgetStats.mostRecent.created)}`;
            }
            if (summary.workflowStats.mostRecent) {
                response += `\n• Workflow: "${summary.workflowStats.mostRecent.name}" - ${this.formatDate(summary.workflowStats.mostRecent.createdAt)}`;
            }
            
            return response;
        }
        
        return `${greeting}! Here's your platform snapshot:\n• Total components: ${summary.total.all}\n• Created today: ${summary.createdToday}\n• This week: ${summary.createdThisWeek}`;
    }

    // Helper method to format dates
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    // Helper to get most active component type
    getMostActiveComponent(summary) {
        const components = [
            { type: 'Forms', count: summary.formStats.total },
            { type: 'Pages', count: summary.pageStats.total },
            { type: 'Widgets', count: summary.widgetStats.total },
            { type: 'Workflows', count: summary.workflowStats.total }
        ];
        
        const mostActive = components.reduce((max, current) => 
            current.count > max.count ? current : max
        );
        
        return mostActive.type;
    }

    // Helper to get weekly count (simplified)
    getWeeklyCount(stats) {
        // This is a simplified version - in reality, you'd filter by date
        return Math.floor(stats.total * 0.3); // Assume 30% created this week
    }

    // Get best practices and tips
    getBestPractices(message) {
        const currentPage = window.location.pathname.split('/').pop();
        const tips = [];
        
        // General tips
        tips.push("💡 Did you know? Forms with fewer than 7 fields have 23% higher completion rates");
        tips.push("💡 Tip: Adding progress indicators to multi-step forms increases completion by 15%");
        tips.push("💡 Best practice: Always preview your components before publishing");
        tips.push("💡 Pro tip: Use descriptive names for your components to make them easier to find later");
        
        // Context-specific tips based on current page
        if (currentPage.includes('form')) {
            tips.push("📝 Form tip: Group related fields together to improve user experience");
            tips.push("📝 Form tip: Use placeholder text to provide examples of expected input");
            tips.push("📝 Form tip: Make error messages specific and helpful");
        } else if (currentPage.includes('workflow')) {
            tips.push("⚡ Workflow tip: Test your workflows with sample data before going live");
            tips.push("⚡ Workflow tip: Use descriptive names for nodes to make debugging easier");
            tips.push("⚡ Workflow tip: Add error handling nodes to manage failures gracefully");
        } else if (currentPage.includes('widget')) {
            tips.push("🧩 Widget tip: Keep widgets focused on a single purpose");
            tips.push("🧩 Widget tip: Use consistent color schemes across related widgets");
            tips.push("🧩 Widget tip: Test widgets on different screen sizes");
        } else if (currentPage.includes('page')) {
            tips.push("📄 Page tip: Keep your most important content above the fold");
            tips.push("📄 Page tip: Use white space effectively to improve readability");
            tips.push("📄 Page tip: Ensure your pages load quickly by optimizing images");
        }
        
        // Component-specific tips based on message content
        if (message.includes('form')) {
            return "📝 Form Best Practices:\n\n" +
                   "• Keep forms short - aim for 5-7 fields maximum\n" +
                   "• Use inline validation for immediate feedback\n" +
                   "• Group related fields with clear labels\n" +
                   "• Make required fields obvious\n" +
                   "• Provide helpful error messages\n" +
                   "• Use appropriate input types (email, tel, date)\n" +
                   "• Add progress indicators for multi-step forms";
        }
        
        if (message.includes('workflow')) {
            return "⚡ Workflow Best Practices:\n\n" +
                   "• Start simple and add complexity gradually\n" +
                   "• Use descriptive names for all nodes\n" +
                   "• Test with edge cases and error scenarios\n" +
                   "• Add logging nodes for debugging\n" +
                   "• Document complex logic with comments\n" +
                   "• Use conditional branches wisely\n" +
                   "• Always have error handling paths";
        }
        
        if (message.includes('widget')) {
            return "🧩 Widget Best Practices:\n\n" +
                   "• Keep widgets focused and single-purpose\n" +
                   "• Use consistent styling across widgets\n" +
                   "• Make widgets responsive for all devices\n" +
                   "• Provide clear data labels and units\n" +
                   "• Use appropriate chart types for your data\n" +
                   "• Add loading states for dynamic content\n" +
                   "• Test with real data before publishing";
        }
        
        if (message.includes('page')) {
            return "📄 Page Best Practices:\n\n" +
                   "• Keep important content above the fold\n" +
                   "• Use clear, hierarchical headings\n" +
                   "• Optimize images for fast loading\n" +
                   "• Ensure mobile responsiveness\n" +
                   "• Use consistent navigation patterns\n" +
                   "• Include clear calls-to-action\n" +
                   "• Test on multiple browsers and devices";
        }
        
        // Return a random tip if no specific context
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        return randomTip + "\n\nAsk me about best practices for forms, workflows, widgets, or pages for more specific guidance!";
    }

    // Form Builder specific responses (existing functionality)
    getFormBuilderResponse(message) {
        if (message.includes('field') || message.includes('add')) {
            return "To add form fields:\n1. Drag fields from the left panel\n2. Drop them into your form\n3. Click on a field to configure its properties\n4. Set validation rules as needed\n\nOr I can create a complete form for you - just tell me what type of form you need!";
        }
        
        if (message.includes('validation')) {
            return "Form validation ensures data quality:\n• Required fields: Make fields mandatory\n• Email validation: Ensure proper email format\n• Number ranges: Set min/max values\n• Custom patterns: Use regex for specific formats\n• Error messages: Customize validation feedback";
        }
        
        if (message.includes('submit') || message.includes('save')) {
            return "Form submissions can be handled in multiple ways:\n• Save to database: Store form data\n• Email notifications: Send submissions via email\n• Trigger workflows: Start automated processes\n• Redirect users: Send to thank you pages\n\nConfigure these in the form settings.";
        }
        
        return "I can help you build effective forms. Try asking about:\n• Adding form fields\n• Setting up validation\n• Handling submissions\n• Form styling and layout\n• Or ask me to create a specific form for you!";
    }

    // Workflow specific responses (existing functionality)
    getWorkflowResponse(message) {
        if (message.includes('trigger')) {
            return "Workflow triggers start your automation:\n• Form Submit: When a form is submitted\n• Page Load: When a page loads\n• Button Click: On button interaction\n• Schedule: At specific times\n• Data Change: When data updates\n\nDrag a trigger from the left panel to start building your workflow.";
        }
        
        if (message.includes('action')) {
            return "Actions define what happens in your workflow:\n• Send Email: Notify users\n• Update Data: Modify records\n• Navigate: Redirect users\n• Show/Hide: Control visibility\n• Calculate: Perform computations\n\nConnect actions to triggers with flow lines.";
        }
        
        if (message.includes('condition') || message.includes('logic')) {
            return "Add logic to make smart workflows:\n• If/Else: Branch based on conditions\n• Switch: Multiple path options\n• Loop: Repeat actions\n• Wait: Add delays\n\nUse these to create dynamic, responsive automations.";
        }
        
        return "Workflows automate your processes. Ask me about:\n• Setting up triggers\n• Adding actions\n• Conditional logic\n• Testing workflows\n\nTo create workflows, use the workflow builder available in the platform.";
    }

    // Widget specific responses (existing functionality)
    getWidgetResponse(message) {
        if (message.includes('chart') || message.includes('graph')) {
            return "Chart widgets visualize your data:\n• Line charts: Show trends over time\n• Bar charts: Compare categories\n• Pie charts: Display proportions\n• Gauge charts: Show single metrics\n\nUse the widget builder to create charts with your data.";
        }
        
        if (message.includes('table') || message.includes('grid')) {
            return "Table widgets display structured data:\n• Sortable columns\n• Filterable rows\n• Pagination support\n• Action buttons\n• Responsive design\n\nUse the widget builder to create data tables.";
        }
        
        if (message.includes('custom') || message.includes('create')) {
            return "Creating custom widgets:\n1. Choose a widget type\n2. Configure data sources\n3. Customize appearance\n4. Set up interactions\n5. Save for reuse\n\nUse the widget builder to create custom widgets.";
        }
        
        return "Widgets enhance your pages with interactive elements. Ask about:\n• Chart types\n• Data tables\n• Custom widgets\n• Widget configuration\n\nTo create widgets, use the widget builder available in the platform.";
    }

    // Page Builder specific responses (existing functionality)
    getPageBuilderResponse(message) {
        if (message.includes('layout') || message.includes('design')) {
            return "Design responsive page layouts:\n• Drag-and-drop sections\n• Adjust column widths\n• Set spacing and padding\n• Mobile-responsive design\n• Custom CSS support\n\nUse the page editor to design your layouts.";
        }
        
        if (message.includes('embed') || message.includes('add')) {
            return "Embed components in your pages:\n• Forms: Collect user data\n• Widgets: Display information\n• Buttons: Add interactions\n• Images: Visual content\n• Custom HTML: Advanced features\n\nUse the page editor to add components.";
        }
        
        if (message.includes('publish') || message.includes('preview')) {
            return "Publishing your pages:\n1. Preview: Test on different devices\n2. Save: Store your changes\n3. Publish: Make live\n4. Share: Get public URL\n5. Embed: Use in other sites\n\nAlways preview before publishing.";
        }
        
        return "Page Builder lets you create complete web experiences. Ask about:\n• Page layouts\n• Adding components\n• Responsive design\n• Publishing pages\n\nTo create pages, use the page editor available in the platform.";
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

    // Get form statistics from localStorage
    getFormStats() {
        const forms = JSON.parse(localStorage.getItem('phoenix_forms') || '{"forms":[]}');
        const formList = forms.forms || [];
        
        const stats = {
            total: formList.length,
            published: formList.filter(f => f.status === 'published').length,
            draft: formList.filter(f => f.status === 'draft').length,
            mostRecent: null,
            topByFields: []
        };
        
        // Find most recent form
        if (formList.length > 0) {
            const sorted = [...formList].sort((a, b) => 
                new Date(b.createdAt || b.created || 0) - new Date(a.createdAt || a.created || 0)
            );
            stats.mostRecent = sorted[0];
        }
        
        // Find forms with most fields
        const withFieldCounts = formList.map(f => ({
            name: f.name,
            fieldCount: (f.fields || []).length
        })).sort((a, b) => b.fieldCount - a.fieldCount);
        
        stats.topByFields = withFieldCounts.slice(0, 3);
        
        return stats;
    }

    // Get page statistics from localStorage
    getPageStats() {
        const pages = JSON.parse(localStorage.getItem('pages') || '[]');
        
        const stats = {
            total: pages.length,
            published: pages.filter(p => p.status === 'published').length,
            draft: pages.filter(p => p.status === 'draft').length,
            mostRecent: null,
            withForms: 0
        };
        
        // Find most recent page
        if (pages.length > 0) {
            const sorted = [...pages].sort((a, b) => 
                new Date(b.lastModified || b.createdAt || 0) - new Date(a.lastModified || a.createdAt || 0)
            );
            stats.mostRecent = sorted[0];
        }
        
        // Count pages with forms (would need to check page content)
        pages.forEach(page => {
            const pageData = localStorage.getItem(`page_${page.id}`);
            if (pageData && pageData.includes('form')) {
                stats.withForms++;
            }
        });
        
        return stats;
    }

    // Get widget statistics from localStorage
    getWidgetStats() {
        const widgets = JSON.parse(localStorage.getItem('phoenix_widgets') || '{"widgets":[]}');
        const widgetList = widgets.widgets || [];
        
        const stats = {
            total: widgetList.length,
            byCategory: {
                charts: widgetList.filter(w => w.category === 'charts').length,
                tables: widgetList.filter(w => w.category === 'display' || w.category === 'tables').length,
                metrics: widgetList.filter(w => w.category === 'analytics' || w.category === 'metrics').length,
                actions: widgetList.filter(w => w.category === 'actions').length,
                other: widgetList.filter(w => !['charts', 'display', 'tables', 'analytics', 'metrics', 'actions'].includes(w.category)).length
            },
            mostRecent: null,
            mostUsed: null
        };
        
        // Find most recent widget
        if (widgetList.length > 0) {
            const sorted = [...widgetList].sort((a, b) => 
                new Date(b.created || b.createdAt || 0) - new Date(a.created || a.createdAt || 0)
            );
            stats.mostRecent = sorted[0];
        }
        
        // Find most used widget
        const byUsage = [...widgetList].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        if (byUsage.length > 0 && byUsage[0].usageCount > 0) {
            stats.mostUsed = byUsage[0];
        }
        
        return stats;
    }

    // Get workflow statistics from localStorage
    getWorkflowStats() {
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        
        const stats = {
            total: workflows.length,
            active: workflows.filter(w => w.status === 'active').length,
            draft: workflows.filter(w => w.status === 'draft' || !w.status).length,
            byTrigger: {
                formSubmit: 0,
                pageLoad: 0,
                buttonClick: 0,
                other: 0
            },
            mostRecent: null,
            topByNodes: []
        };
        
        // Count triggers and find workflows with most nodes
        workflows.forEach(workflow => {
            // Count triggers
            const triggers = workflow.nodes?.filter(n => n.type === 'trigger') || [];
            triggers.forEach(trigger => {
                switch (trigger.subtype) {
                    case 'form_submit':
                        stats.byTrigger.formSubmit++;
                        break;
                    case 'page_load':
                        stats.byTrigger.pageLoad++;
                        break;
                    case 'button_click':
                        stats.byTrigger.buttonClick++;
                        break;
                    default:
                        stats.byTrigger.other++;
                }
            });
        });
        
        // Find most recent workflow
        if (workflows.length > 0) {
            const sorted = [...workflows].sort((a, b) => 
                new Date(b.createdAt || b.created || 0) - new Date(a.createdAt || a.created || 0)
            );
            stats.mostRecent = sorted[0];
        }
        
        // Find workflows with most nodes
        const withNodeCounts = workflows.map(w => ({
            name: w.name,
            nodeCount: (w.nodes || []).length
        })).sort((a, b) => b.nodeCount - a.nodeCount);
        
        stats.topByNodes = withNodeCounts.slice(0, 3);
        
        return stats;
    }

    // Get overall component summary
    getComponentSummary() {
        const formStats = this.getFormStats();
        const pageStats = this.getPageStats();
        const widgetStats = this.getWidgetStats();
        const workflowStats = this.getWorkflowStats();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        // Count components created today and this week
        let createdToday = 0;
        let createdThisWeek = 0;
        
        // Check forms
        const forms = JSON.parse(localStorage.getItem('phoenix_forms') || '{"forms":[]}');
        forms.forms?.forEach(f => {
            const created = new Date(f.createdAt || f.created || 0);
            if (created >= today) createdToday++;
            if (created >= weekAgo) createdThisWeek++;
        });
        
        // Check pages
        const pages = JSON.parse(localStorage.getItem('pages') || '[]');
        pages.forEach(p => {
            const created = new Date(p.lastModified || p.createdAt || 0);
            if (created >= today) createdToday++;
            if (created >= weekAgo) createdThisWeek++;
        });
        
        // Check widgets
        const widgets = JSON.parse(localStorage.getItem('phoenix_widgets') || '{"widgets":[]}');
        widgets.widgets?.forEach(w => {
            const created = new Date(w.created || w.createdAt || 0);
            if (created >= today) createdToday++;
            if (created >= weekAgo) createdThisWeek++;
        });
        
        // Check workflows
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        workflows.forEach(w => {
            const created = new Date(w.createdAt || w.created || 0);
            if (created >= today) createdToday++;
            if (created >= weekAgo) createdThisWeek++;
        });
        
        return {
            total: {
                forms: formStats.total,
                pages: pageStats.total,
                widgets: widgetStats.total,
                workflows: workflowStats.total,
                all: formStats.total + pageStats.total + widgetStats.total + workflowStats.total
            },
            createdToday,
            createdThisWeek,
            formStats,
            pageStats,
            widgetStats,
            workflowStats
        };
    }
}

// NLP Engine for understanding user intent
class ChatbotNLPEngine {
    constructor() {
        this.intents = {
            CREATE_FORM: {
                patterns: [
                    /(?:create|make|build|add|generate)\s+(?:a\s+)?(.+?)\s+form/i,
                    /(?:i need|i want|can you make|please create)\s+(?:a\s+)?(.+?)\s+form/i,
                    /form\s+(?:for|called|named)\s+["']?(.+?)["']?$/i
                ],
                keywords: ['form', 'create', 'make', 'build'],
                handler: 'parseFormIntent'
            },
            CREATE_PAGE: {
                patterns: [
                    /(?:create|make|build|design)\s+(?:a\s+)?(.+?)\s+page/i,
                    /(?:i need|i want)\s+(?:a\s+)?(.+?)\s+page/i,
                    /page\s+(?:with|containing|that has)\s+(.+)/i,
                    /build\s+me\s+a\s+page\s+with\s+(.+)/i
                ],
                keywords: ['page', 'landing', 'website'],
                handler: 'parsePageIntent'
            },
            CREATE_WIDGET: {
                patterns: [
                    /(?:create|make|build|add)\s+(?:a\s+)?(.+?)\s+widget/i,
                    /(?:i need|i want)\s+(?:a\s+)?(.+?)\s+widget/i,
                    /widget\s+(?:for|to show|displaying)\s+(.+)/i
                ],
                keywords: ['widget', 'chart', 'table', 'component'],
                handler: 'parseWidgetIntent'
            },
            CREATE_WORKFLOW: {
                patterns: [
                    /(?:create|make|build|setup)\s+(?:a\s+)?workflow/i,
                    /(?:automate|automation for)\s+(.+)/i,
                    /workflow\s+(?:for|to|that)\s+(.+)/i
                ],
                keywords: ['workflow', 'automate', 'automation'],
                handler: 'parseWorkflowIntent'
            }
        };
        
        this.formTypes = {
            login: /login|sign\s*in|authentication|auth/i,
            registration: /register|registration|sign\s*up|signup|create\s*account/i,
            contact: /contact|feedback|message|inquiry|get\s*in\s*touch/i,
            survey: /survey|questionnaire|poll|feedback/i,
            payment: /payment|checkout|billing|order/i,
            profile: /profile|account|settings|preferences/i,
            subscription: /subscribe|subscription|newsletter/i
        };
        
        this.pageTypes = {
            landing: /landing|home|main|welcome/i,
            about: /about|who\s*we\s*are|company|team/i,
            contact: /contact|get\s*in\s*touch|reach/i,
            product: /product|service|offering/i,
            blog: /blog|article|news|post/i,
            dashboard: /dashboard|admin|control\s*panel/i,
            portfolio: /portfolio|gallery|showcase|work/i
        };
    }
    
    processInput(input, context) {
        // Normalize input
        const normalized = input.trim().toLowerCase();
        
        // Check each intent
        for (const [intentName, intentConfig] of Object.entries(this.intents)) {
            for (const pattern of intentConfig.patterns) {
                const match = input.match(pattern);
                if (match) {
                    // Call specific handler
                    const handler = this[intentConfig.handler];
                    if (handler) {
                        return handler.call(this, input, match, context);
                    }
                }
            }
        }
        
        // No intent matched
        return { action: null };
    }
    
    parseFormIntent(input, match, context) {
        const intent = {
            action: 'CREATE_FORM',
            componentType: 'form',
            raw: input
        };
        
        // Extract form name
        const nameMatch = input.match(/(?:called|named)\s+["']?([^"']+)["']?/i);
        if (nameMatch) {
            intent.name = nameMatch[1].trim();
        }
        
        // Determine form type
        for (const [type, pattern] of Object.entries(this.formTypes)) {
            if (pattern.test(input)) {
                intent.formType = type;
                break;
            }
        }
        
        // Extract any mentioned fields
        intent.fields = this.extractFields(input);
        
        return intent;
    }
    
    parsePageIntent(input, match, context) {
        const intent = {
            action: 'CREATE_PAGE',
            componentType: 'page',
            raw: input
        };
        
        // Extract page name
        const nameMatch = input.match(/(?:called|named)\s+["']?([^"']+)["']?/i);
        if (nameMatch) {
            intent.name = nameMatch[1].trim();
        }
        
        // Extract sections
        intent.sections = this.extractPageSections(input);
        
        // Determine page type
        for (const [type, pattern] of Object.entries(this.pageTypes)) {
            if (pattern.test(input)) {
                intent.pageType = type;
                break;
            }
        }
        
        return intent;
    }
    
    parseWidgetIntent(input, match, context) {
        const intent = {
            action: 'CREATE_WIDGET',
            componentType: 'widget',
            raw: input
        };
        
        // Extract widget name
        const nameMatch = input.match(/(?:called|named)\s+["']?([^"']+)["']?/i);
        if (nameMatch) {
            intent.name = nameMatch[1].trim();
        }
        
        // Check for layout specifications
        if (/split\s*layout|side\s*by\s*side|two\s*column/i.test(input)) {
            intent.layout = 'split';
        } else if (/grid\s*layout|multiple|four|2x2|dashboard|4\s*components?/i.test(input)) {
            intent.layout = 'grid';
        } else if (/triple|three\s*column|1x3|3\s*components?/i.test(input)) {
            intent.layout = 'triple';
        }
        
        // Parse compound widget requests
        intent.widgetTypes = [];
        
        // Parse "and" separated components
        const componentParts = input.split(/\band\b/i);
        componentParts.forEach(part => {
            if (/line\s*chart/i.test(part)) {
                intent.widgetTypes.push({ type: 'chart', chartType: 'line' });
            } else if (/bar\s*chart/i.test(part)) {
                intent.widgetTypes.push({ type: 'chart', chartType: 'bar' });
            } else if (/pie\s*chart/i.test(part)) {
                intent.widgetTypes.push({ type: 'chart', chartType: 'pie' });
            } else if (/chart|graph|plot/i.test(part)) {
                intent.widgetTypes.push({ type: 'chart', chartType: 'line' });
            } else if (/metric|kpi|card/i.test(part)) {
                intent.widgetTypes.push({ type: 'metric' });
            } else if (/table|grid/i.test(part)) {
                intent.widgetTypes.push({ type: 'table' });
            } else if (/button/i.test(part)) {
                intent.widgetTypes.push({ type: 'button' });
            }
        });
        
        // Handle numbered requests like "3 metrics and a chart"
        const numberMatch = input.match(/(\d+)\s*(metric|chart|table|button)/gi);
        if (numberMatch) {
            numberMatch.forEach(match => {
                const [, count, type] = match.match(/(\d+)\s*(metric|chart|table|button)/i);
                for (let i = 0; i < parseInt(count); i++) {
                    intent.widgetTypes.push({ type: type.toLowerCase() });
                }
            });
        }
        
        // Check for implicit compound requests
        const hasMultiple = /chart.*metric|metric.*chart|table.*chart|button.*metric/i.test(input);
        
        // Mark as compound if multiple types or layout specified
        if (intent.widgetTypes.length > 1 || intent.layout || hasMultiple) {
            intent.isCompound = true;
            
            // If no explicit types found but layout specified, add default components
            if (intent.widgetTypes.length === 0) {
                if (intent.layout === 'grid') {
                    intent.widgetTypes = [
                        { type: 'metric' },
                        { type: 'metric' },
                        { type: 'chart', chartType: 'line' },
                        { type: 'chart', chartType: 'bar' }
                    ];
                } else if (intent.layout === 'split') {
                    intent.widgetTypes = [
                        { type: 'chart', chartType: 'line' },
                        { type: 'metric' }
                    ];
                } else if (intent.layout === 'triple') {
                    intent.widgetTypes = [
                        { type: 'metric' },
                        { type: 'chart', chartType: 'line' },
                        { type: 'metric' }
                    ];
                }
            }
        } else if (intent.widgetTypes.length === 0) {
            // Single widget type fallback
            if (/chart|graph|plot/i.test(input)) {
                intent.widgetType = 'chart';
                if (/line/i.test(input)) intent.chartType = 'line';
                else if (/bar/i.test(input)) intent.chartType = 'bar';
                else if (/pie/i.test(input)) intent.chartType = 'pie';
            } else if (/table|grid|list/i.test(input)) {
                intent.widgetType = 'table';
            } else if (/metric|kpi|number|stat|card/i.test(input)) {
                intent.widgetType = 'metric';
            } else if (/button/i.test(input)) {
                intent.widgetType = 'button';
            }
        }
        
        return intent;
    }
    
    parseWorkflowIntent(input, match, context) {
        const intent = {
            action: 'CREATE_WORKFLOW',
            componentType: 'workflow',
            raw: input
        };
        
        // Extract workflow name
        const nameMatch = input.match(/(?:called|named)\s+["']?([^"']+)["']?/i);
        if (nameMatch) {
            intent.name = nameMatch[1].trim();
        }
        
        // Extract trigger type
        if (/form\s*submit/i.test(input)) {
            intent.trigger = 'form_submit';
        } else if (/page\s*load/i.test(input)) {
            intent.trigger = 'page_load';
        } else if (/button\s*click/i.test(input)) {
            intent.trigger = 'button_click';
        }
        
        return intent;
    }
    
    extractFields(input) {
        const fields = [];
        const fieldPatterns = {
            username: /username|user\s*name|login\s*name/i,
            password: /password|pass\s*word/i,
            email: /email|e-mail|mail/i,
            name: /(?:full\s*)?name|first\s*name|last\s*name/i,
            phone: /phone|mobile|contact\s*number|tel/i,
            message: /message|comment|feedback|description/i,
            date: /date|when|schedule|time/i,
            dateOfBirth: /date\s*of\s*birth|birth\s*date|birthday|dob/i,
            address: /address|location|where/i,
            confirmPassword: /confirm\s*password|password\s*confirmation/i,
            terms: /terms|agreement|conditions/i
        };
        
        // First check for specific multi-word patterns
        for (const [field, pattern] of Object.entries(fieldPatterns)) {
            if (pattern.test(input)) {
                fields.push(field);
            }
        }
        
        // Also check for lists like "email, password, date of birth"
        const listMatch = input.match(/(?:with|including|takes?\s*in|has)\s+(.+?)(?:\s+fields?)?$/i);
        if (listMatch) {
            const items = listMatch[1].split(/,\s*|\s+and\s+/);
            items.forEach(item => {
                const cleaned = item.trim().toLowerCase();
                for (const [field, pattern] of Object.entries(fieldPatterns)) {
                    if (pattern.test(cleaned) && !fields.includes(field)) {
                        fields.push(field);
                    }
                }
            });
        }
        
        return fields;
    }
    
    extractPageSections(input) {
        const sections = [];
        const sectionPatterns = {
            header: /header|navigation|nav|menu/i,
            hero: /hero|banner|jumbotron|main/i,
            features: /features|services|benefits|offerings/i,
            about: /about|who\s*we\s*are|story/i,
            contact: /contact|get\s*in\s*touch/i,
            footer: /footer|bottom/i,
            testimonials: /testimonials|reviews|feedback/i,
            gallery: /gallery|portfolio|images/i,
            pricing: /pricing|plans|cost/i,
            team: /team|staff|people/i,
            cta: /cta|call\s*to\s*action/i
        };
        
        // Check for "with X, Y and Z" pattern
        const withMatch = input.match(/with\s+(.+?)(?:\s+section)?$/i);
        if (withMatch) {
            const items = withMatch[1].split(/,\s*|\s+and\s+/);
            items.forEach(item => {
                const cleaned = item.trim().replace(/section$/i, '').trim();
                sections.push(cleaned);
            });
        }
        
        // Also check for explicit mentions
        for (const [section, pattern] of Object.entries(sectionPatterns)) {
            if (pattern.test(input)) {
                if (!sections.includes(section)) {
                    sections.push(section);
                }
            }
        }
        
        return sections;
    }
    
    mergeClarification(intent, response, clarification) {
        const updated = { ...intent };
        
        switch (clarification.field) {
            case 'name':
                updated.name = response.trim();
                break;
            case 'formType':
                // Check if response matches a known form type
                for (const [type, pattern] of Object.entries(this.formTypes)) {
                    if (pattern.test(response)) {
                        updated.formType = type;
                        break;
                    }
                }
                if (!updated.formType) {
                    updated.formType = 'custom';
                }
                break;
            case 'fields':
                updated.fields = this.extractFields(response);
                break;
            case 'sections':
                updated.sections = this.extractPageSections(response);
                break;
            case 'widgetType':
                updated.widgetType = response.toLowerCase().trim();
                break;
        }
        
        return updated;
    }
}

// Action Engine for executing component creation
class ChatbotActionEngine {
    constructor() {
        this.templates = {
            forms: {
                login: {
                    fields: [
                        { type: 'text', label: 'Username', placeholder: 'Enter your username', required: true },
                        { type: 'password', label: 'Password', placeholder: 'Enter your password', required: true }
                    ],
                    submitButton: { text: 'Login', style: 'primary' }
                },
                registration: {
                    fields: [
                        { type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true },
                        { type: 'email', label: 'Email', placeholder: 'Enter your email address', required: true },
                        { type: 'password', label: 'Password', placeholder: 'Enter your password', required: true },
                        { type: 'password', label: 'Confirm Password', placeholder: 'Confirm your password', required: true },
                        { type: 'checkbox', label: 'I agree to the terms and conditions', required: true }
                    ],
                    submitButton: { text: 'Register', style: 'primary' }
                },
                contact: {
                    fields: [
                        { type: 'text', label: 'Name', placeholder: 'Enter your name', required: true },
                        { type: 'email', label: 'Email', placeholder: 'Enter your email address', required: true },
                        { type: 'text', label: 'Subject', placeholder: 'Enter subject', required: true },
                        { type: 'textarea', label: 'Message', placeholder: 'Enter your message', rows: 5, required: true }
                    ],
                    submitButton: { text: 'Send Message', style: 'primary' }
                }
            },
            pages: {
                landing: {
                    sections: [
                        { type: 'header', content: { logo: 'Your Logo', menu: ['Home', 'About', 'Services', 'Contact'] } },
                        { type: 'hero', content: { title: 'Welcome to Your Site', subtitle: 'Your compelling message here', cta: 'Get Started' } },
                        { type: 'features', content: { columns: 3, items: ['Feature 1', 'Feature 2', 'Feature 3'] } },
                        { type: 'footer', content: { copyright: '© 2024 Your Company', links: ['Privacy', 'Terms', 'Contact'] } }
                    ]
                },
                about: {
                    sections: [
                        { type: 'header', content: { logo: 'Your Logo', menu: ['Home', 'About', 'Services', 'Contact'] } },
                        { type: 'hero', content: { title: 'About Us', subtitle: 'Learn more about our story' } },
                        { type: 'about', content: { text: 'Your company story here...' } },
                        { type: 'team', content: { members: [] } },
                        { type: 'footer', content: { copyright: '© 2024 Your Company', links: ['Privacy', 'Terms', 'Contact'] } }
                    ]
                }
            }
        };
    }
    
    validateIntent(intent) {
        const clarifications = [];
        
        switch (intent.action) {
            case 'CREATE_FORM':
                if (!intent.name) {
                    clarifications.push({ field: 'name', required: true });
                }
                if (!intent.formType && (!intent.fields || intent.fields.length === 0)) {
                    clarifications.push({ 
                        field: 'formType', 
                        required: true,
                        suggestions: ['Login Form', 'Registration Form', 'Contact Form', 'Custom Form']
                    });
                }
                break;
                
            case 'CREATE_PAGE':
                if (!intent.name) {
                    clarifications.push({ field: 'name', required: true });
                }
                if (!intent.sections || intent.sections.length === 0) {
                    clarifications.push({ 
                        field: 'sections', 
                        required: true,
                        suggestions: ['Header, Hero, Footer', 'Header, Hero, Features, Footer', 'Header, About, Contact, Footer']
                    });
                }
                break;
                
            case 'CREATE_WIDGET':
                if (!intent.name) {
                    clarifications.push({ field: 'name', required: true });
                }
                if (!intent.widgetType) {
                    clarifications.push({ 
                        field: 'widgetType', 
                        required: true,
                        suggestions: ['Chart', 'Table', 'Metric Card', 'Button']
                    });
                }
                break;
                
            case 'CREATE_WORKFLOW':
                if (!intent.name) {
                    clarifications.push({ field: 'name', required: true });
                }
                if (!intent.trigger) {
                    clarifications.push({ 
                        field: 'workflowTrigger', 
                        required: true,
                        suggestions: ['Form Submission', 'Page Load', 'Button Click']
                    });
                }
                break;
        }
        
        return clarifications;
    }
    
    async execute(intent) {
        switch (intent.action) {
            case 'CREATE_FORM':
                return await this.createForm(intent);
            case 'CREATE_PAGE':
                return await this.createPage(intent);
            case 'CREATE_WIDGET':
                return await this.createWidget(intent);
            case 'CREATE_WORKFLOW':
                return await this.createWorkflow(intent);
            default:
                throw new Error('Unknown action: ' + intent.action);
        }
    }
    
    async createForm(intent) {
        // Generate form ID
        const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get template or create custom
        let formData;
        
        // If user specified custom fields, always create a custom form
        if (intent.fields && intent.fields.length > 0) {
            // Create custom form with specified fields
            formData = {
                id: formId,
                name: intent.name || 'Custom Form',
                description: 'Custom form created by AI assistant',
                fields: this.createFieldsFromIntent(intent.fields),
                submitButton: { text: 'Submit', style: 'primary' },
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'AI Assistant'
            };
        } else if (intent.formType && this.templates.forms[intent.formType]) {
            // Use template if no custom fields specified
            const template = this.templates.forms[intent.formType];
            formData = {
                id: formId,
                name: intent.name || `${intent.formType.charAt(0).toUpperCase() + intent.formType.slice(1)} Form`,
                description: `${intent.formType} form created by AI assistant`,
                fields: template.fields.map((field, index) => ({
                    id: `field_${Date.now()}_${index}`,
                    type: field.type,
                    label: field.label,
                    placeholder: field.placeholder || '',
                    required: field.required || false,
                    width: '100%',
                    cssClass: '',
                    helpText: '',
                    ...(field.name && { name: field.name }),
                    ...(field.rows && { rows: field.rows })
                })),
                submitButton: template.submitButton,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'AI Assistant'
            };
        } else {
            // Default empty form
            formData = {
                id: formId,
                name: intent.name || 'New Form',
                description: 'Form created by AI assistant',
                fields: [],
                submitButton: { text: 'Submit', style: 'primary' },
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'AI Assistant'
            };
        }
        
        // Save to localStorage in both formats
        // 1. Save to phoenix_forms collection
        const forms = JSON.parse(localStorage.getItem('phoenix_forms') || '{"forms":[]}');
        forms.forms.push(formData);
        localStorage.setItem('phoenix_forms', JSON.stringify(forms));
        
        // 2. Also save individual form for form builder compatibility
        localStorage.setItem(`form_${formId}`, JSON.stringify(formData));
        
        return {
            message: `✅ I've created the "${formData.name}" form for you! It's saved as a draft with ${formData.fields.length} fields${formData.fields.length > 0 ? ': ' + formData.fields.map(f => f.label).join(', ') : ''}.`,
            actions: [
                { type: 'edit', label: 'Edit Form', url: `form-builder.html?id=${formId}`, icon: 'edit' },
                { type: 'preview', label: 'Preview', url: `form-builder.html?id=${formId}&preview=true`, icon: 'eye' }
            ],
            data: formData
        };
    }
    
    async createPage(intent) {
        // Generate page ID
        const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Build page structure
        let sections = [];
        if (intent.pageType && this.templates.pages[intent.pageType]) {
            sections = this.templates.pages[intent.pageType].sections;
        } else if (intent.sections && intent.sections.length > 0) {
            // Create sections based on intent
            sections = intent.sections.map(sectionType => {
                return this.createPageSection(sectionType);
            });
        } else {
            // Default page structure
            sections = [
                this.createPageSection('header'),
                this.createPageSection('hero'),
                this.createPageSection('footer')
            ];
        }
        
        const pageData = {
            id: pageId,
            title: intent.name || 'New Page',
            description: 'Page created by AI assistant',
            sections: sections,
            status: 'draft',
            createdAt: new Date().toISOString(),
            createdBy: 'AI Assistant',
            seo: {
                title: intent.name || 'New Page',
                description: '',
                keywords: ''
            }
        };
        
        // Save to localStorage
        localStorage.setItem(`page_${pageId}`, JSON.stringify(pageData));
        
        // Also update pages list
        const pages = JSON.parse(localStorage.getItem('pages') || '[]');
        pages.push({
            id: pageId,
            name: pageData.title,
            status: 'draft',
            lastModified: pageData.createdAt
        });
        localStorage.setItem('pages', JSON.stringify(pages));
        
        return {
            message: `✅ I've created the "${pageData.title}" page with ${sections.length} sections: ${sections.map(s => s.type).join(', ')}.`,
            actions: [
                { type: 'edit', label: 'Edit Page', url: `page-editor.html?id=${pageId}`, icon: 'edit' },
                { type: 'preview', label: 'Preview', url: `page-viewer.html?id=${pageId}`, icon: 'eye' }
            ],
            data: pageData
        };
    }
    
    async createWidget(intent) {
        // Generate widget ID
        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate component count
        if (intent.widgetTypes && intent.widgetTypes.length > 4) {
            throw new Error("I can create widgets with up to 4 components. Which 4 would you like to include?");
        }
        
        // Check if this is a compound widget request
        if (intent.isCompound && intent.widgetTypes && intent.widgetTypes.length > 0) {
            // Determine layout based on component count and intent
            let layoutType = 'split-layout';
            let gridColumns = '1fr 1fr';
            let gridRows = '1fr';
            
            if (intent.layout === 'grid' || intent.widgetTypes.length === 4) {
                layoutType = 'grid-layout';
                gridColumns = '1fr 1fr';
                gridRows = '1fr 1fr';
            } else if (intent.layout === 'triple' || intent.widgetTypes.length === 3) {
                layoutType = 'triple-layout';
                gridColumns = '1fr 1fr 1fr';
                gridRows = '1fr';
            }
            
            // Create a compound widget with appropriate layout
            const definition = {
                type: layoutType,
                layout: intent.layout || 'auto',
                components: [],
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    gridTemplateRows: gridRows,
                    gap: '20px'
                }
            };
            
            // Ensure we have the right number of components
            let componentsToCreate = [...intent.widgetTypes];
            
            // For grid layout, ensure 4 components
            if (layoutType === 'grid-layout') {
                while (componentsToCreate.length < 4) {
                    componentsToCreate.push(componentsToCreate[0] || { type: 'metric' });
                }
                componentsToCreate = componentsToCreate.slice(0, 4);
            }
            
            // Create components for each widget type
            componentsToCreate.forEach(widgetType => {
                const component = this.createWidgetComponent(widgetType);
                if (component) {
                    definition.components.push(component);
                }
            });
            
            // Create widget data
            const widgetData = {
                id: widgetId,
                name: intent.name || 'Dashboard Widget',
                description: `Compound widget with ${intent.widgetTypes.map(w => w.type).join(' and ')} created by AI assistant`,
                category: 'analytics',
                template: 'custom',
                status: 'draft',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                usageCount: 0,
                definition: definition,
                createdBy: 'AI Assistant'
            };
            
            // Save to localStorage
            const widgets = JSON.parse(localStorage.getItem('phoenix_widgets') || '{"widgets":[]}');
            widgets.widgets.push(widgetData);
            widgets.lastUpdated = new Date().toISOString();
            localStorage.setItem('phoenix_widgets', JSON.stringify(widgets));
            
            return {
                message: `✅ I've created the "${widgetData.name}" widget with a ${intent.layout || layoutType.replace('-layout', '')} layout containing ${intent.widgetTypes.map(w => w.type).join(' and ')}!`,
                actions: [
                    { type: 'edit', label: 'Edit Widget', url: `widget-builder-enhanced.html?id=${widgetId}`, icon: 'edit' },
                    { type: 'navigate', label: 'View All Widgets', url: 'widget-list.html', icon: 'th' }
                ],
                data: widgetData
            };
        } else {
            // Single widget creation (existing logic)
            let category = 'other';
            let template = 'blank';
            let definition = {
                type: 'container',
                components: [],
                styling: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px'
                }
            };
            
            // Configure based on widget type
            switch (intent.widgetType) {
                case 'chart':
                    category = 'charts';
                    template = 'chart';
                    definition = {
                        type: 'chart-widget',
                        components: [{
                            type: intent.chartType === 'bar' ? 'bar-chart' : intent.chartType === 'pie' ? 'pie-chart' : 'line-chart',
                            props: {
                                data: [10, 20, 30, 25, 35],
                                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                                title: 'Sample Chart'
                            }
                        }],
                        styling: {
                            background: '#ffffff',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                        }
                    };
                    break;
                case 'table':
                    category = 'display';
                    template = 'table';
                    definition = {
                        type: 'table-widget',
                        components: [{
                            type: 'data-table',
                            props: {
                                columns: ['Name', 'Value', 'Status'],
                                data: [
                                    ['Item 1', '100', 'Active'],
                                    ['Item 2', '200', 'Active']
                                ]
                            }
                        }],
                        styling: {
                            background: '#ffffff',
                            padding: '20px',
                            borderRadius: '8px'
                        }
                    };
                    break;
                case 'metric':
                    category = 'analytics';
                    template = 'metric';
                    definition = {
                        type: 'kpi-metric',
                        components: [{
                            type: 'metric-value',
                            props: {
                                value: '0',
                                label: 'Total',
                                change: '+0%',
                                changeType: 'neutral'
                            }
                        }],
                        styling: {
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            color: 'white',
                            padding: '24px',
                            borderRadius: '12px'
                        }
                    };
                    break;
                case 'button':
                    category = 'actions';
                    template = 'actions';
                    definition = {
                        type: 'action-group',
                        components: [{
                            type: 'button',
                            props: { 
                                text: 'Click Me', 
                                icon: 'fas fa-hand-pointer', 
                                color: 'primary' 
                            }
                        }],
                        styling: {
                            background: '#ffffff',
                            padding: '16px',
                            borderRadius: '8px',
                            display: 'flex',
                            gap: '12px'
                        }
                    };
                    break;
            }
            
            // Create widget data in the expected format
            const widgetData = {
                id: widgetId,
                name: intent.name || `New ${intent.widgetType || 'Widget'}`,
                description: `${intent.widgetType || 'Custom'} widget created by AI assistant`,
                category: category,
                template: template,
                status: 'draft',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                usageCount: 0,
                definition: definition,
                createdBy: 'AI Assistant'
            };
            
            // Save to localStorage
            const widgets = JSON.parse(localStorage.getItem('phoenix_widgets') || '{"widgets":[]}');
            widgets.widgets.push(widgetData);
            widgets.lastUpdated = new Date().toISOString();
            localStorage.setItem('phoenix_widgets', JSON.stringify(widgets));
            
            return {
                message: `✅ I've created the "${widgetData.name}" widget for you! It's saved as a draft ${widgetData.category} widget.`,
                actions: [
                    { type: 'edit', label: 'Edit Widget', url: `widget-builder-enhanced.html?id=${widgetId}`, icon: 'edit' },
                    { type: 'navigate', label: 'View All Widgets', url: 'widget-list.html', icon: 'th' }
                ],
                data: widgetData
            };
        }
    }
    
    createWidgetComponent(widgetType) {
        switch (widgetType.type) {
            case 'chart':
                return {
                    type: 'chart-container',
                    components: [{
                        type: widgetType.chartType === 'bar' ? 'bar-chart' : 
                              widgetType.chartType === 'pie' ? 'pie-chart' : 'line-chart',
                        props: {
                            data: [10, 20, 30, 25, 35],
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                            title: 'Sample Chart'
                        }
                    }],
                    styling: {
                        background: '#ffffff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        height: '100%'
                    }
                };
                
            case 'metric':
                return {
                    type: 'metric-container',
                    components: [{
                        type: 'metric-value',
                        props: {
                            value: '0',
                            label: 'Total',
                            change: '+0%',
                            changeType: 'neutral'
                        }
                    }],
                    styling: {
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        color: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                };
                
            case 'table':
                return {
                    type: 'table-container',
                    components: [{
                        type: 'data-table',
                        props: {
                            columns: ['Name', 'Value', 'Status'],
                            data: [
                                ['Item 1', '100', 'Active'],
                                ['Item 2', '200', 'Active']
                            ]
                        }
                    }],
                    styling: {
                        background: '#ffffff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        height: '100%'
                    }
                };
                
            case 'button':
                return {
                    type: 'button-container',
                    components: [{
                        type: 'button',
                        props: { 
                            text: 'Click Me', 
                            icon: 'fas fa-hand-pointer', 
                            color: 'primary' 
                        }
                    }],
                    styling: {
                        background: '#ffffff',
                        padding: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '12px',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                };
                
            default:
                return null;
        }
    }
    
    async createWorkflow(intent) {
        // Generate workflow ID
        const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create basic workflow structure
        const workflowData = {
            id: workflowId,
            name: intent.name || 'New Workflow',
            description: 'Workflow created by AI assistant',
            status: 'draft',
            nodes: [],
            connections: [],
            createdAt: new Date().toISOString(),
            createdBy: 'AI Assistant'
        };
        
        // Add trigger node
        if (intent.trigger) {
            const triggerNode = {
                id: `node_${Date.now()}_1`,
                type: 'trigger',
                subtype: intent.trigger,
                position: { x: 100, y: 100 },
                config: {},
                outputs: []
            };
            workflowData.nodes.push(triggerNode);
        }
        
        // Save to localStorage
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        workflows.push(workflowData);
        localStorage.setItem('workflows', JSON.stringify(workflows));
        
        return {
            message: `✅ I've created the "${workflowData.name}" workflow with a ${intent.trigger || 'trigger'} node to get you started!`,
            actions: [
                { type: 'edit', label: 'Edit Workflow', url: `workflow-builder.html?id=${workflowId}`, icon: 'edit' },
                { type: 'navigate', label: 'View All Workflows', url: 'workflow-list.html', icon: 'project-diagram' }
            ],
            data: workflowData
        };
    }
    
    createFieldsFromIntent(fieldNames) {
        const fieldTypeMap = {
            username: { type: 'text', label: 'Username' },
            password: { type: 'password', label: 'Password' },
            confirmPassword: { type: 'password', label: 'Confirm Password' },
            email: { type: 'email', label: 'Email Address' },
            name: { type: 'text', label: 'Full Name' },
            phone: { type: 'tel', label: 'Phone Number' },
            message: { type: 'textarea', label: 'Message', rows: 4 },
            date: { type: 'date', label: 'Date' },
            dateOfBirth: { type: 'date', label: 'Date of Birth' },
            address: { type: 'textarea', label: 'Address', rows: 3 },
            terms: { type: 'checkbox', label: 'I agree to the terms and conditions' }
        };
        
        return fieldNames.map((fieldName, index) => {
            const fieldConfig = fieldTypeMap[fieldName] || { type: 'text', label: fieldName };
            return {
                id: `field_${Date.now()}_${index}`,
                type: fieldConfig.type,
                label: fieldConfig.label,
                placeholder: fieldConfig.type === 'checkbox' ? '' : `Enter your ${fieldConfig.label.toLowerCase()}`,
                required: true,
                width: '100%',
                cssClass: '',
                helpText: '',
                ...(fieldConfig.rows && { rows: fieldConfig.rows })
            };
        });
    }
    
    createPageSection(type) {
        const sectionTemplates = {
            header: {
                type: 'header',
                content: {
                    logo: 'Your Logo',
                    menu: ['Home', 'About', 'Services', 'Contact']
                }
            },
            hero: {
                type: 'hero',
                content: {
                    title: 'Welcome',
                    subtitle: 'Your message here',
                    cta: 'Get Started'
                }
            },
            features: {
                type: 'features',
                content: {
                    title: 'Our Features',
                    columns: 3,
                    items: ['Feature 1', 'Feature 2', 'Feature 3']
                }
            },
            about: {
                type: 'about',
                content: {
                    title: 'About Us',
                    text: 'Your story here...'
                }
            },
            contact: {
                type: 'contact',
                content: {
                    title: 'Get In Touch',
                    form: null
                }
            },
            footer: {
                type: 'footer',
                content: {
                    copyright: '© 2024 Your Company',
                    links: ['Privacy', 'Terms', 'Contact']
                }
            }
        };
        
        return sectionTemplates[type] || {
            type: type,
            content: {}
        };
    }
}

// Context Manager for conversation state
class ChatbotContextManager {
    constructor() {
        this.context = {
            pendingAction: null,
            conversationHistory: [],
            lastCreatedComponent: null
        };
    }
    
    getContext() {
        return this.context;
    }
    
    setPendingAction(intent, clarifications) {
        this.context.pendingAction = {
            intent: intent,
            clarifications: clarifications,
            timestamp: new Date().toISOString()
        };
    }
    
    updatePendingAction(intent, clarifications) {
        if (this.context.pendingAction) {
            this.context.pendingAction.intent = intent;
            this.context.pendingAction.clarifications = clarifications;
        }
    }
    
    getPendingAction() {
        return this.context.pendingAction;
    }
    
    hasPendingAction() {
        return this.context.pendingAction !== null;
    }
    
    clearPendingAction() {
        this.context.pendingAction = null;
    }
    
    addToHistory(message, sender) {
        this.context.conversationHistory.push({
            message: message,
            sender: sender,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 messages
        if (this.context.conversationHistory.length > 10) {
            this.context.conversationHistory.shift();
        }
    }
    
    setLastCreatedComponent(component) {
        this.context.lastCreatedComponent = component;
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
