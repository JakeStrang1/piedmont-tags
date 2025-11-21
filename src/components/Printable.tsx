import React, { useEffect, useCallback } from 'react'

interface PrintableProps {
    key?: string
    PrintComponent: React.ReactNode
    widthPx: number
    show: boolean
    onPrintReady?: (printFn: () => void) => void
}

const Printable = ({ key, PrintComponent, widthPx, show, onPrintReady }: PrintableProps) => {
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
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
                crossorigin="anonymous"
            />
            <style type="text/css">html, body {height: ${0}px !important; width: ${widthPx}px !important; overflow: initial !important; -webkit-print-color-adjust: exact; margin-top: 0px; margin-left: 0px; margin-bottom: 0px; margin-right: 0px; } body {margin-top: 0px; margin-left: 0px; } body { display: 'block'; position: 'absolute'; top: 0; left: 0 !important; }</style>
            ${content.innerHTML}
        `

        iframeWindow.document.documentElement.innerHTML = iframeContent
        setTimeout(() => {
            iframeWindow.focus()
            iframeWindow.print()
        }, 1000) // Without a high enough delay the iframe didn't seem to have the proper css when printing (probably there's a better way)

    }, [previewId, iframeId, widthPx])

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