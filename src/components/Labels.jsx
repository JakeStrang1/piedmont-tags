import { useEffect } from 'react';
import { PDFDocument } from 'pdf-lib'
import generatePDF, { Resolution } from 'react-to-pdf';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Barcode from 'react-barcode';
import QRCode from "react-qr-code";
import { sleep, address, lastNameCommaFirstName, isOverseas, getOriginalLocation } from './helpers.js'

function BoxLabels({ orders, locations, settings, openPdf, setOpenPdf, progress, setProgress }) {

  // Allow optional passing in of progress state, otherwise set to no-op
  [progress, setProgress] = progress !== null && setProgress ? [progress, setProgress] : [0, () => { }]

  useEffect(() => {
    if (orders && openPdf) {
      const startTime = new Date()
      setProgress(0)

      const options = {
        method: 'build',
        resolution: Resolution.HIGH,
        page: {
          format: [101.6, 152.4],
          orientation: 'portrait'
        }
      }
      const labelPromises = []
      const parentElement = document.getElementById("box-labels-pdf")
      const labelElements = Array.from(parentElement.getElementsByClassName("label"))
      const elementsCopy = [...labelElements]

      // Assume each label will take 3 seconds
      var progressInterval = window.setInterval(function () {
        const millisElapsed = (new Date()).getTime() - startTime.getTime()
        const percentComplete = 100 * millisElapsed / (3000 * labelElements.length)
        setProgress(percentComplete <= 90 ? percentComplete : 90)
      }, 500);

      const labelGenerator = (promises, elements) => {
        if (elements.length === 0) {
          // All elements removed means all promises have been initialized.
          // This only runs at the end.
          Promise.all(promises)
            .then(async pdfs => {
              clearInterval(progressInterval)
              setProgress(100)

              const pdfDoc = await PDFDocument.create()
              for (let i = 0; i < pdfs.length; i++) {
                const existingPdfBytes = pdfs[i].output('arraybuffer')
                const preloadedReceiptDoc = await PDFDocument.load(existingPdfBytes)
                const pages = await pdfDoc.copyPages(preloadedReceiptDoc, [0])
                const preLoadedPage = pages[0]
                pdfDoc.addPage(preLoadedPage)
              }
              const pdfBytes = await pdfDoc.save()
              const file = new Blob([pdfBytes], { type: 'application/pdf' });
              var fileURL = URL.createObjectURL(file);

              await sleep(500) // Wait so the progress bar has a chance to go to 100 before opening

              window.open(fileURL);
            })
            .then(() => setOpenPdf(false))
          return
        }

        // This runs once per label:

        // generatePDF _can_ generate all the labels in one call, but there's a bug that causes it to stop working
        // after a certain memory size, so I rewrote it to do one page at a time, though its slower now.
        // https://github.com/ivmarcos/react-to-pdf/issues/83
        const promise = generatePDF(() => elements.shift(), options)
        promises.push(promise)
        setTimeout(() => labelGenerator(promises, elements), 0) // Keep calling until elements is empty
      }

      // Using recursive setTimeout pattern to avoid blocking the thread too much since this is a long-running operation
      setTimeout(() => labelGenerator(labelPromises, elementsCopy), 0)
    }
  }, [openPdf])

  function masterFontSize(master) {
    if (master.length <= 7) {
      return 100
    }
    return 70
  }

  function labelStatus(order) {
    if (order.hold_for_pick_up) {
      return "HOLD FOR PU"
    }
    if (isOverseas(order)) {
      return "OVERSEAS"
    }
    if (order.ship_only) {
      return "SHIP ONLY"
    }
    return ""
  }

  function qrCodeValue(order, boxNum, locationCode) {
    // e.g. M045473,ST JEAN,DAVE,QCL,HOLD FOR PICK UP,1 OF 2
    return (`${order.master},${address(order).last_name},${address(order).first_name},${locationCode},${labelStatus(order)},${boxNum} of ${order.total_boxes}`).toUpperCase()
  }

  function orderBoxLabelElements(orders, locations, settings = null) {
    if (!orders) {
      return (<></>)
    }

    if (!settings) {
      settings = {}
    }

    settings.height_b = settings.height_b ? settings.height_b : 720
    settings.width_b = settings.width_b ? settings.width_b : 480
    settings.height_c = settings.height_c ? settings.height_c : 720
    settings.width_c = settings.width_c ? settings.width_c : 480
    settings.padding_left = settings.padding_left ? settings.padding_left : 10
    settings.padding_top = settings.padding_top ? settings.padding_top : 10
    settings.padding_right = settings.padding_right ? settings.padding_right : 10
    settings.padding_bottom = settings.padding_bottom ? settings.padding_bottom : 10

    return orders.reduce((acc, cur) => {
      // Create an entry for each box on an order
      for (let i = 0; i < cur.total_boxes; i++) {
        acc.push({
          order: cur,
          boxNum: i + 1
        })
      }
      return acc
    }, [])
      .map((orderBox, i) => (
        <>
          <div className="label d-flex w-100">
            <div className="position-relative" style={{ height: `${settings.height_b}px`, width: `${settings.width_b}px` }}>
              <div className="d-flex flex-column" style={{ width: `${settings.width_c}px`, height: `${settings.height_c}px`, overflow: "hidden", paddingLeft: `${settings.padding_left}px`, paddingRight: `${settings.padding_right}px`, paddingTop: `${settings.padding_top}px`, paddingBottom: `${settings.padding_bottom}px` }}>
                <Row className="">
                  <Col className="d-flex flex-column align-items-center"><span className="fw-bold" style={{ fontSize: `${masterFontSize(orderBox.order.master)}px`, lineHeight: `${masterFontSize(orderBox.order.master) * 0.8}px` }}>{orderBox.order.master}</span></Col>
                </Row>
                <Row className="mt-1">
                  <Col className="d-flex flex-column align-items-center"><Barcode value={orderBox.order.master} displayValue={false} width={33.0 / orderBox.order.master.length} height={120} /></Col>
                </Row>
                <Row className="flex-grow-1">
                  <Col className="d-flex flex-column justify-content-center">
                    <p style={{ fontSize: "60px", lineHeight: "55px" }}>{lastNameCommaFirstName(address(orderBox.order)).toUpperCase()}</p>
                    {/* <p style={{fontSize: "60px", lineHeight: "60px"}}>{("Davis, Jake and some other names too").toUpperCase()}</p> */}
                  </Col>
                </Row>
                <Row className="">
                  <Col className="d-flex flex-column align-items-center">
                    {
                      labelStatus(orderBox.order) ? (
                        <>
                          <div className="w-100 border border-black border-2 d-flex align-items-center justify-content-center" style={{ height: "100px" }}>
                            <span className="fw-bold" style={{ fontSize: "60px", lineHeight: "60px" }}>{labelStatus(orderBox.order)}</span>
                            {/* <span className="fw-bold" style={{fontSize: "60px", lineHeight: "60px"}}>HOLD FOR PU</span> */}
                          </div>
                        </>
                      ) : (<></>)
                    }
                  </Col>
                </Row>
                <Row className="mt-4">
                  <Col className="d-flex justify-content-between">
                    <div className="" style={{ width: "140px", height: "140px" }}>
                      <QRCode value={qrCodeValue(orderBox.order, orderBox.boxNum, getOriginalLocation(orderBox.order, locations)?.weigh_in_code ?? "")} style={{ width: "100%", height: "100%" }} />
                    </div>
                    <div className="d-flex flex-column align-items-end justify-content-end">
                      <div className="mb-3" style={{ fontSize: "25px", lineHeight: "25px" }}>{orderBox.order.fish_tag ? `Fish Tag: ${orderBox.order.fish_tag}` : ``}</div>
                      <div className="" style={{ fontSize: "45px", lineHeight: "45px" }}>{getOriginalLocation(orderBox.order, locations)?.weigh_in_code ?? ""}</div>
                      <div className="mt-2" style={{ fontSize: "45px", lineHeight: "45px" }}>Box {orderBox.boxNum} of {orderBox.order.total_boxes}</div>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        </>
      ))
  }

  return (
    <>
      <div id="box-labels-pdf" style={{ width: `480px`, position: "absolute", top: 0, left: "-3000px" }}>
        {
          orderBoxLabelElements(orders, locations, settings)
        }
      </div>
    </>
  )
}

export default BoxLabels