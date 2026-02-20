function getRegulation(hallticket) {
    const prefix = hallticket.substring(0,4);

    if (["20JD","21JD","22JD"].includes(prefix)) return "R20";
    if (["23JD","24JD","25JD"].includes(prefix)) return "R23";
}

const gradePoints = {
    R20: { "A+":10,"A":9,"B":8,"C":7,"D":6,"E":5,"F":0,"AB":0 },
    R23: { "S":10,"A":9,"B":8,"C":7,"D":6,"E":5,"F":0,"Ab":0 }
};

function calculateSGPA(subjects, regulation) {
    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach(sub => {
        const credit = parseFloat(sub.credit);
        const grade = sub.grade.trim();
        const point = gradePoints[regulation][grade];

        totalCredits += credit;
        totalPoints += credit * point;
    });

    return (totalPoints / totalCredits).toFixed(2);
}

function processResult() {
    const fileInput = document.getElementById("csvFile");
    const hallticket = document.getElementById("hallticketInput").value.trim();
    const semester = document.getElementById("semesterSelect").value;

    if (!fileInput.files.length) {
        alert("Upload CSV file");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n").slice(1);

        let subjects = [];

        rows.forEach(row => {
            const cols = row.split(",");
            if (cols[0] === hallticket) {
                subjects.push({
                    subcode: cols[1],
                    subname: cols[2],
                    internals: cols[3],
                    grade: cols[4],
                    credit: cols[5]
                });
            }
        });

        if (subjects.length === 0) {
            alert("No records found");
            return;
        }

        const regulation = getRegulation(hallticket);
        const sgpa = calculateSGPA(subjects, regulation);

        displayResult(subjects, sgpa);
    };

    reader.readAsText(file);
}

function displayResult(subjects, sgpa) {

    let html = "<table><tr><th>Code</th><th>Name</th><th>Grade</th><th>Credit</th></tr>";

    subjects.forEach(sub => {
        html += `<tr>
                    <td>${sub.subcode}</td>
                    <td>${sub.subname}</td>
                    <td>${sub.grade}</td>
                    <td>${sub.credit}</td>
                </tr>`;
    });

    html += "</table>";

    html += `
    <div class="summary">
        <h3>SGPA: ${sgpa}</h3>
    </div>
    `;

    document.getElementById("resultSection").innerHTML = html;
}