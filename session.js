import { supabase } from "./supabase.js";

const { data, error } = await supabase.auth.getSession();

if (error) {
    console.error("Error checking session:", error.message);
} else if (data.session) {
    console.log("Patient is logged in:", data.session.user.email);
    const dashboardHeading = document.getElementById("dashboard-heading");

   if (dashboardHeading) {
    const fullName = data.session.user.user_metadata?.full_name;
    dashboardHeading.textContent =
        `Welcome back, ${fullName || data.session.user.email}!`;
}
} else {
    console.log("No patient is currently logged in.");

    if (window.location.pathname.endsWith("/dashboard.html")) {
        window.location.href = "./login.html";
    }
}

const loginLink = document.getElementById("login-link");

const logoutLink = document.getElementById("logout-link");

if (data.session && loginLink) {
    loginLink.textContent = "Appointments";
    loginLink.href = "./patient-dashboard.html";
}

if (data.session && logoutLink) {
    logoutLink.hidden = false;

    logoutLink.addEventListener("click", async (event) => {
        event.preventDefault();

        const { error } = await supabase.auth.signOut();

        if (error) {
            alert("Logout failed: " + error.message);
            return;
        }

        window.location.href = "./index.html";
    });
}


const appointmentsList = document.getElementById("appointments-list");

if (appointmentsList && data.session) {
    const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, service, appointment_date, appointment_time, status")
        .eq("user_id", data.session.user.id)
        .order("appointment_date", { ascending: true });

    if (appointmentsError) {
        console.error("Error loading appointments:", appointmentsError.message);
        appointmentsList.textContent =
            "Unable to load your appointments. Please try again.";
    } else if (appointments.length === 0) {
        appointmentsList.textContent =
            "You have no appointments yet. Book your first visit with us!";
    } else {

        const upcomingList = document.getElementById("appointments-list");
        const historyList = document.getElementById("appointment-history-list");

        upcomingList.replaceChildren();
        historyList.replaceChildren();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingAppointments = [];
        const historyAppointments = [];

        appointments.forEach((appointment) => {
            const appointmentDate = new Date(
                appointment.appointment_date + "T00:00:00"
            );

        if (
            appointment.status === "declined" ||
            appointmentDate < today
        ) {
            historyAppointments.push(appointment);
        } else {
            upcomingAppointments.push(appointment);
        }
    });

    function renderAppointment(appointment, container) {
        const card = document.createElement("div");
        card.className = "appointment-details";

        const service = document.createElement("p");
        service.className = "service-name";
        service.textContent = appointment.service;

        const readableDate = new Date(
            appointment.appointment_date + "T00:00:00"
        ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const date = document.createElement("p");
        date.className = "appointment-date";
        date.textContent =
            `${readableDate} at ${appointment.appointment_time}`;

        const status = document.createElement("p");
        status.className =
            `appointment-status status-${appointment.status}`;
        status.textContent = `Status: ${appointment.status}`;

        card.append(service, date, status);
        container.appendChild(card);
    }

    upcomingAppointments.forEach((appointment) => {
        renderAppointment(appointment, upcomingList);
    });

    historyAppointments.forEach((appointment) => {
        renderAppointment(appointment, historyList);
    });

    if (upcomingAppointments.length === 0) {
        upcomingList.textContent = "You have no upcoming appointments.";
    }

    if (historyAppointments.length === 0) {
        historyList.textContent = "You have no appointment history yet.";
    }

    }
}


    const bookButton = document.getElementById("book-appointment");

    if (bookButton) {
        bookButton.addEventListener("click", async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error checking session:", error.message);
                return;
            }

            if (data.session) {
                window.location.href = "#contact";
             } else {
                sessionStorage.setItem("redirectAfterLogin", "booking");
                window.location.href = "./login.html";
            }
        });
    }

    const bookingForm = document.getElementById("booking-form");

    if (bookingForm) {
        bookingForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error checking session:", error.message);
                alert("Unable to verify your login. Please try again.");
                return;
            }

            if (!data.session) {
                sessionStorage.setItem("redirectAfterLogin", "booking");
                window.location.href = "./login.html";
                return;
            }

            const user = data.session.user;

    const appointment = {
        user_id: user.id,
        full_name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        service: document.getElementById("service").value,
        appointment_date: document.getElementById("appointment-date").value,
       appointment_time: document.getElementById("appointment-time").value,
        message: document.getElementById("message").value.trim()
    };

    const { data: bookingData, error: bookingError } = await supabase
        .from("appointments")
        .insert(appointment)
        .select()
        .single();

    if (bookingError) {
        console.error("Booking error:", bookingError.message);
        alert("Your booking could not be submitted. Please try again.");
        return;
    }

    console.log("Booking saved:", bookingData);
    alert("Your appointment request has been submitted successfully!");
    bookingForm.reset();
        });
    }