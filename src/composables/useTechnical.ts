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
    '2022-05-04-understanding-cascade-theory.md',
    '2023-02-14-semanticity.md',
    '2023-02-14-semanticity-interactive.md'
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
            month: 'long',
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
        let html = marked.parse(content) as string

        // Convert footnote references to clickable superscript numbers
        html = html.replace(/\[\^(\d+)\]/g, '<sup class="footnote-ref cursor-pointer transition-colors hover:opacity-80" data-footnote="$1">$1</sup>')

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
        // Convert custom component tags to Vue component placeholders
        html = html.replace(/<([a-z][a-z0-9]*(?:-[a-z0-9]*)*)((?:\s+[^>]*)?)\s*\/?>/gi, (match, tagName, attrs) => {
            const lowerTagName = tagName.toLowerCase()

            // Only process if it's a valid component in our registry
            if (isValidComponent(lowerTagName)) {
                // Clean up attributes and make them Vue-compatible
                const cleanAttrs = attrs
                    .replace(/\s+/g, ' ')
                    .trim()
                    // Convert any camelCase attributes to kebab-case for Vue
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .toLowerCase()

                return `<component is="${lowerTagName}" ${cleanAttrs} class="interactive-component" />`
            }

            // Return original match if not a registered component
            return match
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
