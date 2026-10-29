import { supabase } from "./supabase.js";
let reportData = null;


async function refreshReportData() {
    const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*");

    if (error) {
        console.error("Error refreshing report data:", error);
        reportData = null;
        return false;
    }

    reportData = appointments;
    return true;
}


function downloadAppointmentReport() {
    if (!reportData) {
        alert("Please generate the report first.");
        return;
    }

    const totalAppointments = reportData.length;

    const pendingCount = reportData.filter(
        appointment => appointment.status === "pending"
    ).length;

    const confirmedCount = reportData.filter(
        appointment => appointment.status === "confirmed"
    ).length;

    const declinedCount = reportData.filter(
        appointment => appointment.status === "declined"
    ).length;

    const otherCount = reportData.filter(
        appointment =>
            !["pending", "confirmed", "declined"].includes(appointment.status)
    ).length;

    const now = new Date();

    const upcomingCount = reportData.filter(appointment => {
        const scheduledDateTime = getAppointmentDateTime(appointment);
        return appointment.status === "confirmed" &&
            scheduledDateTime !== null &&
            scheduledDateTime >= now;
    }).length;

    const pastCount = reportData.filter(appointment => {
        const scheduledDateTime = getAppointmentDateTime(appointment);
        return appointment.status === "confirmed" &&
            scheduledDateTime !== null &&
            scheduledDateTime < now;
    }).length;

    const rows = [
        ["Re-Tooth Dental Clinic — Appointment Summary"],
        ["Report generated", now.toLocaleString()],
        [],
        ["Metric", "Count"],
        ["Total appointments", totalAppointments],
        ["Pending appointments", pendingCount],
        ["Confirmed appointments", confirmedCount],
        ["Upcoming appointments", upcomingCount],
        ["Past appointments", pastCount],
        ["Declined appointments", declinedCount],
        ["Other statuses", otherCount]
    ];

    const csv = rows.map(row =>
        row.map(value => {
            const safeValue = String(value ?? "");
            return `"${safeValue.replace(/"/g, '""')}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `retooth-appointment-report-${now.toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
const downloadButton = document.getElementById("download-report");

if (downloadButton) {
    downloadButton.addEventListener("click", downloadAppointmentReport);
}


const header = document.querySelector('header');

if (header) {
  window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('compact');
  } else {
    header.classList.remove('compact');
  }
});
}

function getAppointmentDateTime(appointment) {
    if (!appointment.appointment_date || !appointment.appointment_time) {
        return null;
    }

    const dateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
    );

    if (Number.isNaN(dateTime.getTime())) {
        return null;
    }

    return dateTime;
}
function renderAppointmentList(containerId, appointments) {
    const list = document.getElementById(containerId);

    if (!list) {
        console.error("Appointment list container not found:", containerId);
        return;
    }

    list.innerHTML = "";

    if (appointments.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No appointments to display.";
        list.appendChild(message);
        return;
    }

    appointments.forEach(appointment => {
        const card = document.createElement("article");
        card.className = "appointment-card";

        const patientName = document.createElement("h3");
        patientName.textContent = appointment.full_name || "Unknown patient";
        card.appendChild(patientName);

        const service = document.createElement("p");
        service.textContent = "Service: " + appointment.service;
        card.appendChild(service);

        const date = document.createElement("p");
        date.textContent = "Date: " + appointment.appointment_date;
        card.appendChild(date);

        const time = document.createElement("p");
        time.textContent = "Time: " + appointment.appointment_time;
        card.appendChild(time);

        const status = document.createElement("p");
        status.textContent = "Status: " + appointment.status;
        card.appendChild(status);

        list.appendChild(card);
    });
}
async function loadPatients() {
        const { data: patients, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading patients:", error);
            alert("Could not load registered patients.");
            return;
        }

        const patientsList = document.getElementById("patients-list");
        const patientsCount = document.getElementById("patients-count");

        patientsList.innerHTML = "";
        patientsCount.textContent = patients.length;

        if (patients.length === 0) {
            patientsList.textContent = "No registered patients found.";
            return;
        }

        patients.forEach(patient => {
            const card = document.createElement("article");
            card.className = "appointment-card";

            const name = document.createElement("h3");
            name.textContent = patient.full_name || "Name not provided";
            card.appendChild(name);

            const email = document.createElement("p");
            email.textContent = "Email: " + (patient.email || "Not available");
            card.appendChild(email);

            const registrationDate = document.createElement("p");
            registrationDate.textContent =
                "Registered: " +
                (patient.created_at
                    ? new Date(patient.created_at).toLocaleDateString()
                    : "Unknown");
            card.appendChild(registrationDate);

            patientsList.appendChild(card);
        });
    }

async function checkAdminAccess() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        window.location.href = "./login.html";
        return;
    }

    const { data: isStaff, error: staffError } =
        await supabase.rpc("is_staff");

    if (staffError || !isStaff) {
        window.location.href = "./patient-dashboard.html";
        return;
    }

    await loadAppointments();
    await loadPatients();

    async function loadAppointments() {
    const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

    if (error) {
        console.error("Error loading appointments:", error);
        return;
    }
    reportData = appointments;
    const now = new Date();

    const pendingAppointments = appointments.filter(
        appointment => appointment.status === "pending"
    );

    const upcomingAppointments = appointments.filter(appointment => {
        const scheduledDateTime = getAppointmentDateTime(appointment);

        return (
            appointment.status === "confirmed" &&
            scheduledDateTime !== null &&
            scheduledDateTime >= now
        );
    });

    const pastAppointments = appointments.filter(appointment => {
        const scheduledDateTime = getAppointmentDateTime(appointment);

        return (
            appointment.status === "confirmed" &&
            scheduledDateTime !== null &&
            scheduledDateTime < now
        );
    });


    const appointmentList = document.getElementById("appointment-list");
    appointmentList.innerHTML = "";

    appointments
        .filter(appointment => appointment.status === "pending")
        .forEach((appointment) => {
        const card = document.createElement("article");
        card.className = "appointment-card";

        const patientName = document.createElement("h3");
        patientName.textContent = appointment.full_name;
        card.appendChild(patientName);

        const service = document.createElement("p");
        service.textContent = "Service: " + appointment.service;
        card.appendChild(service);

        const date = document.createElement('p')
        date.textContent = "Date: " + appointment.appointment_date
        card.appendChild(date);

        const time = document.createElement('p')
        time.textContent = 'Time: ' +appointment.appointment_time
        card.appendChild(time);

        const status = document.createElement('p')
        status.textContent = "status: " + appointment.status
        card.appendChild(status);

        
        const actions = document.createElement("div");
        actions.className = "appointment-actions";

        const approveButton = document.createElement("button");
        approveButton.className = "approve-button";
        approveButton.type = "button";
        approveButton.textContent = "✓ Approve";
        
        approveButton.addEventListener("click", async () => {
            const confirmed = confirm(
            "Are you sure you want to approve this appointment?"
        );

        if (!confirmed) {
            return;
        }
        const { error } = await supabase
            .from("appointments")
            .update({ status: "confirmed" })
            .eq("id", appointment.id);

        if (error) {
            console.error("Error approving appointment:", error);
            alert("Could not approve the appointment.");
            return;
        }

        alert("Appointment approved successfully!");
        await loadAppointments();
    });




        const declineButton = document.createElement("button");
        declineButton.className = "decline-button";
        declineButton.type = "button";
        declineButton.textContent = "✕ Decline";

        declineButton.addEventListener("click", async () => {
            
        const { error } = await supabase
            .from("appointments")
            .update({ status: "declined" })
            .eq("id", appointment.id);

        if (error) {
            console.error("Error declining appointment:", error);
            alert("Could not decline the appointment.");
            return;
        }

        alert("Appointment successfully declined!");
        await loadAppointments();
    });


        actions.appendChild(approveButton);
        actions.appendChild(declineButton);
        card.appendChild(actions);


        


        appointmentList.appendChild(card);
    });

    const pendingCount = pendingAppointments.length;
    const confirmedCount = upcomingAppointments.length;
    const pastCount = pastAppointments.length;

    const totalAppointments = appointments.length;

    const declinedCount = appointments.filter(
        appointment => appointment.status === "declined"
    ).length;


    document.getElementById("pending-count").textContent = pendingCount;
    document.getElementById("confirmed-count").textContent = confirmedCount;
    document.getElementById("past-count").textContent = pastCount;

    
    renderAppointmentList("upcoming-list", upcomingAppointments);

    renderAppointmentList("appointment-history-list", pastAppointments);


}
}


