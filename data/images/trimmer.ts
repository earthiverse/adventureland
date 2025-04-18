import type { Region, Sharp } from "sharp";

/**
 * NOTE: Assumes all sprites have the same width and height
 */
export async function trimSprites(
  width: number,
  height: number,
  north: Sharp,
  east: Sharp,
  south: Sharp,
  west: Sharp,
): Promise<Region> {
  const sprites = [north, east, south, west];

  async function isRowTransparentInAll(top: number): Promise<boolean> {
    for (const sprite of sprites) {
      const rowData = await sprite
        .clone()
        .extract({ left: 0, top, width, height: 1 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = rowData;
      const { channels } = info;

      if (channels !== 4) {
        throw new Error("No transparency channel!?");
      }
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) {
          return false;
        }
      }
    }
    return true;
  }

  async function isColTransparentInAll(left: number): Promise<boolean> {
    for (const sprite of sprites) {
      const rowData = await sprite
        .clone()
        .extract({ left, top: 0, width: 1, height })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = rowData;
      const { channels } = info;

      if (channels !== 4) {
        throw new Error("No transparency channel!?");
      }
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) {
          return false;
        }
      }
    }
    return true;
  }

  let topRowsToTrim = 0;
  let canTrimTop = true;
  while (canTrimTop && topRowsToTrim < height - 1) {
    canTrimTop = await isRowTransparentInAll(topRowsToTrim);
    if (canTrimTop) topRowsToTrim++;
  }

  let bottomRowsToTrim = 0;
  let canTrimBottom = true;
  while (canTrimBottom && bottomRowsToTrim < height - topRowsToTrim - 1) {
    canTrimBottom = await isRowTransparentInAll(height - 1 - bottomRowsToTrim);
    if (canTrimBottom) bottomRowsToTrim++;
  }

  let leftColsToTrim = 0;
  let canTrimLeft = true;
  while (canTrimLeft && leftColsToTrim < width - 1) {
    canTrimLeft = await isColTransparentInAll(leftColsToTrim);
    if (canTrimLeft) leftColsToTrim++;
  }

  let rightColsToTrim = 0;
  let canTrimRight = true;
  while (canTrimRight && rightColsToTrim < width - leftColsToTrim - 1) {
    canTrimRight = await isColTransparentInAll(width - 1 - rightColsToTrim);
    if (canTrimRight) rightColsToTrim++;
  }

  const newWidth = width - leftColsToTrim - rightColsToTrim;
  const newHeight = height - topRowsToTrim - bottomRowsToTrim;

  if (newWidth <= 0 || newHeight <= 0) {
    throw new Error("Something went wrong trimming...");
  }

  // Trim sprites
  return {
    left: leftColsToTrim,
    top: topRowsToTrim,
    width: newWidth,
    height: newHeight,
  };
}
