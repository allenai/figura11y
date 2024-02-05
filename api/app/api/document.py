import os
import tempfile
from flask import Blueprint, jsonify, request, make_response
from werkzeug.utils import secure_filename
from app.services.pdf2figures import PDF2FiguresService
from app.services.classification import ClassificationService
from app.services.pdf2text import PDF2TextService
from app.services.text2mentions import Text2MentionsService


# API Routes
GET_FIGURES = "/getfigures"


def create_document_processing_api() -> Blueprint:
    """Create a Flask Blueprint for document processing API.

    Returns:
        Blueprint: Blueprint for the document processing API.
    """
    # API Services
    api = Blueprint("document", __name__)

    @api.route(GET_FIGURES, methods=["POST"])
    def get_figures():
        pdf_file = request.files["file"]

        if pdf_file.filename == "":
            return make_response(jsonify({"error": "No file was uploaded."}), 400)
        if not pdf_file.filename.endswith(".pdf"):
            return make_response(jsonify({"error": "File must be a PDF."}), 400)

        pdf_path = os.path.join(
            ".",
            secure_filename(pdf_file.filename)
        )
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        pdf_file.save(pdf_path)

        figures = PDF2FiguresService().parse_figures(pdf_path)
        paragraphs, metadata = PDF2TextService().parse_paragraphs(pdf_path)
        for figure in figures:
            figure["figure_type"] = ClassificationService(
                model_path="models/docfigure.pth"
            ).classify(figure.pop("image"))
            figure_num, mentions = Text2MentionsService().find_mentions(
                figure["caption"],
                paragraphs
            )
            figure["filename"] = "%s-Figure%s.png" % (
                os.path.splitext(pdf_file.filename)[0],
                figure_num
            )
            figure["mentions_paragraphs"] = "\n\n".join(mentions)

        document_data = {
            "figures": figures,
            "metadata": metadata
        }

        return make_response(jsonify(document_data), 200)

    return api
