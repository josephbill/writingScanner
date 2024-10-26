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
    
                //alert("Order details saved in localStorage!");
                alert("processing")
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
      alert("Fulfilment Process")
      // You can now access the fulfillment details like so:
      const fulfillment = data.details.fulfillment;
      console.log('Fulfillment ID:', fulfillment.id);
      console.log('Order ID:', fulfillment.order_id);
      console.log('Status:', fulfillment.status);
      console.log('Line Items:', fulfillment.line_items);
      console.log('Created At:', fulfillment.created_at);
      // Process further details as required
    } else {
      alert('Error in response:', data.message || 'Unknown error');
      alert("Error")
    }
  })
  .catch(error => {
    console.error('Request failed:', error);
  });

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
