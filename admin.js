import { supabase } from "./supabase.js";
console.log("admin.js is running");

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

    async function loadAppointments() {
    const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

    if (error) {
        console.error("Error loading appointments:", error);
        return;
    }

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

    const pendingCount = appointments.filter(
        appointment => appointment.status === 'pending'
    ).length;

    const confirmedCount = appointments.filter(
        appointment => appointment.status === 'confirmed'
    ).length;

    const declinedCount = appointments.filter(
        appointment => appointment.status === "declined"
    ).length;

    const totalCount = appointments.length;

    document.getElementById("pending-count").textContent = pendingCount;
    document.getElementById("confirmed-count").textContent = confirmedCount;
    document.getElementById("declined-count").textContent = declinedCount;
    document.getElementById("total-count").textContent = totalCount;

    
const historyList = document.getElementById("appointment-history-list");
historyList.innerHTML = "";

appointments
    .filter(appointment =>
        appointment.status === "confirmed" ||
        appointment.status === "declined"
    )
    .forEach((appointment) => {
        const card = document.createElement("article");
        card.className = "appointment-card";

        const patientName = document.createElement("h3");
        patientName.textContent = appointment.full_name;
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

        historyList.appendChild(card);
    });

}
}

checkAdminAccess();