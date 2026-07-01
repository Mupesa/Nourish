"""Validate prepared recipe images and optionally approve a reviewed batch."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "content" / "recipes" / "image-manifest.json"
REPORT_PATH = ROOT / "content" / "recipes" / "image-validation-report.json"
EXPECTED_SIZE = (1200, 800)
MIN_BYTES = 150_000
MAX_BYTES = 400_000


def difference_hash(image: Image.Image) -> int:
    sample = image.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    pixels = list(sample.get_flattened_data())
    bits = 0
    for row in range(8):
        offset = row * 9
        for column in range(8):
            bits = (bits << 1) | (
                pixels[offset + column] > pixels[offset + column + 1]
            )
    return bits


def hamming_distance(left: int, right: int) -> int:
    return (left ^ right).bit_count()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--expected",
        type=int,
        default=100,
        help="Number of prepared images expected at this checkpoint.",
    )
    parser.add_argument(
        "--approve-through",
        type=int,
        default=0,
        help="Mark IDs up to this number approved when all automated checks pass.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest: list[dict[str, Any]] = json.loads(
        MANIFEST_PATH.read_text(encoding="utf-8")
    )
    prepared = [
        item for item in manifest if (ROOT / item["deliveryFile"]).exists()
    ]
    errors: list[str] = []
    warnings: list[str] = []
    hashes: list[tuple[str, int]] = []
    files: list[dict[str, Any]] = []

    if len(prepared) != args.expected:
        errors.append(
            f"Expected {args.expected} prepared images, found {len(prepared)}."
        )

    for item in prepared:
        path = ROOT / item["deliveryFile"]
        try:
            with Image.open(path) as image:
                image.load()
                dimensions = image.size
                image_format = image.format
                image_hash = difference_hash(image)
        except Exception as error:  # pragma: no cover - diagnostic path
            errors.append(f'{item["recipeId"]}: unreadable image ({error})')
            continue

        size_bytes = path.stat().st_size
        if dimensions != EXPECTED_SIZE:
            errors.append(
                f'{item["recipeId"]}: dimensions {dimensions}, expected {EXPECTED_SIZE}'
            )
        if image_format != "WEBP":
            errors.append(f'{item["recipeId"]}: format {image_format}, expected WEBP')
        if not MIN_BYTES <= size_bytes <= MAX_BYTES:
            warnings.append(
                f'{item["recipeId"]}: {size_bytes} bytes outside '
                f"{MIN_BYTES}-{MAX_BYTES} target"
            )

        hashes.append((item["recipeId"], image_hash))
        files.append(
            {
                "recipeId": item["recipeId"],
                "bytes": size_bytes,
                "width": dimensions[0],
                "height": dimensions[1],
                "format": image_format,
            }
        )

    duplicate_candidates: list[dict[str, Any]] = []
    for index, (left_id, left_hash) in enumerate(hashes):
        for right_id, right_hash in hashes[index + 1 :]:
            distance = hamming_distance(left_hash, right_hash)
            if distance <= 4:
                duplicate_candidates.append(
                    {"left": left_id, "right": right_id, "distance": distance}
                )
    if duplicate_candidates:
        errors.append(
            f"Found {len(duplicate_candidates)} perceptual duplicate candidate(s)."
        )

    passed = not errors
    if passed and args.approve_through:
        for item in manifest:
            number = int(item["recipeId"].split("-")[-1])
            if (
                number <= args.approve_through
                and (ROOT / item["deliveryFile"]).exists()
            ):
                item["qaStatus"] = "approved"
        MANIFEST_PATH.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    report = {
        "passed": passed,
        "expected": args.expected,
        "prepared": len(prepared),
        "approvedThrough": args.approve_through if passed else 0,
        "targetBytes": {"minimum": MIN_BYTES, "maximum": MAX_BYTES},
        "errors": errors,
        "warnings": warnings,
        "perceptualDuplicateCandidates": duplicate_candidates,
        "files": files,
    }
    REPORT_PATH.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({key: report[key] for key in report if key != "files"}, indent=2))
    if not passed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
