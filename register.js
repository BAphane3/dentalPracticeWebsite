
import { supabase } from "./supabase.js";

const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Your passwords do not match.");
        return;
    }

    if (password.length < 8) {
                alert("Password must be atleast 8 characters long.")
                return;
    }

    console.log(
    "Email redirect URL:",
    "http://127.0.0.1:5500/index.html"
);
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
                
            },
            emailRedirectTo: "http://127.0.0.1:5500/public/index.html"
        }
    });

    if (error) {
        alert(error.message);
        return;
    }

    console.log("Registration response:", data);
    alert("Registration submitted. Check your email if confirmation is required.");
});