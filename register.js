
import { supabase } from "./supabase.js"; //supabase file imported to access its information
// creates a object variable from the register-form element in the html file...
const registerForm = document.getElementById("register-form");
//action for object
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    //creates other elements from the form to directly coontrol and manipulate them 
    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    //checks if the passwords match. if not, the user have to re-match the passwords
    if (password !== confirmPassword) {
        alert("Your passwords do not match.");
        return;
    }
    // checks the length if its not less than 8 characters(the length), if not, the user have to increase the length
    if (password.length < 8) {
                alert("Password must be atleast 8 characters long.")
                return;
    }
    // calls supabase to retrieve info and then send the email to the user for verification 
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
                
            },
            // the redirect to the email link from supabase
            emailRedirectTo: "http://127.0.0.1:5500/public/index.html"
        }
    });
    // shows error if the process can't proceed
    if (error) {
        alert(error.message);
        return;
    }
    // message pop up after form completion
    console.log("Registration response:", data);
    alert("Registration submitted. Check your email if confirmation is required.");
});