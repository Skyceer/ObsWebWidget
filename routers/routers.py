from flask import session, render_template, request, jsonify, redirect, url_for, abort

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
    if 'key' not in session:
        return redirect(url_for('index'))

    user = User.query.filter_by(key=session['key']).first()
    return render_template('dashboard.html', domain=request.host.split(':')[0], link=user.link or '',
                           key=session['key'])


@app.route('/dashboard/settings', methods=["POST"])
def save_settings():
    user = User.query.filter_by(key=session['key']).first()
    user.link = request.json['twitch']
    db.session.commit()
    return jsonify({'status': 'success'})


@app.route('/auth', methods=['POST'])
def auth():
    key = request.json.get('key')

    user = User.query.filter_by(key=key).first()

    if user:
        session['key'] = key
    else:
        new_user = User(key=key)
        db.session.add(new_user)
        db.session.commit()
        session['key'] = key
    return jsonify({"status": "success"})


@app.route('/display')
def display_page():
    if not request.args.get('key'):
        abort(404)
    return render_template('display.html')
