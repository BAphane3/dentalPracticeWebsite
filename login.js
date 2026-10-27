import { supabase } from "./supabase.js";


const loginForm = document.getElementById("login-form");
console.log("Login.js loaded");
console.log("Login form found:", loginForm);

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Login form submitted");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
});

if (error) {
    alert(error.message);
    return;
}

const redirectDestination = sessionStorage.getItem("redirectAfterLogin");

const { data: isStaff, error: staffError } =
    await supabase.rpc("is_staff");
    console.log("Staff check result:", isStaff);
    console.log("Staff check error:", staffError);

if (staffError) {
    console.error("Staff check failed:", staffError.message);
}

if (!staffError && isStaff) {
    window.location.href = "./staff-dashboard.html";
} else if (redirectDestination === "booking") {
    sessionStorage.removeItem("redirectAfterLogin");
    window.location.href = "./index.html#contact";
} else {
    window.location.href = "./index.html";
}
});