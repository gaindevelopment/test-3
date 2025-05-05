const MAX_USES = 5;
const COOLDOWN_HOURS = 5;
const ADMIN_CODE = "VIP220881GAIN";
const ACCESS_TOKEN = "r8_H54mblCWFPqKw7amGA6QgaIhVo9Cdbp1pTicH";

let usageData = JSON.parse(localStorage.getItem("usageData") || "{}");
let isAdmin = false;

function checkAdmin() {
  const inputCode = document.getElementById("admin-code").value;
  if (inputCode === ADMIN_CODE) {
    isAdmin = true;
    alert("Admin access granted. Unlimited generations unlocked.");
  } else {
    alert("Incorrect admin code.");
  }
}

function canGenerate(username) {
  const now = Date.now();
  const data = usageData[username] || { count: 0, lastUsed: 0 };
  const elapsed = now - data.lastUsed;
  const hoursPassed = elapsed / (1000 * 60 * 60);

  if (data.count < MAX_USES) return true;
  if (hoursPassed >= COOLDOWN_HOURS) {
    usageData[username] = { count: 0, lastUsed: now };
    localStorage.setItem("usageData", JSON.stringify(usageData));
    return true;
  }
  return false;
}

function generateImage() {
  const username = document.getElementById("username").value.trim();
  const style = document.getElementById("style").value;
  const prompt = document.getElementById("prompt").value.trim();
  const status = document.getElementById("statusText");

  if (!username) {
    status.textContent = "Please enter your username.";
    return;
  }

  if (!prompt) {
    status.textContent = "Please enter a prompt.";
    return;
  }

  if (!isAdmin && !canGenerate(username)) {
    status.textContent =
      "You've reached your generation limit. Try again in 5 hours.";
    return;
  }

  if (!usageData[username]) {
    usageData[username] = { count: 0, lastUsed: 0 };
  }

  if (!isAdmin) {
    usageData[username].count++;
    usageData[username].lastUsed = Date.now();
    localStorage.setItem("usageData", JSON.stringify(usageData));
  }

  status.textContent = "Generating image...";

  fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "7d02375d85af68ac236d1c6ce9603450df240bf72a44527625c1796d8c50fd0d",
      input: {
        prompt: `${prompt}, style: ${style}`,
      },
    }),
  })
    .then((res) => res.json())
    .then((result) => {
      const getImage = () => {
        fetch(result.urls.get)
          .then((res) => res.json())
          .then((output) => {
            if (output.status === "succeeded") {
              document.getElementById("imageContainer").innerHTML = `
                <img src="${output.output[0]}" alt="Generated Image"/>
              `;
              status.textContent = "Image generated successfully.";
            } else if (output.status === "processing") {
              setTimeout(getImage, 3000);
            } else {
              status.textContent = "Failed to generate image.";
            }
          });
      };
      setTimeout(getImage, 3000);
    })
    .catch(() => {
      status.textContent = "Error generating image.";
    });
}