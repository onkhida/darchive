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
    },

    'weight-vector-controller': {
        component: () => import('../components/the-great-divide/WeightVectorController.vue'),
        description: 'Interactive weight vector controller: adjust w0 (bias), w1, w2 to see how the decision boundary changes',
        props: {}
    },

    'weighted-sum-visualizer': {
        component: () => import('../components/the-great-divide/WeightedSumVisualizer.vue'),
        description: 'Sequential animation showing the incremental weighted sum calculation process',
        props: {}
    },

    'data-points-table': {
        component: () => import('../components/the-great-divide/DataPointsTable.vue'),
        description: 'Expandable table displaying 22 decision instances with money, wait time, and decision labels',
        props: {}
    },

    'graph-plot': {
        component: () => import('../components/the-great-divide/GraphPlotComponent.vue'),
        description: 'Normalized data plot showing money vs wait time with min-max normalization applied to decision instances',
        props: {}
    },

    'weight-vector-plot': {
        component: () => import('../components/the-great-divide/WeightVectorPlot.vue'),
        description: 'Normalized data plot with weight vector visualization and orthogonal decision boundary line',
        props: {}
    },

    'misclassification-checker': {
        component: () => import('../components/the-great-divide/MisclassificationChecker.vue'),
        description: 'Interactive tool to test the misclassification formula y(w·x) by placing points and checking classification',
        props: {}
    },

    'weight-update-animator': {
        component: () => import('../components/the-great-divide/WeightUpdateAnimator.vue'),
        description: 'Three-step animation showing perceptron weight update process: misclassified point → computing update (y·x) → reoriented boundary',
        props: {}
    },

    'perceptron-simulator': {
        component: () => import('../components/the-great-divide/PerceptronSimulator.vue'),
        description: 'Complete perceptron training simulator with animated convergence, boundary diaries log, and playback controls',
        props: {
            'width': 'Optional: plot width in px (default: 560)',
            'height': 'Optional: plot height in px (default: 560)'
        }
    },

    'decision-classifier': {
        component: () => import('../components/the-great-divide/DecisionClassifier.vue'),
        description: 'Post-training decision classifier: use final trained weights to classify user-clicked points in real-time',
        props: {
            'w0': 'Bias weight (required)',
            'w1': 'Money feature weight (required)',
            'w2': 'Time feature weight (required)',
            'width': 'Optional: plot width in px (default: 560)',
            'height': 'Optional: plot height in px (default: 560)'
        }
    },

    'xor-problem': {
        component: () => import('../components/the-great-divide/XORProblem.vue'),
        description: 'Visual representation of the XOR problem: showing why a single-layer perceptron cannot solve it',
        props: {}
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
