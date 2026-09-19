"""Assemble a reviewed protagonist atlas from full AlterU Media Service poses.

No partial limb reflection is permitted. Right-facing frames mirror the complete
accepted left-facing frames; all other frames use independent full-body sources.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = json.loads((ROOT / 'assets/platform-media.json').read_text())['jobs']
LEDGER = json.loads((ROOT / 'assets/benchmark/hero-v7/platform-ledger.json').read_text())['jobs']
CELL = 256
VISIBLE_HEIGHT = 195
FOOT_Y = 233
HEAD_X = 128


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def record(job: str) -> dict:
    source = LEDGER if job in LEDGER else MEDIA
    item = source[job]
    if item['status'] != 'succeeded' or not item.get('sha256'):
        raise ValueError(f'{job}: platform job not accepted')
    path = ROOT / item['output']
    if sha(path) != item['sha256']:
        raise ValueError(f'{job}: source hash changed')
    return item


def clean(job: str) -> Image.Image:
    item = record(job)
    image = Image.open(ROOT / item['output']).convert('RGB')
    if image.size != (512, 512):
        raise ValueError(f'{job}: expected 512x512, got {image.size}')
    rgb = np.array(image).astype(np.int16)
    magenta = ((rgb[:, :, 0] >= 100) & (rgb[:, :, 2] >= 90)
               & (rgb[:, :, 0] - rgb[:, :, 1] >= 55)
               & (rgb[:, :, 2] - rgb[:, :, 1] >= 55))
    rgba = np.dstack((rgb.astype('uint8'), np.where(magenta, 0, 255).astype('uint8')))
    result = Image.fromarray(rgba, 'RGBA')
    box = result.getbbox()
    if not box or box[0] < 28 or box[2] > 484 or box[1] < 24 or box[3] > 492:
        raise ValueError(f'{job}: unsafe subject bounds {box}')
    return result


def align(job: str, mirror: bool = False) -> tuple[Image.Image, dict]:
    image = clean(job)
    if mirror:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    box = image.getbbox()
    part = image.crop(box)
    width = round(part.width * VISIBLE_HEIGHT / part.height)
    part = part.resize((width, VISIBLE_HEIGHT), Image.Resampling.NEAREST)
    head_box = part.crop((0, 0, width, min(78, part.height))).getbbox()
    if not head_box:
        raise ValueError(f'{job}: head region missing')
    head_center = (head_box[0] + head_box[2]) / 2
    x = round(HEAD_X - head_center)
    y = FOOT_Y - part.height
    frame = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    frame.alpha_composite(part, (x, y))
    placed = frame.getbbox()
    if not placed or placed[0] <= 0 or placed[2] >= CELL or placed[1] <= 0 or placed[3] != FOOT_Y:
        raise ValueError(f'{job}: aligned subject outside cell {placed}')
    return frame, {
        'bbox': list(placed),
        'headX': HEAD_X,
        'footY': FOOT_Y,
        'visibleHeight': placed[3] - placed[1],
        'mirroredFullFrame': mirror,
    }


def main() -> None:
    rows = [
        ['hero-step-down-l-v5', 'hero-stand-down-v5', 'hero-down-opposite-v8b'],
        ['hero-step-left-l-v5', 'hero-stand-left-v5', 'hero-side-pass-v9b'],
        ['hero-step-left-l-v5', 'hero-stand-left-v5', 'hero-side-pass-v9b'],
        ['hero-step-up-l-v5', 'hero-stand-up-v5', 'hero-up-opposite-v8b'],
    ]
    atlas = Image.new('RGBA', (CELL * 3, CELL * 4), (0, 0, 0, 0))
    report = {
        'version': 2,
        'status': 'candidate',
        'cell': [CELL, CELL],
        'directions': ['down', 'left', 'right', 'up'],
        'sourceService': 'AlterU Media Service',
        'partialLimbReflectionAllowed': False,
        'frames': [],
    }
    for row, jobs in enumerate(rows):
        for column, job in enumerate(jobs):
            mirror = row == 2
            frame, geometry = align(job, mirror=mirror)
            atlas.alpha_composite(frame, (column * CELL, row * CELL))
            item = record(job)
            report['frames'].append({
                'row': row,
                'column': column,
                'direction': report['directions'][row],
                'platformJob': job,
                'requestId': item['requestId'],
                'taskId': item.get('taskId'),
                'sourceSha256': item['sha256'],
                'operations': ['chroma-key', 'uniform-scale', 'foot-align'] + (['mirror-full-frame'] if mirror else []),
                **geometry,
            })
    processed = ROOT / 'assets/processed/hero-walk-v7.png'
    public = ROOT / 'public/art/hero.png'
    processed.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(processed)
    atlas.save(public)
    report['sheet'] = {'path': str(processed.relative_to(ROOT)), 'sha256': sha(processed)}
    (ROOT / 'assets/hero-v7-assembly.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['sheet']))


if __name__ == '__main__':
    main()
