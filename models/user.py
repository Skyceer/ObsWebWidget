from app import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(32), unique=True, nullable=False)
    link = db.Column(db.String(255), nullable=True)
