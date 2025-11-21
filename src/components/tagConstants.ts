// Tag dimension constants - shared between displayed and printable tags
export const TAG_WRAPPER_WIDTH = 256 // w-64 in pixels (64 * 4px = 256px)
export const TAG_MAX_CONTAINER_WIDTH = 1152 // max-w-6xl in pixels (72rem * 16px = 1152px)
export const TAG_GAP = 32 // gap-8 in pixels (8 * 4px = 32px)

// Calculate printable width: max container width matches the displayed version
export const PRINTABLE_WIDTH = TAG_MAX_CONTAINER_WIDTH

