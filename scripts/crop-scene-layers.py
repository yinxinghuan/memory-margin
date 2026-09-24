from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
jobs = json.loads((root / 'doc/rebuild-20260924/layer-jobs.json').read_text())
# Validate the entire input before writing anything. Older jobs were destructively cropped.
for job in jobs:
    if not job.get('output') or job['output'] == job['source']:
        raise SystemExit('Legacy in-place layer jobs: run scripts/bake-scene-layers.tsx first. No files changed.')
    with Image.open(root / job['source']) as image:
        if image.size != (768, 1024):
            raise SystemExit(f"Expected uncropped 768x1024 source: {job['id']}. No files changed.")
result = []
for job in jobs:
    image = Image.open(root / job['source']).convert('RGBA')
    box = image.getbbox()
    if not box:
        continue
    cropped = image.crop(box)
    output = root / job['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output)
    result.append(dict(id=job['id'], scene=job['scene'], depth=job['depth'],
        image='./' + job['output'].removeprefix('public/'), x=box[0]/2, y=box[1]/2,
        width=cropped.width, height=cropped.height, scale=.5))
(root / 'src/scene-layers.json').write_text(json.dumps(result, indent=2))
print('Prepared', len(result), 'independent engine textures; raw layers unchanged')
