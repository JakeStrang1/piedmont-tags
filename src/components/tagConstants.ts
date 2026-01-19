// Tag dimension constants - shared between displayed and printable tags
export const TAG_WRAPPER_WIDTH = 256 // w-64 in pixels (64 * 4px = 256px)
export const TAG_MAX_CONTAINER_WIDTH = 1152 // max-w-6xl in pixels (72rem * 16px = 1152px)
export const TAG_GAP = 32 // gap-8 in pixels (8 * 4px = 32px)

// On-screen tag dimensions scale factor
// When width=3 and height=2, tag should be 600x400
// So scale factor is: 600/3 = 200 or 400/2 = 200 pixels per inch
export const TAG_SCALE_FACTOR_PX_PER_INCH = 200

// Calculate tag dimensions from label dimensions in inches
export const getTagDimensionsPx = (widthInches: number, heightInches: number) => ({
    width: widthInches * TAG_SCALE_FACTOR_PX_PER_INCH,
    height: heightInches * TAG_SCALE_FACTOR_PX_PER_INCH,
})

// Physical label dimensions
export const LABEL_WIDTH_INCHES = 2 // 2 inches wide
export const LABEL_HEIGHT_INCHES = 3 // 3 inches tall
export const PRINTER_DPI = 300 // Standard printer DPI (adjust if needed)

// Calculate printable width: max container width matches the displayed version
export const PRINTABLE_WIDTH = TAG_MAX_CONTAINER_WIDTH

