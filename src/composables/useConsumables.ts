import { ref } from 'vue'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface ConsumablePost {
    slug: string
    title: string
    author: string
    year: string
    date: string
    dateFormatted: string
    content: string
    desc?: string
    authorImage?: string
    tags?: string[]
    fileName: string
    footnotes?: { id: number; content: string }[]
}

// List of all markdown files in the consumables folder
const markdownFiles = [
    '2026-01-31 lives-of-great-men.md',
    '2026-03-31 development-as-modernity.md'
]

const posts = ref<ConsumablePost[]>([])
const isLoading = ref(false)

export function useConsumables() {
    const generateSlug = (fileName: string): string => {
        // Remove the date prefix and .md extension, then create slug
        return fileName.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace(/\.md$/, '').toLowerCase().replace(/\s+/g, '-')
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

    const loadMarkdownFile = async (fileName: string): Promise<string> => {
        try {
            const response = await fetch(`/consumables/${fileName}`)
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}: ${response.status}`)
            }
            const content = await response.text()
            return content
        } catch (error) {
            console.warn(`Could not load ${fileName}:`, error)
            // Return a fallback for files we don't have content for yet
            return `---
title: ${fileName.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace(/\.md$/, '').split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
author: Unknown
year: Unknown
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

                    // Remove footnote definition from main content
                    cleanContent = cleanContent.replace(match[0], '')
                }
            }
        }

        // Sort footnotes by id for proper ordering
        footnotes.sort((a, b) => a.id - b.id)

        // Clean up extra line breaks
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim()

        return { content: cleanContent, footnotes }
    }

    const parseMarkdownFile = (fileName: string, content: string): ConsumablePost => {
        const { data: frontmatter, content: markdownContent } = matter(content)

        // Parse footnotes from the markdown content
        const { content: cleanContent, footnotes } = parseFootnotes(markdownContent)

        const slug = generateSlug(fileName)
        // Ensure date is always a string
        let date = frontmatter.date || fileName.substring(0, 10)
        if (typeof date !== 'string') {
            date = date instanceof Date ? date.toISOString().split('T')[0] : String(date)
        }

        return {
            slug,
            title: frontmatter.title || 'Untitled',
            author: frontmatter.author || 'Unknown',
            year: frontmatter.year || '',
            date: date,
            dateFormatted: formatDate(date),
            content: cleanContent.trim(),
            desc: frontmatter.desc || frontmatter.description,
            authorImage: frontmatter.authorImage || frontmatter.image,
            tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(',').map((tag: string) => tag.trim())) : [],
            fileName,
            footnotes
        }
    }

    const loadAllPosts = async (): Promise<ConsumablePost[]> => {
        isLoading.value = true
        const loadedPosts: ConsumablePost[] = []

        for (const fileName of markdownFiles) {
            try {
                const content = await loadMarkdownFile(fileName)

                // Only parse if we got real content (not fallback)
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

    const getPostBySlug = async (slug: string): Promise<ConsumablePost | null> => {
        // If posts aren't loaded yet, load them
        if (posts.value.length === 0) {
            await loadAllPosts()
        }

        return posts.value.find(post => post.slug === slug) || null
    }

    const refCounts: { [key: string]: number } = {}

    const renderMarkdown = (content: string): string => {
        let html = marked.parse(content) as string

        // Convert footnote references [^1], [^2], etc. to clickable superscript numbers
        html = html.replace(/\[\^(\d+)\]/g, (_m, id) => {
            const count = (refCounts[id] = (refCounts[id] || 0) + 1)
            return `<sup><a href="#footnote-${id}" id="fnref-${id}-${count}" class="footnote-ref cursor-pointer transition-colors hover:opacity-80" data-footnote="${id}" data-footnote-ref="${count}">[${id}]</a></sup>`
        })

        // Style images to take full width of container with auto height
        html = html.replace(/<img([^>]*?)>/g, '<img$1 class="w-full h-auto my-6">')

        // Style image captions (em tags that follow images) - wrap in figure element
        html = html.replace(/(<img[^>]*>)\s*<p><em>(.*?)<\/em><\/p>/g, '<figure class="my-8">$1<figcaption class="text-center text-sm italic mt-3 opacity-70">$2</figcaption></figure>')

        // Style links to match text color instead of being greyed out
        html = html.replace(/<a([^>]*?)>/g, '<a$1 class="underline hover:no-underline transition-all">')

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
