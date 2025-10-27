import { ref } from 'vue'

export interface TechnicalMDXPost {
    title: string
    date: string
    dateFormatted: string
    desc?: string
    slug: string
    fileName: string
    coverImage?: string
    component?: any // The MDX component
    footnotes?: { id: number; content: string }[]
}// List of all MDX files in the technical folder
const mdxFiles = [
    '2023-02-14-semanticity-interactive.mdx'
]

const posts = ref<TechnicalMDXPost[]>([])
const isLoading = ref(false)

export function useTechnicalMDX() {

    const generateSlug = (fileName: string): string => {
        // Remove the date prefix and .mdx extension, then create slug
        return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx$/, '').toLowerCase()
    }

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr)
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
            'semanticity-interactive': '/assets/images/technical/searchingsemantics.png'
        }
        return imageMap[slug] || ''
    }

    const loadMDXFile = async (fileName: string): Promise<{ frontmatter: any; component: any } | null> => {
        try {
            // Use specific import paths for known files to avoid dynamic import issues
            let mdxModule: any

            switch (fileName) {
                case '2023-02-14-semanticity-interactive.mdx':
                    mdxModule = await import('../content/technical/2023-02-14-semanticity-interactive.mdx')
                    break
                default:
                    console.warn(`Unknown MDX file: ${fileName}`)
                    return null
            }

            // MDX files export a default component and frontmatter
            return {
                frontmatter: mdxModule.frontmatter || {},
                component: mdxModule.default
            }
        } catch (error) {
            console.warn(`Could not load MDX file ${fileName}:`, error)
            return null
        }
    }

    const parseMDXFile = (fileName: string, frontmatter: any, component: any): TechnicalMDXPost => {
        const slug = generateSlug(fileName)
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
            fileName,
            coverImage: frontmatter.coverImage || getImagePath(fileName),
            component,
            footnotes: frontmatter.footnotes || []
        }
    }

    const loadAllPosts = async (): Promise<TechnicalMDXPost[]> => {
        isLoading.value = true
        const loadedPosts: TechnicalMDXPost[] = []

        for (const fileName of mdxFiles) {
            try {
                const mdxData = await loadMDXFile(fileName)
                if (!mdxData) continue

                const post = parseMDXFile(fileName, mdxData.frontmatter, mdxData.component)
                loadedPosts.push(post)
            } catch (error) {
                console.error(`Error loading MDX file ${fileName}:`, error)
            }
        }

        // Sort by date (latest to earliest)
        loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        posts.value = loadedPosts
        isLoading.value = false
        return loadedPosts
    }

    const getAllPosts = async (): Promise<TechnicalMDXPost[]> => {
        return await loadAllPosts()
    }

    const getPostBySlug = async (slug: string): Promise<TechnicalMDXPost | null> => {
        if (posts.value.length === 0) {
            await loadAllPosts()
        }
        return posts.value.find(post => post.slug === slug) || null
    }

    return {
        posts,
        isLoading,
        getAllPosts,
        loadAllPosts,
        getPostBySlug
    }
}
