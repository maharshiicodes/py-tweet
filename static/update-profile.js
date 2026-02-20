
const API_BASE_URL = "";

const username = localStorage.getItem("username");
if (!username) {
    window.location.href = "login.html";
}

async function loadCurrentProfile() {
    try {

        const response = await fetch(`${API_BASE_URL}/profile/${username}`);
        if (!response.ok) throw new Error("Failed to load profile");
        const user = await response.json();

        document.getElementById("input-bio").value = user.bio || "";
        

        if (user.profile_pic) {
            const profileImg = document.getElementById("preview-profile");

            profileImg.src = user.profile_pic.startsWith("http") ? user.profile_pic : `${API_BASE_URL}/${user.profile_pic}`;
        }
        

        if (user.banner_pic) {
            const bannerImg = document.getElementById("preview-banner");
            bannerImg.src = user.banner_pic.startsWith("http") ? user.banner_pic : `${API_BASE_URL}/${user.banner_pic}`;
        }
    } catch (err) {
        console.error(err);
        alert("Failed to load profile data");
    }
}


document.getElementById("input-profile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById("preview-profile");
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("input-banner").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById("preview-banner");
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});


document.getElementById("btn-save").addEventListener("click", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    const bio = document.getElementById("input-bio").value.trim(); 
    const profilePic = document.getElementById("input-profile").files[0];
    const bannerPic = document.getElementById("input-banner").files[0];

    formData.append("bio", bio);
    if (profilePic) formData.append("profile_pic", profilePic);
    if (bannerPic) formData.append("banner_pic", bannerPic);

    const btn = document.getElementById("btn-save");
    const originalText = btn.innerText;
    btn.innerText = "Saving...";

    try {
        const response = await fetch(`${API_BASE_URL}/profile/update/${username}`, {
            method: "PUT",
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            alert("Profile updated successfully!");
            window.location.href = `profile.html`;
        } else {
            alert(result.detail || "Failed to update profile");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong. Please try again.");
    } finally {
        btn.innerText = originalText;
    }
});

loadCurrentProfile();