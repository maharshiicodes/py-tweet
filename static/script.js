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
            message.innerText =  "Invalid credentials Make sure you have create an account";
        }
    } catch (error) {
        console.error('Error:', error);
        message.innerText = "Something went wrong.";
    }
});

const signupfrom = document.getElementById('signUpForm');
const signup_message = document.getElementById('signup-message');

signupfrom.addEventListener('submit' ,async(e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const signup_password = document.getElementById('signup-password');

    const signup_data = {
        username : username,
        email : email,
        password: signup_password
    }
    try{
    const signup_response = await fetch('auth/signup',{
        method : 'POST',
        headers : {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(signup_data)
    });
    const signup_result = await signup_response.json()
    if(response.ok){
        signup_message.style.color = "lightgreen";
        signup_message.innerText = "Creating Account..."
        console.log("User created",signup_result.user_id);
    }else{
        signup_message.style.color = "red";
        signup_message.innerText = "User with this email or username already exits";
    }
    }catch(err){
        console.error('Error:', error);
        signup_message.innerText = "Something went wrong.";
    }
})