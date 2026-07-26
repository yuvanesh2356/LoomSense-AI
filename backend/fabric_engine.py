"""Phase 10: Fabric Image Recognition.

NOTE: this is a heuristic color/hue/saturation analysis over the actual
uploaded image (via Pillow) — it genuinely processes the image, but it is
NOT a trained computer-vision model. Wiring a real classifier or a Gemini
Vision call is an explicit Phase 12 item; this function is the single,
isolated swap point for that — its signature and return shape don't need
to change when that happens.
"""
import colorsys
from io import BytesIO
from PIL import Image

import planner_engine


def analyze_image(image_bytes: bytes) -> dict:
    img = Image.open(BytesIO(image_bytes)).convert("RGB").resize((50, 50))
    pixels = list(img.getdata())
    n = len(pixels)
    r = sum(p[0] for p in pixels) / n
    g = sum(p[1] for p in pixels) / n
    b = sum(p[2] for p in pixels) / n
    hex_color = "#{:02X}{:02X}{:02X}".format(int(r), int(g), int(b))

    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue_deg = h * 360

    if s < 0.15:
        hue_bucket = "Neutral"
    elif hue_deg < 30 or hue_deg >= 330:
        hue_bucket = "Red/Maroon"
    elif hue_deg < 70:
        hue_bucket = "Gold/Yellow"
    elif hue_deg < 170:
        hue_bucket = "Green"
    elif hue_deg < 260:
        hue_bucket = "Blue/Indigo"
    else:
        hue_bucket = "Purple/Pink"

    if s > 0.55 and v > 0.5:
        predicted_category = "Silk Saree"
        pattern = f"Vibrant {hue_bucket.lower()} silk-weave pattern"
    elif s > 0.3:
        predicted_category = "Silk-Cotton Saree"
        pattern = f"Blended {hue_bucket.lower()} weave pattern"
    else:
        predicted_category = "Cotton Saree"
        pattern = f"Muted {hue_bucket.lower()} cotton weave pattern"

    return {
        "avg_color_hex": hex_color,
        "hue_bucket": hue_bucket,
        "detected_pattern": pattern,
        "predicted_category": predicted_category,
        "estimated_price": planner_engine.UNIT_PRICE.get(predicted_category, 1200),
    }