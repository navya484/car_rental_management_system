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

document.addEventListener('DOMContentLoaded', () => {
    fetchAvailableVehicles();
});
async function fetchAvailableVehicles() {
    const token = localStorage.getItem('access_token'); // Get the user's token for authentication
    if (!token) {
        alert("Please log in to view available vehicles.");
        window.location.href = "login.html"; // Redirect to login page if no token
        return;
    }
    try {
        const response = await fetch('http://127.0.0.1:5000/vehicles', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            populateVehicleTable(data);
        } else {
            console.error("Failed to fetch vehicles:", response.status);
            alert("Unable to fetch vehicles. Please try again later.");
        }
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        alert("An error occurred while fetching vehicles. Please try again.");
    }
}

// Populate the vehicle table dynamically
function populateVehicleTable(vehicles) {
    const tableBody = document.querySelector('#vehicles-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (vehicles.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'No vehicles available at the moment.';
        cell.style.textAlign = 'center';
        return;
    }
    vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.vehicle_id}</td>
            <td>${vehicle.make}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.year}</td>
            <td>${vehicle.category}</td>
            <td>$${vehicle.daily_rate}</td>
        `;
        tableBody.appendChild(row);
    });
}



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


function calculateTotal(element) {
    const row = element.closest('tr');
    const startDate = new Date(row.querySelector('.start-date').value);
    const endDate = new Date(row.querySelector('.end-date').value);
    const rate = parseInt(row.querySelector('.rate').dataset.rate, 10);
    const totalAmountElement = row.querySelector('.total-amount');
    
    if (startDate && endDate && startDate <= endDate) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1; // Include end date
        const totalAmount = days * rate;
        totalAmountElement.textContent = totalAmount.toFixed(2);
    } else {
        totalAmountElement.textContent = "0";
    }
}

function confirmBooking(button) {
    const row = button.closest('tr');
    const model = row.cells[2].textContent;
    const startDate = row.querySelector('.start-date').value;
    const endDate = row.querySelector('.end-date').value;
    const totalAmount = row.querySelector('.total-amount').textContent;
    
    if (startDate && endDate && totalAmount > 0) {
        alert(`Booking confirmed for ${model} from ${startDate} to ${endDate}. Total amount: ${totalAmount} USD`);
        // Here, you could redirect or send data to your server
    } else {
        alert("Please select valid dates for booking.");
    }
}

function cancelBooking(button) {
    const row = button.closest('tr');
    row.querySelector('.start-date').value = '';
    row.querySelector('.end-date').value = '';
    row.querySelector('.total-amount').textContent = '0';
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
