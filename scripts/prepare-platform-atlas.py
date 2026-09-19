"""Deterministic alpha preparation of a recorded AlterU Media Service RGB atlas.

No content is painted or invented here. Source SHA and task success are required.
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PRESETS = {
    'hero-walk-v3': (3, 4, 'white', 'assets/processed/hero-walk-v3.png'),
    'hero-walk-v4': (3, 4, 'white', 'assets/processed/hero-walk-v4.png'),
    'cast-stand': (4, 1, 'checker', 'assets/processed/cast-stand.png'),
    'objects': (3, 3, 'pale', 'assets/processed/objects.png'),
    'home-worktable-v3': (1, 1, 'magenta', 'assets/processed/home-worktable-v3.png'),
    'service-console-v3': (1, 1, 'magenta', 'assets/processed/service-console-v3.png'),
    'home-worktable-v4': (1, 1, 'magenta', 'assets/processed/home-worktable-v4.png'),
    'service-console-v4': (1, 1, 'magenta', 'assets/processed/service-console-v4.png'),
    'home-worktable-v5': (1, 1, 'magenta', 'assets/processed/home-worktable-v5.png'),
    'service-console-v5': (1, 1, 'magenta', 'assets/processed/service-console-v5.png'),
    'service-console-v6': (1, 1, 'magenta', 'assets/processed/service-console-v6.png'),
    'large-router-island-v1': (1, 1, 'magenta', 'assets/processed/large-router-island-v1.png'),
    'large-router-island-v2': (1, 1, 'magenta', 'assets/processed/large-router-island-v2.png'),
    'large-concourse-detail-atlas-v1': (3, 3, 'magenta', 'assets/processed/large-concourse-detail-atlas-v1.png'),
    'rug': (1, 1, 'white', 'assets/processed/rug.png'),
    'neighbor-stand-v4': (1, 1, 'magenta', 'assets/processed/neighbor-stand-v4.png'),
    'caretaker-stand-v4': (1, 1, 'magenta', 'assets/processed/caretaker-stand-v4.png'),
    'clerk-stand-v4': (1, 1, 'magenta', 'assets/processed/clerk-stand-v4.png'),
    'door-leaf-v2': (1, 1, 'magenta', 'assets/processed/door-leaf-v2.png'),
    'door-front-atlas-v3': (2, 1, 'magenta', 'assets/processed/door-front-atlas-v3.png'),
    'door-side-passage-v3': (1, 1, 'magenta', 'assets/processed/door-side-passage-v3.png'),
    'door-side-face-v4': (1, 1, 'magenta', 'assets/processed/door-side-face-v4.png'),
    'door-side-leaf-v5': (1, 1, 'magenta', 'assets/processed/door-side-leaf-v5.png'),
    'world-props-v2': (3, 3, 'magenta', 'assets/processed/world-props-v2.png'),
    'ambient-home-props-v1': (3, 3, 'magenta-white', 'assets/processed/ambient-home-props-v1.png'),
    'ambient-home-furniture-v2': (2, 2, 'magenta', 'assets/processed/ambient-home-furniture-v2.png'),
    'ambient-service-furniture-v1': (2, 2, 'magenta-white', 'assets/processed/ambient-service-furniture-v1.png'),
    'service-archive-cabinet-v2': (1, 1, 'magenta', 'assets/processed/service-archive-cabinet-v2.png'),
    'service-waiting-bench-v2': (1, 1, 'magenta', 'assets/processed/service-waiting-bench-v2.png'),
    'service-supply-cabinet-v2': (1, 1, 'magenta', 'assets/processed/service-supply-cabinet-v2.png'),
    'service-archive-cabinet-v3': (1, 1, 'magenta', 'assets/processed/service-archive-cabinet-v3.png'),
    'service-waiting-bench-v3': (1, 1, 'magenta', 'assets/processed/service-waiting-bench-v3.png'),
    'service-waiting-seat-v4': (1, 1, 'magenta', 'assets/processed/service-waiting-seat-v4.png'),
    'service-memory-chair-v1': (1, 1, 'magenta', 'assets/processed/service-memory-chair-v1.png'),
    'service-memory-chair-v2': (1, 1, 'magenta', 'assets/processed/service-memory-chair-v2.png'),
    'service-memory-archive-v4': (1, 1, 'magenta', 'assets/processed/service-memory-archive-v4.png'),
    'service-maintenance-console-v3': (1, 1, 'magenta', 'assets/processed/service-maintenance-console-v3.png'),
    'service-memory-archive-v5': (1, 1, 'magenta', 'assets/processed/service-memory-archive-v5.png'),
    'service-maintenance-console-v4': (1, 1, 'magenta', 'assets/processed/service-maintenance-console-v4.png'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def candidate(rgb, kind):
    p = rgb.astype(np.int16)
    if kind == 'magenta':
        return (p[:, :, 0] >= 100) & (p[:, :, 2] >= 90) & ((p[:, :, 0] - p[:, :, 1]) >= 55) & ((p[:, :, 2] - p[:, :, 1]) >= 55)
    lo = p.min(axis=2)
    hi = p.max(axis=2)
    if kind == 'magenta-white':
        magenta = (p[:, :, 0] >= 100) & (p[:, :, 2] >= 90) & ((p[:, :, 0] - p[:, :, 1]) >= 55) & ((p[:, :, 2] - p[:, :, 1]) >= 55)
        white = (lo >= 225) & (hi - lo <= 24)
        pale_pink = (p[:, :, 0] >= 225) & (p[:, :, 1] >= 205) & (p[:, :, 2] >= 225) & (np.abs(p[:, :, 0] - p[:, :, 2]) <= 35)
        return magenta | white | pale_pink
    if kind == 'white':
        return (lo >= 231) & (hi - lo <= 19)
    if kind == 'checker':
        return (lo >= 205) & (hi - lo <= 12)
    pale = (p[:, :, 0] >= 165) & (p[:, :, 0] <= 232) & (p[:, :, 1] - p[:, :, 0] >= 5) & (p[:, :, 1] - p[:, :, 0] <= 23) & (p[:, :, 2] - p[:, :, 0] >= 0) & (p[:, :, 2] - p[:, :, 0] <= 16)
    white = (lo >= 220) & (hi - lo <= 18)
    return pale | white


def prepare(job):
    if job not in PRESETS:
        raise ValueError(f'Unknown approved atlas job: {job}')
    cols, rows, kind, output_rel = PRESETS[job]
    manifest = json.loads((ROOT / 'assets/platform-media.json').read_text())
    record = manifest['jobs'].get(job)
    if not record or record['status'] != 'succeeded':
        raise ValueError(f'Platform generation has not succeeded: {job}')
    source = ROOT / record['output']
    source_bytes = source.read_bytes()
    if digest(source_bytes) != record['sha256']:
        raise ValueError('Platform source hash changed')
    image = Image.open(source)
    if image.mode not in ('RGB', 'RGBA'):
        raise ValueError(f'Unexpected source mode: {image.mode}')
    rgb = np.array(image.convert('RGB'))
    height, width = rgb.shape[:2]
    if width % cols or height % rows:
        raise ValueError('Atlas cell grid is uneven')
    cw, ch = width // cols, height // rows
    removable = candidate(rgb, kind)
    remove = np.zeros((height, width), dtype=bool)
    if kind == 'magenta':
        # Chroma-key fields can contain disconnected magenta patches between
        # legs; the subject has no magenta, so remove every qualifying pixel.
        remove = removable
        if job in ('world-props-v2', 'ambient-home-furniture-v2', 'large-concourse-detail-atlas-v1'):
            # The generated atlas has dark cell-divider strokes. They are not
            # world objects, and every subject sits well inside its cell.
            for row in range(rows):
                for col in range(cols):
                    x, y = col * cw, row * ch
                    edge = 14 if job == 'large-concourse-detail-atlas-v1' else 8
                    remove[y:y+edge, x:x+cw] = True
                    remove[y+ch-edge:y+ch, x:x+cw] = True
                    remove[y:y+ch, x:x+edge] = True
                    remove[y:y+ch, x+cw-edge:x+cw] = True
    else:
        for row in range(rows):
            for col in range(cols):
                x, y = col * cw, row * ch
                # Pillow may expose numpy-backed pixels as read-only; floodfill
                # silently leaves those unchanged unless the image is copied.
                tile = Image.fromarray(np.where(removable[y:y+ch, x:x+cw], 255, 0).astype('uint8'), 'L').copy()
                for point in ((0, 0), (cw-1, 0), (0, ch-1), (cw-1, ch-1)):
                    if tile.getpixel(point) == 255:
                        ImageDraw.floodfill(tile, point, 128, thresh=0)
                remove[y:y+ch, x:x+cw] = np.array(tile) == 128
    rgba = np.dstack((rgb, np.where(remove, 0, 255).astype('uint8')))
    if job in ('service-memory-chair-v1', 'service-memory-chair-v2'):
        # The platform output has a one-pixel dark-magenta chroma fringe that
        # survives the bright-key threshold and becomes pink after minifying.
        p = rgb.astype(np.int16)
        fringe = (p[:, :, 0] >= 20) & (p[:, :, 2] >= 20) & ((p[:, :, 0] - p[:, :, 1]) >= 15) & ((p[:, :, 2] - p[:, :, 1]) >= 12) & (np.abs(p[:, :, 0] - p[:, :, 2]) <= 60)
        rgba[:, :, 3] = np.where(fringe, 0, rgba[:, :, 3]).astype('uint8')
        remove = rgba[:, :, 3] == 0
    if job == 'hero-walk-v3':
        # The platform kept the left-facing identity but drifted in right row.
        # Mirror that same generated left row; replace the one wrong up frame
        # with a mirrored valid up step. No new painted content is introduced.
        original = rgba.copy()
        for col in range(3):
            source_col = 2 - col
            rgba[2*ch:3*ch, col*cw:(col+1)*cw] = np.flip(
                original[ch:2*ch, source_col*cw:(source_col+1)*cw], axis=1
            )
        rgba[3*ch:4*ch, 0:cw] = np.flip(original[3*ch:4*ch, 2*cw:3*cw], axis=1)
    output = ROOT / output_rel
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, 'RGBA').save(output)
    prepared = json.loads((ROOT / 'assets/platform-processed.json').read_text()) if (ROOT / 'assets/platform-processed.json').exists() else {}
    prepared[job] = {'source': record['output'], 'sourceSha256': record['sha256'], 'sourceRequestId': record['requestId'], 'output': output_rel, 'sha256': digest(output.read_bytes()), 'algorithm': ('magenta-chroma-all-v2' if kind == 'magenta' else f'edge-connected-{kind}-alpha-v2')+('+atlas-grid-edge-v1' if job in ('world-props-v2', 'ambient-home-furniture-v2', 'large-concourse-detail-atlas-v1') else '')+('+dark-magenta-fringe-v1' if job in ('service-memory-chair-v1', 'service-memory-chair-v2') else '')+('+source-frame-mirror-v1' if job == 'hero-walk-v3' else ''), 'transparentPixels': int(remove.sum()), 'totalPixels': width*height, 'grid': [cols, rows]}
    (ROOT / 'assets/platform-processed.json').write_text(json.dumps(prepared, indent=2) + '\n')
    print(json.dumps(prepared[job]))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: prepare-platform-atlas.py JOB_ID')
    prepare(sys.argv[1])
