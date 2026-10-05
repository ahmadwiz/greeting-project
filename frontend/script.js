const serverURL = "http://localhost:5000";

const timeResult = document.getElementById("time-result");
const greetingResult = document.getElementById("greeting-result");


document.getElementById("time-form").addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();
    timeResult.textContent = "Loading...";

    try {
      const response = await fetch(event.currentTarget.action, {
        method: event.currentTarget.method
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();
      timeResult.textContent = "Server time: " + data.time;
    } catch (error) {
      timeResult.textContent = "Could not connect to the server.";
    }
  }
);

document.getElementById("greeting-form").addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();
    greetingResult.textContent = "Loading...";

    const name = document.getElementById("name").value.trim();

    try {
      const response = await fetch(event.currentTarget.action, {
        method: event.currentTarget.method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name })
      });

      const data = await response.json();
      greetingResult.textContent = data.message;
    } catch (error) {
      greetingResult.textContent = "Could not connect to the server.";
    }
  }
);