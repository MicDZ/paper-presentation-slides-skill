"""Prepare presentation figures from the arXiv 1706.03762v7 source archive.

Run from the project root:  python3 -I data/prepare_figures.py

Inputs (unchanged paper assets under paper-source/src/) and outputs (figures/):
  Figures/ModalNet-21.png -> figures/transformer-architecture.png  (copied unchanged)
  Figures/ModalNet-19.png -> figures/scaled-dot-product-attention.png (copied unchanged)
  Figures/ModalNet-20.png -> figures/multi-head-attention.png (bottom whitespace cropped)
  vis/making_more_difficult5_new.pdf -> figures/attention-vis-making.png
      (rasterized at 300 dpi with pdftoppm; top 36 pt trimmed, as the paper's
       \\includegraphics[trim=0 0 0 36, clip] does)
  Paper Eq. 3 (learning-rate schedule) -> figures/lr-schedule.png
      (plotted from the formula with the paper's d_model=512, warmup_steps=4000;
       no data points are read from the paper)

Never executes anything from the paper source; pdftoppm only rasterizes a PDF.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "paper-source" / "src"
OUT = ROOT / "figures"
OUT.mkdir(exist_ok=True)

shutil.copyfile(SRC / "Figures/ModalNet-21.png", OUT / "transformer-architecture.png")
shutil.copyfile(SRC / "Figures/ModalNet-19.png", OUT / "scaled-dot-product-attention.png")

mh = Image.open(SRC / "Figures/ModalNet-20.png")
bbox = mh.getbbox()  # alpha-based content box
mh.crop((0, 0, mh.width, min(mh.height, bbox[3] + 10))).save(OUT / "multi-head-attention.png")

DPI = 300
with tempfile.TemporaryDirectory() as tmp:
    prefix = Path(tmp) / "vis"
    subprocess.run(["pdftoppm", "-r", str(DPI), "-png", "-singlefile",
                    str(SRC / "vis/making_more_difficult5_new.pdf"), str(prefix)], check=True)
    im = Image.open(str(prefix) + ".png").convert("RGB")
    top = round(36 * DPI / 72)
    im = im.crop((0, top, im.width, im.height))
    # crop surrounding white margin
    from PIL import ImageChops
    diff = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255)))
    b = diff.getbbox()
    if b:
        pad = 20
        im = im.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(im.width, b[2] + pad), min(im.height, b[3] + pad)))
    im.save(OUT / "attention-vis-making.png")

# Learning-rate schedule, Paper Eq. 3
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

d_model, warmup = 512, 4000
steps = np.arange(1, 100_001)
lrate = d_model ** -0.5 * np.minimum(steps ** -0.5, steps * warmup ** -1.5)
fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=200)
ax.plot(steps, lrate, color="#154677", lw=2.2)
ax.axvline(warmup, color="#C9A24F", ls="--", lw=1.4)
ax.annotate("warmup_steps = 4000", xy=(warmup, lrate.max()), xytext=(14000, lrate.max() * 0.95),
            fontsize=11, color="#7a5a12", arrowprops=dict(arrowstyle="->", color="#7a5a12"))
ax.set_xlabel("training step (base model: 100K steps)", fontsize=11)
ax.set_ylabel("learning rate", fontsize=11)
ax.ticklabel_format(axis="x", style="sci", scilimits=(3, 3))
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10)
fig.tight_layout()
fig.savefig(OUT / "lr-schedule.png")
print("peak lrate", lrate.max(), "at step", steps[lrate.argmax()])

# Focus crops of Paper Fig. 1 (stages too small to read in the full figure).
# Boxes are fractions (x0, y0, x1, y1) of the original image from the top-left.
arch = Image.open(SRC / "Figures/ModalNet-21.png")
W, H = arch.size
CROPS = {
    "arch-crop-inputs.png":  (0.00, 0.725, 1.00, 1.00),   # embeddings + positional encodings
    "arch-crop-encoder.png": (0.00, 0.345, 0.48, 0.80),   # one encoder layer with its input/output
    "arch-crop-decoder.png": (0.50, 0.00, 1.00, 0.745),   # decoder layer + linear/softmax head
}
for name, (x0, y0, x1, y1) in CROPS.items():
    arch.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))).save(OUT / name)
