"""Whole-pose assembly only; mirrored right-facing frames have no asymmetric props."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
root=Path(__file__).resolve().parents[1];source=root/'doc/rebuild-20260924/art';target=root/'public/art/rebuild-20260924'
rows=[['down-a','root','down-b-v3'],['left-a','left-stand','left-b-v2'],['left-a','left-stand','left-b-v2'],['up-a','up-stand','up-b-v2']]
atlas=Image.new('RGBA',(768,1024));report=[]
for row,poses in enumerate(rows):
 for col,pose in enumerate(poses):
  name=f'hero-{pose}';record=json.loads((source/f'{name}.json').read_text());raw=(source/f'{name}.webp').read_bytes()
  assert hashlib.sha256(raw).hexdigest()==record['sha256']
  image=Image.open(source/f'{name}.webp').convert('RGBA');arr=np.array(image).astype(np.int16)
  key=(arr[:,:,0]>150)&(arr[:,:,2]>150)&(arr[:,:,0]-arr[:,:,1]>75)&(arr[:,:,2]-arr[:,:,1]>75);arr[:,:,3]=np.where(key,0,255)
  image=Image.fromarray(arr.astype('uint8'),'RGBA');bounds=image.getbbox();image=image.crop(bounds)
  if row==2:image=image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  image=image.resize((round(image.width*216/image.height),216),Image.Resampling.NEAREST)
  head=image.crop((0,0,image.width,65)).getbbox();x=round(128-(head[0]+head[2])/2)
  assert x>=0 and x+image.width<=256
  frame=Image.new('RGBA',(256,256));frame.alpha_composite(image,(x,243-216));atlas.alpha_composite(frame,(col*256,row*256))
  report.append(dict(row=row,col=col,source=name,requestId=record['requestId'],parent=record.get('parent'),sourceBounds=bounds,outputBounds=frame.getbbox(),foot=243,visibleHeight=216,wholeFrameMirrored=row==2))
atlas.save(target/'hero-sheet.png')
# Neutral dark contact sheet is QA only, never the runtime sprite texture.
contact=Image.new('RGBA',atlas.size,(28,36,40,255));contact.alpha_composite(atlas);contact.convert('RGB').save(source/'hero-contact.png')
(source/'hero-assembly.json').write_text(json.dumps(dict(status='candidate, motion review required',frames=report),indent=2))
