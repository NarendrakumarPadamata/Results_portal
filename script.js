// =====================================
// GLOBAL DATABASE
// =====================================
let studentDatabase = {};

// =====================================
// DEFINE CSV FILES HERE
// =====================================
const csvFiles = [
    "data/1-1_REG_NOV_2025.csv",
    "data/1-2_REG_APR_2026.csv",
    "data/2-1_REG_NOV_2025.csv",
    "data/2-2_REG_APR_2027.csv",
    "data/3-1_REG_NOV_2027.csv"
];

// =====================================
// REGULATION DETECTION
// =====================================
function getRegulation(hallticket) {
    const prefix = hallticket.substring(0, 4).toUpperCase();

    if (["20JD", "21JD", "22JD"].includes(prefix)) return "R20";
    if (["23JD", "24JD", "25JD"].includes(prefix)) return "R23";

    return "R23";
}

// =====================================
// GRADE POINTS
// =====================================
const gradePoints = {
    R20: { "A+":10,"A":9,"B":8,"C":7,"D":6,"E":5,"F":0,"AB":0,"ABSENT":0 },
    R23: { "S":10,"A":9,"B":8,"C":7,"D":6,"E":5,"F":0,"AB":0,"ABSENT":0 }
};

// =====================================
// LOAD ALL CSV FILES
// =====================================
async function loadAllCSV() {

    for (let filePath of csvFiles) {

        try {
            const response = await fetch(filePath);
            if (!response.ok) continue;

            const text = await response.text();

            const fileName = filePath.split("/")[1].replace(".csv", "");
            const parts = fileName.split("_");

            const semester = parts[0];
            const month = parts[2];
            const year = parts[3];
            const examKey = month + "-" + year;

            const rows = text.split(/\r?\n/);

            for (let i = 1; i < rows.length; i++) {

                if (rows[i].trim() === "") continue;

                const cols = rows[i].split(",");

                const hallticket = cols[1]?.trim().toUpperCase();
                const subcode = cols[2]?.trim();
                const subname = cols[3]?.trim();
                const internal = cols[4]?.trim() || "-";
                const grade = cols[5]?.trim().toUpperCase();
                const credit = parseFloat(cols[6]);

                if (!hallticket) continue;

                if (!studentDatabase[hallticket]) {
                    studentDatabase[hallticket] = {
                        regulation: getRegulation(hallticket),
                        semesters: {}
                    };
                }

                if (!studentDatabase[hallticket].semesters[semester]) {
                    studentDatabase[hallticket].semesters[semester] = {};
                }

                if (!studentDatabase[hallticket].semesters[semester][examKey]) {
                    studentDatabase[hallticket].semesters[semester][examKey] = [];
                }

                studentDatabase[hallticket]
                    .semesters[semester][examKey]
                    .push({ subcode, subname, internal, grade, credit });
            }

        } catch (error) {
            console.log("Error loading:", filePath);
        }
    }

    console.log("All CSV files loaded successfully");
}

// Load CSV immediately
loadAllCSV();

// =====================================
// CALCULATE SGPA
// =====================================
function calculateSGPA(subjects, regulation) {

    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach(sub => {
        const point = gradePoints[regulation][sub.grade] ?? 0;
        totalCredits += sub.credit;
        totalPoints += sub.credit * point;
    });

    if (totalCredits === 0) return "0.00";

    return (totalPoints / totalCredits).toFixed(2);
}

// =====================================
// CALCULATE CGPA
// =====================================
function calculateCGPA(student) {

    let totalCredits = 0;
    let totalPoints = 0;

    for (const sem in student.semesters) {
        for (const exam in student.semesters[sem]) {
            student.semesters[sem][exam].forEach(sub => {
                const point = gradePoints[student.regulation][sub.grade] ?? 0;
                totalCredits += sub.credit;
                totalPoints += sub.credit * point;
            });
        }
    }

    if (totalCredits === 0) return "0.00";

    return (totalPoints / totalCredits).toFixed(2);
}

// =====================================
// MAIN BUTTON FUNCTION
// =====================================
function getResult() {

    const hallticket = document
        .querySelector("input[type='text']")
        .value.trim()
        .toUpperCase();

    const selectedSemester = document.querySelectorAll("select")[1].value;

    if (!hallticket) {
        alert("Enter Hall Ticket");
        return;
    }

    const student = studentDatabase[hallticket];

    if (!student) {
        alert("No Data Found");
        return;
    }

    let htmlContent = "";

    const semestersToShow =
        selectedSemester === "ALL"
            ? Object.keys(student.semesters)
            : [selectedSemester];

    semestersToShow.forEach(sem => {

        if (!student.semesters[sem]) return;

        htmlContent += `<h3>Semester ${sem}</h3>`;

        for (const exam in student.semesters[sem]) {

            htmlContent += `
                <table>
                    <tr>
                        <th>Sub Code</th>
                        <th>Sub Name</th>
                        <th>Internal</th>
                        <th>Grade</th>
                        <th>Credit</th>
                    </tr>
            `;

            student.semesters[sem][exam].forEach(sub => {
                htmlContent += `
                    <tr>
                        <td>${sub.subcode}</td>
                        <td>${sub.subname}</td>
                        <td>${sub.internal}</td>
                        <td>${sub.grade}</td>
                        <td>${sub.credit}</td>
                    </tr>
                `;
            });

            htmlContent += `</table>`;

            const sgpa = calculateSGPA(
                student.semesters[sem][exam],
                student.regulation
            );

            htmlContent += `<p><strong>SGPA: ${sgpa}</strong></p>`;
        }
    });

    const cgpa = calculateCGPA(student);
    const percentage = ((cgpa - 0.5) * 10).toFixed(2);

    htmlContent += `
        <div class="summary">
            <h3>CGPA: ${cgpa}</h3>
            <h3>Percentage: ${percentage}%</h3>
        </div>
    `;

    // ===== OPEN NEW TAB =====
    const newTab = window.open("", "_blank");

    newTab.document.write(`
        <html>
        <head>
            <title>Result</title>
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <div class="header">
                <h2 style="text-align:center;">ELURU COLLEGE OF ENGINEERING AND TECHNOLOGY</h2>
                <h3 style="text-align:center;">RESULTS PORTAL</h3>
            </div>
            <div class="main-container">
                <div class="card">
                    ${htmlContent}
                </div>
            </div>
        </body>
        </html>
    `);

    newTab.document.close();
}
