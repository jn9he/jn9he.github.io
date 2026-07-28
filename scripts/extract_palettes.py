"""
ML Color & Silhouette Extraction Pipeline
Extracts color palettes and fish silhouettes from the Image Library.
"""

import argparse
import json
import os
import random
from pathlib import Path

import cv2
import numpy as np
from sklearn.cluster import KMeans


def get_eligible_families(input_dir: str, min_images: int = 20) -> list[str]:
    """Find families with at least min_images .jpg files."""
    families = []
    for entry in sorted(os.listdir(input_dir)):
        family_path = os.path.join(input_dir, entry)
        if not os.path.isdir(family_path):
            continue
        jpg_files = [
            f for f in os.listdir(family_path)
            if f.lower().endswith(('.jpg', '.jpeg'))
        ]
        if len(jpg_files) >= min_images:
            families.append(entry)
    return families


def extract_palette(family_path: str, num_samples: int = 30, k: int = 5) -> list[str]:
    """Extract k dominant colors from sampled images in a family directory."""
    jpg_files = [
        f for f in os.listdir(family_path)
        if f.lower().endswith(('.jpg', '.jpeg'))
    ]
    sampled = random.sample(jpg_files, min(num_samples, len(jpg_files)))

    all_pixels = []
    for filename in sampled:
        img_path = os.path.join(family_path, filename)
        img = cv2.imread(img_path)
        if img is None:
            continue
        # Resize to 100x100 for fast processing
        img = cv2.resize(img, (100, 100))
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        # Reshape to list of pixels
        pixels = img.reshape(-1, 3)
        all_pixels.append(pixels)

    if not all_pixels:
        return []

    all_pixels = np.vstack(all_pixels)

    # Filter out near-black (< 30) and near-white (> 225) pixels (likely backgrounds)
    mask = ~(
        (np.all(all_pixels < 30, axis=1)) |
        (np.all(all_pixels > 225, axis=1))
    )
    filtered_pixels = all_pixels[mask]

    if len(filtered_pixels) < k:
        return []

    # Run KMeans
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(filtered_pixels)

    # Convert cluster centers to hex
    colors = []
    for center in kmeans.cluster_centers_:
        r, g, b = int(center[0]), int(center[1]), int(center[2])
        colors.append(f"#{r:02x}{g:02x}{b:02x}")

    return colors


def extract_silhouette(family_path: str, target_points: int = 18) -> list[list[float]]:
    """Extract a simplified silhouette from a representative image."""
    jpg_files = [
        f for f in os.listdir(family_path)
        if f.lower().endswith(('.jpg', '.jpeg'))
    ]
    if not jpg_files:
        return []

    # Pick a representative image (middle of sorted list for consistency)
    jpg_files.sort()
    representative = jpg_files[len(jpg_files) // 2]
    img_path = os.path.join(family_path, representative)

    img = cv2.imread(img_path)
    if img is None:
        return []

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Otsu threshold
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        # Try without inversion
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return []

    # Find the largest contour
    largest_contour = max(contours, key=cv2.contourArea)

    # Approximate the contour to target_points
    # Iteratively adjust epsilon to get close to target number of points
    perimeter = cv2.arcLength(largest_contour, True)
    epsilon = 0.01 * perimeter
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)

    # Adjust epsilon to get 15-20 points
    for _ in range(50):
        if len(approx) > 20:
            epsilon *= 1.2
        elif len(approx) < 15:
            epsilon *= 0.8
        else:
            break
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)

    # If we still can't get 15-20, just use what we have
    if len(approx) < 3:
        return []

    # Normalize coordinates to 0-1 range
    h, w = img.shape[:2]
    points = []
    for point in approx:
        x = round(float(point[0][0]) / w, 4)
        y = round(float(point[0][1]) / h, 4)
        points.append([x, y])

    return points


def main():
    parser = argparse.ArgumentParser(description="Extract color palettes and silhouettes from fish images")
    parser.add_argument("--input-dir", required=True, help="Path to Image_Library directory")
    parser.add_argument("--output-dir", default="src/data/", help="Path to output directory for JSON files")
    args = parser.parse_args()

    input_dir = args.input_dir
    output_dir = args.output_dir

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    print(f"Scanning {input_dir} for eligible families...")
    eligible_families = get_eligible_families(input_dir, min_images=20)
    print(f"Found {len(eligible_families)} families with 20+ images")

    # Select up to 40 families
    if len(eligible_families) > 40:
        # Pick 40 evenly spaced families for diversity
        step = len(eligible_families) / 40
        selected_families = [eligible_families[int(i * step)] for i in range(40)]
    else:
        selected_families = eligible_families

    print(f"Selected {len(selected_families)} families for processing")

    palettes = {}
    silhouettes = {}

    for i, family in enumerate(selected_families):
        family_path = os.path.join(input_dir, family)
        print(f"[{i+1}/{len(selected_families)}] Processing {family}...")

        # Extract palette
        palette = extract_palette(family_path)
        if palette:
            palettes[family] = palette

        # Extract silhouette
        silhouette = extract_silhouette(family_path)
        if silhouette:
            silhouettes[family] = silhouette

    # Write output JSON files
    palettes_path = os.path.join(output_dir, "palettes.json")
    silhouettes_path = os.path.join(output_dir, "silhouettes.json")

    with open(palettes_path, "w") as f:
        json.dump(palettes, f, indent=2)
    print(f"Wrote {len(palettes)} palettes to {palettes_path}")

    with open(silhouettes_path, "w") as f:
        json.dump(silhouettes, f, indent=2)
    print(f"Wrote {len(silhouettes)} silhouettes to {silhouettes_path}")

    print("Done!")


if __name__ == "__main__":
    main()
