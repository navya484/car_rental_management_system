document.addEventListener("DOMContentLoaded", () => {
    console.log("Document loaded.");

    // Check if the current page is the one that should contain the menu
    if (window.location.pathname.includes("welcome.html")) {
        console.log("Current page is welcome.html. Adding event listener for 'Vehicles' menu item.");

        const menuList = document.getElementById("menu-list");
        if (!menuList) {
            console.error("Menu list with id 'menu-list' not found in the DOM.");
            return;
        }

        const vehiclesLink = menuList.querySelector("a[href='vehicles.html']");
        if (!vehiclesLink) {
            console.error("Vehicles link not found in the menu list.");
            return;
        }

        vehiclesLink.addEventListener("click", async (event) => {
            event.preventDefault(); // Prevent the default navigation behavior
            console.log("'Vehicles' menu item clicked. Fetching vehicle data...");

            const token = localStorage.getItem("access_token");
            if (!token) {
                console.warn("No access token found. Redirecting to login.");
                alert("You must log in to view available vehicles.");
                window.location.href = "login.html";
                return;
            }

            try {
                console.log("Sending GET request to fetch vehicles.");
                const response = await fetch("http://127.0.0.1:5000/vehicles", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    console.log("Vehicle data fetched successfully.");
                    const vehicles = await response.json();
                    console.log("Fetched vehicles:", vehicles);
                    createVehicleTableIfNeeded() 
                    setTimeout(() => {
                        populateVehicleTable(vehicles);
                    }, 10);
                    
                    
                } else {
                    console.error("Failed to fetch vehicles. Response status:", response.status);
                    alert("Unable to fetch vehicles. Please try again.");
                }
            } catch (error) {
                console.error("Error occurred while fetching vehicles:", error);
                alert("An error occurred while fetching vehicles.");
            }
        });
    }
});

// Function to create the vehicle table if it doesn't exist yet
function createVehicleTableIfNeeded() {
    console.log("Creating vehicle table structure if it doesn't exist.");
    const welcomeContainer = document.querySelector(".welcome-container");
    welcomeContainer.innerHTML = ""; // Clear existing content

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";

    const table = document.createElement("table");
    table.id = "vehicles-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>Vehicle ID</th>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Category</th>
                <th>Daily Rate</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    tableContainer.appendChild(table);
    welcomeContainer.appendChild(tableContainer);
    console.log("Vehicle table structure created successfully.");
}

// Function to populate the vehicle table with data
function populateVehicleTable(vehicles) {
    console.log("Populating vehicle table with data.");
    const tableBody = document.querySelector("#vehicles-table tbody");
    if (!tableBody) {
        console.error("Table body not found.");
        return;
    }
    tableBody.innerHTML = ""; // Clear existing rows

    if (vehicles.length === 0) {
        console.warn("No vehicles available to display.");
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = "No vehicles available.";
        cell.style.textAlign = "center";
        return;
    }

    vehicles.forEach((vehicle) => {
        console.log("Adding vehicle to table:", vehicle);
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

    console.log("Vehicle table populated successfully.");
}

function toggleMenu() {
    const menu = document.getElementById("menu-list");
    menu.classList.toggle("show"); 
}