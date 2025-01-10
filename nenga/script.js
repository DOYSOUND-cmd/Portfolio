window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('card-container').addEventListener('click', () => {
        document.getElementById('card').classList.toggle('flipped');
    });
});