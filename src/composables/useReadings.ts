import { ref } from 'vue'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface ReadingPost {
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

// List of all markdown files in the readings folder
const markdownFiles = [
    '2022-05-04 swing-time.md',
    '2023-12-04 notes-from-the-end-of-everything.md'
]

const posts = ref<ReadingPost[]>([])
const isLoading = ref(false)

export function useReadings() {
    const generateSlug = (fileName: string): string => {
        // Remove the date prefix and .md extension, then create slug
        return fileName.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace(/\.md$/, '').toLowerCase().replace(/\s+/g, '-')
    }

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const loadMarkdownFile = async (fileName: string): Promise<string> => {
        try {
            const response = await fetch(`/readings/${fileName}`)
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

    const parseMarkdownFile = (fileName: string, content: string): ReadingPost => {
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

    const loadAllPosts = async (): Promise<ReadingPost[]> => {
        isLoading.value = true
        const loadedPosts: ReadingPost[] = []

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

        // Sort by date (latest to earliest)
        loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        posts.value = loadedPosts
        isLoading.value = false
        return loadedPosts
    }

    const getPostBySlug = async (slug: string): Promise<ReadingPost | null> => {
        // If posts aren't loaded yet, load them
        if (posts.value.length === 0) {
            await loadAllPosts()
        }

        return posts.value.find(post => post.slug === slug) || null
    }

    const renderMarkdown = (content: string): string => {
        let html = marked.parse(content) as string

        // Convert footnote references [^1], [^2], etc. to clickable superscript numbers
        html = html.replace(/\[\^(\d+)\]/g, '<sup class="footnote-ref cursor-pointer transition-colors hover:opacity-80" data-footnote="$1">$1</sup>')

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
