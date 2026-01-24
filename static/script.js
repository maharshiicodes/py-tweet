const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const data = {
        identifier: identifier,
        password: password
    };

    try {
        const response = await fetch('/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            message.style.color = "lightgreen";
            message.innerText = "Success! Redirecting...";
            console.log("User ID:", result.user_id)
        } else {
            message.style.color = "red";
            message.innerText =  "Login failed";
        }
    } catch (error) {
        console.error('Error:', error);
        message.innerText = "Something went wrong.";
    }
});