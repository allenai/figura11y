import torch
import torch.nn as  nn
from torchvision import models, transforms
from PIL import Image

# Original label names set from DocFigure (we swap out "Graph plots" -> "Line plot" as the authors do in their paper, not their code)
labelNames = [
    "3D objects",
    "Algorithm",
    "Area chart",
    "Bar plots",
    "Block diagram",
    "Box plot",
    "Bubble Chart",
    "Confusion matrix",
    "Contour plot",
    "Flow chart",
    "Geographic map",
    "Graph plots",
    "Heat map",
    "Histogram",
    "Mask",
    "Medical images",
    "Natural images",
    "Pareto charts",
    "Pie chart",
    "Polar plot",
    "Radar chart",
    "Scatter plot",
    "Sketches",
    "Surface plot",
    "Tables",
    "Tree Diagram",
    "Vector plot",
    "Venn Diagram"
]

# Set of figure types we support with specially selected guidelines for prompting
permittedLabelNames = set([
    "Area chart",
    "Bar plots",
    "Block diagram",
    "Box plot",
    "Bubble chart",
    "Confusion matrix",
    "Flow chart",
    "Line plot",
    "Histogram",
    "Pareto charts",
    "Pie chart",
    "Polar plot",
    "Radar chart",
    "Scatter plot",
    "Sketches",
    "Tree Diagram",
    "Venn Diagram"
])


class ClassificationService:
    """Service for classifying figures.
    """
    def __init__(self, model_path: str) -> None:
        """Initialize classifier.

        Args:
            model_path (str): Path to the DocFigure model checkpoint.
        """

        # Most of this code taken from the DocFigure repo: https://github.com/jobinkv/DocFigure
        self.model_path = model_path
        self.model =  models.resnext101_32x8d()
        num_features = self.model.fc.in_features
        fc = list(self.model.fc.children()) # Remove last layer
        fc.extend([nn.Linear(num_features, 28)]) # Add our layer with 4 outputs
        self.model.fc = nn.Sequential(*fc)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.eval()
        self.mean_std = (
            [.485, .456, .406],
            [.229, .224, .225]
        )
        self.t = transforms.Compose([
            transforms.Resize((384, 384), interpolation=Image.Resampling.LANCZOS),
            transforms.ToTensor(),
            transforms.Normalize(*self.mean_std)
        ])

    def classify(self, image: str | Image.Image) -> str:
        """Classify a given figure.

        Args:
            image (str | Image.Image): Path to the image or a pre-loaded PIL.Image.

        Returns:
            str: THe detected figure type (label only, or "Other" if not in permittedLabelNames).
        """
        if isinstance(image, str):
            image = Image.open(image).convert("RGB")
        img_tensor = self.t(image)
        fig_label = self.model(img_tensor.to(self.device).unsqueeze(0))
        fig_prediction = fig_label.max(1)[1]
        label = labelNames[fig_prediction]
        if label not in permittedLabelNames:
            label = "Other"
        return label
