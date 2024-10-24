from flask import session, render_template, request, jsonify, redirect, url_for

from app import app, db
from models import User


@app.route('/')
def index():
    if 'key' in session:
        return redirect(url_for('dashboard'))
    else:
        return render_template('index.html')


@app.route('/dashboard')
def dashboard():
    user = User.query.filter_by(key=session['key']).first()
    return render_template('dashboard.html', domain=request.host.split(':')[0], link=user.link, key=session['key'])


@app.route('/dashboard/settings', methods=["POST"])
def save_settings():
    user = User.query.filter_by(key=session['key']).first()
    user.link = request.json['twitch']
    db.session.commit()
    return jsonify({'status': 'success'})


@app.route('/auth', methods=['POST'])
def auth():
    key = request.json.get('key')

    if len(key) == 32 and key == key.lower():
        user = User.query.filter_by(key=key).first()

        if user:
            session['key'] = key
            return jsonify({"status": "success"})
        else:
            new_user = User(key=key)
            db.session.add(new_user)
            db.session.commit()
            session['key'] = key
            return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error"})


@app.route('/display')
def display_page():
    return render_template('display.html')
