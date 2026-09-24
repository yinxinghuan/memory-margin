from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
root=Path(__file__).resolve().parents[1];source=root/'doc/rebuild-20260924/art';target=root/'public/art/rebuild-20260924';reports=[]
rosters={
 'neighbor':[['root']*3,['left-a-v2','left-stand','left-b-v2'],['left-a-v2','left-stand','left-b-v2'],['up-stand']*3],
 'caretaker':[['down-a','root','down-b'],['left-stand']*3,['left-stand']*3,['up-a','up-stand','up-b-v2']],
 'clerk':[['root']*3,['left-stand']*3,['right-stand']*3,['up-stand']*3],
}
for actor,rows in rosters.items():
 atlas=Image.new('RGBA',(768,1024));frames=[]
 for row,poses in enumerate(rows):
  for col,pose in enumerate(poses):
   name=f'{actor}-{pose}';record=json.loads((source/f'{name}.json').read_text());raw=(source/f'{name}.webp').read_bytes();assert hashlib.sha256(raw).hexdigest()==record['sha256']
   image=Image.open(source/f'{name}.webp').convert('RGBA');arr=np.array(image).astype(np.int16)
   # Saturated magenta only: preserve the neighbor's low-saturation plum jacket.
   key=(arr[:,:,0]>150)&(arr[:,:,2]>150)&(arr[:,:,0]-arr[:,:,1]>75)&(arr[:,:,2]-arr[:,:,1]>75);arr[:,:,3]=np.where(key,0,255)
   image=Image.fromarray(arr.astype('uint8'),'RGBA');bounds=image.getbbox();image=image.crop(bounds)
   mirrored=row==2 and actor!='clerk'
   if mirrored:image=image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   image=image.resize((round(image.width*216/image.height),216),Image.Resampling.NEAREST)
   head=image.crop((0,0,image.width,65)).getbbox();x=round(128-(head[0]+head[2])/2);assert x>=0 and x+image.width<=256
   frame=Image.new('RGBA',(256,256));frame.alpha_composite(image,(x,27));atlas.alpha_composite(frame,(col*256,row*256))
   frames.append(dict(row=row,col=col,source=name,requestId=record['requestId'],mirrored=mirrored,bounds=frame.getbbox()))
 atlas.save(target/f'{actor}-sheet.png');contact=Image.new('RGBA',atlas.size,(28,36,40,255));contact.alpha_composite(atlas);contact.convert('RGB').save(source/f'{actor}-contact.png')
 portrait=Image.open(source/f'{actor}-portrait.webp').convert('RGB');portrait.save(target/f'{actor}-portrait.png')
 reports.append(dict(id=actor,visibleHeight=216,foot=243,profile='horizontal patrol' if actor=='neighbor' else 'vertical patrol' if actor=='caretaker' else 'stationary; facing only',frames=frames,status='candidate; in-engine review required'))
(source/'cast-assembly.json').write_text(json.dumps(reports,indent=2))
