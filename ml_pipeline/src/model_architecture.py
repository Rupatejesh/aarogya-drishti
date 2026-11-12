"""
Aarogya Drishti - Transfer Learning Architecture for Oral Lesion Classification
Employs MobileNetV3-Large or EfficientNet-B0 with custom clinical head for 4-class triage.
"""

import torch
import torch.nn as nn
from torchvision import models

class OralOncologyClassifier(nn.Module):
    def __init__(self, num_classes: int = 4, architecture: str = "mobilenet_v3_large", pretrained: bool = True):
        super(OralOncologyClassifier, self).__init__()
        self.architecture = architecture

        if architecture == "mobilenet_v3_large":
            try:
                weights = models.MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
                base_model = models.mobilenet_v3_large(weights=weights)
            except Exception:
                base_model = models.mobilenet_v3_large(weights=None)
            in_features = base_model.classifier[0].in_features
            base_model.classifier = nn.Sequential(
                nn.Linear(in_features, 512),
                nn.Hardswish(),
                nn.Dropout(p=0.3),
                nn.Linear(512, 128),
                nn.Hardswish(),
                nn.Dropout(p=0.2),
                nn.Linear(128, num_classes)
            )
            self.model = base_model

        elif architecture == "efficientnet_b0":
            try:
                weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
                base_model = models.efficientnet_b0(weights=weights)
            except Exception:
                base_model = models.efficientnet_b0(weights=None)
            in_features = base_model.classifier[1].in_features
            base_model.classifier = nn.Sequential(
                nn.Dropout(p=0.3),
                nn.Linear(in_features, 256),
                nn.SiLU(),
                nn.Dropout(p=0.2),
                nn.Linear(256, num_classes)
            )
            self.model = base_model
        else:
            raise ValueError(f"Unsupported architecture: {architecture}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)

    def predict_probabilities(self, x: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            logits = self.forward(x)
            return torch.softmax(logits, dim=1)

if __name__ == "__main__":
    net = OralOncologyClassifier(num_classes=4)
    dummy_input = torch.randn(2, 3, 224, 224)
    out = net(dummy_input)
    print("Model initialized successfully. Output shape:", out.shape)

