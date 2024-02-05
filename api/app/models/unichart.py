import logging
from PIL import Image
from transformers import DonutProcessor, VisionEncoderDecoderModel
from app.models.base import BaseModel


CKPT = "ahmed-masry/unichart-base-960"


class UniChartModel(BaseModel):
    """Wrapper for UniChart models.
    """
    def __init__(self, ckpt: str = CKPT, device: str = "cpu"):
        """Initialize a UniChart model.

        Args:
            ckpt (str, optional): Checkpoint path. Defaults to CKPT.
            device (str, optional): Device to load to. Defaults to "cpu".
        """
        super().__init__(ckpt, device)

        self.model = VisionEncoderDecoderModel.from_pretrained(self.ckpt).to(device)
        self.processor = DonutProcessor.from_pretrained(self.ckpt)

    def __call__(
        self,
        image_path: str,
        input_prompt: str = "<extract_data_table>",
        max_tokens: int = 512
    ) -> str:
        """Extract the data table from a given figure (or potentially any other prompt accessible UniChart methods).

        Args:
            image_path (str): Path to the image.
            input_prompt (str, optional): Input prompt to use. Defaults to "<extract_data_table>".
            max_tokens (int, optional): Maximum output tokens to generate. Defaults to 512.

        Returns:
            str: Generated text (typically corresponding to a data table).
        """
        image = Image.open(image_path).convert("RGB")
        input_prompt += " <s_answer>"
        decoder_input_ids = self.processor.tokenizer(input_prompt, add_special_tokens=False, return_tensors="pt").input_ids
        pixel_values = self.processor(image, return_tensors="pt").pixel_values

        # Generation params are taken from the demo: https://huggingface.co/spaces/ahmed-masry/UniChart-Base
        # We override max_length to be max_tokens
        outputs = self.model.generate(
            pixel_values.to(self.device),
            decoder_input_ids=decoder_input_ids.to(self.device),
            max_length=max_tokens,
            early_stopping=True,
            pad_token_id=self.processor.tokenizer.pad_token_id,
            eos_token_id=self.processor.tokenizer.eos_token_id,
            use_cache=True,
            num_beams=4,
            bad_words_ids=[[self.processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True,
        )
        sequence = self.processor.batch_decode(outputs.sequences)[0]
        sequence = sequence.replace(self.processor.tokenizer.eos_token, "").replace(self.processor.tokenizer.pad_token, "")

        # Replace the RegEx from the demo with a simpler, more robust solution
        return sequence[sequence.find("<s_answer>") + len("<s_answer>"):].strip()
