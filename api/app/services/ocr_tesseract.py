import numpy
import pandas
import pytesseract as pt
from PIL import Image


class OCRService:
    """OCR service. Note that this will preserve the layout of the text, as much as possible, in the output string.
    """
    def __init__(
        self,
        grid_size: tuple[int, int] = (40, 100),
        config: str = "--psm 12"
    ) -> None:
        """Initialize the OCR service.

        Args:
            grid_size (tuple[int, int], optional): Dimensions of the grid in characters. Defaults to (40, 100).
            config (str, optional): Tesseract config. Defaults to "--psm 12" based on early experiments.
        """
        self.grid_size = grid_size
        self.config = config

    def get_text(self, image_path: str) -> str:
        grid = numpy.full(self.grid_size, " ", dtype=str)

        # Get OCR results with bounding boxes
        df = pt.image_to_data(Image.open(image_path), config=self.config, output_type=pt.Output.DATAFRAME)
        df = df.dropna(subset=["text"])

        print(df)

        # Normalize coordinates per grid
        df["left_scaled"] = (df["left"] / (df["left"] + df["width"]).max() * (self.grid_size[1] - 1)).astype(int)
        df["top_scaled"] = (df["top"] / (df["top"] + df["height"]).max() * (self.grid_size[0] - 1)).astype(int)

        # Place words according to scaled coordinates
        for _, row in df.iterrows():
            word, left, top = row["text"], row["left_scaled"], row["top_scaled"]
            word = word[:self.grid_size[1] - left]
            grid[top, left:left+len(word)] = list(word)

        # Grid -> string
        ascii_lines = ["".join(row).rstrip() for row in grid]
        while ascii_lines and not ascii_lines[0].strip():
            ascii_lines.pop(0)
        while ascii_lines and not ascii_lines[-1].strip():
            ascii_lines.pop()
        ascii_string = "\n".join(ascii_lines)

        print(ascii_string)
        return ascii_string


class StructuredOCRService:
    """Structured OCR service. This will aim to return a list of strings with their bounding boxes, for rendering directly on the image.
    If desired, it can also format the output into a grid, similar to the OCRService, with format_ocr taking output from get_text.
    """
    def __init__(
        self,
        grid_size: tuple[int, int] = (40, 100),
        config: str = "--psm 12"
    ) -> None:
        """Initialize the StructuredOCR service.

        Args:
            grid_size (tuple[int, int], optional): Dimensions of the grid in characters (if used). Defaults to (40, 100).
            config (str, optional): Tesseract config. Defaults to "--psm 12" based on early experiments.
        """
        self.grid_size = grid_size
        self.config = config

    def get_text(self, image_path: str) -> str:
        # Get OCR results with bounding boxes
        df = pt.image_to_data(Image.open(image_path), config=self.config, output_type=pt.Output.DATAFRAME)
        df = df.dropna(subset=["text"])

        return df.to_dict(orient="records")

    def format_ocr(self, ocr: list[dict[str, any]]) -> str:
        grid = numpy.full(self.grid_size, " ", dtype=str)
        df = pandas.DataFrame(ocr)

        # Normalize coordinates per grid
        df["left_scaled"] = (df["left"] / (df["left"] + df["width"]).max() * (self.grid_size[1] - 1)).astype(int)
        df["top_scaled"] = (df["top"] / (df["top"] + df["height"]).max() * (self.grid_size[0] - 1)).astype(int)

        # Place words according to scaled coordinates
        for _, row in df.iterrows():
            word, left, top = row["text"], row["left_scaled"], row["top_scaled"]
            word = word[:self.grid_size[1] - left]
            grid[top, left:left+len(word)] = list(word)

        # Grid -> string
        ascii_lines = ["".join(row).rstrip() for row in grid]
        while ascii_lines and not ascii_lines[0].strip():
            ascii_lines.pop(0)
        while ascii_lines and not ascii_lines[-1].strip():
            ascii_lines.pop()
        ascii_string = "\n".join(ascii_lines)
        return ascii_string
