const CODECHEF_URL = "www.codechef.com";
const CODEFORCES_URL = "codeforces.com";
const ICON_PATH = chrome.runtime.getURL("icon.png");

// Initializing storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ submissions: [] });
});

// Listening for new submissions
chrome.webRequest.onBeforeSendHeaders.addListener(
    async (details) => {
        const url = new URL(details.url);
        const solution_id = url.searchParams.get("solution_id");

        // Check if the request is for CodeChef or Codeforces
        if (url.hostname.includes(CODECHEF_URL) || url.hostname.includes(CODEFORCES_URL)) {
            const data = await chrome.storage.sync.get(["submissions"]);
            const submissions = data.submissions || [];

            // Insert if solution_id not present in storage
            if (solution_id && !isPresent(solution_id, submissions)) {
                let submission = {
                    title: getTitle(details.requestHeaders),
                    solution_id: solution_id,
                    website: url.hostname.includes(CODECHEF_URL) ? CODECHEF_URL : CODEFORCES_URL,
                };
                submissions.push(submission);
                chrome.storage.sync.set({ submissions: submissions });

                fetchResults();
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

// Checking if submission already present into storage
function isPresent(solution_id, submissions) {
    return submissions.some(submission => submission.solution_id === solution_id);
}

// Extracting title of the problem
function getTitle(headers) {
    let url = null;
    headers.forEach((header) => {
        if (header.name === "Referer") {
            url = header.value;
        }
    });
    if (url) {
        const urlParams = new URLSearchParams(url.substring(url.lastIndexOf("?") + 1));
        return urlParams.get("title");
    }
    return "";
}

// Fetching results
async function fetchResults() {
    const data = await chrome.storage.sync.get(["submissions"]);
    const submissions = data.submissions || [];

    if (submissions.length) {
        const promises = submissions.map((submission) => {
            if (submission.website === CODECHEF_URL) {
                return getData(`https://www.codechef.com/api/ide/submit?solution_id=${submission.solution_id}`);
            } else if (submission.website === CODEFORCES_URL) {
                return getData(`https://codeforces.com/api/user.status?handle=Luffy_06&from=1`);
            }
        });

        Promise.all(promises).then((results) => {
            results.forEach((result, index) => {
                if (result && result.result_code != "wait") {
                    const submission = submissions[index];
                    chrome.notifications.create("", {
                        type: "basic",
                        title: `Problem: ${submission.title}`,
                        message: createMessage(result.result_code),
                        iconUrl: ICON_PATH,
                    });
                    submissions.splice(index, 1);
                }
            });
            if (submissions.length) {
                setTimeout(fetchResults, 1000);
            }
            chrome.storage.sync.set({ submissions: submissions });
        });
    }
}


// Fetching individual response from API
function getData(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then((res) => res.json())
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });
}

// Updating submissions - Removing completed submission
function updatedSubmissions(solution_id, submissions) {
    return submissions.filter((submission) => submission.solution_id !== solution_id);
}


// Function to create a message based on the verdict code
function createMessage(code) {
    // Verdicts specific to CodeChef
    switch (code) {
        case "accepted":
            return "Verdict: Accepted!";
        case "partial_accepted":
            return "Verdict: Partially Accepted!";
        case "wrong":
            return "Verdict: Wrong!";
        case "time":
            return "Verdict: Time Limit Exceeded!";
        case "runtime":
            return "Verdict: Runtime Error!";
        case "compile":
            return "Verdict: Compilation Error!";
        case "score":
            return "Verdict: Insufficient Score!";
        case "error":
            return "Verdict: Internal Error!";
    }

    // General verdicts
    switch (code) {
        case "OK":
            return "Verdict: Accepted!";
        case "PARTIAL":
            return "Verdict: Partially Accepted!";
        case "WRONG_ANSWER":
            return "Verdict: Wrong Answer!";
        case "TIME_LIMIT_EXCEEDED":
            return "Verdict: Time Limit Exceeded!";
        case "MEMORY_LIMIT_EXCEEDED":
            return "Verdict: Memory Limit Exceeded!";
        case "RUNTIME_ERROR":
            return "Verdict: Runtime Error!";
        case "COMPILATION_ERROR":
            return "Verdict: Compilation Error!";
        case "INTERNAL_ERROR":
            return "Verdict: Internal Error!";
        case "INFINITE_LOOP":
            return "Verdict: Infinite Loop!";
        case "SEGMENTATION_FAULT":
            return "Verdict: Segmentation Fault!";
        case "PRESENTATION_ERROR":
            return "Verdict: Presentation Error!";
        case "RUNTIME_ERROR_SEGMENTATION_FAULT":
            return "Verdict: Runtime Error (Segmentation Fault)!";
        case "RUNTIME_ERROR_UNKNOWN":
            return "Verdict: Runtime Error (Unknown)!";
        case "JUDGE_ERROR":
            return "Verdict: Judge Error!";
        case "SYSTEM_ERROR":
            return "Verdict: System Error!";
        case "UNKNOWN":
            return "Verdict: Unknown!";
        case "SKIPPED":
            return "Verdict: Skipped!";
        case "TESTING":
            return "Verdict: Testing!";
        case "IDLENESS_LIMIT_EXCEEDED":
            return "Verdict: Idleness Limit Exceeded!";
        default:
            return "Verdict: Unrecognized!";
    }
}

