import io
import base64
import tempfile
from flask import Blueprint, jsonify, request, make_response
from PIL import Image
from app.services.plot2text import Plot2TextService
from app.services.ocr import OCRService


# API Routes
PREPROCESS_FIGURE = "/preprocess"


# Download models at start
_ = OCRService()
_ = Plot2TextService()


def is_plot(figuretype: str) -> bool:
    """Simple heuristic to determine if a figure is a plot.

    Args:
        figuretype (str): The figure type (assuming it is from our version of DocFigure labels).

    Returns:
        bool: True if we think that the figure is a plot, False otherwise.
    """
    if figuretype == "Flow Chart":
        return False
    return "chart" in figuretype.lower() or "plot" in figuretype.lower() or "histogram" in figuretype.lower()


def create_figure_processing_api() -> Blueprint:
    """Create a Flask Blueprint for figure processing API.

    Returns:
        Blueprint: Blueprint for the figure processing API.
    """
    api = Blueprint("figure", __name__)

    ocr_service = OCRService()
    plot2text_service = Plot2TextService()

    @api.route("/")
    def index() -> tuple[str, int]:
        return "", 204

    @api.route(PREPROCESS_FIGURE, methods=["POST"])
    def preprocess_figure():
        figure = request.get_json()["figure"]

        img_b64 = figure["base64_encoded"]
        img_bytes = base64.b64decode(img_b64)
        img = Image.open(io.BytesIO(img_bytes))
        filepath = tempfile.NamedTemporaryFile(suffix=".png").name
        img.save(filepath)
        figure_preprocessed = {**figure}
        try:
            figure_preprocessed["ocr_text"] = ocr_service.get_text(filepath)
        except:
            figure_preprocessed["ocr_text"] = ""
        if is_plot(figure_preprocessed["figure_type"]):
            figure_preprocessed["data_table"] = plot2text_service.get_datatable(filepath)

        return make_response(jsonify(figure_preprocessed), 200)


    return api
