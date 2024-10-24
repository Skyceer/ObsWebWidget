from app import app, db
from .user import User

with app.app_context():
    db.create_all()
