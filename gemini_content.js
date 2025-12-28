(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get("q");

    if (!prompt) return;

    function insertPrompt() {
        // Gemini's input field selector (subject to change, using a broad strategy)
        const input = document.querySelector(".ql-editor") ||
            document.querySelector("rich-textarea div[contenteditable='true']") ||
            document.querySelector("div[contenteditable='true']");

        if (input) {
            // Clear existing content if any (optional, but good for clean slot runs)
            input.textContent = "";

            // Simulate typing/input
            input.focus();
            document.execCommand("insertText", false, prompt);

            // Dispatch input event to trigger UI updates
            input.dispatchEvent(new Event("input", { bubbles: true }));

            // Attempt to hit enter (optional, might require user interaction)
            /* 
            const enterEvent = new KeyboardEvent("keydown", {
              bubbles: true, cancelable: true, keyCode: 13, key: "Enter"
            });
            input.dispatchEvent(enterEvent);
            */
        } else {
            // Retry if not found yet
            setTimeout(insertPrompt, 500);
        }
    }

    // Initial attempt
    if (document.readyState === "complete") {
        insertPrompt();
    } else {
        window.addEventListener("load", insertPrompt);
    }
})();
