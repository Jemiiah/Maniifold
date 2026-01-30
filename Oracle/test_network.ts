
import "@provablehq/sdk/testnet.js";

async function test() {
    console.log("Testing fetch to api.provable.com...");
    try {
        const res = await fetch("https://api.provable.com/v2/testnet/program/predictionprivacyhack.aleo");
        console.log("Fetch Status:", res.status);
        const text = await res.text();
        console.log("Fetch Response length:", text.length);
    } catch (e: any) {
        console.error("Fetch failed:", e);
    }

    console.log("\nTesting XMLHttpRequest to parameters.provable.com...");
    try {
        const xhr = new globalThis.XMLHttpRequest();
        xhr.open("GET", "https://parameters.provable.com/testnet/fee_public.prover.f72b6ff", true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log("XHR Status:", xhr.status);
                console.log("XHR Response length:", xhr.responseText?.length || 0);
            }
        };
        xhr.onerror = (err) => console.error("XHR error event:", err);
        xhr.send();
    } catch (e: any) {
        console.error("XHR failed synchronously:", e);
    }
}

test();
