document.addEventListener('DOMContentLoaded', () => {
    const backgroundVideo = document.getElementById('background-video');
    const backgroundMusic = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = musicToggle?.querySelector('.icon');
    
    if (backgroundVideo) {
        backgroundVideo.muted = true; 
        
        backgroundVideo.setAttribute('playsinline', '');
        backgroundVideo.setAttribute('webkit-playsinline', '');
        
        backgroundVideo.style.display = 'block';
        backgroundVideo.style.opacity = '1';
        
        backgroundVideo.play().then(() => {
        }).catch(error => {
            document.addEventListener('click', function playVideoOnClick() {
                backgroundVideo.play().catch(e => {});
                document.removeEventListener('click', playVideoOnClick);
            }, { once: true });
        });
    }
    
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3; 
        
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updateMusicToggle(true);
            }).catch(error => {
                document.addEventListener('click', function playOnFirstClick() {
                    backgroundMusic.play().then(() => {
                        updateMusicToggle(true);
                    });
                    document.removeEventListener('click', playOnFirstClick);
                }, { once: true });
            });
        }
    }
    
    if (musicToggle && backgroundMusic) {
        musicToggle.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                updateMusicToggle(true);
            } else {
                backgroundMusic.pause();
                updateMusicToggle(false);
            }
        });
    }
    
    function updateMusicToggle(isPlaying) {
        if (musicToggle) {
            if (isPlaying) {
                musicToggle.classList.add('active');
                const icon = musicToggle.querySelector('.icon');
                if (icon) icon.textContent = '🔊';
            } else {
                musicToggle.classList.remove('active');
                const icon = musicToggle.querySelector('.icon');
                if (icon) icon.textContent = '🔈';
            }
        }
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        } else {
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (typeof showNotification === 'function') {
                showNotification('Форма отправлена!', 'success');
            }
            
            this.reset();
        });
    }
});
