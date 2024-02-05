import datetime
import json
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, ForeignKeyConstraint, Text, LargeBinary, Boolean
from sqlalchemy.orm import relationship, validates, declarative_base


Base = declarative_base()


class SerializableBase(Base):
    __abstract__ = True

    def to_dict(self) -> dict:
        return {
            c.name: getattr(
                self,
                c.name
            ) for c in self.__table__.columns
        }


class Description(SerializableBase):
    __tablename__ = "description"

    id = Column(Integer, primary_key=True)
    current_string = Column(Text)
    current_html = Column(Text)
    history = Column(JSON)
    summarized_version = Column(Text)
    study_session = Column(Boolean, default=False)
    condition = Column(String, default="full")
    user_id = Column(Integer, ForeignKey("user.id"), index=True)
    figure_id = Column(Integer, ForeignKey("figure.id"), unique=True, index=True)
    paper_id = Column(Integer, ForeignKey("paper.id"), index=True)
    user = relationship("User", back_populates="descriptions", foreign_keys=[user_id])
    figure = relationship("Figure", back_populates="description", uselist=False, foreign_keys=[figure_id])
    paper = relationship("Paper", back_populates="descriptions", foreign_keys=[paper_id])
    suggestions = relationship("Suggestions", back_populates="description")
    events = relationship("Event", back_populates="description")

    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["user.id"], name="fk_description_user"),
        ForeignKeyConstraint(["figure_id"], ["figure.id"], name="fk_description_figure"),
        ForeignKeyConstraint(["paper_id"], ["paper.id"], name="fk_description_paper")
    )


class User(SerializableBase):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    username = Column(String, index=True, unique=True)
    g_id = Column(String, index=True, unique=True)
    date_first_interacted = Column(DateTime, default=datetime.datetime.utcnow)
    activedescription_id = Column(Integer, ForeignKey("description.id"))
    descriptions = relationship("Description", back_populates="user", foreign_keys=[Description.user_id])
    suggestions = relationship("Suggestions", back_populates="user")
    papers = relationship("Paper", back_populates="user")
    settings = relationship("Settings", back_populates="user")
    events = relationship("Event", back_populates="user")


class Paper(SerializableBase):
    __tablename__ = "paper"

    id = Column(Integer, primary_key=True)
    pdf_file = Column(LargeBinary)
    filename = Column(String)
    title = Column(String)
    authors = Column(String)
    date_uploaded = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("user.id"), index=True)
    user = relationship("User", back_populates="papers")
    figures = relationship("Figure", back_populates="paper")
    descriptions = relationship("Description", back_populates="paper")

    def to_dict(self) -> dict:
        paper_dict = {
            c.name: getattr(
                self,
                c.name
            ) for c in self.__table__.columns
        }
        paper_dict["pdf_file"] = self.pdf_file.decode("utf-8")
        return paper_dict


class Figure(SerializableBase):
    __tablename__ = "figure"

    id = Column(Integer, primary_key=True)
    base64_encoded = Column(Text)
    filename = Column(String)
    dimensions = Column(String)
    ocr_text = Column(Text)
    figure_type = Column(String)
    caption = Column(Text)
    mentions_paragraphs = Column(String)
    data_table = Column(String)
    study_session = Column(Boolean, default=False)
    condition = Column(String, default="full")
    user_id = Column(Integer, ForeignKey("user.id"), index=True)
    paper_id = Column(Integer, ForeignKey("paper.id"), index=True)
    description = relationship("Description", back_populates="figure", uselist=False)
    paper = relationship("Paper", back_populates="figures", foreign_keys=[paper_id])
    settings = relationship("Settings", back_populates="figure", uselist=False)
    events = relationship("Event", back_populates="figure")


class Settings(SerializableBase):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    current_settings = Column(JSON)
    last_changed = Column(DateTime, default=datetime.datetime.utcnow)
    history = Column(JSON)
    study_session = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("user.id"))
    figure_id = Column(Integer, ForeignKey("figure.id"))
    user = relationship("User", back_populates="settings")
    figure = relationship("Figure", back_populates="settings", uselist=False)


class Suggestions(SerializableBase):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True)
    content = Column(JSON)
    suggestion_type = Column(String)
    model = Column(String)
    text_context = Column(Text)
    study_session = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("user.id"))
    condition = Column(String, default="full")
    description_id = Column(Integer, ForeignKey("description.id"))
    user = relationship("User", back_populates="suggestions")
    description = relationship("Description", uselist=False, back_populates="suggestions")

    @validates("content")
    def validate_mixed_field(
        self,
        key: str,
        value: dict
    ) -> str:
        if isinstance(value, str):
            return value  # If it"s a string, we just return it as-is

        if isinstance(value, dict):
            # Replace with your own specific field validation
            if "question" in value and "suggested_answer" in value:
                return json.dumps(value)

        raise ValueError(
            "Invalid value for the field %s. Must be a string or a dict with the keys \"question\" and \"suggested_answer\". Got %s." % (
                key,
                value
            )
        )


class Event(SerializableBase):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    figure_id = Column(Integer, ForeignKey("figure.id"))
    description_id = Column(Integer, ForeignKey("description.id"))
    condition = Column(String, default="full")
    study_session = Column(Boolean, default=False)
    event_type = Column(String)
    event_data = Column(JSON)
    event_time = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", back_populates="events")
    figure = relationship("Figure", back_populates="events")
    description = relationship("Description", back_populates="events")


class GeneratedDescription(SerializableBase):
    __tablename__ = "generated_description"

    id = Column(Integer, primary_key=True)
    description = Column(Text)
    model = Column(String)
    figure_id = Column(Integer, ForeignKey("figure.id"))
