from app.models.pix2struct import Pix2StructModel
from app.models.unichart import UniChartModel


# Add new models here for data table extraction from plots
MODELS = {
    "pix2struct": Pix2StructModel,
    "unichart": UniChartModel
}


class Plot2TextService:
    """Service for extracting underlying data tables from plots.
    """
    def __init__(self, model_name: str = "unichart", device: str = "cpu") -> None:
        """Initialize the Plot2Text service.

        Args:
            model_name (str, optional): Which model to use. Defaults to "unichart" (more CPU-friendly, for now).
            device (str, optional): Device to load to. Defaults to "cpu".
        """
        self.model_name = model_name.lower()
        self.device = device

        self.model = MODELS[self.model_name](device=self.device)

    def get_datatable(
        self,
        image_path: str,
        datatable_prompt: str = "<extract_data_table>" # UniChart uses this prompt
    ) -> str:
        """Extract the underlying data table from a plot.

        Args:
            image_path (str): Path to image file.
            datatable_prompt (str, optional): Prompt to provide to the model. Defaults to "<extract_data_table>" (UniChart).

        Returns:
            str: The extracted data table.
        """
        return self.model(
            image_path,
            datatable_prompt
        )
