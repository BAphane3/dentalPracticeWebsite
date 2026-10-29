// Import Supabase so I can access the it.
import { supabase } from "./supabase.js";

// Check if a patient currently has an active login session.
const { data, error } = await supabase.auth.getSession();

// Show an error in the console if the session could not be checked.
if (error) {
    console.error("Error checking session:", error.message);
} else if (data.session) {
    // Display a welcome message if the patient is logged in.
    console.log("Patient is logged in:", data.session.user.email);

    // Find the heading where the welcome message will appear.
    const dashboardHeading = document.getElementById("dashboard-heading");

    if (dashboardHeading) {
        // Get the patient's full name from their account details.
        const fullName = data.session.user.user_metadata?.full_name;

        // Show the patient's name, or their email if their name is not available.
        dashboardHeading.textContent =
            `Welcome back, ${fullName || data.session.user.email}!`;
    }
} else {
    // it lets me know in the console if nobody is logged in.
    console.log("No patient is currently logged in.");

    // Send logged-out patients to the login page if they try to open the dashboard.
    if (window.location.pathname.endsWith("/dashboard.html")) {
        window.location.href = "./login.html";
    }
}

// Finds the login link in the website navigation.
const loginLink = document.getElementById("login-link");

// Finds the logout link in the website navigation.
const logoutLink = document.getElementById("logout-link");

// if a patient is logged in, change the login link to take them to their appointments screen when cllicked.
if (data.session && loginLink) {
    loginLink.textContent = "Appointments";
    loginLink.href = "./patient-dashboard.html";
}

// Only shows the logout nav link when a patient is logged in.
if (data.session && logoutLink) {
    logoutLink.hidden = false;
    //actions to clicking the link:
    logoutLink.addEventListener("click", async (event) => {
        // Stops the link from following its normal URL.
        event.preventDefault();

        // Sign the patient out of their Supabase account.
        const { error } = await supabase.auth.signOut();

        // Shows an alert if the logout process fails.
        if (error) {
            alert("Logout failed: " + error.message);
            return;
        }

        // Returns the user to the home page after logging out.
        window.location.href = "./index.html";
    });
}

// Finds the area where the patient's appointments will be showed.
const appointmentsList = document.getElementById("appointments-list");

