const API_BASE_URL = "http://127.0.0.1:8000";
const urlParams = new URLSearchParams(window.location.search);
const myUsername = localStorage.getItem("username");
const currentUserId = localStorage.getItem("user_id");


const targetUsername = urlParams.get('u') || myUsername;

if (!myUsername) {
    window.location.href = 'login.html';
}

document.addEventListener("DOMContentLoaded", () => {
    loadProfile(targetUsername);

});

async function loadProfile(username) {
    try {

        const response = await fetch(`${API_BASE_URL}/profile/${username}?current_user_id=${currentUserId}`);
        if (!response.ok) throw new Error("Failed to load profile");

        const user = await response.json();


        document.getElementById("profile_name").innerText = user.username;
        document.getElementById("profile_bio").innerText = user.bio || "No bio yet.";
        document.getElementById("followers-count").innerText = user.followers;
        document.getElementById("following-count").innerText = user.following;


        if (user.profile_pic) {
            const imgEl = document.getElementById("profile-display");
            const cleanPath = user.profile_pic.startsWith("http") ? user.profile_pic : `${API_BASE_URL}/${user.profile_pic}`;
            if(imgEl) imgEl.src = `${cleanPath}?t=${Date.now()}`;
        }
        if (user.banner_pic) {
            const bannerEl = document.getElementById("banner-display");
            const cleanPath = user.banner_pic.startsWith("http") ? user.banner_pic : `${API_BASE_URL}/${user.banner_pic}`;
            if(bannerEl) {
                bannerEl.src = `${cleanPath}?t=${Date.now()}`;
                bannerEl.classList.remove("hidden");
            }
        }


        const actionBtn = document.getElementById("profile-action-btn");

        if (username === myUsername) {
            actionBtn.innerText = "Edit Profile";
            actionBtn.className = "mt-2 border border-gray-500 text-white font-bold text-sm py-1.5 px-4 rounded-full hover:bg-white/10 transition duration-200";
            actionBtn.onclick = () => window.location.href = "update-profile.html";
        } else {
            updateFollowButton(actionBtn, user.is_following);

            actionBtn.onclick = async () => {
                await toggleFollow(username, actionBtn);
            };
        }



        if (username === myUsername) {
            loadPersonalTweets(currentUserId);
        } else {
             console.log("To load other user's tweets, ensure User_Profile returns an ID");
        }

    } catch (err) {
        console.error("Profile Error:", err);
    }
}


function updateFollowButton(btn, isFollowing) {
    if (isFollowing) {
        btn.innerText = "Unfollow";
        btn.className = "mt-2 border border-red-500 text-red-500 font-bold text-sm py-1.5 px-4 rounded-full hover:bg-red-900/20 transition duration-200";
    } else {
        btn.innerText = "Follow";
        btn.className = "mt-2 bg-white text-black font-bold text-sm py-1.5 px-4 rounded-full hover:bg-gray-200 transition duration-200";
    }
}


async function toggleFollow(targetUsername, btn) {

    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/profile/follow/${targetUsername}?current_user_id=${currentUserId}`, {
            method: "POST"
        });

        if (response.ok) {
            const data = await response.json();
            const isNowFollowing = (data.action === "followed");


            updateFollowButton(btn, isNowFollowing);


            const countSpan = document.getElementById("followers-count");
            let count = parseInt(countSpan.innerText);
            countSpan.innerText = isNowFollowing ? count + 1 : count - 1;
        } else {
            const err = await response.json();
            alert(err.detail || "Action failed");
        }
    } catch (err) {
        console.error("Follow Error:", err);
    } finally {
        btn.disabled = false;
    }
}

async function loadPersonalTweets(userId) {
   const feed = document.getElementById("personal-feed");
   if (!feed) return;

   try{
       const response = await fetch(`${API_BASE_URL}/tweet/${userId}`);
       if (!response.ok) throw new Error("Failed to fetch tweets");

       const tweets = await response.json();
       feed.innerHTML = "";

       if (tweets.length === 0) {
           feed.innerHTML = "<p class='text-gray-500 text-center py-4'>No tweets yet.</p>";
           return;
       }

       tweets.forEach(tweet => {
        let profilePicUrl = "https://gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        if (tweet.user && tweet.user.profile_pic) {
            profilePicUrl = tweet.user.profile_pic.startsWith("http")
                ? tweet.user.profile_pic
                : `${API_BASE_URL}/${tweet.user.profile_pic}`;
        }
        const dateStr = new Date(tweet.created_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });

        const tweetEl = document.createElement("div");
        tweetEl.className = "border-b border-gray-800 p-4 hover:bg-white/5 transition";
        tweetEl.innerHTML = `
            <div class="flex space-x-3">
                <div class="h-10 w-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                    <img src="${profilePicUrl}" alt="User" class="h-full w-full object-cover">
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-bold text-white">${tweet.user.username}</h3>
                        <span class="text-gray-500 text-sm">@${tweet.user.username} · ${dateStr}</span>
                    </div>
                    <p class="text-gray-200 mt-1">${tweet.content}</p>
                    <div class="flex justify-between text-gray-500 mt-3 max-w-md text-sm">
                         <button class="hover:text-pink-600 group flex items-center transition">
                            <i class="far fa-heart"></i> <span class="ml-1">${tweet.likes || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        feed.appendChild(tweetEl);
    });

   } catch(err) {
       console.error("Tweet Error:", err);
       feed.innerHTML = "<p class='text-red-500 text-center'>Failed to load tweets.</p>";
   }
}