const reportButton = document.getElementById("generate-report");


reportButton.addEventListener("click", async () => {
    const reportResults = document.getElementById("report-results");
    const downloadButton = document.getElementById("download-report");
    downloadButton.disabled = true;

    reportResults.textContent = "Refreshing appointment data...";

    const refreshed = await refreshReportData();

    if (!refreshed) {
        reportResults.textContent =
            "Could not refresh appointment data. Please try again.";
        document.getElementById("download-report").disabled = true;
        return;
    }
    if (reportData.length === 0) {
         reportResults.innerHTML = `
            <h3>Appointment Summary</h3>
            <p>Total appointments: 0</p>
            <p>No appointments have been recorded yet.</p>
            <p>Report generated: ${new Date().toLocaleString()}</p>
        `;

    document.getElementById("download-report").disabled = false;
    return;
}
        
        const totalAppointments = reportData.length;
        
        const now = new Date();

        const upcomingCount = reportData.filter(appointment => {
            const scheduledDateTime = getAppointmentDateTime(appointment);

            return appointment.status === "confirmed" &&
                scheduledDateTime !== null &&
                scheduledDateTime >= now;
        }).length;

        const pastCount = reportData.filter(appointment => {
            const scheduledDateTime = getAppointmentDateTime(appointment);

            return appointment.status === "confirmed" &&
                scheduledDateTime !== null &&
                scheduledDateTime < now;
        }).length;


        const pendingCount = reportData.filter(
            appointment => appointment.status === "pending"
        ).length;

        const confirmedCount = reportData.filter(
            appointment => appointment.status === "confirmed"
        ).length;

        const declinedCount = reportData.filter(
            appointment => appointment.status === "declined"
        ).length;

        const otherCount = reportData.filter(appointment =>
            !["pending", "confirmed", "declined"].includes(appointment.status)
        ).length;
        

        reportResults.innerHTML = `
            <h3>Appointment Summary</h3>
            <div class="report-metrics">
                <article class="report-metric">
                    <h4>Total appointments</h4>
                    <p>${totalAppointments}</p>
                </article>
                <article class="report-metric">
                    <h4>Pending appointments</h4>
                    <p>${pendingCount}</p>
                </article>
                <article class="report-metric">
                    <h4>Confirmed appointments</h4>
                    <p>${confirmedCount}</p>
                </article>
                <article class="report-metric">
                    <h4>Upcoming appointments</h4>
                    <p>${upcomingCount}</p>
                </article>
                <article class="report-metric">
                    <h4>Past appointments</h4>
                    <p>${pastCount}</p>
                </article>
                <article class="report-metric">
                    <h4>Declined appointments</h4>
                    <p>${declinedCount}</p>
                </article>
                <article class="report-metric">
                    <h4>Other statuses</h4>
                    <p>${otherCount}</p>
                </article>
            </div>

            <p class="report-timestamp">
                Report generated: ${new Date().toLocaleString()}
            </p>
        `;
        document.getElementById("download-report").disabled = false;
        downloadButton.disabled = false;
    });


checkAdminAccess();