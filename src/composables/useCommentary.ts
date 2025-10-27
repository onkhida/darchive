import { ref } from 'vue'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface CommentaryPost {
    title: string
    date: string
    dateFormatted: string
    desc?: string
    slug: string
    birthday: boolean
    content?: string
    fileName: string
    footnotes?: { id: number; content: string }[]
}

// List of all markdown files in the commentary folder
const markdownFiles = [
    '2022-05-04-mahogany-pieces.md',
    '2023-02-14-centre-forward-play.md',
    '2023-02-15-mind-body-discrepancy.md',
    '2023-02-16-whats-inside.md',
    '2023-02-17-hot-wheels.md',
    '2023-02-17-one-too-many-zebras.md',
    '2023-03-07-the-promise-to-be-better.md',
    '2023-03-08-media-queries.md',
    '2023-03-08-on-belief.md',
    '2023-05-04-nineteen.md',
    '2023-05-08-beating-the-press.md',
    '2023-09-11-sense-of-agency.md',
    '2023-09-22-across-space-time.md',
    '2023-11-17-centre-stage.md',
    '2023-12-04-regarding-stacks.md'
]

const posts = ref<CommentaryPost[]>([])
const isLoading = ref(false)

export function useCommentary() {

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

    const isBirthdayPost = (dateStr: string | Date): boolean => {
        // Check if the date is May 4th (my birthday)
        const dateString = typeof dateStr === 'string' ? dateStr : dateStr.toISOString()
        return dateString.includes('-05-04') || dateString.includes('-5-4')
    }

    const loadMarkdownFile = async (fileName: string): Promise<string> => {
        try {
            const response = await fetch(`/commentary/${fileName}`)
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}: ${response.status}`)
            }
            const content = await response.text()
            return content
        } catch (error) {
            console.warn(`Could not load ${fileName}:`, error)
            // Return a fallback for files we don't have content for yet
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

    const parseMarkdownFile = (fileName: string, content: string): CommentaryPost => {
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
            title: frontmatter.title || 'Untitled',
            date: date,
            dateFormatted: formatDate(date),
            desc: frontmatter.desc,
            slug,
            birthday: isBirthdayPost(date),
            content: cleanContent.trim(),
            fileName,
            footnotes
        }
    }

    const loadAllPosts = async (): Promise<CommentaryPost[]> => {
        isLoading.value = true
        const loadedPosts: CommentaryPost[] = []

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

    const getPostBySlug = async (slug: string): Promise<CommentaryPost | null> => {
        // If posts aren't loaded yet, load them
        if (posts.value.length === 0) {
            await loadAllPosts()
        }

        return posts.value.find(post => post.slug === slug) || null
    }

    const renderMarkdown = (content: string): string => {
        let html = marked.parse(content) as string

        // Convert footnote references [^1], [^2], etc. to clickable superscript numbers
        // Use theme-appropriate colors instead of blue
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
