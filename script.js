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
    // If found your QR code
    function onScanSuccess(decodeText, decodeResult) {
        console.log("Your QR code data: " + decodeText, decodeResult);

        // Extract the data using regular expressions or string methods
        const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
        const orderNumber = decodeText.match(/Order Number:\s*(\d+)/)?.[1];
        const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];

        // Log the extracted values to verify
        console.log("Order ID:", orderId);
        console.log("Order Number:", orderNumber);
        console.log("Product ID:", productId);

        // Create or update a paragraph to display the combined details
        let detailsParagraph = document.getElementById("order-details");
        if (!detailsParagraph) {
            // Create the paragraph if it doesn't exist
            detailsParagraph = document.createElement("p");
            detailsParagraph.id = "order-details";
            document.body.appendChild(detailsParagraph);
        }

        // Check if the extracted values are valid
        if (orderId && orderNumber && productId) {
            // Save the values to localStorage
            localStorage.setItem("order_id", orderId);
            localStorage.setItem("order_number", orderNumber);
            localStorage.setItem("product_id", productId);

            // Display the extracted QR code details
            detailsParagraph.innerHTML = `
                <strong>QR Code Details:</strong><br>
                Order ID: ${orderId}<br>
                Order Number: ${orderNumber}<br>
                Product ID: ${productId}<br>
                Processing fulfillment...
            `;

            // Define the request options
            const requestOptions = {
                method: 'POST', // or PUT depending on your API's method
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ order_id: orderId }) // Send order_id in the request body
            };

            // URL of the API endpoint
            const url = 'https://adverteyez.onrender.com/fulfill_order'; // Replace with the correct API endpoint

            // Perform the fetch operation
            fetch(url, requestOptions)
                .then(response => response.json()) // Parse the JSON response
                .then(data => {
                    if (data.details && data.details.fulfillment) {
                        console.log('Fulfillment processed:', data.details.fulfillment);

                        // Update the paragraph with fulfillment details
                        detailsParagraph.innerHTML += `
                            <br><strong>Fulfillment Processed:</strong><br>
                            Fulfillment ID: ${data.details.fulfillment.id}<br>
                            Order ID: ${data.details.fulfillment.order_id}<br>
                            Status: ${data.details.fulfillment.status}<br>
                            Line Items: ${data.details.fulfillment.line_items.map(item => item.name).join(', ')}<br>
                            Created At: ${data.details.fulfillment.created_at}
                        `;
                    } else {
                        detailsParagraph.innerHTML += `<br><strong>Error:</strong> ${data.message || 'Unknown error in fulfillment processing.'}`;
                    }
                })
                .catch(error => {
                    console.error('Request failed:', error);
                    detailsParagraph.innerHTML += `<br><strong>Error:</strong> Request failed during fulfillment process.`;
                });
        } else {
            // Display error if details couldn't be extracted
            detailsParagraph.innerHTML = "Failed to extract order details from the QR code.";
        }
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbos: 250 }
    );
    htmlscanner.render(onScanSuccess);
});
