document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const textElements = document.querySelectorAll('h1, h2');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateText(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    textElements.forEach(element => {
        observer.observe(element);
    });

    function animateText(element) {
        const targetText = element.textContent;
        const chars = Array.from(targetText);
        element.textContent = "";

        chars.forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            element.appendChild(span);
        });

        const totalShuffles = 20;
        const initialShuffles = 13;
        const initialInterval = 400 / initialShuffles;
        const remainingShuffles = totalShuffles - initialShuffles;
        const remainingTime = 250;

        let shuffleCount = 0;
        let spans = Array.from(element.querySelectorAll('span'));

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function randomColor(type) {
            if (type === 'cordH1') {
                return `rgb(255, ${Math.floor(Math.random() * 256)}, 0)`;
            } else if (type === 'cordH2') {
                return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0)`;
            } else {
                return `rgb(0, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
            }
        }

        const shuffleInterval = setInterval(() => {
            shuffle(spans);
            spans.forEach((span) => {
                span.style.color = randomColor(element.tagName.toLowerCase());
                span.style.opacity = 1;
                element.appendChild(span);
            });
            shuffleCount++;
            if (shuffleCount >= initialShuffles) {
                clearInterval(shuffleInterval);

                function slowShuffle() {
                    if (shuffleCount < totalShuffles) {
                        shuffle(spans);
                        spans.forEach((span) => {
                            span.style.color = randomColor(element.tagName.toLowerCase());
                            span.style.opacity = 1;
                            element.appendChild(span);
                        });
                        shuffleCount++;
                        const remainingShuffleInterval = remainingTime / remainingShuffles;
                        setTimeout(slowShuffle, remainingShuffleInterval + (remainingShuffleInterval / remainingShuffles) * (shuffleCount - initialShuffles));
                    } else {
                        targetText.split('').forEach((char, index) => {
                            spans[index].textContent = char;
                            if (element.closest('#cord')) {
                                spans[index].style.color = element.tagName.toLowerCase() === 'h1' ? '#000000' : '#000000';
                            } else {
                                spans[index].style.color = '#E0E0E0';
                            }
                            spans[index].style.opacity = 1;
                            element.appendChild(spans[index]);
                        });
                    }
                }
                slowShuffle();
            }
        }, initialInterval);
    }

    // Progress bar logic
    const progressBar = document.querySelector('.progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTotal = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollCurrent = document.documentElement.scrollTop;
        const scrollPercent = (scrollCurrent / scrollTotal) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    });

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.classList.add('show');

    hamburger.addEventListener('click', () => {
        if (navMenu.classList.contains('show')) {
            navMenu.classList.remove('show');
            navMenu.classList.add('hide');
            setTimeout(() => {
                navMenu.classList.remove('hide');
                navMenu.style.display = 'none';
            }, 500);
        } else {
            navMenu.style.display = 'flex';
            setTimeout(() => {
                navMenu.classList.add('show');
            }, 10);
        }
    });

    document.querySelector('#cord .card').addEventListener('click', function() {
        this.classList.toggle('clicked');
    });
 // 資格リストの項目にクリックイベントを追加
 const qualificationItems = document.querySelectorAll('.qualification-item');

 qualificationItems.forEach(item => {
     item.addEventListener('click', () => {
         // 既存の選択状態をリセット（他の資格の説明を閉じる）
         qualificationItems.forEach(i => {
             if (i !== item) {
                 i.classList.remove('active');
             }
         });
         // 選択した項目の表示をトグル
         item.classList.toggle('active');
     });
 });
 const fadeInElements = document.querySelectorAll('.fadein-x-left, .fadein-x-right');

 const fadeInObserver = new IntersectionObserver((entries, observer) => {
     entries.forEach(entry => {
         if (entry.isIntersecting) {
             entry.target.style.animationDelay = '0s';
             observer.unobserve(entry.target);
         }
     });
 }, {
     root: null,
     threshold: 0.1,
 });

 fadeInElements.forEach(element => {
     fadeInObserver.observe(element);
 });
});