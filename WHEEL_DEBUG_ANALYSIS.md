# Wheel Alignment Debug Analysis

## Current Behavior (30 modules, 12° per segment)

From the logs:
- Selected index: 5
- Segment angle: 12°
- Target segment center: -24° (calculated as -90 + 5*12 + 6)
- Target angle: 114° (calculated as 90 - (-24))
- Total rotation: 1483.52° (includes multiple full rotations)
- Final rotation (mod 360): 43.52°

After rotation:
- Segment at pointer: 11 (WRONG - should be 5)
- Module at pointer: System-Monitoring und Überwachung (WRONG)

## Understanding the Coordinate System

### Initial State (no rotation):
- Segment 0: starts at -90°, center at -84° (-90 + 6)
- Segment 1: starts at -78°, center at -72° (-78 + 6)
- Segment 5: starts at -30°, center at -24° (-30 + 6)
- Pointer: at 90° (top)

### After Rotation by 114°:
The wheel rotates CLOCKWISE by 114°.
- Segment 5 center was at -24°
- After +114° rotation: -24° + 114° = 90° ✓ (should be at pointer)

But the final rotation is 1483.52° = 4 full rotations + 43.52°

So segment 5 center should be at: -24° + 43.52° = 19.52°

Wait, that's not 90°! The issue is that we're adding extra full rotations, so:
- 1483.52° mod 360 = 43.52°
- Segment 5 center after rotation: -24° + 43.52° = 19.52° (NOT at pointer!)

## The Real Problem

The calculation `totalRotation = fullRotations * 360 + targetAngle` is correct for the TARGET angle, but we're using a RANDOM number of full rotations (3-5), which means the final position is unpredictable!

We need:
1. Calculate how much to rotate to get segment to pointer
2. Add EXACT full rotations (not random)
3. OR: Always use the same formula and don't add randomness

## Solution

The issue is that `fullRotations` uses `Math.random()`, so the total rotation is not deterministic. We need to ensure that after ALL rotations (including the random full spins), the segment ends up at the pointer.

The correct formula should be:
```javascript
const fullRotations = Math.floor(3 + Math.random() * 3); // 3-5 full rotations (integer)
const totalRotation = fullRotations * 360 + targetAngle;
```

This ensures we always end up at the same final angle (targetAngle) regardless of how many full spins we do.
