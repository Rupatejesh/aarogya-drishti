"""
Aarogya Drishti - Model Training and Validation Script
Trains MobileNetV3 / EfficientNet on clinical oral lesion dataset using AdamW and CrossEntropyLoss.
Outputs loss, validation accuracy per epoch, final scikit-learn classification report,
and saves the trained weights to ml_pipeline/models/best_oral_model.pt.
"""

from pathlib import Path
import argparse
import time
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import classification_report, confusion_matrix

from dataset_loader import create_data_loaders, DATA_DIR, OUTPUT_DIR
from model_architecture import OralOncologyClassifier

# 1. Resolving absolute paths relative to script location
BASE_DIR = Path(__file__).resolve().parent.parent


def train_model(
    data_dir: Path = DATA_DIR,
    output_dir: Path = OUTPUT_DIR,
    architecture: str = "mobilenet_v3_large",
    epochs: int = 5,
    batch_size: int = 16,
    lr: float = 3e-4,
    device_name: str = "auto"
):
    resolved_data_dir = Path(data_dir).resolve()
    resolved_output_dir = Path(output_dir).resolve()
    resolved_output_dir.mkdir(parents=True, exist_ok=True)

    if device_name == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(device_name)

    print("=" * 72)
    print(f"[*] AAROGYA DRISHTI - ORAL ONCOLOGY PYTORCH TRAINING PIPELINE")
    print(f"[*] Base Directory   : {BASE_DIR}")
    print(f"[*] Dataset Directory: {resolved_data_dir}")
    print(f"[*] Output Directory : {resolved_output_dir}")
    print(f"[*] Target Hardware  : {device}")
    print(f"[*] Architecture     : {architecture}")
    print(f"[*] Epochs           : {epochs} | Batch Size: {batch_size} | LR: {lr}")
    print("=" * 72)

    train_loader, val_loader, class_names = create_data_loaders(
        data_dir=resolved_data_dir,
        batch_size=batch_size,
        val_split=0.2,
        num_workers=0
    )
    print(f"[*] Clinical Triage Classes ({len(class_names)}): {class_names}")

    model = OralOncologyClassifier(
        num_classes=len(class_names),
        architecture=architecture,
        pretrained=True
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    best_model_path = resolved_output_dir / "best_oral_model.pt"

    print(f"\n[*] Starting training loop for {epochs} epochs...")
    for epoch in range(1, epochs + 1):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)

        scheduler.step()
        train_loss = running_loss / max(total_train, 1)
        train_acc = (correct_train / max(total_train, 1)) * 100

        # Validation Loop
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)

        epoch_val_loss = val_loss / max(total_val, 1)
        epoch_val_acc = (correct_val / max(total_val, 1)) * 100
        elapsed = time.time() - start_time

        print(
            f"Epoch {epoch:02d}/{epochs:02d} [{elapsed:.1f}s] | "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
            f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.2f}%"
        )

        if epoch_val_acc >= best_val_acc or epoch == 1:
            best_val_acc = epoch_val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "classes": class_names,
                "val_accuracy": best_val_acc,
                "architecture": architecture
            }, str(best_model_path))
            print(f"  --> [✓] Saved best model checkpoint: {best_model_path.name} (Val Acc: {best_val_acc:.2f}%)")

    print("\n" + "=" * 72)
    print(f"[✓] Training Completed Successfully! Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"[✓] Checkpoint successfully saved to: {best_model_path}")
    print("=" * 72)

    # Final Classification Report on Validation Set
    print("\n[*] Generating Final Clinical Classification Report on Validation Set...")
    model.eval()
    all_targets = []
    all_preds = []

    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_targets.extend(labels.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())

    report = classification_report(
        all_targets,
        all_preds,
        target_names=class_names,
        zero_division=0
    )
    print("\n" + report)

    cm = confusion_matrix(all_targets, all_preds)
    print("[*] Confusion Matrix:")
    print(cm)
    print("=" * 72)

    return best_model_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Aarogya Drishti Oral Lesion Classifier")
    parser.add_argument("--data_dir", type=str, default=str(DATA_DIR), help="Path to raw image dataset")
    parser.add_argument("--output_dir", type=str, default=str(OUTPUT_DIR), help="Directory to save model weights")
    parser.add_argument("--architecture", type=str, default="mobilenet_v3_large", choices=["mobilenet_v3_large", "efficientnet_b0"])
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    args = parser.parse_args()

    train_model(
        data_dir=Path(args.data_dir),
        output_dir=Path(args.output_dir),
        architecture=args.architecture,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr
    )
