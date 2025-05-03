const socket = io({});
const key = $('#key').val()

socket.emit('join', {room: key});


function getRandomHex() {
    const array = new Uint8Array(4);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}


function addMediaElement(mediaId, mediaType, url, initialWidthPx, initialHeightPx) {
    const container = $('#media-container');

    let mediaContent = '';
    if (mediaType === 'image') {
        mediaContent = `<img src="${url}" class="media-file" style="position: absolute; width: 100%; height: 100%;">`;
    } else if (mediaType === 'video') {
        mediaContent = `<video src="${url}" class="media-file" style="position: absolute; width: 100%; height: 100%;" autoplay loop muted></video>`;
    }

    container.append(`
        <div id="${mediaId}" class="media-wrapper" data-media-type="${mediaType}" style="position: absolute; top: 0%; left: 0%; width: ${initialWidthPx}px; height: ${initialHeightPx}px;">
            ${mediaContent}
            <div class="resize-handle ne"></div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle sw"></div>
        </div>
    `);

    $('#media-list').append(`
    <div id="list-${mediaId}" class="media-item mb-1 d-flex align-items-center justify-content-between">
        <input type="text" class="form-control-plaintext media-title text-white" value="Media ${mediaId.split('-')[1]}" data-id="${mediaId}">
        <button class="btn btn-sm btn-danger remove-media ms-1 me-1" data-id="${mediaId}">
            <i class="fas fa-trash"></i>
        </button>
        <button class="btn btn-sm btn-secondary hide-media" data-id="${mediaId}">
            <i class="fas fa-eye"></i>
        </button>
    </div>
`);


    $('#media-url').val('');

    socket.emit('media_added', {
        id: mediaId,
        mediaType: mediaType,
        url: url,
        width: initialWidthPx,
        height: initialHeightPx,
        x: 0,
        y: 0,
        room: key
    });
}

$('#add-media').click(function () {
    const url = $('#media-url').val();
    if (url) {
        let hex = getRandomHex()
        const mediaId = 'media-' + hex;
        const img = new Image();
        img.src = url;
        img.onload = function () {
            const aspectRatio = img.width / img.height;
            const initialWidthPx = 100;
            const initialHeightPx = initialWidthPx / aspectRatio;
            addMediaElement(mediaId, 'image', url, initialWidthPx, initialHeightPx);
        };
        img.onerror = function () {
            const video = document.createElement('video');
            video.src = url;
            video.addEventListener('loadedmetadata', function () {
                const aspectRatio = video.videoWidth / video.videoHeight;
                const initialWidthPx = 100;
                const initialHeightPx = initialWidthPx / aspectRatio;
                addMediaElement(mediaId, 'video', url, initialWidthPx, initialHeightPx);
            });
            video.onerror = function () {
                alert('Не удалось загрузить медиафайл. Проверьте URL и попробуйте снова.');
            };
        };
        img.src = url;
    }
});

$(document).on('click', '.remove-media', function () {
    const mediaId = $(this).data('id');
    $(`#${mediaId}`).remove();
    $(`#list-${mediaId}`).remove();

    socket.emit('media_removed', {
        id: mediaId, room: key
    });
});

$(document).on('click', '.hide-media', function () {
    const mediaId = $(this).data('id');
    const mediaElement = $(`#${mediaId}`);
    let visibility = '';

    if (!mediaElement.hasClass('visually-hidden')) {
        $(this).html('<i class="fas fa-eye-slash"></i>');
        mediaElement.addClass('visually-hidden');
        visibility = 'hidden';

    } else {
        mediaElement.removeClass('visually-hidden');
        $(this).html('<i class="fas fa-eye"></i>');
        visibility = 'visible';
    }

    socket.emit('media_visibility_changed', {id: mediaId, visibility: visibility, room: key});
});

let throttleTimeout = null;

