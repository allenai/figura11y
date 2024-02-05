import numpy
import pandas
from PIL import Image
Image.ANTIALIAS = Image.LANCZOS # For EasyOCR
import easyocr


class OCRService:
    """OCR service. Note that this will preserve the layout of the text, as much as possible, in the output string.
    """
    def __init__(
        self,
        grid_maxdim: int = 100
    ) -> None:
        """Initialize the OCR service.

        Args:
            grid_maxdim (int): Dimension (maximum side length) of grid in characters.
        """
        self.grid_maxdim = grid_maxdim
        self.reader = easyocr.Reader(["en"])

    def get_text(self, image_path: str) -> str:
        image_dims = Image.open(image_path).size
        image_maxdim = max(image_dims)
        rescale_ratio = image_maxdim / self.grid_maxdim
        grid_size = (int(image_dims[1] / rescale_ratio), int(image_dims[0] / rescale_ratio))

        grid = numpy.full(grid_size, " ", dtype=str)

        # Get OCR results with bounding boxes
        results = self.reader.readtext(image_path)
        content = []
        for bounding_box, text, confidence in results:
            tl, tr, br, bl = bounding_box
            content.append({
                "text": text,
                "left": tl[0],
                "top": tl[1],
                "width": tr[0] - tl[0],
                "height": bl[1] - tl[1],
                "confidence": confidence
            })
        df = pandas.DataFrame(content)

        # Normalize coordinates per grid
        df["left_scaled"] = (df["left"] / (df["left"] + df["width"]).max() * (grid_size[1] - 1)).astype(int)
        df["top_scaled"] = (df["top"] / (df["top"] + df["height"]).max() * (grid_size[0] - 1)).astype(int)

        # Place words according to scaled coordinates
        for _, row in df.iterrows():
            word, left, top = row["text"], row["left_scaled"], row["top_scaled"]
            word = word[:grid_size[1] - left]
            grid[top, left:left+len(word)] = list(word)

        # Grid -> string
        ascii_lines = ["".join(row).rstrip() for row in grid]
        while ascii_lines and not ascii_lines[0].strip():
            ascii_lines.pop(0)
        while ascii_lines and not ascii_lines[-1].strip():
            ascii_lines.pop()
        ascii_string = "\n".join(ascii_lines)

        return ascii_string
