// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    const loginId = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Adjusted endpoint and keys to match the backend.py `login` route
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: loginId, password }), // Ensure key matches backend
        });

        if (response.ok) {
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                alert("Login successful!");
                window.location.href = "welcome.html"; // Redirect after login
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } else {
            alert("Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
    }
});

// Fetch available vehicles
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("You must log in to view available vehicles.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/vehicles", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const vehicles = await response.json();
            populateVehicleTable(vehicles);
        } else {
            alert("Unable to fetch vehicles. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        alert("An error occurred while fetching vehicles.");
    }
});

// Populate vehicle table
function populateVehicleTable(vehicles) {
    const tableBody = document.querySelector("#vehicles-table tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    if (vehicles.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = "No vehicles available.";
        cell.style.textAlign = "center";
        return;
    }

    vehicles.forEach(vehicle => {
        const row = document.createElement("tr");
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

// Register a new user
document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/register", { // Adjusted to match backend
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, email }),
        });

        const data = await response.json();
        if (data.success) {
            alert("Registration successful!");
            window.location.href = "welcome.html"; // Redirect to dashboard
        } else {
            alert("Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration. Please try again.");
    }
});
document.getElementById("summaryStartDate").textContent = localStorage.getItem("bookingStartDate");
document.getElementById("summaryEndDate").textContent = localStorage.getItem("bookingEndDate");
document.getElementById("summaryTotalAmount").textContent = localStorage.getItem("bookingTotalAmount");

// Calculate total booking cost
function calculateTotal(element) {
    const row = element.closest("tr");
    const startDate = new Date(row.querySelector(".start-date").value);
    const endDate = new Date(row.querySelector(".end-date").value);
    const rate = parseInt(row.querySelector(".rate").dataset.rate, 10);
    const totalAmountElement = row.querySelector(".total-amount");

    if (startDate && endDate && startDate <= endDate) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
        const totalAmount = days * rate;
        totalAmountElement.textContent = totalAmount.toFixed(2);
    } else {
        totalAmountElement.textContent = "0";
    }
}

// Confirm booking
function confirmBooking(button) {
    const row = button.closest("tr");
    const vehicleId = row.cells[0].textContent;
    const startDate = row.querySelector(".start-date").value;
    const endDate = row.querySelector(".end-date").value;
    const totalAmount = row.querySelector(".total-amount").textContent;

    if (startDate && endDate && totalAmount > 0) {
        alert(`Booking confirmed for vehicle ID: ${vehicleId}.`);
        // Send booking details to the backend
        createBooking(vehicleId, startDate, endDate, totalAmount);
    } else {
        alert("Please fill in valid booking details.");
    }
}

// Send booking details to the backend
async function createBooking(vehicleId, startDate, endDate, totalAmount) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("You must log in to create a booking.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/bookings", { // Adjusted to match backend
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ vehicle_id: vehicleId, start_date: startDate, end_date: endDate, total_amount: totalAmount }),
        });

        if (response.ok) {
            alert("Booking created successfully! Proceed to payment.");
            redirectToBookingSummary();
        } else {
            alert("Failed to create booking. Please try again.");
        }
    } catch (error) {
        console.error("Booking error:", error);
        alert("An error occurred while creating the booking.");
    }
}

// Redirect to payment page
function redirectToPayment() {
    window.location.href = "payment.html";
}

function backToDashboard() {
    window.location.href = "welcome.html"; 
}

function redirectToBookingSummary() {
    window.location.href = "bookingsummary.html";
}

// Process payment
async function processPayment(bookingId) {
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedPaymentMethod) {
        alert("Please select a payment method.");
        return;
    }

    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch(`http://127.0.0.1:5000/payments/${bookingId}/pay`, { // Adjusted to match backend
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ payment_method: selectedPaymentMethod.value }),
        });

        if (response.ok) {
            alert("Payment successful!");
            window.location.href = "welcome.html";
        } else {
            alert("Payment failed. Please try again.");
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert("An error occurred during payment.");
    }
}
