"""Assemble AlterU Media Service NPC directions into reviewed 3x4 atlases.

Every source is a complete body. Right-facing rows mirror complete accepted
left-facing frames; no limb or torso is synthesized or reflected separately.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = json.loads((ROOT / 'assets/platform-media.json').read_text())['jobs']
CELL, FOOT_Y, HEAD_X = 256, 233, 128
TARGET_HEIGHT = {'neighbor': 200, 'caretaker': 194, 'clerk': 191}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(job: str) -> Image.Image:
    item = MEDIA[job]
    path = ROOT / item['output']
    if item['status'] != 'succeeded' or sha(path) != item['sha256']:
        raise ValueError(f'{job}: platform source is not a stable success')
    image = Image.open(path).convert('RGB')
    if image.size != (512, 512):
        raise ValueError(f'{job}: expected 512x512')
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


def align(job: str, height: int, mirror: bool = False):
    image = clean(job)
    if mirror:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    box = image.getbbox()
    part = image.crop(box)
    width = round(part.width * height / part.height)
    part = part.resize((width, height), Image.Resampling.NEAREST)
    head = part.crop((0, 0, width, min(78, height))).getbbox()
    if not head:
        raise ValueError(f'{job}: missing head region')
    x = round(HEAD_X - (head[0] + head[2]) / 2)
    y = FOOT_Y - height
    frame = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    frame.alpha_composite(part, (x, y))
    placed = frame.getbbox()
    if not placed or placed[0] <= 0 or placed[2] >= CELL or placed[1] <= 0 or placed[3] != FOOT_Y:
        raise ValueError(f'{job}: aligned subject outside cell {placed}')
    return frame, {'bbox': list(placed), 'mirroredFullFrame': mirror}


def build(person: str):
    down = f'{person}-stand-v5'
    left = f'{person}-stand-left-v6'
    up = f'{person}-stand-up-v6'
    left_row = ([f'neighbor-step-left-a-v6', left, f'neighbor-step-left-b-v6']
                if person == 'neighbor' else [left, left, left])
    rows = [[down, down, down], left_row, left_row, [up, up, up]]
    atlas = Image.new('RGBA', (CELL * 3, CELL * 4), (0, 0, 0, 0))
    frames = []
    for row, jobs in enumerate(rows):
        for column, job in enumerate(jobs):
            mirror = row == 2
            frame, geometry = align(job, TARGET_HEIGHT[person], mirror)
            atlas.alpha_composite(frame, (column * CELL, row * CELL))
            item = MEDIA[job]
            frames.append({'row': row, 'column': column, 'direction': ['down', 'left', 'right', 'up'][row],
                           'platformJob': job, 'requestId': item['requestId'], 'taskId': item.get('taskId'),
                           'sourceSha256': item['sha256'], 'operations': ['chroma-key', 'uniform-scale', 'foot-align'] + (['mirror-full-frame'] if mirror else []), **geometry})
    processed = ROOT / f'assets/processed/{person}-motion-v6.png'
    public = ROOT / f'public/art/{person}-motion-v6.png'
    atlas.save(processed)
    atlas.save(public)
    return {'person': person, 'sheet': {'path': str(processed.relative_to(ROOT)), 'publicPath': str(public.relative_to(ROOT)), 'sha256': sha(processed)}, 'frames': frames}


def main():
    report = {'version': 1, 'status': 'candidate', 'sourceService': 'AlterU Media Service',
              'cell': [CELL, CELL], 'directions': ['down', 'left', 'right', 'up'],
              'partialLimbReflectionAllowed': False,
              'characters': [build(person) for person in ('neighbor', 'caretaker', 'clerk')]}
    path = ROOT / 'assets/npc-motion-v6-assembly.json'
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({item['person']: item['sheet'] for item in report['characters']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
