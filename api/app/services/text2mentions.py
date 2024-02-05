import re


class Text2MentionsService:
    """Service to find any paragraphs that mention a given figure, indicated by its caption.
    """
    def find_mentions(
        self,
        caption: str,
        paragraphlist: list[str]
    ) -> tuple[str, list[str]]:
        """Find any paragraphs that mention a given figure, indicated by its caption.

        Args:
            caption (str): The caption. Expected to contain an explicit figure reference, likely in the beginning. Example: "Figure 1: This is a figure."
            paragraphlist (list[str]): List of paper paragraphs to search.

        Returns:
            list[str]: List of paragraphs that mention the same figure.
        """
        pattern = r"\b([Ff][Ii][Gg](?:ure)?s?\.?\s?(\w*\d+))\b"
        caption_matches = re.findall(pattern, caption)
        if not caption_matches or not len(caption_matches):
            return []
        figure_num = caption_matches[0][-1]
        paragraphs = []
        for paragraph in paragraphlist:
            if not isinstance(paragraph, str):
                print("FOUND NONSTRING PARAGRAPH: ", paragraph)
                continue
            paragraph_matches = re.findall(pattern, paragraph)
            if paragraph_matches:
                is_relevant = any(match[-1] == figure_num for match in paragraph_matches)
                if is_relevant:
                    paragraphs.append(paragraph)

        return figure_num, paragraphs
