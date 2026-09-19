"""Chroma-key accepted generated-room objects without repainting content."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCES={
 'audit-resonance-scanner':'assets/benchmark/generated-room/audit-resonance-scanner.png',
 'audit-comparison-console-v2':'assets/benchmark/generated-room/audit-comparison-console-v2.png',
 'audit-sealed-buffer':'assets/benchmark/generated-room/audit-sealed-buffer.png',
 'audit-sealed-buffer-v2':'assets/benchmark/generated-room/audit-sealed-buffer-v2.png',
}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
records={}
for asset,relative in SOURCES.items():
 source=ROOT/relative
 rgb=np.array(Image.open(source).convert('RGB')).astype(np.int16)
 magenta=(rgb[:,:,0]>=110)&(rgb[:,:,2]>=90)&((rgb[:,:,0]-rgb[:,:,1])>=55)&((rgb[:,:,2]-rgb[:,:,1])>=45)
 rgba=np.dstack((rgb.astype('uint8'),np.where(magenta,0,255).astype('uint8')))
 output=ROOT/f'assets/benchmark/generated-room/processed/{asset}.png'
 output.parent.mkdir(parents=True,exist_ok=True)
 Image.fromarray(rgba,'RGBA').save(output)
 records[asset]={'source':relative,'sourceSha256':sha(source),'output':str(output.relative_to(ROOT)),'sha256':sha(output),'algorithm':'magenta-chroma-all-v3','transparentPixels':int(magenta.sum()),'totalPixels':512*512}
(ROOT/'assets/benchmark/generated-room/preparation-report.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps(records))
