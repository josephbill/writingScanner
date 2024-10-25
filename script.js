// script.js file

function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(function () {

    // If found you qr code
    function onScanSuccess(decodeText, decodeResult) {
        console.log("You Qr is : " + decodeText, decodeResult);
            // Extract the data using regular expressions or string methods
            const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
            const orderNumber = decodeText.match(/Order Number:\s*(\d+)/)?.[1];
            const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];
    
            // Log the extracted values to verify
            console.log("Order ID:", orderId);
            console.log("Order Number:", orderNumber);
            console.log("Product ID:", productId);
    
            // Check if the extracted values are not null or undefined
            if (orderId && orderNumber && productId) {
                // Save the values to localStorage
                localStorage.setItem("order_id", orderId);
                localStorage.setItem("order_number", orderNumber);
                localStorage.setItem("product_id", productId);
    
                alert("Order details saved in localStorage!");
            } else {
                alert("Failed to extract order details from the QR code.");
            }
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbos: 250 }
    );
    htmlscanner.render(onScanSuccess);
});
