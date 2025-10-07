# Wheel Alignment Fix - Version 2

## Issue Identified

The wheel was not correctly aligning the selected module with the pointer after spinning. The debug logs showed:

```
Selected index: 5
Selected module: Last-, Performance- und Stresstests
...
Segment at pointer: 11
Module at pointer: System-Monitoring und Überwachung
```

The wheel was selecting one module but displaying a different one as the winner.

## Root Cause

The bug was in the rotation calculation. The code was calculating the target segment center without accounting for the initial -90° offset where segments start being drawn.

### Previous (Incorrect) Code:

```javascript
const targetSegmentCenter = finalIndex * segmentAngle + segmentAngle / 2;
```

This assumed segments start at 0°, but they actually start at -90° (bottom of the wheel).

### Fixed Code:

```javascript
const targetSegmentCenter = -90 + finalIndex * segmentAngle + segmentAngle / 2;
```

Now correctly accounts for the -90° starting position.

## How It Works

1. **Segment Layout**: Segments are drawn starting at -90° (6 o'clock position, bottom) and go counter-clockwise
2. **Pointer Position**: The pointer is at 90° (12 o'clock position, top)
3. **Segment Center Calculation**:
   - Segment `i` starts at: `-90 + (i * segmentAngle)`
   - Its center is at: `-90 + (i * segmentAngle) + (segmentAngle / 2)`
4. **Rotation Calculation**: To align segment center with pointer at 90°:
   - `targetAngle = 90 - targetSegmentCenter`

## Example with 30 Modules

- Segment angle: 360° / 30 = 12°
- For index 5:
  - Old calculation: 5 \* 12 + 6 = 66°
  - New calculation: -90 + 5 \* 12 + 6 = -24°
  - Target rotation: 90 - (-24) = 114°

This ensures the selected segment actually ends up at the pointer position.

## Testing

After this fix:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload the page
3. Spin the wheel multiple times
4. Verify the displayed winner matches the segment aligned with the pointer

The debug logs should now show:

- "Final index (selected)" matches "Segment at pointer"
- "Winner module" matches "Module at pointer"

## Status

✅ Fix implemented
✅ Code formatted and linted
🔄 Ready for manual testing
