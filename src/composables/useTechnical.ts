import { ref } from 'vue'
import matter from 'gray-matter'
import { marked } from 'marked'
import { isValidComponent } from './useComponentRegistry'

export interface TechnicalPost {
    title: string
    date: string
    dateFormatted: string
    desc?: string
    slug: string
    content?: string
    fileName: string
    coverImage?: string
    footnotes?: { id: number; content: string }[]
    components?: string[] // List of components used in this post
    hasInteractiveComponents?: boolean
}

// List of all markdown files in the technical folder
const markdownFiles = [
    // '2022-05-04-understanding-cascade-theory.md',
    '2026-03-12-the-great-divide.md',
]

const posts = ref<TechnicalPost[]>([])
const isLoading = ref(false)

export function useTechnical() {

    const generateSlug = (fileName: string): string => {
        // Remove the date prefix and .md extension, then create slug
        return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').toLowerCase()
    }

    const formatDate = (dateStr: string): string => {
        // Safari-safe date parsing: ensure proper format before creating Date object
        let normalizedDate = dateStr

        // Convert formats like "2023-2-14" to "2023-02-14" for Safari compatibility
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
            const parts = dateStr.split('-')
            if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                const year = parts[0]
                const month = parts[1].padStart(2, '0')
                const day = parts[2].padStart(2, '0')
                normalizedDate = `${year}-${month}-${day}`
            }
        }

        const date = new Date(normalizedDate)

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date format: ${dateStr}, using fallback`)
            return dateStr // Return original string as fallback
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getImagePath = (fileName: string): string => {
        // Map filename to image - you can customize this logic
        const slug = generateSlug(fileName)
        const imageMap: Record<string, string> = {
            'understanding-cascade-theory': '/assets/images/technical/understandingcascadetheory.png',
            'semanticity': '/assets/images/technical/searchingsemantics.png'
        }
        return imageMap[slug] || ''
    }

    const loadMarkdownFile = async (fileName: string): Promise<string> => {
        try {
            const response = await fetch(`/technical/${fileName}`)
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}: ${response.status}`)
            }
            const content = await response.text()
            return content
        } catch (error) {
            console.warn(`Could not load ${fileName}:`, error)
            return `---
title: ${fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
date: ${fileName.substring(0, 10)}
desc: Coming soon...
---

Content coming soon...`
        }
    }

    const parseFootnotes = (content: string): { content: string; footnotes: { id: number; content: string }[] } => {
        const footnotes: { id: number; content: string }[] = []

        // Extract footnote definitions [^1]: content, [^2]: content, etc.
        const footnoteRegex = /^\[\^(\d+)\]:\s*(.+)$/gm
        let match
        let cleanContent = content

        while ((match = footnoteRegex.exec(content)) !== null) {
            const idStr = match[1]
            const footnoteContent = match[2]
            if (idStr && footnoteContent) {
                const id = parseInt(idStr, 10)
                if (!isNaN(id)) {
                    footnotes.push({ id, content: footnoteContent })
                    cleanContent = cleanContent.replace(match[0], '')
                }
            }
        }

        footnotes.sort((a, b) => a.id - b.id)
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim()

        return { content: cleanContent, footnotes }
    }

    const parseMarkdownFile = (fileName: string, content: string): TechnicalPost => {
        const { data: frontmatter, content: markdownContent } = matter(content)
        const { content: cleanContent, footnotes } = parseFootnotes(markdownContent)

        const slug = generateSlug(fileName)
        let date = frontmatter.date || fileName.substring(0, 10)
        if (typeof date !== 'string') {
            date = date instanceof Date ? date.toISOString().split('T')[0] : String(date)
        }

        // Extract components used in the content
        const componentMatches = cleanContent.match(/<([a-z][a-z0-9]*(?:-[a-z0-9]*)*)/g) || []
        const usedComponents = [...new Set(
            componentMatches
                .map(match => match.substring(1)) // Remove the '<'
                .filter(tagName => isValidComponent(tagName))
        )]

        return {
            title: frontmatter.title || 'Untitled',
            date: date,
            dateFormatted: formatDate(date),
            desc: frontmatter.desc,
            slug,
            content: cleanContent.trim(),
            fileName,
            coverImage: frontmatter.coverImage || getImagePath(fileName),
            footnotes,
            components: frontmatter.components || usedComponents,
            hasInteractiveComponents: usedComponents.length > 0
        }
    }

    const loadAllPosts = async (): Promise<TechnicalPost[]> => {
        isLoading.value = true
        const loadedPosts: TechnicalPost[] = []

        for (const fileName of markdownFiles) {
            try {
                const content = await loadMarkdownFile(fileName)
                if (content.includes('Content coming soon...')) {
                    continue
                }

                const post = parseMarkdownFile(fileName, content)
                loadedPosts.push(post)
            } catch (error) {
                console.error(`Error loading ${fileName}:`, error)
            }
        }

        // Sort by date (latest to earliest) - normalize dates for Safari compatibility
        loadedPosts.sort((a, b) => {
            const normalizeDate = (dateStr: string): string => {
                if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                    const parts = dateStr.split('-')
                    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                        const year = parts[0]
                        const month = parts[1].padStart(2, '0')
                        const day = parts[2].padStart(2, '0')
                        return `${year}-${month}-${day}`
                    }
                }
                return dateStr
            }

            const dateA = new Date(normalizeDate(a.date))
            const dateB = new Date(normalizeDate(b.date))

            // Handle invalid dates by falling back to string comparison
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                return b.date.localeCompare(a.date)
            }

            return dateB.getTime() - dateA.getTime()
        })

        posts.value = loadedPosts
        isLoading.value = false
        return loadedPosts
    }

    const getPostBySlug = async (slug: string): Promise<TechnicalPost | null> => {
        if (posts.value.length === 0) {
            await loadAllPosts()
        }
        return posts.value.find(post => post.slug === slug) || null
    }

    const renderMarkdown = (content: string): string => {
        // Protect LaTeX math (display and inline) so marked doesn't mangle it.
        const mathPlaceholders: Record<string, string> = {}
        let mathCounter = 0

        // Replace display math $$...$$ first
        content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
            const key = `MATH_BLOCK_${mathCounter++}`
            mathPlaceholders[key] = `$$${expr}$$`
            return `<span data-math-key="${key}"></span>`
        })

        // Replace inline math $...$ (avoid matching already replaced $$ blocks)
        // This regex is conservative: it avoids matching across newlines.
        content = content.replace(/(^|[^\\$])\$([^\n\$]+?)\$/g, (_m, prefix, expr) => {
            const key = `MATH_INLINE_${mathCounter++}`
            mathPlaceholders[key] = `$${expr}$`
            return prefix + `<span data-math-key="${key}"></span>`
        })

        let html = marked.parse(content) as string

        // Restore math placeholders into the generated HTML exactly as originally written
        Object.keys(mathPlaceholders).forEach((key) => {
            const placeholder = `<span data-math-key="${key}"></span>`
            html = html.split(placeholder).join(mathPlaceholders[key])
        })

        // Convert footnote references to anchors with stable ids and occurrence counts
        const refCounts: Record<string, number> = {}
        html = html.replace(/\[\^(\d+)\]/g, (_m, id) => {
            const count = (refCounts[id] = (refCounts[id] || 0) + 1)
            return `<sup><a href="#footnote-${id}" id="fnref-${id}-${count}" class="footnote-ref cursor-pointer transition-colors hover:opacity-80" data-footnote="${id}" data-footnote-ref="${count}">[${id}]</a></sup>`
        })

        // Style images to take full width with sharp corners
        html = html.replace(/<img([^>]*?)>/g, '<img$1 class="w-full h-auto my-6">')

        // Style image captions
        html = html.replace(/(<img[^>]*>)\s*<p><em>(.*?)<\/em><\/p>/g, '<figure class="my-8">$1<figcaption class="text-center text-sm italic mt-3 opacity-70">$2</figcaption></figure>')

        // Style links
        html = html.replace(/<a([^>]*?)>/g, '<a$1 class="underline hover:no-underline transition-all">')

        // Parse interactive components (custom tags)
        html = parseInteractiveComponents(html)

        return html
    }

    const parseInteractiveComponents = (html: string): string => {
        // Replace custom component tags with safe placeholder DIVs that include the component name and props JSON (URL-encoded)
        // Example replacement: <vector-playground initial-a="100,-40" />
        // -> <div class="interactive-component" data-component="vector-playground" data-props="%7B%22initialA%22%3A%22100,-40%22%7D"></div>

        const attrRegex = /([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g

        html = html.replace(/<([a-z][a-z0-9]*(?:-[a-z0-9]*)*)((?:\s+[^>]*)?)\s*\/?>>/gi, (match, tagName, attrs) => {
            const lowerTagName = tagName.toLowerCase()

            if (!isValidComponent(lowerTagName)) return match

            const props: Record<string, any> = {}

            if (attrs && attrs.trim()) {
                let m: RegExpExecArray | null
                while ((m = attrRegex.exec(attrs)) !== null) {
                    if (!m[1]) continue
                    const name = m[1]
                    const value = m[2] ?? m[3] ?? m[4] ?? 'true'
                    // convert attribute name to camelCase-ish prop keys (keep simple)
                    const propName = name.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())
                    props[propName] = value
                }
            }

            const propsJson = encodeURIComponent(JSON.stringify(props))

            return `<div class="interactive-component" data-component="${lowerTagName}" data-props="${propsJson}"></div>`
        })

        return html
    }

    return {
        posts,
        isLoading,
        loadAllPosts,
        getPostBySlug,
        renderMarkdown
    }
}
