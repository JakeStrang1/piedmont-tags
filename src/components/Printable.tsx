import React, { useEffect, useCallback } from 'react'
import { usePrintSettings } from '../hooks/usePrintSettings'

interface PrintableProps {
    key?: string
    PrintComponent: React.ReactNode
    widthPx: number
    show: boolean
    onPrintReady?: (printFn: () => void) => void
}

const Printable = ({ key, PrintComponent, widthPx, show, onPrintReady }: PrintableProps) => {
    const { settings } = usePrintSettings()
    const keyValue = key ?? 'default'
    const previewId = `preview-${keyValue}`
    const iframeId = `ifmcontentstoprint-${keyValue}`

    const print = useCallback(() => {
        const content = document.getElementById(previewId)
        const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null
        if (!iframe || !content) return

        const iframeWindow = iframe.contentWindow
        if (!iframeWindow) return

        // Get all stylesheets from the main document to include Tailwind CSS
        let stylesheets = ''
        try {
            // Try to get the compiled CSS file
            const styleLinks = document.querySelectorAll('link[rel="stylesheet"]')
            styleLinks.forEach((link) => {
                const href = (link as HTMLLinkElement).href
                if (href && !href.includes('bootstrap')) {
                    stylesheets += `<link rel="stylesheet" href="${href}">\n`
                }
            })
        } catch (e) {
            console.warn('Could not access stylesheets:', e)
        }

        const iframeContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                ${stylesheets}
                <style type="text/css">
                    /* Screen styles */
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: ${widthPx}px;
                        height: auto;
                        overflow: initial;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    body {
                        display: block;
                        position: relative;
                    }
                    
                    /* Print styles - configurable label dimensions */
                    @page {
                        size: ${settings.labelWidthInches}in ${settings.labelHeightInches}in;
                        margin: 0;
                    }
                    
                    @media print {
                        * {
                            box-sizing: border-box;
                        }
                        
                        html, body {
                            width: ${settings.labelWidthInches}in !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        
                        body {
                            display: block !important;
                            position: relative !important;
                        }
                        
                        /* Each tag wrapper should be one label - set physical dimensions */
                        .print-tag-wrapper {
                            width: ${settings.labelWidthInches}in !important;
                            height: ${settings.labelHeightInches}in !important;
                            display: block !important;
                            page-break-after: always;
                            page-break-inside: avoid;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: hidden !important;
                        }
                        
                        /* Hide spacer divs in print */
                        .print-spacer {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                        }
                        
                        /* Tag container - set physical dimensions, preserve all other styles from screen */
                        .print-tag-container {
                            width: ${settings.labelWidthInches}in !important;
                            height: ${settings.labelHeightInches}in !important;
                            aspect-ratio: ${settings.labelWidthInches}/${settings.labelHeightInches} !important;
                            /* All other styles (padding, border, font, etc.) come from the on-screen classes */
                            margin: 0 !important;
                            box-shadow: none !important;
                            /* Preserve flex layout */
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow: visible !important;
                            position: relative !important;
                        }
                        
                        /* Make the EditableTag inside scale to fit the container */
                        /* The EditableTag has fixed pixel dimensions, but we need it to fit the print container */
                        .print-tag-container > div {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            box-sizing: border-box !important;
                            /* Override any fixed pixel dimensions from inline styles */
                            min-width: 0 !important;
                            min-height: 0 !important;
                        }
                        
                        /* Override inline style attributes for print */
                        .print-tag-container > div[style*="width"] {
                            width: 100% !important;
                        }
                        .print-tag-container > div[style*="height"] {
                            height: 100% !important;
                        }
                        
                        /* Ensure all child elements also scale */
                        .print-tag-container > div > * {
                            max-width: 100% !important;
                            max-height: 100% !important;
                        }
                        
                        /* Remove br tags spacing in print */
                        .print-tag-container br {
                            display: none !important;
                        }
                        
                        /* Ensure inputs maintain their on-screen styling, just remove interactive states */
                        .print-tag-container input {
                            /* Font size, line height, padding all come from on-screen classes */
                            margin: 0 !important;
                            border: none !important;
                            background: transparent !important;
                            /* Preserve text alignment and styling */
                            text-align: center !important;
                            width: 100% !important;
                            /* Remove hover/focus states for print */
                            transition: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `

        iframeWindow.document.documentElement.innerHTML = iframeContent
        setTimeout(() => {
            iframeWindow.focus()
            iframeWindow.print()
        }, 1000) // Without a high enough delay the iframe didn't seem to have the proper css when printing (probably there's a better way)

    }, [previewId, iframeId, widthPx, settings])

    useEffect(() => {
        onPrintReady?.(print)
    }, [onPrintReady, print])

    return (
        <>
            <iframe id={iframeId} style={{ height: "0px", width: "0px", position: "absolute" }}></iframe>
            <div id={previewId} className="toPrint" style={{ backgroundColor: "green", width: `${widthPx}px`, position: "absolute", top: 0, left: `${show ? "0px" : "-3000px"}` }}>
                {PrintComponent}
            </div>
        </>
    )
}

export default Printable