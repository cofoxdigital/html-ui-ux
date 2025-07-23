# Workflow Builder Integration Guide

## Overview

The Phoenix Platform now includes a powerful Workflow Builder that integrates seamlessly with the Page Builder, Form Builder, and Widget Builder to create dynamic, interactive custom websites. This guide explains how to use these tools together to build complete web applications.

## Architecture

### Core Components

1. **Page Builder** - Create and design web pages with drag-and-drop interface
2. **Form Builder** - Design custom forms with various field types
3. **Widget Builder** - Create reusable data visualization components
4. **Workflow Builder** - Define business logic and automation

### How They Work Together

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│    Pages    │────▶│    Forms    │────▶│  Workflows   │
│             │     │   Widgets   │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Custom Website │
                    └────────────────┘
```

## Workflow Builder Features

### 1. Visual Canvas
- Drag-and-drop node interface
- Real-time connection validation
- Auto-layout functionality
- Zoom and pan controls

### 2. Node Types

#### Triggers
- **Form Submit** - Activates when a specific form is submitted
- **Page Load** - Fires when a page loads
- **Button Click** - Responds to button clicks
- **Timer** - Executes at specified intervals
- **Data Change** - Monitors localStorage changes

#### Actions
- **Navigate** - Redirect to another page
- **Show Message** - Display notifications
- **Update Widget** - Refresh widget data
- **Save Data** - Store data in localStorage
- **Delete Data** - Remove stored data
- **Set Variable** - Create workflow variables
- **Show/Hide Element** - Control element visibility

#### Logic
- **Condition** - Branch workflow based on conditions
- **Wait** - Pause execution for specified duration

#### Data
- **Transform** - Modify data (uppercase, lowercase, trim, etc.)

### 3. Properties Panel
Each node has configurable properties:
- Form/Page/Widget selection
- Data mappings
- Conditions and operators
- Timing controls

### 4. Testing & Preview
- **Test Mode** - Run workflows with mock data
- **Preview Mode** - Test workflows in actual pages
- **Debug Console** - View execution logs

## Building a Custom Website

### Step 1: Create Forms
1. Use Form Builder to create input forms
2. Define fields (text, email, select, etc.)
3. Publish forms when ready

### Step 2: Create Widgets
1. Design data visualization widgets
2. Configure data sources
3. Publish widgets for use

### Step 3: Build Pages
1. Use Page Editor to design layouts
2. Add forms and widgets to pages
3. Include buttons and interactive elements
4. Publish pages

### Step 4: Create Workflows
1. Open Workflow Builder
2. Add trigger nodes (e.g., form submit)
3. Connect action nodes (e.g., save data, navigate)
4. Add logic for conditional flows
5. Configure node properties
6. Test and publish workflows

### Step 5: Preview & Deploy
1. Use Preview button to test workflows
2. Verify all interactions work correctly
3. Published workflows activate automatically

## Example Use Cases

### 1. Contact Form Workflow
```
[Form Submit] → [Save Data] → [Show Message] → [Navigate to Thank You]
```

### 2. User Registration Flow
```
[Form Submit] → [Condition: Email Valid?]
                    ├─ Yes → [Save User] → [Navigate to Dashboard]
                    └─ No → [Show Error Message]
```

### 3. Data Dashboard
```
[Page Load] → [Load Data] → [Update Widget] → [Timer: Refresh Every 30s]
```

### 4. Multi-Step Form
```
[Button Click: Next] → [Save Step 1] → [Navigate to Step 2]
[Form Submit: Step 2] → [Combine Data] → [Save Final] → [Show Success]
```

## Best Practices

### 1. Workflow Design
- Keep workflows simple and focused
- Use meaningful names for nodes
- Test each path thoroughly
- Document complex logic

### 2. Data Management
- Use consistent naming for storage keys
- Clean up temporary data
- Validate data before processing
- Handle errors gracefully

### 3. User Experience
- Provide clear feedback (messages, loading states)
- Ensure smooth navigation
- Test on different devices
- Consider accessibility

### 4. Performance
- Minimize unnecessary data transformations
- Use conditions to skip unneeded actions
- Batch similar operations
- Clean up unused workflows

## Advanced Features

### 1. Variable Scoping
- **Workflow Variables** - Available within single execution
- **Global Variables** - Persist across workflows

### 2. Data Transformation
- Chain multiple transformations
- Access nested data with dot notation
- Use template syntax: `{{variable.property}}`

### 3. Conditional Logic
- AND/OR operators for complex conditions
- Compare values, check existence
- String operations (contains, starts with)

### 4. Integration Points
- Forms pass data to workflows
- Workflows update widget data
- Pages can trigger multiple workflows
- Workflows can chain together

## Troubleshooting

### Common Issues

1. **Workflow Not Triggering**
   - Verify trigger configuration
   - Check if workflow is published
   - Ensure form/page IDs match

2. **Data Not Saving**
   - Check storage key names
   - Verify data mapping
   - Look for console errors

3. **Navigation Not Working**
   - Confirm page is published
   - Check page ID in action node
   - Test in preview mode

4. **Conditions Not Working**
   - Verify data types match
   - Check operator selection
   - Test with console logs

## API Reference

### Workflow Engine Events
```javascript
// Form submission
window.dispatchEvent(new CustomEvent('formSubmit', {
    detail: { formId: 'form_123', data: {...} }
}));

// Page load
window.dispatchEvent(new CustomEvent('pageLoad', {
    detail: { pageId: 'page_456' }
}));

// Button click
window.dispatchEvent(new CustomEvent('buttonClick', {
    detail: { buttonId: 'btn_789' }
}));
```

### Data Access
```javascript
// Get workflow data
const data = localStorage.getItem('workflow_data');

// Get form data
const formData = JSON.parse(localStorage.getItem('form_submissions'));

// Get widget data
const widgetData = JSON.parse(localStorage.getItem('widget_data'));
```

## Conclusion

The Workflow Builder transforms the Phoenix Platform into a complete no-code website builder. By combining visual page design with powerful automation logic, users can create sophisticated web applications without writing code. The integration between all builders ensures a seamless development experience from design to deployment.
