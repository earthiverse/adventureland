import data from "./G_811.json" with { type: "json" };
import { trimSprites } from "./trimmer.ts";
import fs from "fs/promises";
import sharp from "sharp";

const baseUrl = "https://adventure.land";
const type = "hat";

// Make directory
await fs.mkdir(type, { recursive: true });

// Get files
for (const spriteFile in data.sprites) {
  const spriteSheet = data.sprites[spriteFile];
  if (spriteSheet.type !== type) continue; // Different type

  const spritesheet = await fetch(baseUrl + spriteSheet.file);
  const rows = spriteSheet.rows;
  const cols = spriteSheet.columns;

  console.debug(`Downloading ${spriteFile}...`);
  const baseImage = sharp(await spritesheet.bytes());
  const metadata = await baseImage.metadata();
  const baseWidth = metadata.width as number;
  const baseHeight = metadata.height as number;

  const spriteWidth = baseWidth / cols;
  const spriteHeight = baseHeight / rows;
  if (spriteHeight % 1 !== 0) {
    console.error(`Invalid sprite height for ${spriteFile}!`, spriteHeight);
  }
  if (spriteWidth % 1 !== 0) {
    console.error(`Invalid sprite width for ${spriteFile}!`, spriteWidth);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const spriteId = spriteSheet.matrix[row][col];
      if (!spriteId) continue; // Empty

      // Grab sprite from spritesheet
      console.log("Extracting", spriteId);
      const sprite = baseImage.clone().extract({
        left: col * spriteWidth,
        top: row * spriteHeight,
        width: spriteWidth,
        height: spriteHeight,
      });

      // Split into the four directions
      const directionHeight = spriteHeight / 4;
      const south = await sharp(
        await sprite
          .clone()
          .extract({
            left: 0,
            top: 0,
            width: spriteWidth,
            height: directionHeight,
          })
          .toBuffer(),
      );
      const west = await sharp(
        await sprite
          .clone()
          .extract({
            left: 0,
            top: directionHeight,
            width: spriteWidth,
            height: directionHeight,
          })
          .toBuffer(),
      );
      const east = await sharp(
        await sprite
          .clone()
          .extract({
            left: 0,
            top: directionHeight * 2,
            width: spriteWidth,
            height: directionHeight,
          })
          .toBuffer(),
      );
      const north = await sharp(
        await sprite
          .clone()
          .extract({
            left: 0,
            top: directionHeight * 3,
            width: spriteWidth,
            height: directionHeight,
          })
          .toBuffer(),
      );

      await fs.mkdir(`${type}/${spriteId}`, { recursive: true });
      const region = await trimSprites(
        spriteWidth,
        directionHeight,
        north,
        east,
        south,
        west,
      );
      await south.extract(region).toFile(`${type}/${spriteId}/S.png`);
      await west.extract(region).toFile(`${type}/${spriteId}/W.png`);
      await east.extract(region).toFile(`${type}/${spriteId}/E.png`);
      await north.extract(region).toFile(`${type}/${spriteId}/N.png`);
    }
  }
}
