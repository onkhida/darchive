# Assets Structure for DArchive

## Simple Image Organization

```
public/assets/images/
├── commentary/      # Images for commentary posts (album covers, photos, etc.)
└── technical/       # Images for technical posts (screenshots, diagrams, code)
```

## Usage in Markdown

### Basic Image
```markdown
![Alt text](/assets/images/commentary/filename.jpg)
![Alt text](/assets/images/technical/filename.jpg)
```

### Image with Caption
```markdown
![Alt text](/assets/images/commentary/filename.jpg)
_This is the image caption in italics_
```

## Examples

### Commentary Posts
- Album covers: `/assets/images/commentary/boniver-lp-2.png`
- Personal photos: `/assets/images/commentary/birthday-2023.jpg`
- Book covers: `/assets/images/commentary/book-cover.jpg`

### Technical Posts  
- Code screenshots: `/assets/images/technical/vscode-setup.png`
- Architecture diagrams: `/assets/images/technical/system-design.svg`
- UI mockups: `/assets/images/technical/app-wireframe.png`

## Styling Applied

- **Responsive**: Images automatically scale on mobile
- **Centered**: Images are centered in the content
- **Rounded corners**: Modern aesthetic with rounded edges
- **Shadow**: Subtle shadow for depth
- **Max width**: Constrained to `max-w-2xl` for readability
- **Caption styling**: Italicized, centered, smaller text

## File Naming Convention

- Use lowercase
- Use hyphens instead of spaces
- Include descriptive names
- Examples:
  - `boniver-lp-cover.png`
  - `chess-tournament-2023.jpg`
  - `react-component-diagram.svg`

## Supported Formats

- `.jpg/.jpeg` - Best for photos
- `.png` - Best for graphics with transparency
- `.webp` - Modern format, smaller file sizes
- `.svg` - Vector graphics (scalable)
