"""
Aarogya Drishti - Oral Oncology Multimodal Image Dataset Loader
Applies clinical data augmentations and standardized normalizations for MobileNetV3 / EfficientNet.
Includes resilient self-bootstrapping generator for synthetic clinical oral placeholder images.
"""

from pathlib import Path
from typing import Tuple, List
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import torch
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import datasets, transforms

# 1. Resolving absolute paths relative to script location
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
OUTPUT_DIR = BASE_DIR / "models"

TARGET_CLASSES = [
    "normal",
    "benign_lesions",
    "opmd_leukoplakia",
    "oral_squamous_carcinoma"
]

VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def generate_synthetic_oral_sample(class_name: str, seed_index: int) -> Image.Image:
    """
    Generates a 224x224 RGB PNG simulating oral mucosa and clinical lesion markers.
    """
    rng = np.random.RandomState(seed_index * 137 + abs(hash(class_name)) % 10000)

    # 1. Base realistic oral mucosal tissue (pinkish-red vascularized gradient)
    base = np.zeros((224, 224, 3), dtype=np.uint8)
    base[..., 0] = np.clip(rng.normal(212, 14, (224, 224)), 160, 255)  # Red channel
    base[..., 1] = np.clip(rng.normal(112, 14, (224, 224)), 65, 160)   # Green channel
    base[..., 2] = np.clip(rng.normal(122, 14, (224, 224)), 75, 170)   # Blue channel

    img = Image.fromarray(base)
    img = img.filter(ImageFilter.GaussianBlur(radius=2.5))
    draw = ImageDraw.Draw(img)

    # Center location with slight jitter
    cx = 112 + int(rng.randint(-25, 25))
    cy = 112 + int(rng.randint(-25, 25))

    if class_name == "normal":
        # Healthy smooth mucosa: soft specular light reflections and fine mucosal sheen
        draw.ellipse([cx - 45, cy - 25, cx + 45, cy + 25], fill=(238, 148, 158))
        draw.ellipse([cx - 20, cy - 10, cx + 20, cy + 10], fill=(248, 185, 192))
        # Microvascular striations
        for _ in range(4):
            x1, y1 = cx + int(rng.randint(-50, 50)), cy + int(rng.randint(-50, 50))
            x2, y2 = x1 + int(rng.randint(-30, 30)), y1 + int(rng.randint(-30, 30))
            draw.line([(x1, y1), (x2, y2)], fill=(185, 60, 75), width=1)

    elif class_name == "benign_lesions":
        # Aphthous / traumatic ulcer: intensely erythematous inflammatory halo
        halo_r = int(rng.randint(30, 42))
        draw.ellipse([cx - halo_r, cy - halo_r, cx + halo_r, cy + halo_r], fill=(175, 42, 52))
        # Fibrinous necrotic yellowish-white central crater
        crater_r = int(halo_r * 0.55)
        draw.ellipse([cx - crater_r, cy - crater_r, cx + crater_r, cy + crater_r], fill=(236, 228, 172))

    elif class_name == "opmd_leukoplakia":
        # Pre-cancerous leukoplakia: irregular, corrugated, thick non-scrapable white plaque
        pts = [
            (cx - int(rng.randint(30, 50)), cy - int(rng.randint(15, 30))),
            (cx - int(rng.randint(10, 25)), cy - int(rng.randint(35, 55))),
            (cx + int(rng.randint(25, 45)), cy - int(rng.randint(20, 35))),
            (cx + int(rng.randint(35, 55)), cy + int(rng.randint(20, 40))),
            (cx + int(rng.randint(0, 20)), cy + int(rng.randint(35, 50))),
            (cx - int(rng.randint(30, 45)), cy + int(rng.randint(20, 35)))
        ]
        draw.polygon(pts, fill=(244, 244, 238))
        # Internal keratotic texture lines
        for _ in range(5):
            lx = cx + int(rng.randint(-25, 25))
            ly = cy + int(rng.randint(-20, 20))
            draw.line([(lx - 12, ly), (lx + 12, ly + int(rng.randint(-4, 4)))], fill=(215, 215, 205), width=1)

    elif class_name == "oral_squamous_carcinoma":
        # Malignant oral squamous cell carcinoma: indurated everted borders + central necrotic ulceration
        tumor_r = int(rng.randint(42, 58))
        draw.ellipse([cx - tumor_r, cy - tumor_r, cx + tumor_r, cy + tumor_r], fill=(125, 22, 32))
        # Deep dark necrotic ulcer core
        core_r = int(tumor_r * 0.58)
        draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(55, 12, 18))
        # Hemorrhagic crusting and micro-nodularity
        for _ in range(6):
            nx = cx + int(rng.randint(-int(tumor_r * 0.7), int(tumor_r * 0.7)))
            ny = cy + int(rng.randint(-int(tumor_r * 0.7), int(tumor_r * 0.7)))
            nr = int(rng.randint(4, 8))
            draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=(195, 85, 95))

    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    return img


