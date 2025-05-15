(function() {
    function canPlayVideo(mime) {
        const video = document.createElement('video');
        return video.canPlayType(mime) !== '';
    }
    
    const canPlayMP4 = canPlayVideo('video/mp4');
    if (!canPlayMP4) {
        console.warn('Браузер не поддерживает MP4 видео');
        activateFallbackBackground();
        return;
    }
    
    const videoElement = document.getElementById('background-video');
    const videoFallback = document.getElementById('video-fallback');
    
    const videoFile = 'IMG_9890.MP4';
    
    if (!videoElement) {
        console.error('Элемент видео не найден!');
        activateFallbackBackground();
        return;
    }
    
    videoElement.muted = true;
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    videoElement.setAttribute('x5-video-player-type', 'h5');
    videoElement.setAttribute('x5-video-player-fullscreen', 'true');
    videoElement.setAttribute('x5-video-orientation', 'portraint');
    
    function checkVideoFile() {
        const img = new Image();
        img.onload = function() {
            console.error('Файл не является видео, это изображение!');
            activateFallbackBackground();
        };
        img.onerror = function() {
        };
        img.src = videoFile;
    }
    checkVideoFile();
    
    const videoTimeout = setTimeout(() => {
        console.warn('Превышено время ожидания загрузки видео');
        activateFallbackBackground();
    }, 5000);
    
    videoElement.addEventListener('loadeddata', function() {
        console.log('Видео загружено и готово к воспроизведению');
        clearTimeout(videoTimeout);
    });
    
    videoElement.addEventListener('playing', function() {
        console.log('Видео успешно воспроизводится');
        clearTimeout(videoTimeout);
    });
    
    videoElement.addEventListener('stalled', function() {
        console.warn('Видео приостановлено из-за буферизации');
    });
    
    videoElement.addEventListener('error', function(e) {
        console.error('Ошибка видео:', videoElement.error);
        activateFallbackBackground();
        clearTimeout(videoTimeout);
        
        tryFallbackVideo();
    });
    
    tryPlayVideo();

    function tryPlayVideo() {
        const playPromise = videoElement.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Видео успешно запущено');
            }).catch(error => {
                console.error('Ошибка воспроизведения видео:', error);
                
                document.addEventListener('click', function playOnClick() {
                    videoElement.play().catch(e => {
                        console.error('Не удалось запустить видео по клику:', e);
                        activateFallbackBackground();
                        tryFallbackVideo();
                    });
                    document.removeEventListener('click', playOnClick);
                }, { once: true });
                
                activateFallbackBackground();
                
                tryFallbackVideo();
            });
        }
    }
    
    function tryFallbackVideo() {
        if (videoFallback) {
            console.log('Пробуем iframe');
            videoFallback.style.display = 'block';
            videoFallback.innerHTML = `
                <div style="width:100%;height:100%;position:absolute;top:0;left:0;overflow:hidden;">
                    <div style="width:100%;height:100%;background:black;"></div>
                </div>
            `;
        }
    }
    
    function activateFallbackBackground() {
        document.documentElement.classList.add('no-video');
        document.body.setAttribute('data-video-failed', 'true');
    }
})(); 