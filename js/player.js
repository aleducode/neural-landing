document.addEventListener('DOMContentLoaded', function () {
    // Function to load video
    function loadVideo(element) {
        const videoSrc = element.dataset.videoSrc;
        const videoClass = element.dataset.videoClass;

        if (!videoSrc) return;

        // Create video element
        const video = document.createElement('video');
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.className = videoClass || '';
        video.style.pointerEvents = 'none';

        // Add source
        video.innerHTML = `<source src="${videoSrc}" type="video/mp4">`;

        // When video can play
        video.oncanplay = function () {
            // Remove placeholder
            const placeholder = element.querySelector('.video-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };

        // Replace placeholder with video
        element.appendChild(video);

        // Start playing
        video.play().catch(function (error) {
            console.log("Video autoplay failed:", error);
        });
    }

    // Initialize Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadVideo(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });

    // Observe all lazy video elements
    document.querySelectorAll('.lazy-video').forEach(videoElement => {
        observer.observe(videoElement);
    });
});
