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
        function onScanSuccess(decodeText, decodeResult) {
            console.log("Your QR code data: " + decodeText, decodeResult);
            alert("Your QR code data: " + decodeText, decodeResult)
            const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
            const orderNumber = decodeText.match(/Order Number:\s*([a-zA-Z0-9]+)/)?.[1];
            const firstName = decodeText.match(/First Name:\s*([a-zA-Z0-9]+)/)?.[1];
            const lastname = decodeText.match(/Last Name:\s*([a-zA-Z0-9]+)/)?.[1];
            const quantity = decodeText.match(/Quantity:\s*([a-zA-Z0-9]+)/)?.[1];
            const prod_title = decodeText.match(/Product Title:\s*([a-zA-Z0-9]+)/)?.[1];
            const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];


            // alert(firstName)

            if (orderId && orderNumber && productId) {
                localStorage.setItem("order_id", orderId);
                localStorage.setItem("order_number", orderNumber);
                localStorage.setItem("product_id", productId);

                // Populate modal with details
                const modalDetails = document.getElementById("modal-order-details");
                modalDetails.innerHTML = `
                    <strong>Order ID:</strong> ${orderId}<br>
                    <strong>Order Number:</strong> ${orderNumber}<br>
                    <strong>Product ID:</strong> ${productId}<br>
                    <strong>Product Title:</strong> ${prod_title}<br>
                    <strong>Order Name:</strong> ${firstName} ${lastname}<br>
                    <strong>Quantity:</strong> ${quantity}
                `;

                // Show modal
                const modal = document.getElementById("scanModal");
                modal.style.display = "block";

                // Handle button clicks
                const fulfillBtn = document.getElementById("fulfill-btn");
                const cancelBtn = document.getElementById("cancel-btn");

                fulfillBtn.onclick = () => {
                    // Perform the fetch operation
                    const requestOptions = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ order_id: orderId }),
                    };

                    const url = "https://adverteyez.onrender.com/fulfill_order";

                    fetch(url, requestOptions)
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.details && data.details.fulfillment) {
                                alert(`Fulfillment Processed:\nStatus: ${data.details.fulfillment.status}`);
                                //update record as a scanned detail
                                     // submitting fulfillment
                                     // here add more details to the order submission in ticket_attendance 
                                     // TODO : also update model on backend  
                const data_shopify = {
                    "first_name": firstName + " " + lastname,
                    "order_number": orderNumber,
                    "order_id" : orderId,
                    "quantity" : quantity,
                    "prod_title" : prod_title,
                    "status" : "fulfilled"
                  }
                                 // Making the POST request to the server
 fetch('https://adverteyez.onrender.com/create_ticket_attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Tell the server we're sending JSON data
    },
    body: JSON.stringify(data_shopify) // Convert JavaScript object to JSON string
  })
  .then(response => response.json()) // Convert the response to JSON
  .then(result => {
    if (result.success) {
      console.log('Shopify order fulfilled.', result);
      alert(result.message)
      // Do something with the result if needed
    } else {
      console.error('Error:', result.message);
      alert(result.message)

      // Handle error if request fails
    }
  })
  .catch(error => {
    console.error('Request failed:', error);
    // Handle network or other errors
  }); 

                            } else {
                                alert(`${orderNumber}  : ${data.message || "Ticket fulfillment is already active. Check admin page for ticket count/ verification." || data.details.fulfillment.status}`);
                                                               // submitting fulfillment
                                                               // add more details as indicated above  
                const data_shopify_error = {
                  "first_name": firstName + " " + lastname,
                  "order_number": orderNumber,
                  "order_id" : orderId,
                  "quantity" : quantity,
                  "prod_title" : prod_title,
                  "status" : "fulfilled"
                  }
                  // here add a confirm window popup , for count check. 
                   // Populate modal with details
                const modalDetails = document.getElementById("modal-order-details");
                modalDetails.innerHTML = `
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>Order Number:</strong> ${orderNumber}<br>
                <strong>Product ID:</strong> ${productId}<br>
                <strong>Product Title:</strong> ${prod_title}<br>
                <strong>Order Name:</strong> ${firstName} ${lastname}<br>
                <strong>Quantity:</strong> ${quantity}
                `;

                // Show modal
                const modal = document.getElementById("scanModal");
                modal.style.display = "block";

                // Handle button clicks
                const fulfillBtn = document.getElementById("fulfill-btn");
                fulfillBtn.textContent = "Mark Attendance"
                const cancelBtn = document.getElementById("cancel-btn");

                fulfillBtn.addEventListener('click', function () {
                     
                                 // Making the POST request to the server
 fetch('https://adverteyez.onrender.com/create_ticket_attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json' // Tell the server we're sending JSON data
  },
  body: JSON.stringify(data_shopify_error) // Convert JavaScript object to JSON string
})
.then(response => response.json()) // Convert the response to JSON
.then(result => {
  if (result.success) {
    // console.log('Shopify order fulfilled. Multiple order fulfillment', result);
    alert('Shopify order fulfilled. Multiple order fulfillment')
    modal.style.display = "none";

    // Do something with the result if needed
  } else {
    console.error('Error:', result.message);
    alert(result.message)
    modal.style.display = "none";

    // Handle error if request fails
  }
})
.catch(error => {
  console.error('Request failed:', error);
  // Handle network or other errors
}); 

                })

                // cancel button 
                cancelBtn.addEventListener('click', function(){
                  modal.style.display = "none";
                })


                }
                        })
                        .catch((error) => {
                            console.error("Request failed:", error);
                            alert("Error: Request failed during fulfillment process.");
                        });

                    // Close modal
                    modal.style.display = "none";
                };

                cancelBtn.onclick = () => {
                    modal.style.display = "none";
                };
            } else if(orderNumber.toLowerCase()  === 'mpesa'){
                alert("Mpesa Payment. Ticket Verified")
                // submitting fulfillment 
                const data_mpesa = {
                  "first_name": firstName + " " + lastname,
                  "order_number": orderNumber,
                  "order_id" : orderId,
                  "quantity" : quantity,
                  "prod_title" : prod_title,
                  "status" : "fulfilled"
                  }

                  const modalDetails = document.getElementById("modal-order-details");
                  modalDetails.innerHTML = `
                  <strong>Order ID:</strong> ${orderId}<br>
                  <strong>Order Number:</strong> ${orderNumber}<br>
                  <strong>Product ID:</strong> ${productId}<br>
                  <strong>Product Title:</strong> ${prod_title}<br>
                  <strong>Order Name:</strong> ${firstName} ${lastname}<br>
                  <strong>Quantity:</strong> ${quantity}
              `;
  
                  // Show modal
                  const modal = document.getElementById("scanModal");
                  modal.style.display = "block";
  
                  // Handle button clicks
                  const fulfillBtn = document.getElementById("fulfill-btn");
                  fulfillBtn.textContent = "Mark Attendance"
                  const cancelBtn = document.getElementById("cancel-btn");
  
                  fulfillBtn.addEventListener('click', function () {
                       
                                   // Making the POST request to the server
// Making the POST request to the server
fetch('https://adverteyez.onrender.com/create_ticket_attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json' // Tell the server we're sending JSON data
  },
  body: JSON.stringify(data_mpesa) // Convert JavaScript object to JSON string
})
.then(response => response.json()) // Convert the response to JSON
.then(result => {
  if (result.success) {
    console.log('Mpesa fulfilled.', result);
    alert(result.message)
    modal.style.display = "none";

    // Do something with the result if needed
  } else {
    console.error('Error:', result.message);
    alert(result.message)
    modal.style.display = "none";

    // Handle error if request fails
  }
})
.catch(error => {
  console.error('Request failed:', error);
  // Handle network or other errors
}); 
  
                  })
  
                  // cancel button 
                  cancelBtn.addEventListener('click', function(){
                    modal.style.display = "none";
                  })


                  
            } else if(orderNumber.toLowerCase()  === 'complimentary'){
                alert("This is a complimentary issued ticket. Ticket Verified")

                const data_complimentary = {
                  "first_name": firstName + " " + lastname,
                  "order_number": orderNumber,
                  "order_id" : orderId,
                  "quantity" : quantity,
                  "prod_title" : prod_title,
                  "status" : "fulfilled"
                  }

                  const modalDetails = document.getElementById("modal-order-details");
                  modalDetails.innerHTML = `
                  <strong>Order ID:</strong> ${orderId}<br>
                  <strong>Order Number:</strong> ${orderNumber}<br>
                  <strong>Product ID:</strong> ${productId}<br>
                  <strong>Product Title:</strong> ${prod_title}<br>
                  <strong>Order Name:</strong> ${firstName} ${lastname}<br>
                  <strong>Quantity:</strong> ${quantity}
              `;
  
                  // Show modal
                  const modal = document.getElementById("scanModal");
                  modal.style.display = "block";
  
                  // Handle button clicks
                  const fulfillBtn = document.getElementById("fulfill-btn");
                  fulfillBtn.textContent = "Mark Attendance"
                  const cancelBtn = document.getElementById("cancel-btn");
  
                  fulfillBtn.addEventListener('click', function () {
                       
                                   // Making the POST request to the server
 // Making the POST request to the server
 fetch('https://adverteyez.onrender.com/create_ticket_attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json' // Tell the server we're sending JSON data
  },
  body: JSON.stringify(data_complimentary) // Convert JavaScript object to JSON string
})
.then(response => response.json()) // Convert the response to JSON
.then(result => {
  if (result.success) {
    console.log('Complimentary recorded:', result);
    alert(result.message)
    modal.style.display = "none";
    // Do something with the result if needed
  } else {
    console.error('Error:', result.message);
    alert(result.message)
    modal.style.display = "none";
    // Handle error if request fails
  }
})
.catch(error => {
  console.error('Request failed:', error);
  // Handle network or other errors
});
  
                  })
  
                  // cancel button 
                  cancelBtn.addEventListener('click', function(){
                    modal.style.display = "none";
                  })


                
            } else {
                alert("Failed to extract order details from the QR code.");
            }
        }

        let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbos: 250 });
        htmlscanner.render(onScanSuccess);
    });
