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

        const iframeContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                    integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
                    crossorigin="anonymous"
                />
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
                        
                        /* Each tag wrapper should be one label */
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
                        
                        /* Tag container - configurable dimensions */
                        .print-tag-container {
                            width: ${settings.labelWidthInches}in !important;
                            height: ${settings.labelHeightInches}in !important;
                            aspect-ratio: ${settings.labelWidthInches}/${settings.labelHeightInches} !important;
                            padding: ${settings.paddingInches}in !important;
                            border: ${settings.borderWidthPoints}pt solid black !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            background: white !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        
                        /* Input/text styling for print */
                        .print-tag-container input {
                            font-size: ${settings.fontSizeInches}in !important;
                            line-height: ${settings.lineHeight} !important;
                            padding: ${settings.textPaddingVerticalInches}in ${settings.textPaddingHorizontalInches}in !important;
                            margin: 0 !important;
                            border: none !important;
                            background: transparent !important;
                            text-align: center !important;
                            width: 100% !important;
                            font-weight: 600 !important;
                            color: black !important;
                        }
                        
                        /* Remove br tags spacing in print */
                        .print-tag-container br {
                            display: none !important;
                        }
                        
                        /* Flex container for tag content */
                        .print-tag-container > div {
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                            gap: ${settings.textGapInches}in !important;
                            width: 100% !important;
                            height: 100% !important;
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