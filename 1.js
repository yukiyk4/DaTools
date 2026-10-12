function showfact() {
    document.getElementById("fact").innerText = "Nigga is black";
}

// Dark Mode Toggle Logic
const toggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

// Check saved preference on page load
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeText.textContent = 'Light Mode';
    themeIcon.textContent = '☀️';
}

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    const isDark = document.body.classList.contains('dark-mode');

    // Update button icon and text directly by their IDs
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';

    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
