document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    // Get user input values
    const loginId = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Log user input values for debugging
    console.log("Username:", loginId);
    console.log("Password:", password);

    try {
        // Send POST request to the backend with loginId and password
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: loginId, password: password }) // Ensure the key matches the backend (username instead of loginId)
        });

        // Log response status for debugging
        console.log("Response Status:", response.status);

        // Handle the backend response
        if (response.ok) {
            const data = await response.json();

            // Log the response data from the backend
            console.log("Response Data:", data);

            if (data.access_token) {
                // Login successful, store the JWT token
                console.log("Login successful, storing token.");
                localStorage.setItem('access_token', data.access_token);

                // Redirect to the appropriate dashboard (You can customize this based on the user type if needed)
                window.location.href = "welcome.html"; // Change to the appropriate page
            } else {
                console.warn("Invalid credentials. Please try again.");
                alert("Invalid credentials. Please try again.");
            }
        } else {
            console.error("Server error:", response.status);
            alert("Server error. Please try again later.");
        }
    } catch (error) {
        console.error("Error occurred:", error);
        alert("An error occurred. Please try again.");
    }
});



document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email })
    });

    const data = await response.json();

    if (data.success) {
        window.location.href = 'welcome.html'; // Redirect to the welcome page
    } else {
        document.getElementById('error-message').innerText = 'Registration failed. Please try again.';
    }
});


function filterCategory(category) {
    const vehicles = document.querySelectorAll('.vehicle-card');
    vehicles.forEach(vehicle => {
        vehicle.style.display = vehicle.getAttribute('data-category') === category ? 'flex' : 'none';
    });
}

function calculateTotal() {
    const rate = parseFloat(document.getElementById('rate').innerText);
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    if (startDate && endDate && endDate >= startDate) {
        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
        const totalAmount = duration * rate;
        document.getElementById('totalAmount').innerText = totalAmount;
    } else {
        document.getElementById('totalAmount').innerText = '0';
    }
}

function confirmBooking() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    if (startDate && endDate) {
        alert('Booking Confirmed!');
        // Navigate to summary page with booking details as URL parameters (optional)
        window.location.href = `booking-summary.html?startDate=${startDate}&endDate=${endDate}&rate=${document.getElementById('rate').innerText}&totalAmount=${document.getElementById('totalAmount').innerText}`;
    } else {
        alert('Please select both start and end dates.');
    }
}

function cancelBooking() {
    window.location.href = 'welcome.html';
}
// Function to redirect to the payment page
function redirectToPayment() {
    // Replace 'payment.html' with the actual URL of your payment page
    window.location.href = 'payment.html';
}

// Function to go back to the dashboard
function backToDashboard() {
    // Replace 'welcome.html' with the actual URL of your dashboard page
    window.location.href = 'welcome.html';
}
// Function to show the selected payment form
function showPaymentForm(formId) {
    document.querySelectorAll('.payment-form').forEach(form => form.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
}

// Function to process payment
function processPayment() {
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!selectedPaymentMethod) {
        alert('Please select a payment method.');
        return;
    }

    if (selectedPaymentMethod.value === 'creditCard' || selectedPaymentMethod.value === 'debitCard') {
        const cardNumber = document.getElementById(selectedPaymentMethod.value + 'Number').value;
        const expiry = document.getElementById(selectedPaymentMethod.value + 'Expiry').value;
        const cvv = document.getElementById(selectedPaymentMethod.value + 'CVV').value;

        if (!cardNumber || !expiry || !cvv) {
            alert('Please fill in all card details.');
            return;
        }

        alert('Payment Successful!');
    } else if (selectedPaymentMethod.value === 'paypal') {
        alert('Redirecting to PayPal...');
    }
}

// Function to cancel payment
function cancelPayment() {
    window.location.href = 'booking-summary.html';
    alert('Payment Cancelled');
}
// Function to toggle change password section visibility
function toggleChangePassword() {
    const changePasswordSection = document.getElementById('changePasswordSection');
    changePasswordSection.classList.toggle('active');
}

// Function to handle saving the new password
function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }

    alert('Password changed successfully!');
    toggleChangePassword();
}

// Function to cancel password change
function cancelPasswordChange() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    toggleChangePassword();
}

// Placeholder function for editing profile
function editProfile() {
    alert('Edit Profile button clicked. Implement functionality as needed.');
}
// Placeholder for future JavaScript functionality on the Contact Us page
console.log("Contact page loaded successfully.");
