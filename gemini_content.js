(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get("q");

    if (!prompt) return;

    // Log for debugging
    console.log("[GPT Side Runner] Attempting to insert prompt:", prompt);

    function findInput() {
        // Strategy 1: Common rich text editors
        const selectors = [
            ".ql-editor",
            "rich-textarea div[contenteditable='true']",
            "div[role='textbox']",
            "div[contenteditable='true']",
            "textarea",
            // Specific to Gemini variants seen in wild
            "div[aria-label='Enter a prompt here']",
            "div[aria-label='プロンプトを入力してください']",
            "div[aria-label='プロンプト']",
            "div[aria-label='入力']"
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                console.log("[GPT Side Runner] Found input using selector:", selector);
                return el;
            }
        }
        return null;
    }

    function insertText(input, text) {
        input.focus();

        // Method 1: execCommand (Standard for contenteditable)
        const success = document.execCommand("insertText", false, text);
        if (success) {
            console.log("[GPT Side Runner] Inserted text via execCommand");
            return;
        }

        // Method 2: Direct manipulation + Events (Fallback)
        console.log("[GPT Side Runner] execCommand failed, trying direct manipulation");

        // Backup existing text just in case (usually empty for new chat)
        const originalText = input.innerText;
        input.innerText = text; // Or textContent

        // Dispatch events to simulate user input so framework picks it up
        const events = ["input", "change", "textInput"];
        events.forEach(evtType => {
            input.dispatchEvent(new Event(evtType, { bubbles: true, cancelable: true }));
        });

        // Specific modern event for some frameworks
        // input.dispatchEvent(new InputEvent('input', {bubbles: true, data: text, inputType: 'insertText'})); 
    }

    function attemptInsertion(retries = 10) {
        const input = findInput();
        if (input) {
            // Wait a split second to ensure focusability
            setTimeout(() => insertText(input, prompt), 200);
        } else if (retries > 0) {
            console.log(`[GPT Side Runner] Input not found, retrying... (${retries})`);
            setTimeout(() => attemptInsertion(retries - 1), 500);
        } else {
            console.warn("[GPT Side Runner] Failed to find input field after multiple retries.");
        }
    }

    if (document.readyState === "complete") {
        attemptInsertion();
    } else {
        window.addEventListener("load", () => attemptInsertion());
    }
})();
