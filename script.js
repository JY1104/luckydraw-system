// ============================
// 🎯 Lucky Draw Main Script
// ============================

let names = JSON.parse(localStorage.getItem("names") || "[]");
let winners = JSON.parse(localStorage.getItem("winners") || "[]");
let flashInterval = null;
let spinSound = null;

// 初始化
(function initialize() {
  updateUserList();
  updateWinnerList();

  // Winner List 字体颜色
  const winnerList = document.getElementById("winner-list");
  const winnerColor = localStorage.getItem("winnerFontColor");
  if (winnerColor) {
    winnerList.style.color = winnerColor;
    const h3 = winnerList.querySelector("h3");
    if (h3) h3.style.color = winnerColor;
  }

  // Flash 文字位置与颜色
  const flashEl = document.getElementById("flashNameDisplay");
  const fx = localStorage.getItem("flashOffsetX");
  const fy = localStorage.getItem("flashOffsetY");
  if (fx && fy) {
    flashEl.style.position = "absolute";
    flashEl.style.left = `${fx}px`;
    flashEl.style.top = `${fy}px`;
  }
  const flashColor = localStorage.getItem("flashColor");
  if (flashColor) flashEl.style.color = flashColor;

  // 背景图
  const bg = localStorage.getItem("bgImage");
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  }
})();

// 抽奖主函数
function flashRandomNameDraw() {
  playClickSound();
  if (names.length === 0) return alert("名单为空");

  stopFlash();
  playSpinSound();

  const flashDisplay = document.getElementById("flashNameDisplay");
  let flashCount = 0;
  let maxFlashes = 30 + Math.floor(Math.random() * 20);
  let winnerName = "";

  flashInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * names.length);
    winnerName = names[randomIndex];
    flashDisplay.textContent = winnerName;
    flashCount++;
    if (flashCount >= maxFlashes) {
      stopFlash();
      stopSpinSound();
      setTimeout(() => {
        showPopup(winnerName);
        names.splice(randomIndex, 1);
        localStorage.setItem("names", JSON.stringify(names));
        winners.push(winnerName);
        localStorage.setItem("winners", JSON.stringify(winners));
        updateUserList();
        updateWinnerList();
      }, 300);
    }
  }, 100);
}

function stopFlash() {
  if (flashInterval) clearInterval(flashInterval);
  flashInterval = null;
}

function showPopup(winnerName) {
  const popup = document.getElementById("customPopup");
  const nameDisplay = document.getElementById("winnerNameDisplay");
  nameDisplay.textContent = winnerName;
  popup.classList.add("show");
  popup.classList.remove("hidden");

  const winSound = new Audio("sound/win.mp3");
  winSound.play();

  launchConfetti();
}

function closePopup() {
  playClickSound();
  const popup = document.getElementById("customPopup");
  popup.classList.remove("show");
  setTimeout(() => popup.classList.add("hidden"), 300);
}

function launchConfetti() {
  const end = Date.now() + 2000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function playClickSound() {
  const clickSound = new Audio("sound/click.mp3");
  clickSound.volume = 0.5;
  clickSound.play();
}

function playSpinSound() {
  spinSound = new Audio("sound/spin.mp3");
  spinSound.loop = true;
  spinSound.volume = 0.5;
  spinSound.play().catch(err => console.warn("❗ Spin 音效自动播放失败", err));
}

function stopSpinSound() {
  if (spinSound) {
    spinSound.pause();
    spinSound.currentTime = 0;
    spinSound = null;
  }
}

function updateUserList() {
  const userlist = document.getElementById("userlist");
  if (!userlist) return;
  let html = names.length === 0 ? "<em class='no-users'>No users</em>" : "<b>User List:</b><ul>";
  names.forEach((name, i) => {
    html += `<li><span>${name}</span><button onclick="removeUser(${i})">Remove</button></li>`;
  });
  html += names.length > 0 ? "</ul><button onclick='removeAllUsers()' style='margin-top:16px;background:#dc3545;'>Remove All</button>" : "";
  userlist.innerHTML = html;
}

function updateWinnerList() {
  const container = document.querySelector("#winner-list ul");
  if (!container) return;
  container.innerHTML = "";
  winners.forEach((name, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${name}`;
    container.appendChild(li);
  });
}

function removeUser(index) {
  names.splice(index, 1);
  localStorage.setItem("names", JSON.stringify(names));
  updateUserList();
}

function removeAllUsers() {
  if (confirm("是否清空所有名字？")) {
    names = [];
    localStorage.setItem("names", JSON.stringify(names));
    updateUserList();
  }
}

function exportNames() {
  const blob = new Blob([names.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "names.txt";
  a.click();
  URL.revokeObjectURL(url);
}

// 消息监听
window.addEventListener("message", (event) => {
  const { type, payload } = event.data;
  const flashContainer = document.getElementById("flashContainer");
  const flashEl = document.getElementById("flashNameDisplay");
  const titleEl = document.querySelector(".main-header h1");
  const winnerListEl = document.getElementById("winner-list");

	// 替换位置还原逻辑
	const fx = localStorage.getItem("flashOffsetX");
	const fy = localStorage.getItem("flashOffsetY");
	if (fx && fy) {
	  flashContainer.style.position = "absolute";
	  flashContainer.style.left = `${fx}px`;
	  flashContainer.style.top = `${fy}px`;
	}
  

  switch (type) {
    case "insertName":
      if (!names.includes(payload)) {
        names.push(payload);
        localStorage.setItem("names", JSON.stringify(names));
        updateUserList();
      } else {
        event.source.postMessage({ type: "nameDuplicate", payload }, "*");
      }
      break;

    case "removeAllNames":
      names = [];
      localStorage.setItem("names", JSON.stringify(names));
      updateUserList();
      break;

    case "uploadNameList":
      if (Array.isArray(payload)) {
        for (const name of payload) {
          if (!names.includes(name)) names.push(name);
        }
        localStorage.setItem("names", JSON.stringify(names));
        updateUserList();
      }
      break;

    case "requestNameExport":
      exportNames();
      break;

    case "clearWinners":
      winners = [];
      localStorage.setItem("winners", JSON.stringify(winners));
      updateWinnerList();
      break;

    case "setWinnerColor":
      if (winnerListEl) {
        winnerListEl.style.color = payload;
        const h3 = winnerListEl.querySelector("h3");
        if (h3) h3.style.color = payload;
        localStorage.setItem("winnerFontColor", payload);
      }
      break;

	case "setFlashOffset":
	  if (flashContainer) {
		flashContainer.style.position = "absolute";
		flashContainer.style.left = `${payload.x}px`;
		flashContainer.style.top = `${payload.y}px`;
		localStorage.setItem("flashOffsetX", payload.x);
		localStorage.setItem("flashOffsetY", payload.y);
	  }
	  break;


    case "setFlashColor":
      if (flashEl) {
        flashEl.style.color = payload;
        localStorage.setItem("flashColor", payload);
      }
    break;

    case "setBackground":
      document.body.style.backgroundImage = `url(${payload})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      localStorage.setItem("bgImage", payload);
    break;

    case "spinNow":
      flashRandomNameDraw();
    break;
	  

    default:
      console.warn("⚠️ 未知指令类型：", type);
  }
});
