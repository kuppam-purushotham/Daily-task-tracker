let currentTask = "";
let startTime = null;
let timerInterval = null;


// ==============================
// START TASK
// ==============================

function startTask(task) {

    if (currentTask !== "") {
        alert("Stop the current task first.");
        return;
    }

    currentTask = task;
    startTime = new Date();

    document.getElementById("current-task").textContent =
        "Current task: " + task;

    timerInterval = setInterval(updateTimer, 1000);

    updateTimer();
}


// ==============================
// TIMER
// ==============================

function updateTimer() {

    if (startTime === null) {
        return;
    }

    const now = new Date();

    const seconds = Math.floor(
        (now - startTime) / 1000
    );

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
        (seconds % 3600) / 60
    );

    const remainingSeconds = seconds % 60;

    document.getElementById("timer").textContent =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(remainingSeconds).padStart(2, "0");
}


// ==============================
// STOP TASK
// ==============================

async function stopTask() {

    if (currentTask === "") {
        alert("No activity is running.");
        return;
    }

    clearInterval(timerInterval);

    const endTime = new Date();

    const duration = Math.floor(
        (endTime - startTime) / 1000
    );

    const activity = {
        task: currentTask,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: duration
    };

    console.log("Sending activity:", activity);

    try {

        const response = await fetch(
            "/add_activity",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(activity)
            }
        );

        const result = await response.json();

        console.log("Server response:", result);

        if (!response.ok) {
            alert(result.error || "Could not save activity.");
            return;
        }

        resetTimer();

        await loadActivities();

    } catch (error) {

        console.error("Save error:", error);

        alert("Could not connect to Flask.");
    }
}


// ==============================
// RESET TIMER
// ==============================

function resetTimer() {

    currentTask = "";
    startTime = null;
    timerInterval = null;

    document.getElementById("current-task").textContent =
        "No activity";

    document.getElementById("timer").textContent =
        "00:00:00";
}


// ==============================
// LOAD ACTIVITIES
// ==============================

async function loadActivities() {

    try {

        const response = await fetch("/activities");

        const activities = await response.json();

        console.log("Activities from server:", activities);

        displayHistory(activities);
        updateSummary(activities);
        updateChart(activities);

    } catch (error) {

        console.error(
            "Loading activities failed:",
            error
        );
    }
}


// ==============================
// HISTORY
// ==============================

function displayHistory(activities) {

    const history =
        document.getElementById("history");

    if (activities.length === 0) {

        history.innerHTML = `
            <p class="empty-message">
                No activities recorded yet.
            </p>
        `;

        return;
    }

    history.innerHTML = "";

    activities.forEach(activity => {

        const item =
            document.createElement("div");

        item.className = "history-item";

        item.innerHTML = `
            <div>
                <strong>${activity.task}</strong>

                <p>
                    ${formatTime(activity.start_time)}
                    -
                    ${formatTime(activity.end_time)}
                </p>
            </div>

            <strong>
                ${formatDuration(activity.duration)}
            </strong>
        `;

        history.appendChild(item);
    });
}


// ==============================
// SUMMARY
// ==============================

function updateSummary(activities) {

    if (activities.length === 0) {

        document.getElementById("total-time").textContent =
            "0h 0m";

        document.getElementById("highest-task").textContent =
            "No data";

        document.getElementById("lowest-task").textContent =
            "No data";

        return;
    }

    let total = 0;

    const totals = {};

    activities.forEach(activity => {

        total += Number(activity.duration);

        if (!totals[activity.task]) {
            totals[activity.task] = 0;
        }

        totals[activity.task] +=
            Number(activity.duration);
    });

    document.getElementById("total-time").textContent =
        formatShortDuration(total);

    const tasks = Object.entries(totals);

    tasks.sort((a, b) => b[1] - a[1]);

    const highest = tasks[0];
    const lowest = tasks[tasks.length - 1];

    document.getElementById("highest-task").textContent =
        highest[0] + " • " +
        formatShortDuration(highest[1]);

    document.getElementById("lowest-task").textContent =
        lowest[0] + " • " +
        formatShortDuration(lowest[1]);
}


// ==============================
// CHART
// ==============================

function updateChart(activities) {

    const chart =
        document.getElementById("pie-chart");

    const legend =
        document.getElementById("chart-legend");

    if (activities.length === 0) {

        chart.style.background = "#242d47";

        document.getElementById("chart-total").textContent =
            "0h";

        legend.textContent = "No data yet.";

        return;
    }

    const totals = {};

    let total = 0;

    activities.forEach(activity => {

        if (!totals[activity.task]) {
            totals[activity.task] = 0;
        }

        totals[activity.task] +=
            Number(activity.duration);

        total += Number(activity.duration);
    });

    document.getElementById("chart-total").textContent =
        formatShortDuration(total);

    const colors = [
        "#8b7cff",
        "#4fd1c5",
        "#f6ad55",
        "#63b3ed",
        "#f687b3",
        "#68d391",
        "#fc8181",
        "#b794f4",
        "#f6e05e",
        "#90cdf4"
    ];

    let currentAngle = 0;

    const parts = [];

    const entries =
        Object.entries(totals);

    entries.forEach(([task, seconds], index) => {

        const percentage =
            (seconds / total) * 100;

        const nextAngle =
            currentAngle + percentage;

        parts.push(
            `${colors[index % colors.length]}
             ${currentAngle}%
             ${nextAngle}%`
        );

        currentAngle = nextAngle;
    });

    chart.style.background =
        `conic-gradient(${parts.join(",")})`;

    legend.innerHTML = "";

    entries.forEach(([task, seconds], index) => {

        const percentage =
            ((seconds / total) * 100).toFixed(1);

        const item =
            document.createElement("div");

        item.className = "legend-item";

        item.innerHTML = `
            <span
                class="legend-dot"
                style="
                    background:
                    ${colors[index % colors.length]}
                ">
            </span>

            <span>
                ${task} - ${percentage}%
            </span>
        `;

        legend.appendChild(item);
    });
}


// ==============================
// FORMAT TIME
// ==============================

function formatDuration(seconds) {

    seconds = Number(seconds);

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const remaining =
        seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${remaining}s`;
    }

    return `${remaining}s`;
}


function formatShortDuration(seconds) {

    seconds = Number(seconds);

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    return `${hours}h ${minutes}m`;
}


function formatTime(value) {

    const date = new Date(value);

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==============================
// LOAD WHEN PAGE OPENS
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadActivities();
    }
);