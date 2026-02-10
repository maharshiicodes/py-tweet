const userId = localStorage.getItem("user_id");
const urlParams = new URLSearchParams(window.location.search);
const tweetId = urlParams.get('id');

if (!userId) window.location.href = "login.html";
if (!tweetId) window.location.href = "index.html"; // Go back if no ID

document.addEventListener("DOMContentLoaded", () => {
    loadSingleTweet();
    loadComments();
});

async function loadSingleTweet() {
    try {
        const response = await fetch(`/tweet/single/${tweetId}`);
        if (!response.ok) throw new Error("Failed to load tweet");

        const tweet = await response.json();
        const container = document.getElementById("main-tweet");

        // Handle Profile Pic URL
        let profilePic = "https://gravatar.com/avatar/00000000?d=mp&f=y";
        if (tweet.user && tweet.user.profile_pic) {
            profilePic = tweet.user.profile_pic.startsWith("http")
                ? tweet.user.profile_pic
                : `http://127.0.0.1:8000/${tweet.user.profile_pic}`;
        }

        container.innerHTML = `
            <div class="flex gap-3">
                <div class="h-10 w-10 rounded-full bg-gray-600 overflow-hidden">
                    <img src="${profilePic}" class="h-full w-full object-cover">
                </div>
                <div>
                    <h3 class="font-bold">${tweet.user ? tweet.user.username : 'Unknown'}</h3>
                </div>
            </div>
            <div class="mt-4 text-xl">${tweet.content}</div>
            <div class="mt-4 text-gray-500 text-sm pb-2 border-b border-gray-800">
                ${new Date(tweet.created_at).toLocaleString()}
            </div>
            <div class="py-3 text-gray-500 flex justify-around">
                <span><i class="far fa-comment"></i> ${tweet.comments}</span>
                <span><i class="fas fa-retweet"></i> ${tweet.reposts}</span>
                <span><i class="far fa-heart"></i> ${tweet.likes}</span>
            </div>
        `;
    } catch (err) {
        console.error(err);
    }
}

async function loadComments() {
    try {
        const response = await fetch(`/tweet/${tweetId}/comments`);
        const comments = await response.json();
        const list = document.getElementById("comments-list");
        list.innerHTML = "";

        comments.forEach(comment => {
            let profilePic = "https://gravatar.com/avatar/00000000?d=mp&f=y";
            if (comment.user && comment.user.profile_pic) {
                profilePic = comment.user.profile_pic.startsWith("http")
                    ? comment.user.profile_pic
                    : `http://127.0.0.1:8000/${comment.user.profile_pic}`;
            }

            list.innerHTML += `
                <div class="p-4 border-b border-gray-800 flex gap-3">
                    <div class="h-10 w-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                         <img src="${profilePic}" class="h-full w-full object-cover">
                    </div>
                    <div>
                        <div class="flex gap-2">
                            <h3 class="font-bold">${comment.user ? comment.user.username : 'Unknown'}</h3>
                            <span class="text-gray-500 text-sm">· ${new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="text-gray-200 mt-1">${comment.content}</p>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function postComment() {
    const content = document.getElementById("comment-input").value;
    if (!content.trim()) return;

    try {
        // NOTE: We pass 'content' as a query param or body depending on backend.
        // For the Python code above, we expect a query param string or body.
        // Let's send it as a query param for simplicity since the python signature was:
        // content: str
        const response = await fetch(`/tweet/${tweetId}/comment?user_id=${userId}&content=${encodeURIComponent(content)}`, {
            method: "POST"
        });

        if (response.ok) {
            document.getElementById("comment-input").value = "";
            loadComments(); // Refresh list
            loadSingleTweet(); // Refresh count
        } else {
            alert("Failed to post comment");
        }
    } catch (err) {
        console.error(err);
    }
}