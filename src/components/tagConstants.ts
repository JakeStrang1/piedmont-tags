// Tag dimension constants
export const TAG_WRAPPER_WIDTH = 256 // w-64 in pixels (64 * 4px = 256px)
export const TAG_MAX_CONTAINER_WIDTH = 1152 // max-w-6xl in pixels (72rem * 16px = 1152px)
export const TAG_GAP = 32 // gap-8 in pixels (8 * 4px = 32px)

// On-screen tag dimensions scale factor
// When width=2 and height=3, tag should be 400x600
// So scale factor is: 400/2 = 200 or 600/3 = 200 pixels per inch
export const TAG_SCALE_FACTOR_PX_PER_INCH = 200

// Calculate tag dimensions from label dimensions in inches
export const getTagDimensionsPx = (widthInches: number, heightInches: number) => ({
    width: widthInches * TAG_SCALE_FACTOR_PX_PER_INCH,
    height: heightInches * TAG_SCALE_FACTOR_PX_PER_INCH,
})

