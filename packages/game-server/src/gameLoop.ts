/** Game Loop */
export async function gameLoop() {
  try {
    // TODO: Find monsters that aren't moving, but should be, and update them
  } catch (e) {
    console.error(e); // TODO: Log errors
  } finally {
    setTimeout(() => void gameLoop(), 1000 / 60); // TODO: Move to config
  }
}
