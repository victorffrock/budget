import sys
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

SCALE = 8
S = 128 * SCALE
def px(v): return int(round(v * SCALE))

variant = sys.argv[1] if len(sys.argv) > 1 else "stable"
if variant not in {"stable", "test"}:
    raise SystemExit("Uso: make_icon.py [stable|test]")

img = Image.new("RGBA", (S, S), (0,0,0,0))

BLUE_2 = (98,160,234,255)
BLUE_4 = (28,113,216,255)
BLUE_5 = (26,95,180,255)
LIGHT_1 = (255,255,255,255)
DARK_2 = (94,92,100,255)
GREEN_5 = (38,162,105,255)
YELLOW_5 = (246,211,45,255)

margin = px(8)
left = margin
right = S - margin
top = margin
bottom = S - margin
radius = px(28)
profile_h = px(5)

# 1) darker "front face" shape
front = Image.new("RGBA", (S,S), (0,0,0,0))
ImageDraw.Draw(front).rounded_rectangle(
    [left, top+profile_h, right, bottom+profile_h], radius=radius, fill=BLUE_5)
img.alpha_composite(front)

# 2) top face with gradient
canvas = Image.new("RGBA", (S,S), (0,0,0,0))
cd = ImageDraw.Draw(canvas)
for y in range(top, bottom):
    t = (y - top) / max(1, (bottom - top))
    r = int(BLUE_2[0] + (BLUE_4[0]-BLUE_2[0])*t)
    g = int(BLUE_2[1] + (BLUE_4[1]-BLUE_2[1])*t)
    b = int(BLUE_2[2] + (BLUE_4[2]-BLUE_2[2])*t)
    cd.line([(left,y),(right,y)], fill=(r,g,b,255))
mask = Image.new("L",(S,S),0)
ImageDraw.Draw(mask).rounded_rectangle([left,top,right,bottom], radius=radius, fill=255)
img.paste(canvas, (0,0), mask)

draw = ImageDraw.Draw(img)

# symbol: receipt
r_w = px(46); r_h = px(56)
r_cx = S/2
r_top = top + px(20)
r_left = r_cx - r_w/2
r_right = r_cx + r_w/2
r_bottom = r_top + r_h

zig = []
teeth = 6
for i in range(teeth+1):
    x = r_left + (r_right-r_left) * i/teeth
    y = r_top + (px(4) if i % 2 == 0 else -px(2))
    zig.append((x,y))
poly = zig + [(r_right, r_bottom), (r_left, r_bottom)]

shadow = Image.new("RGBA",(S,S),(0,0,0,0))
sd = ImageDraw.Draw(shadow)
sd.polygon([(x,y+px(3)) for x,y in poly], fill=(0,0,0,55))
shadow = shadow.filter(ImageFilter.GaussianBlur(px(1.2)))
img.alpha_composite(shadow)
draw = ImageDraw.Draw(img)

draw.polygon(poly, fill=LIGHT_1)

line_x1 = r_left + px(9)
line_x2 = r_right - px(9)
for i, frac in enumerate([1.0, 0.68, 0.85]):
    y = r_top + px(15) + i*px(9)
    x2 = line_x1 + (line_x2-line_x1)*frac
    draw.line([(line_x1,y),(x2,y)], fill=DARK_2, width=px(2.6))

badge_r = px(11)
badge_cx = r_right - px(4)
badge_cy = r_bottom - px(6)

if variant == "stable":
    draw.ellipse([badge_cx-badge_r, badge_cy-badge_r, badge_cx+badge_r, badge_cy+badge_r], fill=GREEN_5)
    cw = px(1.8)
    draw.line([(badge_cx-px(5), badge_cy), (badge_cx-px(1.5), badge_cy+px(4))], fill=LIGHT_1, width=cw)
    draw.line([(badge_cx-px(1.5), badge_cy+px(4)), (badge_cx+px(5.5), badge_cy-px(4.5))], fill=LIGHT_1, width=cw)
else:
    # O frasco âmbar diferencia visualmente o canal experimental sem trocar a
    # identidade principal do Budget. O desenho é simples para continuar
    # legível em lançadores que exibem o ícone em 16 ou 32 pixels.
    draw.ellipse([badge_cx-badge_r, badge_cy-badge_r, badge_cx+badge_r, badge_cy+badge_r], fill=YELLOW_5)
    stroke = px(1.7)
    neck_left = badge_cx - px(2.5)
    neck_right = badge_cx + px(2.5)
    neck_top = badge_cy - px(6.5)
    shoulder_y = badge_cy - px(0.5)
    flask = [
        (neck_left, neck_top),
        (neck_right, neck_top),
        (neck_right, shoulder_y),
        (badge_cx + px(5.5), badge_cy + px(5.5)),
        (badge_cx - px(5.5), badge_cy + px(5.5)),
        (neck_left, shoulder_y),
    ]
    draw.line(flask + [flask[0]], fill=LIGHT_1, width=stroke, joint="curve")
    draw.line([(badge_cx-px(4), badge_cy+px(2)), (badge_cx+px(4), badge_cy+px(2))], fill=LIGHT_1, width=stroke)

final = img.resize((512,512), Image.LANCZOS)
filename = "icon-test.png" if variant == "test" else "icon.png"
out = Path(__file__).resolve().parent / filename
final.save(out)
print("saved", final.size, "→", out)
