/*
 * FPS readout (issue #9): frames per second and ms per frame
 * measured between requestAnimationFrame timestamps, so it's what the user sees (not pure GPU time)
 * averaged over ~0.5 s and written to the DOM only then, not every frame
 */
const WINDOW_MS = 500;

export interface FpsMeter {
    frame(timestamp: number): void; // call once per frame with the requestAnimationFrame timestamp
}

export function createFpsMeter(element: HTMLElement): FpsMeter {
    let windowStart: number | undefined;
    let frames = 0;
    return {
        frame(timestamp) {
            if (windowStart === undefined) {
                windowStart = timestamp;
                return;
            }
            frames++;
            const elapsed = timestamp - windowStart;
            if (elapsed >= WINDOW_MS) {
                element.textContent = `${(frames * 1000 / elapsed).toFixed(0)} FPS · ${(elapsed / frames).toFixed(1)} ms`;
                windowStart = timestamp;
                frames = 0;
            }
        },
    };
}
