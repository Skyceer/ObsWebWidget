from flask_socketio import join_room, emit, leave_room

from app import socketio


@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room)
    emit('status', {'message': f'ok'}, room=room)


@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    leave_room(room)
    emit('status', {'message': 'goodbye'}, room=room)


@socketio.on('media_added')
def handle_media_added(data):
    room = data.pop('room')
    emit('media_added', data, broadcast=True, room=room)


@socketio.on('media_removed')
def handle_media_removed(data):
    room = data.pop('room')
    emit('media_removed', data, broadcast=True, room=room)


@socketio.on('media_visibility_changed')
def handle_media_visibility_changed(data):
    room = data.pop('room')
    emit('media_visibility_changed', data, broadcast=True, room=room)


@socketio.on('media_moved')
def handle_media_moved(data):
    room = data.pop('room')
    emit('media_moved', data, broadcast=True, room=room)


@socketio.on('media_resized')
def handle_media_resized(data):
    room = data.pop('room')
    emit('media_resized', data, room=room, broadcast=True)


@socketio.on('all_media_hidden')
def handle_media_resized(data):
    room = data.pop('room')
    emit('all_media_hidden', data, room=room, broadcast=True)


@socketio.on('all_media_removed')
def handle_media_resized(data):
    room = data.pop('room')
    emit('all_media_removed', room=room, broadcast=True)


@socketio.on('text_edited')
def handle_media_resized(data):
    room = data.pop('room')
    emit('text_edited', data, room=room, broadcast=True)
