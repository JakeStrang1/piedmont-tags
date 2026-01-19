export const getStylesheets = (): string => {
    let stylesheets = ''
    try {
        // Copy all stylesheet links
        const styleLinks = document.querySelectorAll('link[rel="stylesheet"]')
        styleLinks.forEach((link) => {
            const href = (link as HTMLLinkElement).href
            if (href) {
                stylesheets += `<link rel="stylesheet" href="${href}">\n`
            }
        })

        // Copy any inline style tags (Vite might inject Tailwind this way in dev)
        const styleTags = document.querySelectorAll('style')
        styleTags.forEach((style) => {
            const content = style.textContent || style.innerHTML
            if (content) {
                stylesheets += `<style>${content}</style>\n`
            }
        })
    } catch (e) {
        console.warn('Could not access stylesheets from main document:', e)
    }
    return stylesheets
}
