// Fetch submissions from storage and display them in the popup
chrome.storage.sync.get(["submissions"], function(data) {
    const submissions = data.submissions || [];
    const resultsDiv = document.getElementById("submissionResults");

    if (submissions.length === 0) {
        resultsDiv.innerHTML = "<p>No submissions to display.</p>";
    } else {
        resultsDiv.innerHTML = "<h2>Recent Submissions:</h2>";
        submissions.forEach(function(submission) {
            const submissionElement = document.createElement("div");
            submissionElement.innerHTML = `
                <p><strong>Title:</strong> ${submission.title}</p>
                <p><strong>Solution ID:</strong> ${submission.solution_id}</p>
                <p><strong>Website:</strong> ${submission.website}</p>
                <hr>
            `;
            resultsDiv.appendChild(submissionElement);
        });
    }
});