// Only load appointments if the appointment list exists and a user is logged in.
if (appointmentsList && data.session) {

    // Get the appointments belonging to the currently logged-in patient.
    const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, service, appointment_date, appointment_time, status")
        .eq("user_id", data.session.user.id)
        .order("appointment_date", { ascending: true });

    // sends an error message if the appointments could not be loaded.
    if (appointmentsError) {
        console.error("Error loading appointments:", appointmentsError.message);
        appointmentsList.textContent =
            "Unable to load your appointments. Please try again.";

    // Shows a message if the patient has not booked any appointments yet.
    } else if (appointments.length === 0) {
        appointmentsList.textContent =
            "You have no appointments yet. Book your first visit with us!";
    } else {

        // Find the separate areas for upcoming appointments and appointment history.
        const upcomingList = document.getElementById("appointments-list");
        const historyList = document.getElementById("appointment-history-list");

        // Clears any existing appointment cards before adding the latest results.
        upcomingList.replaceChildren();
        historyList.replaceChildren();

        // Get today's date and reset the time to midnight for date comparisons.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create empty arrays to store upcoming appointments and past appointments.
        const upcomingAppointments = [];
        const historyAppointments = [];

        // Go through each appointment and decide which list it belongs in.
        appointments.forEach((appointment) => {
            // Convert the appointment date into a JS date type.
            const appointmentDate = new Date(
                appointment.appointment_date + "T00:00:00"
            );

            // send declined appointments and appointments before today to the history.
            if (
                appointment.status === "declined" ||
                appointmentDate < today
            ) {
                historyAppointments.push(appointment);
            } else {
                // Keep today's appointments and future appointments in the upcoming list.
                upcomingAppointments.push(appointment);
            }
        });

        // Create an appointment card and place it inside the correct container.
        function renderAppointment(appointment, container) {

            // Create a new div to hold the appointment information.
            const card = document.createElement("div");
            card.className = "appointment-details";

            // Create a paragraph to display the name of the service.
            const service = document.createElement("p");
            service.className = "service-name";
            service.textContent = appointment.service;

            // Format the appointment date so it is easier to read.
            const readableDate = new Date(
                appointment.appointment_date + "T00:00:00"
            ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            // Create a paragraph showing the appointment date and time.
            const date = document.createElement("p");
            date.className = "appointment-date";
            date.textContent =
                `${readableDate} at ${appointment.appointment_time}`;

            // Create a paragraph showing the current appointment status.
            const status = document.createElement("p");
            status.className =
                `appointment-status status-${appointment.status}`;
            status.textContent = `Status: ${appointment.status}`;

            // Add the service, date and status to the appointment card.
            card.append(service, date, status);

            // Add the completed card to the correct appointment list.
            container.appendChild(card);
        }

        // Display all upcoming appointments in the upcoming appointments section.
        upcomingAppointments.forEach((appointment) => {
            renderAppointment(appointment, upcomingList);
        });

        // Display all past or declined appointments in the history section.
        historyAppointments.forEach((appointment) => {
            renderAppointment(appointment, historyList);
        });

        // Show a message if there are no upcoming appointments to display.
        if (upcomingAppointments.length === 0) {
            upcomingList.textContent = "You have no upcoming appointments.";
        }

        // Show a message if there are no past or declined appointments to display.
        if (historyAppointments.length === 0) {
            historyList.textContent = "You have no appointment history yet.";
        }

    }
}

// Find the button used to start the appointment booking process.
const bookButton = document.getElementById("book-appointment");

if (bookButton) {
    // Check the patient's login status when they click the booking button.
    bookButton.addEventListener("click", async () => {

        // Check again to make sure the patient has a valid login session.
        const { data, error } = await supabase.auth.getSession();

        // Stop the process if the login status cannot be checked.
        if (error) {
            console.error("Error checking session:", error.message);
            return;
        }

        // Logged-in patients can go straight to the booking section.
        if (data.session) {
            window.location.href = "#contact";
        } else {
            // Remember that the patient wanted to book an appointment after logging in.
            sessionStorage.setItem("redirectAfterLogin", "booking");

            // Send logged-out patients to the login page first.
            window.location.href = "./login.html";
        }
    });
}

// Find the appointment booking form on the page.
const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
    // Run this code when the patient submits the booking form.
    bookingForm.addEventListener("submit", async (event) => {

        // Stop the form from refreshing the page when it is submitted.
        event.preventDefault();

        // Check whether the patient is still logged in before saving the booking.
        const { data, error } = await supabase.auth.getSession();

        // Display an error if the login session cannot be checked.
        if (error) {
            console.error("Error checking session:", error.message);
            alert("Unable to verify your login. Please try again.");
            return;
        }

        // If the patient is not logged in, save their intended action and redirect them.
        if (!data.session) {
            sessionStorage.setItem("redirectAfterLogin", "booking");
            window.location.href = "./login.html";
            return;
        }

        // Get the details of the currently logged-in patient.
        const user = data.session.user;

        // Collect the information entered into the appointment form.
        const appointment = {
            // Link the appointment to the patient's Supabase user ID.
            user_id: user.id,

            // Get the patient's name and remove any extra spaces at the beginning or end.
            full_name: document.getElementById("name").value.trim(),

            // Get the patient's email address and remove extra spaces.
            email: document.getElementById("email").value.trim(),

            // Get the service selected by the patient.
            service: document.getElementById("service").value,

            // Get the date selected for the appointment.
            appointment_date: document.getElementById("appointment-date").value,

            // Get the time selected for the appointment.
            appointment_time: document.getElementById("appointment-time").value,

            // Get the patient's message and remove extra spaces.
            message: document.getElementById("message").value.trim()
        };

        // Save the appointment details in the Supabase appointments table.
        const { data: bookingData, error: bookingError } = await supabase
            .from("appointments")
            .insert(appointment)
            .select()
            .single();

        // Show an error message if the appointment could not be saved.
        if (bookingError) {
            console.error("Booking error:", bookingError.message);
            alert("Your booking could not be submitted. Please try again.");
            return;
        }

        // Log the saved booking in the console for checking and debugging.
        console.log("Booking saved:", bookingData);

        // Let the patient know that their appointment request was submitted successfully.
        alert("Your appointment request has been submitted successfully!");

        // Clear the form after the booking has been submitted.
        bookingForm.reset();
    });
}