"""Declared chroma-key/tight-crop processing; never redraws body parts."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, hashlib
root=Path(__file__).resolve().parents[1]
sources=root/'doc/rebuild-20260924/art';out=root/'public/art/rebuild-20260924';out.mkdir(parents=True,exist_ok=True)
report=[]
for name in ['home-floor','voice-console','hero-root']:
    image=Image.open(sources/f'{name}.webp').convert('RGBA')
    original=image.size
    if name!='home-floor':
        rgb=np.array(image).astype(np.int16)
        key=(rgb[:,:,0]>150)&(rgb[:,:,2]>150)&((rgb[:,:,0]-rgb[:,:,1])>75)&((rgb[:,:,2]-rgb[:,:,1])>75)
        rgb[:,:,3]=np.where(key,0,255)
        image=Image.fromarray(rgb.astype('uint8'),'RGBA')
        bounds=image.getbbox()
        if not bounds:raise ValueError(f'{name}: empty foreground')
        image=image.crop(bounds)
    else:bounds=(0,0,*image.size)
    target=out/f'{name}.png';image.save(target)
    parent=json.loads((sources/f'{name}.json').read_text())
    report.append(dict(id=name,requestId=parent['requestId'],sourceSHA=parent['sha256'],output=str(target.relative_to(root)),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),original=original,bounds=bounds,processed=image.size,processing='RGB magenta key and tight crop' if name!='home-floor' else 'decode only',visualQA='candidate; room validation pending'))
(root/'doc/rebuild-20260924/art/processing.json').write_text(json.dumps(report,indent=2))
