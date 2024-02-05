import os
import requests
from bs4 import BeautifulSoup

# Utility functions are taken from doc2json
# See https://github.com/allenai/s2orc-doc2json

def get_title_from_grobid_xml(raw_xml: BeautifulSoup) -> str:
    """
    Returns title
    :return:
    """
    for title_entry in raw_xml.find_all("title"):
        if title_entry.has_attr("level") \
                and title_entry["level"] == "a":
            return title_entry.text
    try:
        return raw_xml.title.text
    except AttributeError:
        return ""

def get_author_names_from_grobid_xml(raw_xml: BeautifulSoup) -> list[dict[str, str]]:
    """
    Returns a list of dictionaries, one for each author,
    containing the first and last names.

    e.g.
        {
            "first": first,
            "middle": middle,
            "last": last,
            "suffix": suffix
        }
    """
    names = []

    for author in raw_xml.find_all("author"):
        if not author.persname:
            continue

        # forenames include first and middle names
        forenames = author.persname.find_all("forename")

        # surnames include last names
        surnames = author.persname.find_all("surname")

        # name suffixes
        suffixes = author.persname.find_all("suffix")

        first = ""
        middle = []
        last = ""
        suffix = ""

        for forename in forenames:
            if forename["type"] == "first":
                if not first:
                    first = forename.text
                else:
                    middle.append(forename.text)
            elif forename["type"] == "middle":
                middle.append(forename.text)

        if len(surnames) > 1:
            for surname in surnames[:-1]:
                middle.append(surname.text)
            last = surnames[-1].text
        elif len(surnames) == 1:
            last = surnames[0].text

        if len(suffix) >= 1:
            suffix = " ".join([suffix.text for suffix in suffixes])

        names_dict = {
            "first": first,
            "middle": middle,
            "last": last,
            "suffix": suffix
        }

        names.append(names_dict)
    return names


class PDF2TextService:
    """Service to convert PDF to text using GROBID (assumes a GROBID service is running).
    """
    def parse_paragraphs(
        self,
        pdf_path: str,
        grobid_url: str = os.environ.get("GROBID_SERVICE", "http://localhost:8070"),
    ) -> tuple[list[str], dict[str, str]]:
        """Run the PDF2Text service.

        Args:
            pdf_path (str): Path to PDF file.
            grobid_url (_type_, optional): URL to access the GROBID service. Defaults to "http://grobid:8070".

        Returns:
            list[str]: List of paragraphs in the PDF.
        """
        url = "%s/api/processFulltextDocument" % grobid_url
        with open(pdf_path, "rb") as infile:
            files = {"input": infile}
            response = requests.post(url, files=files)
            text = response.text
            soup = BeautifulSoup(text, "lxml")
            paragraphs = [
                paragraph.text for paragraph in soup.find_all("p")
            ]
            metadata = {
                "title": get_title_from_grobid_xml(soup),
                "authors": [
                    "%s %s %s" % (
                        author["first"],
                        " ".join(author["middle"]),
                        author["last"]
                    ) for author in get_author_names_from_grobid_xml(soup)
                ]
            }
            return paragraphs, metadata
