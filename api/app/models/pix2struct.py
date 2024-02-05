from PIL import Image
from transformers import Pix2StructForConditionalGeneration, Pix2StructProcessor
from app.models.base import BaseModel


CKPT = "google/deplot"


class Pix2StructModel(BaseModel):
    """Wrapper for Pix2Struct models.
    """
    def __init__(self, ckpt: str = CKPT, device: str = "cpu"):
        """Initialize a Pix2Struct model.

        Args:
            ckpt (str, optional): Checkpoint path. Defaults to CKPT.
            device (str, optional): Device to load to. Defaults to "cpu".
        """
        super().__init__(ckpt, device)

        self.model = Pix2StructForConditionalGeneration.from_pretrained(self.ckpt).to(self.device)
        self.processor = Pix2StructProcessor.from_pretrained(self.ckpt)

    def __call__(
        self,
        image_path: str,
        input_prompt: str,
        max_tokens: int = 1024
    ) -> str:
        """Extract the data table from a given figure (or potentially any other prompt accessible Pix2Struct methods).

        Args:
            image_path (str): Path to the image.
            input_prompt (str): Input prompt to use.
            max_tokens (int, optional): Maximum output tokens to generate. Defaults to 1024.

        Returns:
            str: Generated text (typically corresponding to a data table).
        """
        image = Image.open(image_path)
        inputs = self.processor(images=image, text=input_prompt, return_tensors="pt").to(self.device)
        predictions = self.model.generate(**inputs, max_new_tokens=max_tokens)
        return self.processor.decode(predictions[0], skip_special_tokens=True).replace("<0x0A>", "\n")
