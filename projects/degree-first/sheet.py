"""Tile a folder of stills into labelled contact sheets: python3 sheet.py <dir> <out_prefix> [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
files = sorted(glob.glob(os.path.join(d, "*.jpg")))
per = cols * 2
for k in range(0, len(files), per):
    chunk = files[k:k + per]
    ims = [Image.open(f) for f in chunk]
    w, h = ims[0].size
    tw = 360; th = int(h * tw / w)
    sheet = Image.new("RGB", (cols * tw, ((len(ims) + cols - 1) // cols) * (th + 24)), "white")
    dr = ImageDraw.Draw(sheet)
    for i, (im, f) in enumerate(zip(ims, chunk)):
        x, y = (i % cols) * tw, (i // cols) * (th + 24)
        sheet.paste(im.resize((tw, th)), (x, y + 24))
        dr.text((x + 6, y + 4), os.path.basename(f)[:-4] + "s", fill="black")
    sheet.save(f"{out}_{k // per}.jpg", quality=85)
    print(f"{out}_{k // per}.jpg")
