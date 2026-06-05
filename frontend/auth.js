async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("https://YOUR_SUPABASE_URL/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "YOUR_SUPABASE_KEY"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.access_token) {

    // ✅ FIXED KEY NAME
    localStorage.setItem("access_token", data.access_token);

    document.getElementById("loginMessage").innerText =
      "Login Success ✅";

    window.location.href = "dashboard.html";

  } else {
    document.getElementById("loginMessage").innerText =
      "Login Failed ❌";
  }
}