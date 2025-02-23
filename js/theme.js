// Theme management
const themeToggle = {
    init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        
        // Add event listeners to theme toggle buttons
        document.querySelectorAll('.theme-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update button icons
        document.querySelectorAll('.theme-toggle').forEach(button => {
            const icon = button.querySelector('i');
            if (theme === 'light') {
                icon.className = 'fas fa-moon';
                button.setAttribute('title', 'Switch to Dark Mode');
            } else {
                icon.className = 'fas fa-sun';
                button.setAttribute('title', 'Switch to Light Mode');
            }
        });
    }
};

// Initialize theme management when DOM is loaded
document.addEventListener('DOMContentLoaded', () => themeToggle.init());
