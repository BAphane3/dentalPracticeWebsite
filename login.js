import { supabase } from "./supabase.js"; //calls supabase file

// creates element from the html
const loginForm = document.getElementById("login-form");
// action +=loginForm element
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Login form submitted");
    // creates elements required 
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
// check if account data== staff account data
const { data: isStaff, error: staffError } =
    await supabase.rpc("is_staff");
    console.log("Staff check result:", isStaff);
    console.log("Staff check error:", staffError);

if (staffError) {
    console.error("Staff check failed:", staffError.message);
}
// iif account==staff account, redirects to staff dashboard
if (!staffError && isStaff) {
    window.location.href = "./staff-dashboard.html";
    //if staff != staff, redirect to booking
} else if (redirectDestination === "booking") {
    sessionStorage.removeItem("redirectAfterLogin");
    window.location.href = "./index.html#contact";
} else {
    window.location.href = "./index.html";
}
});