"""Assemble reviewed platform single-pose art into one foot-aligned RPG atlas.

The only image sources are successful AlterU Media Service jobs. Processing is
limited to chroma removal, 50% nearest-neighbor reduction, alignment and pose
reflection. Rejected platform gait candidates never enter this build.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = json.loads((ROOT / 'assets/platform-media.json').read_text())['jobs']
OUT = ROOT / 'assets/processed'
OUT.mkdir(parents=True, exist_ok=True)
FOOT_Y = 233
HEAD_X = 128


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source(job: str) -> Image.Image:
    record = MEDIA[job]
    if record['status'] != 'succeeded':
        raise ValueError(f'{job}: platform job not succeeded')
    path = ROOT / record['output']
    if sha(path) != record['sha256']:
        raise ValueError(f'{job}: platform source hash changed')
    image = Image.open(path).convert('RGB')
    if image.size != (512, 512):
        raise ValueError(f'{job}: expected 512×512, got {image.size}')
    rgb = np.array(image).astype(np.int16)
    magenta = ((rgb[:, :, 0] >= 100) & (rgb[:, :, 2] >= 90)
               & (rgb[:, :, 0] - rgb[:, :, 1] >= 55)
               & (rgb[:, :, 2] - rgb[:, :, 1] >= 55))
    pixels = np.dstack((rgb.astype('uint8'), np.where(magenta, 0, 255).astype('uint8')))
    cleaned = Image.fromarray(pixels, 'RGBA')
    box = cleaned.getbbox()
    if not box or box[0] < 45 or box[2] > 467 or box[1] < 35 or box[3] > 485:
        raise ValueError(f'{job}: subject not safely inside single-pose cell: {box}')
    return cleaned


def other_leg(image: Image.Image) -> Image.Image:
    """Reverse only the leg silhouette below the coat hem; identity stays put."""
    result = image.copy()
    lower = image.crop((0, 365, 512, 512))
    result.paste(lower.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (0, 365))
    return result


def tile(image: Image.Image, *, mirror: bool = False, visible_height: int | None = None) -> tuple[Image.Image, dict]:
    if mirror:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    half = image.resize((256, 256), Image.Resampling.NEAREST)
    box = half.getbbox()
    if not box:
        raise ValueError('empty sprite')
    normalized_from = box[3] - box[1]
    if visible_height and abs(normalized_from - visible_height) > 2:
        # Service pose candidates can shift the whole head by ~19 px between
        # side frames. Normalize the complete silhouette uniformly before
        # aligning the head and feet; do not stretch only the legs or torso.
        part = half.crop(box)
        new_width = round(part.width * visible_height / normalized_from)
        part = part.resize((new_width, visible_height), Image.Resampling.NEAREST)
        half = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        half.alpha_composite(part, ((256 - new_width) // 2, 0))
        box = half.getbbox()
    # Head center remains fixed when a foot extends to one side.
    head = half.crop((0, box[1], 256, min(256, box[1] + 75))).getbbox()
    if not head:
        raise ValueError('head region missing')
    head_x = (head[0] + head[2]) / 2
    dx = round(HEAD_X - head_x)
    dy = FOOT_Y - box[3]
    result = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    result.alpha_composite(half, (dx, dy))
    placed = result.getbbox()
    if not placed or placed[0] < 0 or placed[2] > 256 or placed[1] < 0 or placed[3] != FOOT_Y:
        raise ValueError(f'sprite cannot align: {placed}')
    return result, {'bbox': list(placed), 'headX': HEAD_X, 'footY': FOOT_Y, 'dx': dx, 'dy': dy, 'mirrored': mirror, 'normalizedHeightFrom': normalized_from if visible_height else None, 'targetVisibleHeight': visible_height}


def main() -> None:
    atlas = Image.new('RGBA', (768, 1024), (0, 0, 0, 0))
    recipe = [
        [('hero-step-down-l-v5', False), ('hero-stand-down-v5', False), ('hero-step-down-l-v5', True)],
        [('hero-step-left-l-v5', False), ('hero-stand-left-v5', False), ('hero-step-left-l-v5', True)],
        [('hero-step-left-l-v5', False), ('hero-stand-left-v5', False), ('hero-step-left-l-v5', True)],
        [('hero-step-up-l-v5', False), ('hero-stand-up-v5', False), ('hero-step-up-l-v5', True)],
    ]
    report = {'version': 1, 'cell': [256, 256], 'sourceService': 'AlterU Media Service', 'heroFrames': [], 'npc': {}}
    for row, frames in enumerate(recipe):
        for col, (job, alternate) in enumerate(frames):
            if row == 2:
                # Right-facing poses are exact reflection of the accepted left poses.
                image = source(job)
                if alternate:
                    image = other_leg(image)
                frame, data = tile(image, mirror=True, visible_height=195 if col != 1 else None)
                transforms = ['mirror-direction'] + (['opposite-leg'] if alternate else [])
            else:
                image = source(job)
                if alternate:
                    image = other_leg(image)
                frame, data = tile(image, visible_height=195 if row in (1, 3) and col != 1 else None)
                transforms = ['opposite-leg'] if alternate else []
            atlas.alpha_composite(frame, (col * 256, row * 256))
            report['heroFrames'].append({'row': row, 'column': col, 'platformJob': job, 'sourceSha256': MEDIA[job]['sha256'], 'transforms': transforms, **data})
    hero_out = OUT / 'hero-walk-v5.png'
    atlas.save(hero_out)
    report['hero'] = {'path': str(hero_out.relative_to(ROOT)), 'sha256': sha(hero_out)}
    for person in ('neighbor', 'caretaker', 'clerk'):
        job = f'{person}-stand-v5'
        frame, data = tile(source(job))
        out = OUT / f'{job}-aligned.png'
        frame.save(out)
        report['npc'][person] = {'platformJob': job, 'sourceSha256': MEDIA[job]['sha256'], 'path': str(out.relative_to(ROOT)), 'sha256': sha(out), **data}
    (ROOT / 'assets/actor-assembly.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'hero': report['hero'], 'npc': {p: v['bbox'] for p, v in report['npc'].items()}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
