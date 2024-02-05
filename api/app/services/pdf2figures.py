import os
import io
import subprocess
import json
import base64
from PIL import Image


# Path to the PDFFigures2 JAR file
PDF_FIGURES_JAR_PATH = os.path.join(
    os.path.dirname(__file__),
    "pdffigures2-assembly-0.0.12-SNAPSHOT.jar"
)


class PDF2FiguresService:
    """Service for extracting figures from PDFs with PDFFigures2 as the underlying tool.
    """
    def parse_figures(
        self,
        pdf_path: str,
        output_folder: str = "figures",
        resolution: int = 300,
        jar_path: str = PDF_FIGURES_JAR_PATH
    ) -> list[dict[str, str | Image.Image]]:
        """Run the PDF2Figures service.

        Args:
            pdf_path (str): Path to PDF file.
            output_folder (str, optional): Output directory. Defaults to "figures".
            resolution (int, optional): Image resolution. Defaults to 300.
            jar_path (str, optional): Path to the PDFFigures2 JAR file. Defaults to PDF_FIGURES_JAR_PATH.

        Returns:
            list[dict[str, str | Image.Image]]: List of figures with associated metadata.
        """
        data_path = os.path.join(output_folder, "data")
        figure_path = os.path.join(output_folder, "figures")
        os.makedirs(data_path, exist_ok=True)
        os.makedirs(figure_path, exist_ok=True)

        args = [
            "java",
            "-jar",
            jar_path,
            pdf_path,
            "-i",
            str(resolution),
            "-d",
            os.path.join(os.path.abspath(data_path), ""),
            "-m",
            os.path.join(os.path.abspath(figure_path), ""),  # end path with "/"
        ]
        _ = subprocess.run(
            args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20
        )

        metadata_path = os.path.join(
            data_path,
            os.path.splitext(
                os.path.basename(
                    pdf_path
                )
            )[0] + ".json"
        )

        with open(metadata_path) as json_file:
            metadata = json.load(json_file)

        metadata = [
            example for example in metadata if example["figType"] == "Figure"
        ]

        figures = []
        for example in metadata:
            img = Image.open(example["renderURL"]).convert("RGB")
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            imagedata = base64.b64encode(buffered.getvalue()).decode("utf-8")
            caption = example["caption"]
            figures.append({
                "image": img,
                "dimensions": {
                    "width": img.width,
                    "height": img.height
                },
                "base64_encoded": imagedata,
                "caption": caption
            })
        return figures
