let quizData = null;
let currentClub = null;
let currentTask = "informal";
let timerInterval = null;
let secondsPassed = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetch("data.json")
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải file data.json");
            return response.json();
        })
        .then(data => {
            quizData = data;
            initApp();
        })
        .catch(error => {
            console.error("Lỗi:", error);
            alert("Vui lòng sử dụng Local Web Server (như Live Server) để mở dự án.");
        });
});

function initApp() {
    document.getElementById("appTitle").innerText = quizData.title;

    const clubSelect = document.getElementById("clubSelect");
    clubSelect.innerHTML = "";
    quizData.clubs.forEach(club => {
        const option = document.createElement("option");
        option.value = club.id;
        option.innerText = club.name;
        clubSelect.appendChild(option);
    });

    currentClub = quizData.clubs[0];

    // Chuyển Tab Task 1 / Task 2
    document.getElementById("tabInformal").addEventListener("click", () => switchTask("informal"));
    document.getElementById("tabFormal").addEventListener("click", () => switchTask("formal"));

    // Đổi Club
    clubSelect.addEventListener("change", (e) => {
        currentClub = quizData.clubs.find(c => c.id === e.target.value);
        resetAllState();
    });

    // Sự kiện nút bấm
    document.getElementById("checkBtn").addEventListener("click", checkAnswers);
    document.getElementById("resetBtn").addEventListener("click", resetAllState);

    renderCurrentState();
    startTimer();
}

function switchTask(task) {
    currentTask = task;
    document.getElementById("tabInformal").classList.toggle("active", task === "informal");
    document.getElementById("tabFormal").classList.toggle("active", task === "formal");
    document.getElementById("informalSection").classList.toggle("active", task === "informal");
    document.getElementById("formalSection").classList.toggle("active", task === "formal");
    renderCurrentState();
}

function renderCurrentState() {
    if (!currentClub) return;

    // Hiển thị Email Context
    document.getElementById("emailContextText").innerHTML = `
        <strong>${currentClub.emailContext.replace(/\n/g, '<br>')}</strong><br>
        <small style="color: #555;">${currentClub.emailContextTranslation.replace(/\n/g, '<br>')}</small>
    `;

    if (currentTask === "informal") {
        const inf = currentClub.informal;
        document.getElementById("infInstruction").innerHTML = `
            <strong>Yêu cầu:</strong> ${inf.instruction}<br>
            <small style="color: #555;">${inf.instructionTranslation}</small>
        `;
        const textarea = document.getElementById("infAnswer");
        textarea.value = "";
        document.getElementById("infResult").style.display = "none";
        document.getElementById("infWordCount").innerText = `Số từ: 0 (Mục tiêu: ${inf.minWords}-${inf.maxWords} từ)`;

        textarea.oninput = () => {
            const count = countWords(textarea.value);
            document.getElementById("infWordCount").innerText = `Số từ: ${count} (Mục tiêu: ${inf.minWords}-${inf.maxWords} từ)`;
        };
    } else {
        const form = currentClub.formal;
        document.getElementById("formInstruction").innerHTML = `
            <strong>Yêu cầu:</strong> ${form.instruction}<br>
            <small style="color: #555;">${form.instructionTranslation}</small>
        `;
        const textarea = document.getElementById("formAnswer");
        textarea.value = "";
        document.getElementById("formResult").style.display = "none";
        document.getElementById("formWordCount").innerText = `Số từ: 0 (Mục tiêu: ${form.minWords}-${form.maxWords} từ)`;

        textarea.oninput = () => {
            const count = countWords(textarea.value);
            document.getElementById("formWordCount").innerText = `Số từ: ${count} (Mục tiêu: ${form.minWords}-${form.maxWords} từ)`;
        };
    }
}

function countWords(str) {
    const text = str.trim();
    return text ? text.split(/\s+/).length : 0;
}

function checkAnswers() {
    if (currentTask === "informal") {
        const inf = currentClub.informal;
        validateSection(
            document.getElementById("infAnswer").value,
            document.getElementById("infResult"),
            inf.minWords,
            inf.maxWords,
            inf.sampleAnswer,
            inf.sampleAnswerTranslation
        );
    } else {
        const form = currentClub.formal;
        validateSection(
            document.getElementById("formAnswer").value,
            document.getElementById("formResult"),
            form.minWords,
            form.maxWords,
            form.sampleAnswer,
            form.sampleAnswerTranslation
        );
    }
}

function validateSection(text, resultBox, min, max, sample, sampleTranslation) {
    text = text.trim();
    resultBox.style.display = "block";

    if (!text) {
        resultBox.innerHTML = `
            <div class="feedback warning">⚠️ Bạn chưa nhập nội dung email.</div>
            <div class="sample-answer">
                💡 <strong>Đáp án mẫu:</strong><br>${sample.replace(/\n/g, '<br>')}<br><br>
                <small style="color: #555;"><strong>Bản dịch:</strong><br>${sampleTranslation.replace(/\n/g, '<br>')}</small>
            </div>
        `;
        return;
    }

    const words = countWords(text);
    let warnings = [];

    if (words < min || words > max) {
        warnings.push(`Độ dài hiện tại là <strong>${words} từ</strong> (yêu cầu khoảng từ ${min} - ${max} từ).`);
    }

    if (text.charAt(0) !== text.charAt(0).toUpperCase() && isNaN(text.charAt(0))) {
        warnings.push("Nên viết hoa chữ cái đầu câu.");
    }

    if (!['.', '!', '?'].includes(text.slice(-1))) {
        warnings.push("Nên có dấu kết thúc câu (dấu chấm, chấm cảm...).");
    }

    let html = "";
    if (warnings.length === 0) {
        html = `<div class="feedback success">✔ Định dạng & độ dài email đạt chuẩn!</div>`;
    } else {
        html = `<div class="feedback warning">⚠️ <strong>Góp ý:</strong><br>- ${warnings.join('<br>- ')}</div>`;
    }

    html += `
        <div class="sample-answer">
            💡 <strong>Đáp án mẫu:</strong><br>${sample.replace(/\n/g, '<br>')}<br><br>
            <small style="color: #555;"><strong>Bản dịch:</strong><br>${sampleTranslation.replace(/\n/g, '<br>')}</small>
        </div>
    `;
    resultBox.innerHTML = html;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsPassed++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(secondsPassed / 60).toString().padStart(2, '0');
    const secs = (secondsPassed % 60).toString().padStart(2, '0');
    document.getElementById("timer").innerText = `⏱️ Thời gian: ${mins}:${secs}`;
}

function resetAllState() {
    secondsPassed = 0;
    updateTimerDisplay();
    startTimer();
    renderCurrentState();
}