def bootstrap_dataset_if_needed(data_dir: Path, target_samples_per_class: int = 25) -> None:
    """
    Checks each class subfolder. If empty or missing, generates synthetic clinical placeholder
    oral images (224x224 RGB PNGs) so training executes end-to-end with zero FileNotFoundError.
    """
    data_dir.mkdir(parents=True, exist_ok=True)

    for class_name in TARGET_CLASSES:
        class_folder = data_dir / class_name
        class_folder.mkdir(parents=True, exist_ok=True)

        existing_images = [
            f for f in class_folder.glob("*")
            if f.is_file() and f.suffix.lower() in VALID_IMAGE_EXTENSIONS
        ]

        needed = target_samples_per_class - len(existing_images)
        if needed > 0:
            print(f"[*] Bootstrapping class '{class_name}': found {len(existing_images)}, generating {needed} synthetic oral images...")
            for i in range(needed):
                synthetic_img = generate_synthetic_oral_sample(class_name, seed_index=len(existing_images) + i + 1)
                img_path = class_folder / f"synthetic_{class_name}_{len(existing_images) + i + 1:03d}.png"
                synthetic_img.save(img_path, format="PNG")
        else:
            print(f"[✓] Class '{class_name}' verified: {len(existing_images)} images present.")


def get_transforms(img_size: int = 224):
    """
    Returns clinical training and validation torchvision transforms.
    """
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return train_transform, val_transform


class TransformedSubset(Dataset):
    """
    Applies custom transforms onto PyTorch Subset instances.
    """
    def __init__(self, subset, transform=None):
        self.subset = subset
        self.transform = transform

    def __getitem__(self, idx):
        x, y = self.subset[idx]
        if self.transform is not None:
            x = self.transform(x)
        return x, y

    def __len__(self):
        return len(self.subset)


def create_data_loaders(
    data_dir: Path = DATA_DIR,
    batch_size: int = 16,
    val_split: float = 0.2,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, List[str]]:
    """
    Loads raw oral image folder structure with resolved paths, splits into train/val subsets,
    and returns PyTorch DataLoaders.
    """
    resolved_data_dir = Path(data_dir).resolve()

    # Self-bootstrap dataset if folders are empty
    bootstrap_dataset_if_needed(resolved_data_dir, target_samples_per_class=25)

    train_tf, val_tf = get_transforms()

    # Base dataset loads raw PIL images (without transform so splits receive distinct transforms)
    raw_dataset = datasets.ImageFolder(root=str(resolved_data_dir), transform=None)
    classes = raw_dataset.classes

    val_size = max(int(len(raw_dataset) * val_split), 1)
    train_size = len(raw_dataset) - val_size

    generator = torch.Generator().manual_seed(42)
    train_raw_subset, val_raw_subset = random_split(raw_dataset, [train_size, val_size], generator=generator)

    train_dataset = TransformedSubset(train_raw_subset, transform=train_tf)
    val_dataset = TransformedSubset(val_raw_subset, transform=val_tf)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=False
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False
    )

    return train_loader, val_loader, classes


if __name__ == "__main__":
    print("[*] Testing dataset loader with path:", DATA_DIR)
    train_l, val_l, cls_names = create_data_loaders(DATA_DIR, batch_size=16)
    print(f"[✓] DataLoaders initialized. Classes: {cls_names}")
    print(f"[✓] Train batches: {len(train_l)}, Val batches: {len(val_l)}")
