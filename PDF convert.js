// --- (Keep all your existing PDF converter logic above this) ---

// Dark Mode Toggle Logic for PDF Page
const toggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.createElement("span"); // handles safety if text span is missing
// Check if themeText span exists in HTML, otherwise use standard behavior
const themeTextEl = document.getElementById("theme-text") || toggleBtn;

// Check saved preference on page load (syncs with homepage preference!)
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (document.getElementById("theme-text")) {
        document.getElementById("theme-text").textContent = "Light Mode";
    }
    themeIcon.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    // Update button icon and text
    themeIcon.textContent = isDark ? "☀️" : "🌙";
    if (document.getElementById("theme-text")) {
        document.getElementById("theme-text").textContent = isDark ? "Light Mode" : "Dark Mode";
    }

    // Save preference to localStorage so it stays dark across all pages
    localStorage.setItem("theme", isDark ? "dark" : "light");
});
