import { nextTick } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export function useKaTeX() {
    /**
     * Render inline LaTeX math
     * Usage: useKaTeX().renderInline('x^2 + y^2 = z^2')
     */
    const renderInline = (mathString: string): string => {
        try {
            return katex.renderToString(mathString, {
                displayMode: false,
                throwOnError: false,
            })
        } catch (error) {
            console.error('KaTeX render error:', error)
            return mathString // Fallback to original string
        }
    }

    /**
     * Render display (block) LaTeX math
     * Usage: useKaTeX().renderDisplay('x^2 + y^2 = z^2')
     */
    const renderDisplay = (mathString: string): string => {
        try {
            return katex.renderToString(mathString, {
                displayMode: true,
                throwOnError: false,
            })
        } catch (error) {
            console.error('KaTeX render error:', error)
            return mathString
        }
    }

    /**
     * Auto-render KaTeX in the DOM after content injection
     * Call this after markdown content is rendered via v-html
     * Handles CDN script loading with retries
     */
    const renderDOM = async () => {
        await nextTick()

        const renderWhenReady = (attempts = 0) => {
            // @ts-ignore
            if (window && (window as any).renderMathInElement) {
                // @ts-ignore
                (window as any).renderMathInElement(document.body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                })
            } else if (attempts < 20) {
                setTimeout(() => renderWhenReady(attempts + 1), 100)
            }
        }

        renderWhenReady()
    }

    return {
        renderInline,
        renderDisplay,
        renderDOM,
    }
}
