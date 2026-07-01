"""Compress generated recipe masters and build a visual QA contact sheet.

Requires Pillow:
    python -m pip install pillow

The script reads content/recipes/image-manifest.json, converts available
masters to 1200x800 WebP delivery files, updates their manifest status, and
creates content/recipes/contact-sheet.jpg.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "content" / "recipes" / "image-manifest.json"
CONTACT_SHEET = ROOT / "content" / "recipes" / "contact-sheet.jpg"
DELIVERY_SIZE = (1200, 800)


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_ratio = size[0] / size[1]
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        new_width = round(image.height * target_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    else:
        new_height = round(image.width / target_ratio)
        top = (image.height - new_height) // 2
        image = image.crop((0, top, image.width, top + new_height))
    return image.resize(size, Image.Resampling.LANCZOS)


def prepare_item(item: dict[str, Any]) -> bool:
    master = ROOT / item["sourceMaster"]
    delivery = ROOT / item["deliveryFile"]
    if not master.exists():
        return False
    delivery.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(master) as source:
        rgb = cover_crop(source.convert("RGB"), DELIVERY_SIZE)
        rgb.save(delivery, "WEBP", quality=88, method=6)
    item["generationStatus"] = "generated"
    if item.get("qaStatus") != "approved":
        item["qaStatus"] = "pending"
    item["deliveryBytes"] = delivery.stat().st_size
    return True


def build_contact_sheet(items: list[dict[str, Any]]) -> None:
    available = [item for item in items if (ROOT / item["deliveryFile"]).exists()]
    if not available:
        return
    columns = 4
    tile_w, tile_h = 360, 280
    rows = (len(available) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * tile_w, rows * tile_h), "#f5fbf2")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, item in enumerate(available):
        row, col = divmod(index, columns)
        x, y = col * tile_w, row * tile_h
        with Image.open(ROOT / item["deliveryFile"]) as image:
            thumb = cover_crop(image.convert("RGB"), (340, 220))
        sheet.paste(thumb, (x + 10, y + 10))
        label = f'{item["recipeId"]}  {item["title"]}'
        draw.text((x + 12, y + 238), label[:52], fill="#171d18", font=font)
    CONTACT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(CONTACT_SHEET, "JPEG", quality=90)


def main() -> None:
    items = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    prepared = sum(prepare_item(item) for item in items)
    build_contact_sheet(items)
    MANIFEST_PATH.write_text(
        json.dumps(items, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Prepared {prepared} recipe images; contact sheet: {CONTACT_SHEET}")


if __name__ == "__main__":
    main()
