# DArchive Technical Blog - Writing Workflow

This guide explains how to create and manage interactive technical blog posts using our enhanced Markdown + component registry system.

## 📁 Project Structure

```
src/
├── components/
│   ├── ColorPicker.vue          # Interactive color picker
│   ├── LiveCSSEditor.vue        # Live CSS editor with preview
│   ├── CodeSandbox.vue          # Code display with copy
│   └── HelloWorld.vue           # Example component
├── composables/
│   ├── useTechnical.ts          # Main blog post handling
│   ├── useComponentRegistry.ts  # Component registry system
│   └── useCommentary.ts         # Commentary posts
├── content/                     # Future: MDX content (optional)
└── views/
    ├── Technical.vue            # Post listing page
    └── TechnicalDetail.vue      # Individual post view

public/technical/                # Your blog post files go here
├── 2022-05-04-understanding-cascade-theory.md
├── 2023-02-14-semanticity.md
└── 2023-02-14-semanticity-interactive.md    # Example interactive post
```

## ✍️ Writing a New Blog Post

### 1. Create Your Markdown File

Create a new file in `public/technical/` with the naming convention:
```
YYYY-MM-DD-post-title.md
```

### 2. Add Frontmatter

Every post should start with YAML frontmatter:

```markdown
---
title: "Your Post Title"
date: "2023-12-25"
desc: "A brief description of your post for listings and SEO"
components: ["color-picker", "live-css-editor", "code-sandbox"]  # Optional: list of interactive components
---
```

### 3. Write Your Content

Use standard Markdown syntax. For interactive components, use custom HTML tags:

```markdown
# Your Post Title

Regular markdown content here...

## Interactive Section

<color-picker initial-color="#ff6b35" />

Try editing this CSS:

<live-css-editor initial-css="
.example {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  padding: 2rem;
}
" />

Here's some code to try:

<code-sandbox code="
const greeting = 'Hello, World!';
console.log(greeting);
" language="javascript" />
```

### 4. Register Your Post

Add your new file to the `markdownFiles` array in `src/composables/useTechnical.ts`:

```typescript
const markdownFiles = [
    '2022-05-04-understanding-cascade-theory.md',
    '2023-02-14-semanticity.md',
    '2023-12-25-your-new-post.md'  // Add your file here
]
```

## 🧩 Available Interactive Components

### `<color-picker>`
Interactive color picker with theme awareness.

**Props:**
- `initial-color`: Starting color (default: #007bff)
- `theme`: Light/dark theme (auto-detected)

**Example:**
```html
<color-picker initial-color="#ff6b35" />
```

### `<live-css-editor>`
Live CSS editor with real-time preview.

**Props:**
- `initial-css`: Starting CSS content
- `target-selector`: CSS selector to apply styles (default: .preview)

**Example:**
```html
<live-css-editor initial-css="
.example {
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 8px;
}
" />
```

### `<code-sandbox>`
Code display with syntax highlighting and copy functionality.

**Props:**
- `code`: Code content to display
- `language`: Programming language (javascript, html, css, etc.)
- `title`: Optional title for the code block

**Example:**
```html
<code-sandbox 
  code="function hello() { return 'Hello, World!'; }" 
  language="javascript" 
  title="Simple Function" />
```

## 🔧 Adding New Interactive Components

### 1. Create the Vue Component

Create your component in `src/components/`:

```vue
<!-- src/components/MyNewComponent.vue -->
<template>
  <div class="my-component">
    <!-- Your component template -->
  </div>
</template>

<script setup lang="ts">
// Your component logic
</script>
```

### 2. Register the Component

Add it to `src/composables/useComponentRegistry.ts`:

```typescript
export const componentRegistry: Record<string, ComponentRegistryEntry> = {
  // ... existing components
  
  'my-new-component': {
    component: () => import('../components/MyNewComponent.vue'),
    description: 'Description of what your component does',
    props: {
      'prop-name': 'Description of this prop',
      'another-prop': 'Description of another prop'
    }
  }
}
```

### 3. Use in Posts

Now you can use it in any blog post:

```html
<my-new-component prop-name="value" another-prop="another-value" />
```

## 📂 Organizing Complex Posts

For posts with many custom components, create a dedicated folder:

```
src/components/post-specific/
└── advanced-react-patterns/
    ├── HookDemo.vue
    ├── ContextVisualizer.vue
    ├── StateChart.vue
    └── PerformanceProfiler.vue
```

Register them with descriptive names:

```typescript
'react-hook-demo': {
  component: () => import('../components/post-specific/advanced-react-patterns/HookDemo.vue'),
  description: 'Interactive React hook demonstration'
}
```

## 🎨 Styling Guidelines

### Theme Awareness
All components automatically receive theme state via Vue's provide/inject:

```typescript
import { inject } from 'vue'

const isDark = inject('isDark', ref(false))
```

### CSS Classes
Use consistent utility classes:
- `interactive-component` - Automatically added to all interactive components
- Theme-responsive classes: Use `:class="isDark ? 'dark-styles' : 'light-styles'"`

## 🚀 Development Workflow

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Create Your Post
- Add markdown file to `public/technical/`
- Update the file list in `useTechnical.ts`
- Create any needed components

### 3. Test Locally
- Visit `http://localhost:5173/technical`
- Check your post appears with "INTERACTIVE" badge if it has components
- Test all interactive elements

### 4. Build for Production
```bash
npm run build
```

## 📝 Writing Tips

### Good Interactive Posts:
- **Start simple**: Use one interactive component to illustrate a concept
- **Progressive enhancement**: Add interactivity that enhances understanding
- **Clear examples**: Each component should have a clear purpose
- **Accessible**: Consider screen readers and keyboard navigation

### Component Design:
- **Single responsibility**: Each component does one thing well
- **Reusable**: Design for use across multiple posts
- **Theme-aware**: Respect light/dark mode preferences
- **Performance**: Lazy-load and keep bundle sizes reasonable

## 🐛 Troubleshooting

### Post Not Showing
1. Check filename follows `YYYY-MM-DD-title.md` format
2. Verify file is added to `markdownFiles` array
3. Check frontmatter YAML syntax

### Component Not Loading
1. Verify component is registered in `useComponentRegistry.ts`
2. Check import path is correct
3. Ensure component tag is kebab-case

### Interactive Components Not Working
1. Check browser console for errors
2. Verify all required props are provided
3. Test component in isolation

## 🎯 Best Practices

1. **Content First**: Write the content, then add interactivity
2. **Performance**: Only load components when needed
3. **Accessibility**: Test with screen readers
4. **Mobile**: Ensure components work on touch devices
5. **Fallbacks**: Provide meaningful content even if JS fails

## 🔮 Future Enhancements

The system is designed to grow with your needs:

- **Shared Component Library**: Build reusable components across posts
- **Advanced Interactions**: Add data visualization, animations, etc.
- **Post Templates**: Create templates for common post types
- **Content Management**: Potentially add a CMS interface

---

**Happy writing! 🚀**

Remember: The best interactive posts teach concepts through hands-on experience. Focus on helping readers understand, not just showing off cool tech.