$(document).on('mousedown', '.media-file', function (event) {
    const element = $(this).parent();
    const container = $('#media-container');
    const containerOffset = container.offset();
    const containerWidth = container.width();
    const containerHeight = container.innerHeight();
    const offsetX = event.pageX - element.offset().left;
    const offsetY = event.pageY - element.offset().top;

    function moveAt(pageX, pageY) {
        const elementWidth = element.width();
        const elementHeight = element.height();

        let newX = pageX - containerOffset.left - offsetX;
        let newY = pageY - containerOffset.top - offsetY;

        newX = Math.max(0, Math.min(newX, containerWidth - elementWidth));
        newY = Math.max(0, Math.min(newY, containerHeight - elementHeight));

        element.css({
            left: newX + 'px',
            top: newY + 'px'
        });

        if (!throttleTimeout) {
            throttleTimeout = setTimeout(function () {
                socket.emit('media_moved', {
                    id: element.attr('id'),
                    x: newX / containerWidth * 100,
                    y: newY / containerHeight * 100,
                    room: key
                });
                throttleTimeout = null;
            }, 50);
        }
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    $(document).on('mousemove', onMouseMove);

    $(document).on('mouseup', function () {
        $(document).off('mousemove', onMouseMove);
    });

    event.preventDefault();
});


let resizeThrottleTimeout = null;

$(document).on('mousedown', '.resize-handle', function (event) {
    event.stopPropagation();
    const wrapper = $(this).parent();
    const img = wrapper.find('.media-file');
    const startX = event.pageX;
    const startY = event.pageY;
    const startWidth = wrapper.width();
    const startHeight = wrapper.height();
    const aspectRatio = startWidth / startHeight;
    let isAltPressed = event.altKey;
    const handleClass = $(this).attr('class').split(' ').pop();
    const container = $('#media-container');
    const containerWidth = container.width();
    const containerHeight = container.innerHeight();

    function resize(event) {
        let newWidth = startWidth + (event.pageX - startX);
        let newHeight = startHeight + (event.pageY - startY);

        if (handleClass.includes('nw') || handleClass.includes('sw')) {
            newWidth = startWidth - (event.pageX - startX);
        }
        if (handleClass.includes('nw') || handleClass.includes('ne')) {
            newHeight = startHeight - (event.pageY - startY);
        }

        if (!isAltPressed) {
            newHeight = newWidth / aspectRatio;
        }

        wrapper.css({
            width: newWidth + 'px',
            height: newHeight + 'px'
        });

        if (!resizeTextThrottleTimeout) {
            resizeTextThrottleTimeout = setTimeout(function () {
                socket.emit('media_resized', {
                    id: wrapper.attr('id'),
                    width: newWidth / containerWidth * 100,
                    height: newHeight / containerHeight * 100,
                    room: key
                });
                resizeTextThrottleTimeout = null;
            }, 50);
        }
    }

    $(document).on('mousemove', resize);

    $(document).on('mouseup', function () {
        $(document).off('mousemove', resize);
    });

    event.preventDefault();
});


$('#hide-media').click(function () {
    const medias = $('.media-wrapper');
    let status = ''
    if (medias.not('.visually-hidden').length > 0) {
        medias.addClass('visually-hidden');
        status = 'hide'
    } else {
        medias.removeClass('visually-hidden');
        status = 'show'
    }

    socket.emit('all_media_hidden', {'status': status, room: key});
});

$('#delete-media').click(function () {
    const medias = $('.media-wrapper');
    medias.remove();
    $('#media-list').empty()
    socket.emit('all_media_removed', {room: key});

});


$('#copyButton').click(function (e) {
    let key = $('#key').val()
    const textToCopy = `${location.origin}/display?key=${encodeURIComponent(key)}`;

    navigator.clipboard.writeText(textToCopy).then(function () {
        const btn = $('#copyButton').toggleClass('btn-success btn-primary')
        setTimeout(function () {
            btn.toggleClass('btn-success btn-primary');
        }, 700);

    }).catch(function (error) {
        alert('Ошибка при копировании: ' + error);
    });
});

$('#settingsModal').on('hidden.bs.modal', function (e) {
    $.ajax({
        url: '/dashboard/settings',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({'twitch': $('#twitchLink').val()}),

    });
});


function addTextElement(textId, initialWidthPx, initialHeightPx, textContent) {
    const container = $('#media-container');
    container.append(`
        <div id="${textId}" class="media-wrapper" data-media-type="text" style="position: absolute; top: 0%; left: 0%; width: ${initialWidthPx}px; height: ${initialHeightPx}px; background: rgba(255, 255, 255, 0.0);">
            <div class="media-file text-area" style="position: absolute; width: 100%; height: 100%; font-size: 16px;" ></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle sw"></div>
        </div>
    `);

    $('#media-list').append(`
        <div id="list-${textId}" class="media-item mb-1 d-flex align-items-center justify-content-between">
            <input type="text" class="form-control-plaintext media-title text-white" value="Text ${textId.split('-')[1]}" data-id="${textId}">
            <button class="btn btn-sm btn-danger remove-media ms-1 me-1" data-id="${textId}">
                <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-secondary hide-media" data-id="${textId}">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `);

    $(`#${textId} .text-area`).on('dblclick', function () {
        $(this).attr('contenteditable', 'true').focus();
    });

    $(`#${textId} .text-area`).on('blur', function () {
        $(this).attr('contenteditable', 'false');
    });

    socket.emit('media_added', {
        id: textId,
        mediaType: 'text',
        content: textContent,
        width: initialWidthPx,
        height: initialHeightPx,
        x: 0,
        y: 0,
        room: key
    });
}


$('#add-text').click(function () {
    let hex = getRandomHex();
    const textId = 'text-' + hex;
    const initialWidthPx = 150;
    const initialHeightPx = 50;
    addTextElement(textId, initialWidthPx, initialHeightPx, '');
});


function adjustFontSizeToFit($textArea) {
    var fontSize = 10;
    var maxFontSize = 100;
    var $div = $textArea.closest('.media-wrapper');
    var divWidth = $div.width();
    var divHeight = $div.height();

    if (!$textArea.text().trim()) {
        $textArea.css({
            'width': '100%',
            'height': '100%'
        });
        return;
    } else {
        $textArea.css({
            'width': '',
            'height': ''
        });
    }

    $textArea.css('font-size', fontSize + 'px');

    while (fontSize < maxFontSize) {
        var textWidth = $textArea[0].scrollWidth;
        var textHeight = $textArea[0].scrollHeight;

        if (textWidth <= divWidth && textHeight <= divHeight) {
            fontSize++;
            $textArea.css('font-size', fontSize + 'px');
        } else {
            break;
        }
    }

    if ($textArea[0].scrollWidth > divWidth || $textArea[0].scrollHeight > divHeight) {
        fontSize--;
        $textArea.css('font-size', fontSize + 'px');
    }

    const container = $('#media-container');
    const containerWidth = container.width();
    const containerHeight = container.innerHeight();

    return (fontSize / Math.min(containerWidth, containerHeight)) * 100;
}

$(document).on('input', '.text-area', function () {

    const size = adjustFontSizeToFit($(this));
    socket.emit('text_edited', {
        id: $(this).parent().attr('id'),
        content: $(this).html(),
        room: key,
        size: size
    });
});


let resizeTextThrottleTimeout = null;


$(document).on('mousedown', '.resize-handle', function (event) {
    const el = $(this).siblings('.text-area')

    function resize() {
        let size = adjustFontSizeToFit(el);
        if (!resizeThrottleTimeout) {
            resizeThrottleTimeout = setTimeout(function () {
                socket.emit('text_edited', {
                    id: el.parent().attr('id'),
                    content: el.html(),
                    room: key,
                    size: size
                });
                resizeThrottleTimeout = null;
            }, 50);
        }
    }

    $(document).on('mousemove', resize);

    $(document).on('mouseup', function () {
        $(document).off('mousemove', resize);

    });
});
