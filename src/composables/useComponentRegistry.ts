import type { Component } from 'vue'

export interface ComponentRegistryEntry {
    component: () => Promise<{ default: Component }>
    description: string
    props?: Record<string, string>
}

export const componentRegistry: Record<string, ComponentRegistryEntry> = {
    // Shared interactive components
    'color-picker': {
        component: () => import('../components/ColorPicker.vue'),
        description: 'Interactive color picker with theme awareness',
        props: {
            'initial-color': 'Initial hex color (default: #007bff)',
            'theme': 'Light or dark theme (default: auto-detected)'
        }
    },

    'live-css-editor': {
        component: () => import('../components/LiveCSSEditor.vue'),
        description: 'Live CSS editor with real-time preview',
        props: {
            'initial-css': 'Initial CSS content',
            'target-selector': 'CSS selector to apply styles to (default: .preview)'
        }
    },

    'code-sandbox': {
        component: () => import('../components/CodeSandbox.vue'),
        description: 'Code display with copy functionality',
        props: {
            'code': 'Code content to display',
            'language': 'Programming language for syntax highlighting',
            'title': 'Optional title for the code block'
        }
    },

    'vector-playground': {
        component: () => import('../components/the-great-divide/VectorPlayground.vue'),
        description: 'Interactive vector playground used in "The Great Divide" article',
        props: {
            'initial-a': 'Optional: initial vector A as "x,y" (example: "100,-40")',
            'initial-b': 'Optional: initial vector B as "x,y" (example: "-80,80")'
        }
    },

    'classification-plot': {
        component: () => import('../components/the-great-divide/ClassificationPlot.vue'),
        description: 'Interactive classification plot: add points, drag weight vector, see northern/southern halves',
        props: {
            'width': 'Optional: plot width in px (default: 560)',
            'height': 'Optional: plot height in px (default: 400)'
        }
    }

    // Add more components here as needed:
    // 'semantic-demo': {
    //   component: () => import('../components/post-specific/semanticity/SemanticDemo.vue'),
    //   description: 'Semantic HTML demonstration',
    //   props: { ... }
    // }
}

export function isValidComponent(tagName: string): boolean {
    return tagName in componentRegistry
}

export async function loadComponent(tagName: string): Promise<Component | null> {
    const entry = componentRegistry[tagName]
    if (!entry) return null

    try {
        const module = await entry.component()
        return module.default
    } catch (error) {
        console.error(`Failed to load component ${tagName}:`, error)
        return null
    }
}

export function getComponentInfo(tagName: string): ComponentRegistryEntry | null {
    return componentRegistry[tagName] || null
}

export function getAllComponents(): Record<string, ComponentRegistryEntry> {
    return componentRegistry
}
