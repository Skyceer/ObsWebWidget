from flask import Flask
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
socketio = SocketIO(app)

from routers import routers  # noqa

if __name__ == '__main__':
    socketio.run(app)
