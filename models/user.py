from sqlalchemy import Integer, String

from app import db


class User(db.Model):
    id = db.Column(Integer, primary_key=True)
    key = db.Column(String, unique=True, nullable=False)
    link = db.Column(String, nullable=True)
