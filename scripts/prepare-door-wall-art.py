from pathlib import Path
from PIL import Image
import numpy as np
import json,hashlib
root=Path(__file__).resolve().parents[1]
report=[]
for name in ['door-side-root','wall-panel-root','door-front-root-v2']:
 source=root/f'doc/rebuild-20260924/art/{name}.webp'
 image=Image.open(source).convert('RGBA');a=np.array(image).astype(np.int16)
 key=(a[:,:,0]>150)&(a[:,:,2]>150)&(a[:,:,0]-a[:,:,1]>75)&(a[:,:,2]-a[:,:,1]>75)
 a[:,:,3]=np.where(key,0,255);image=Image.fromarray(a.astype('uint8'),'RGBA');box=image.getbbox();image=image.crop(box)
 target=root/f'public/art/rebuild-20260924/{name}.png';image.save(target)
 report.append(dict(id=name,width=image.width,height=image.height,bounds=box,sourceSHA=hashlib.sha256(source.read_bytes()).hexdigest(),output=str(target.relative_to(root)),processing='magenta key, tight crop; no geometric deformation'))
(root/'src/door-wall-art.json').write_text(json.dumps(report,indent=2))
print(report)
