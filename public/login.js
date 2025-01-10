const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            // Redirect to dashboard on successful login
            window.location.href = '/';
        } else {
            // Display error message on failed login
            const data = await response.json();
            errorMessage.textContent = data.error || 'Invalid credentials';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'An error occurred during login';
    }
});