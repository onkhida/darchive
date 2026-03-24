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

    return {
        renderInline,
        renderDisplay,
    }
}
