import React, { useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { usePrintSettings, type PrintSettings } from '../hooks/usePrintSettings'

interface PrintData {
    PrintTagContent: React.ComponentType<{ cards: Array<{ id: number; tagNumber: string; tagText: string }>; settings: PrintSettings }>
    cards: Array<{ id: number; tagNumber: string; tagText: string }>
}

interface PrintableProps {
    key?: string
    PrintComponent: React.ReactNode
    widthPx: number
    show: boolean
    onPrintReady?: (printFn: () => void) => void
    printData?: PrintData // Data needed for React rendering in iframe
}

const Printable = ({ key, PrintComponent, widthPx, show, onPrintReady, printData }: PrintableProps) => {
    const { settings } = usePrintSettings()
    const keyValue = key ?? 'default'
    const previewId = `preview-${keyValue}`
    const iframeId = `ifmcontentstoprint-${keyValue}`
    const iframeRootRef = useRef<ReactDOM.Root | null>(null)
    const previewRootRef = useRef<ReactDOM.Root | null>(null)
    const prevDataRef = useRef<{ cards: Array<{ id: number; tagNumber: string; tagText: string }>; settings: PrintSettings } | null>(null)

    const print = useCallback(() => {
        const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null
        if (!iframe) return

        const iframeWindow = iframe.contentWindow
        const iframeDoc = iframe.contentDocument
        if (!iframeWindow || !iframeDoc) return

        // Get all stylesheets from the main document to include Tailwind CSS
        let stylesheets = ''
        try {
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

        // Set up iframe document structure
        iframeDoc.open()
        iframeDoc.write(`
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
                <div id="print-root"></div>
            </body>
            </html>
        `)
        iframeDoc.close()

        // Render React component into iframe
        if (printData && printData.PrintTagContent && printData.cards) {
            const rootElement = iframeDoc.getElementById('print-root')
            if (rootElement) {
                // Clean up previous root if it exists
                if (iframeRootRef.current) {
                    iframeRootRef.current.unmount()
                }

                // Create new React root and render
                const root = ReactDOM.createRoot(rootElement)
                iframeRootRef.current = root

                const PrintTagContent = printData.PrintTagContent
                root.render(
                    React.createElement(PrintTagContent, {
                        cards: printData.cards,
                        settings: settings,
                    })
                )

                // Wait for React to render, then print
                setTimeout(() => {
                    iframeWindow.focus()
                    iframeWindow.print()
                }, 1500) // Give React time to render
            }
        } else {
            // Fallback to HTML copy method if React rendering data not available
            const content = document.getElementById(previewId)
            if (content) {
                const rootElement = iframeDoc.getElementById('print-root')
                if (rootElement) {
                    rootElement.innerHTML = content.innerHTML
                }
            }
            setTimeout(() => {
                iframeWindow.focus()
                iframeWindow.print()
            }, 1000)
        }

    }, [previewId, iframeId, widthPx, settings, printData])

    // Render preview using the same component that will be printed
    useEffect(() => {
        if (!show) {
            // Clean up when preview is hidden
            if (previewRootRef.current) {
                previewRootRef.current.unmount()
                previewRootRef.current = null
            }
            prevDataRef.current = null
            return
        }

        const previewElement = document.getElementById(previewId)
        if (!previewElement) return

        if (printData && printData.PrintTagContent && printData.cards) {
            // Check if data actually changed
            const currentData = { cards: printData.cards, settings }
            const prevData = prevDataRef.current
            const dataChanged = !prevData ||
                prevData.cards.length !== currentData.cards.length ||
                prevData.settings.labelWidthInches !== currentData.settings.labelWidthInches ||
                prevData.settings.labelHeightInches !== currentData.settings.labelHeightInches ||
                prevData.cards.some((card, i) =>
                    !currentData.cards[i] ||
                    card.id !== currentData.cards[i].id ||
                    card.tagNumber !== currentData.cards[i].tagNumber ||
                    card.tagText !== currentData.cards[i].tagText
                )

            // Only create new root if we don't have one
            if (!previewRootRef.current) {
                // Create a React root for the preview
                const previewRoot = ReactDOM.createRoot(previewElement)
                previewRootRef.current = previewRoot
            }

            // Only update if data changed
            if (dataChanged) {
                const PrintTagContent = printData.PrintTagContent

                // Update the rendered content (React 18 root.render can be called multiple times)
                if (previewRootRef.current) {
                    previewRootRef.current.render(
                        React.createElement(PrintTagContent, {
                            cards: printData.cards,
                            settings: settings,
                        })
                    )
                }

                prevDataRef.current = currentData
            }

            // Cleanup on unmount
            return () => {
                if (previewRootRef.current) {
                    previewRootRef.current.unmount()
                    previewRootRef.current = null
                }
                prevDataRef.current = null
            }
        } else if (PrintComponent) {
            // Fallback to original PrintComponent if React rendering not available
            if (previewRootRef.current) {
                previewRootRef.current.unmount()
            }
            const fallbackRoot = ReactDOM.createRoot(previewElement)
            previewRootRef.current = fallbackRoot
            fallbackRoot.render(PrintComponent as React.ReactElement)
        }
    }, [previewId, show, printData, settings, PrintComponent])

    useEffect(() => {
        onPrintReady?.(print)
    }, [onPrintReady, print])

    return (
        <>
            <iframe id={iframeId} style={{ height: "0px", width: "0px", position: "absolute" }}></iframe>
            <div
                id={previewId}
                className="toPrint z-[9999]"
                style={{
                    backgroundColor: "green",
                    width: `${widthPx}px`,
                    position: "absolute",
                    top: 0,
                    left: `${show ? "0px" : "-3000px"}`
                }}
            />
        </>
    )
}

export default Printable