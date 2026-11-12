# Aarogya Drishti — Machine Learning Oral Screening Training Pipeline

This directory contains the custom PyTorch training pipeline for classifying oral cavity mucosal images into 4 clinical triage categories:
1. `normal`: Healthy pink oral mucosa (ICD-10: Z01.20)
2. `benign_lesions`: Aphthous stomatitis, frictional hyperkeratosis, traumatic ulcers (ICD-10: K12.0)
3. `opmd_leukoplakia`: Oral Leukoplakia, Erythroplakia, Oral Submucous Fibrosis [OSMF] (ICD-10: K13.21, K13.5)
4. `oral_squamous_carcinoma`: Chronic indurated, exophytic, or suspected OSCC lesions (ICD-10: C06.0)

---

## 1. Quick Setup

```bash
cd ml_pipeline
pip install -r requirements.txt
```

---

## 2. Adding Images to the Dataset

Drop your clinical oral JPEG/PNG photos into the appropriate class folder in `data/raw/`:
```text
ml_pipeline/
├── data/
│   └── raw/
│       ├── normal/                     <- Healthy oral cavity photos
│       ├── benign_lesions/             <- Aphthae, traumatic keratosis
│       ├── opmd_leukoplakia/           <- White plaques, OSMF, speckled patches
│       └── oral_squamous_carcinoma/    <- Biopsy-confirmed malignant or high-risk ulcers
```

---

## 3. Training the Model

Run the training script with default MobileNetV3-Large (ideal for fast edge/mobile inference in rural tribal spokes):
```bash
cd src
python train.py --epochs 25 --batch_size 32 --architecture mobilenet_v3_large
```

Or train using EfficientNet-B0:
```bash
python train.py --epochs 30 --batch_size 16 --architecture efficientnet_b0 --lr 0.0002
```

Trained weights will be saved automatically to `ml_pipeline/models/aarogya_drishti_<arch>_best.pt`.

