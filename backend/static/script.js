const loadForm = document.getElementById("load-form");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const loadStatus = document.getElementById("load-status");
const postStatus = document.getElementById("post-status");
const messageList = document.getElementById("messages");

async function getJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15000)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

async function loadMessages() {
  loadStatus.textContent = "Loading messages...";

  try {
    const data = await getJSON(loadForm.action, { method: loadForm.method });
    messageList.replaceChildren();

    for (const entry of data.messages) {
      const item = document.createElement("li");
      item.textContent = `${entry.author}: ${entry.message}`;
      messageList.appendChild(item);
    }

    loadStatus.textContent = data.messages.length ? "" : "No messages yet.";
  } catch {
    loadStatus.textContent = "Could not load messages. Try again.";
  }
}

async function showLoginStatus() {
  try {
    const data = await getJSON("/me");
    if (data.username) {
      document.getElementById("welcome").textContent = `Hello, ${data.username}!`;
      document.getElementById("login").hidden = true;
      document.getElementById("logout").hidden = false;
      document.getElementById("sign-in-note").hidden = true;
      messageForm.hidden = false;
    }
  } catch {
    document.getElementById("welcome").textContent = "Could not check sign-in.";
  }
}

loadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadMessages();
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();

  if (message.length < 1 || message.length > 200) {
    postStatus.textContent = "Enter a message between 1 and 200 characters.";
    return;
  }

  const button = messageForm.querySelector("button");
  button.disabled = true;
  postStatus.textContent = "Saving...";

  try {
    const data = await getJSON(messageForm.action, {
      method: messageForm.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    postStatus.textContent = data.message;
    messageForm.reset();
    await loadMessages();
  } catch (error) {
    postStatus.textContent = error.message || "Could not save your message.";
  } finally {
    button.disabled = false;
  }
});

showLoginStatus();
loadMessages();