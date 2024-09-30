const shuffleArray = (array) => {
    const shuffledArray = array.sort(() => Math.random() - 0.5);
    return shuffledArray
}



document.addEventListener('DOMContentLoaded', async () => {
    const days = document.querySelectorAll('.day');
    const modal = document.getElementById('modal');
    const img = document.querySelector('#modal img');
    const movieTitle = document.getElementById('movie-title');
    const closeBtn = document.querySelector('.close');


    const response = await fetch('movies.json')
    const movies = (await response.json()).movies;

    const today = new Date().getDate();
    const month = new Date().getMonth() + 1;

    const shuffleMovies = window.localStorage.getItem('movies') ? JSON.parse(window.localStorage.getItem('movies')) : shuffleArray(movies)
    window.localStorage.setItem('movies', JSON.stringify(shuffleMovies))

    shuffleMovies.forEach((movie, index) => {
        const dayNumber = index + 1;
        const day = document.querySelector(`[data-day="${dayNumber}"]`);
        if (index <= today && month === 10) {
            day.querySelector('.lock').style.display = 'none';
            day.classList.add('unlocked')
            day.addEventListener('click', () => {
                movieTitle.textContent = `Película recomendada para el día ${dayNumber}: ${movie.title}`;
                img.src = movie.img;
                modal.style.display = 'block';
            });
        }
    })


    // days.forEach(day => {
    //     const dayNumber = parseInt(day.getAttribute('data-day'));

    //     if (dayNumber <= today) {
    //         day.addEventListener('click', () => {
    //             // Mostrar una película aleatoria
    //             const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    //             movieTitle.textContent = `Película recomendada para el día ${dayNumber}: ${randomMovie}`;
    //             modal.style.display = 'block';
    //         });
    //     } else {
    //         day.style.opacity = '0.5'; // Los días futuros están deshabilitados
    //     }
    // });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
