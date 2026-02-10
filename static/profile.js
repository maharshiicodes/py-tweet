const API_BASE_URL = "http://127.0.0.1:8000";
const urlParams = new URLSearchParams(window.location.search);
const myUsername = localStorage.getItem("username");
const currentUserId = localStorage.getItem("user_id");
let currentTab = 'posts';


const targetUsername = urlParams.get('u') || myUsername;

if (!currentUserId) {
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
        window.profileUserId = user.id;

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

        if (user.id) {
            loadPersonalTweets(user.id);
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
            let count = parseInt(countSpan.innerText) || 0;
            countSpan.innerText = isNowFollowing ? count + 1 : Math.max(0, count - 1);

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


async function loadPersonalTweets(targetUserId) {
    const feed = document.getElementById("personal-feed");
    feed.innerHTML = "<p class='text-gray-500 text-center py-4'>Loading...</p>";

    try {
        const endpoint = currentTab === 'saved'
            ? `/profile/${targetUserId}/saved`
            : `/profile/${targetUserId}/posts`;

        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error("Failed to fetch tweets");

        const tweets = await response.json();
        feed.innerHTML = "";

        if (tweets.length === 0) {
            feed.innerHTML = currentTab === 'saved'
                ? "<p class='text-gray-500 text-center py-10'>You haven't saved any tweets yet.</p>"
                : "<p class='text-gray-500 text-center py-10'>No tweets yet.</p>";
            return;
        }

        tweets.forEach(tweet => {
            let finalPicUrl = "https://gravatar.com/avatar/00000000?d=mp&f=y";
            if (tweet.user && tweet.user.profile_pic) {
                finalPicUrl = tweet.user.profile_pic.startsWith("http")
                    ? tweet.user.profile_pic
                    : `${API_BASE_URL}/${tweet.user.profile_pic}`;
            }

            const dateStr = new Date(tweet.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            const tweetEl = document.createElement("div");
            tweetEl.className = "border-b border-gray-800 p-4 hover:bg-white/5 transition";
            tweetEl.innerHTML = `
                <div class="flex space-x-3">
                    <div class="h-10 w-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                        <img src="${finalPicUrl}" class="h-full w-full object-cover">
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h3 class="font-bold text-white">${tweet.user.username}</h3>
                            <span class="text-gray-500 text-sm">@${tweet.user.username} · ${dateStr}</span>
                        </div>
                        <p class="text-gray-200 mt-1">${tweet.content}</p>
                        
                        <div class="flex justify-between text-gray-500 mt-3 max-w-md text-sm">
                             <button class="hover:text-blue-500"><i class="far fa-comment"></i> ${tweet.comments || 0}</button>
                             
                             <button onclick="repostTweet(${tweet.id}, this)" class="${tweet.reposted ? 'text-green-500' : ''} hover:text-green-500 group flex items-center gap-1 transition">
                                <i class="fas fa-retweet"></i> <span>${tweet.reposts || 0}</span>
                             </button>
                             
                             <button onclick="likeTweet(${tweet.id})" class="hover:text-pink-600 group flex items-center transition">
                                <i class="far fa-heart"></i> <span id="like-count-feed-${tweet.id}" class="ml-1">${tweet.likes || 0}</span>
                            </button>
                            
                            <button onclick="bookmarkTweet(${tweet.id}, this)" class="hover:text-blue-500 transition">
                                <i class="far fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            feed.appendChild(tweetEl);
        });

    } catch (err) {
        console.error("Tweet Error:", err);
        feed.innerHTML = "<p class='text-red-500 text-center'>Failed to load tweets.</p>";
    }
}

async function likeTweet(tweetId) {
    const userId = localStorage.getItem("user_id");
    try {
        const response = await fetch(`${API_BASE_URL}/tweet/${tweetId}/like?user_id=${userId}`, {
            method: "PUT"
        });
        if (response.ok) {
            const data = await response.json();
            const countSpan = document.getElementById(`like-count-feed-${tweetId}`);
            if (countSpan) {
                countSpan.innerText = data.likes;
                const button = countSpan.parentElement;
                const icon = button.querySelector("i");
                if (data.action === "liked") {
                    button.classList.add("text-red-500");
                    icon.classList.remove("far");
                    icon.classList.add("fas");
                } else {
                    button.classList.remove("text-red-500");
                    icon.classList.remove("fas");
                    icon.classList.add("far");
                }
            }
        }
    } catch (error) { console.error("Error liking tweet:", error); }
}

function switchTab(tab) {
    currentTab = tab;

    const postsBtn = document.getElementById('tab-posts');
    const savedBtn = document.getElementById('tab-saved');

    if(tab == 'posts'){
        postsBtn.className = "flex-1 hover:bg-white/10 py-4 font-bold border-b-4 border-blue-500 text-white transition cursor-pointer";
        savedBtn.className = "flex-1 hover:bg-white/10 py-4 font-medium text-gray-500 border-b-4 border-transparent transition cursor-pointer";
    } else {
        savedBtn.className = "flex-1 hover:bg-white/10 py-4 font-bold border-b-4 border-blue-500 text-white transition cursor-pointer";
        postsBtn.className = "flex-1 hover:bg-white/10 py-4 font-medium text-gray-500 border-b-4 border-transparent transition cursor-pointer";
    }

    if (window.profileUserId) {
        loadPersonalTweets(window.profileUserId);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const uName = urlParams.get('u') || localStorage.getItem("username");
        loadProfile(uName);
    }
}



window.repostTweet = async function(tweetId, btn) {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;


    const span = btn.querySelector('span');
    let count = parseInt(span.innerText) || 0;

    if (btn.classList.contains("text-green-500")) {
        btn.classList.remove("text-green-500");
        span.innerText = Math.max(0, count - 1);
    } else {
        btn.classList.add("text-green-500");
        span.innerText = count + 1;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tweet/${tweetId}/repost?user_id=${userId}`, { method: "POST" });
        if (response.ok) {
            const data = await response.json();
            span.innerText = data.reposts; // Sync with server truth
        } else {
             alert("Action failed");
        }
    } catch (e) { console.error(e); }
};

window.bookmarkTweet = async function(tweetId, btn) {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;


    const icon = btn.querySelector("i");
    if (btn.classList.contains("text-blue-500")) {
        btn.classList.remove("text-blue-500");
        icon.classList.replace("fas", "far");
    } else {
        btn.classList.add("text-blue-500");
        icon.classList.replace("far", "fas");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tweet/${tweetId}/bookmark?user_id=${userId}`, { method: "POST" });
        if (!response.ok) {
             alert("Action failed");
        }
    } catch (e) { console.error(e); }
};