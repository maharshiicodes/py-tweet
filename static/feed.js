const userId = localStorage.getItem("user_id");

if (!userId) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", loadFeed);

async function loadFeed() {
    const feedContainer = document.getElementById("feed");
    try {
        const response = await fetch("/feed");

        if (!response.ok) {
            console.error("Failed to fetch feed");
            return;
        }

        const tweets = await response.json();
        feedContainer.innerHTML = "";

        if(tweets.length === 0) {
            feedContainer.innerHTML = '<div class="text-center text-gray-500 mt-10">No tweets yet. Be the first!</div>';
            return;
        }

        tweets.forEach(tweet => {
            const tweetElement = document.createElement("div");
            tweetElement.className = "border-b border-gray-800 p-4 hover:bg-gray-900/30 transition";

            const isMyTweet = tweet.user_id === Number(userId);

            let profilePic = "https://gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            if (tweet.user && tweet.user.profile_pic) {
                profilePic = tweet.user.profile_pic.startsWith("http")
                    ? tweet.user.profile_pic
                    : `http://127.0.0.1:8000/${tweet.user.profile_pic}`;
            }

            const dateStr = new Date(tweet.created_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
            });

            tweetElement.innerHTML = `
                <div class="flex space-x-3">
                 <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                    <img src="${profilePic}" class="w-full h-full object-cover">
                 </div>
                 
                 <div class="w-full">
                  <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-bold text-gray-100">${tweet.user ? tweet.user.username : 'Unknown'}</h3>
                        <span class="text-gray-500 text-sm">@${tweet.user ? tweet.user.username : 'unknown'} · ${dateStr}</span>
                    </div>

                      ${isMyTweet ? `
                        <button onclick="deleteTweet(${tweet.id})" class="text-gray-500 hover:text-red-500 text-sm">
                          <i class="fas fa-trash"></i>
                        </button>
                         ` : ''}
                        </div>
                        
                        <p class="text-gray-100 mt-1">${tweet.content}</p>
                        
                        <div class="flex justify-between text-gray-500 mt-3 max-w-md text-sm">
                            <button class="hover:text-blue-500"><i class="far fa-comment"></i> ${tweet.comments || 0}</button>
                            <button class="hover:text-green-500"><i class="fas fa-retweet"></i> ${tweet.reposts || 0}</button>
                            
                            <button onclick="likeTweet(${tweet.id})" class="group flex items-center gap-2 transition hover:text-red-500">
                                <i class="far fa-heart group-hover:text-red-500"></i> 
                                <span id="like-count-${tweet.id}">${tweet.likes || 0}</span>
                            </button>

                            <button class="hover:text-blue-500"><i class="far fa-bookmark"></i> ${tweet.bookmarks || 0}</button>
                        </div>
                    </div>
                </div>
            `;
            feedContainer.appendChild(tweetElement);
        });

    } catch (error) {
        console.error("Error loading feed:", error);
    }
}


async function postTweet() {
    const content = document.getElementById("tweetContent").value;
    if (!content.trim()) { alert("Tweet cannot be empty!"); return; }
    try {
        const response = await fetch(`/tweet/?user_id=${userId}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content })
        });
        if (response.ok) { document.getElementById("tweetContent").value = ""; loadFeed(); }
        else { const data = await response.json(); alert("Failed: " + (data.detail || "Error")); }
    } catch (error) { console.error("Error posting:", error); }
}

async function deleteTweet(tweetId) {
    if(!confirm("Are you sure?")) return;
    try {
        const response = await fetch(`/tweet/${tweetId}/?user_id=${userId}`, { method: "DELETE" });
        if (response.ok) { loadFeed(); }
        else { const data = await response.json(); alert(data.detail); }
    } catch (error) { console.error("Error deleting:", error); }
}


async function likeTweet(tweetId) {
    const userId = localStorage.getItem("user_id");

    try {
        // Send user_id so backend knows who you are
        const response = await fetch(`/tweet/${tweetId}/like?user_id=${userId}`, {
            method: "PUT"
        });

        if (response.ok) {
            const data = await response.json();

            // Update Number
            const countSpan = document.getElementById(`like-count-${tweetId}`);
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
        } else {
            console.error("Failed to like");
        }
    } catch (error) {
        console.error("Error liking tweet:", error);
    }
}

function logout() {
    localStorage.removeItem("user_id");
    window.location.href = "login.html";
}