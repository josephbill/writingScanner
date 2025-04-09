domReady(function () {
    // Common function to handle ticket attendance submission
    async function submitTicketAttendance(data, modal) {
      try {
        const response = await fetch('https://adverteyez.onrender.com/create_ticket_attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          window.location.reload();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Request failed:', error);
        alert("Error submitting ticket attendance");
      } finally {
        if (modal) modal.style.display = "none";
      }
    }
  
    // Common function to populate modal
    function populateModal(modal, details) {
      const modalDetails = document.getElementById("modal-order-details");
      modalDetails.innerHTML = `
        <strong>Order ID:</strong> ${details.orderId || 'N/A'}<br>
        <strong>Order Number:</strong> ${details.orderNumber}<br>
        <strong>Product ID:</strong> ${details.productId || 'N/A'}<br>
        <strong>Product Title:</strong> ${details.prodTitle || 'N/A'}<br>
        <strong>Order Name:</strong> ${details.firstName} ${details.lastName || ''}<br>
        <strong>Quantity:</strong> ${details.quantity}
      `;
  
      const fulfillBtn = document.getElementById("fulfill-btn");
      const cancelBtn = document.getElementById("cancel-btn");
  
      fulfillBtn.textContent = details.btnText || "Fulfill Order";
      fulfillBtn.onclick = details.onFulfillClick || null;
      cancelBtn.onclick = () => { modal.style.display = "none"; };
  
      modal.style.display = "block";
    }
  
    // Handle order fulfillment
    async function handleOrderFulfillment(orderId, orderNumber, firstName, lastName, quantity, prodTitle, productId) {
      const modal = document.getElementById("scanModal");
      
      try {
        const response = await fetch("https://adverteyez.onrender.com/fulfill_order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId })
        });
        
        const data = await response.json();
        
        if (data.details?.fulfillment) {
          alert(`Remaining: ${data.remaining} - Status: ${data.status} - Fulfilled: ${data.fulfilled} - Quantity: ${quantity}`);
          
          const ticketData = {
            first_name: `${firstName} ${lastName}`,
            order_number: orderNumber,
            order_id: orderId,
            quantity: quantity,
            prod_title: prodTitle,
            status: "fulfilled"
          };
          
          await submitTicketAttendance(ticketData, modal);
        } else {
          alert(`${orderNumber}: ${data.message || "Ticket fulfillment may already be active. Check admin page for verification."}`);
          
          const modalDetails = {
            orderId,
            orderNumber,
            productId,
            prodTitle,
            firstName,
            lastName,
            quantity,
            btnText: "Mark Attendance"
          };
          
          populateModal(modal, {
            ...modalDetails,
            onFulfillClick: () => {
              submitTicketAttendance({
                first_name: `${firstName} ${lastName}`,
                order_number: orderNumber,
                order_id: orderId,
                quantity: quantity,
                prod_title: prodTitle,
                status: "fulfilled"
              }, modal);
            }
          });
        }
      } catch (error) {
        console.error("Request failed:", error);
        alert("Error during fulfillment process.");
      }
    }
  
    // Handle special ticket types (MPESA, Complimentary)
    function handleSpecialTicket(type, firstName, lastName, quantity, prodTitle) {
      alert(`${type} Payment. Ticket Verified`);
      
      const modal = document.getElementById("scanModal");
      const orderNumber = type.toLowerCase();
      const ticketData = {
        first_name: `${firstName} ${lastName}`,
        order_number: orderNumber,
        order_id: type === "MPESA" ? 1 : 0,
        quantity: quantity,
        prod_title: prodTitle,
        status: "fulfilled"
      };
      
      populateModal(modal, {
        orderId: 'N/A',
        orderNumber: type,
        productId: 'N/A',
        prodTitle,
        firstName,
        lastName,
        quantity,
        btnText: "Mark Attendance",
        onFulfillClick: () => submitTicketAttendance(ticketData, modal)
      });
    }
  
    // Main scan success handler
    function onScanSuccess(decodeText, decodeResult) {
      console.log("QR code data:", decodeText, decodeResult);
      
      const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
      const orderNumber = decodeText.match(/Order Number:\s*([a-zA-Z0-9]+)/)?.[1];
      const firstName = decodeText.match(/First Name:\s*([a-zA-Z]+)/)?.[1] || '';
      const lastName = decodeText.match(/Last Name:\s*([a-zA-Z]+)/)?.[1] || '';
      const quantity = decodeText.match(/Quantity:\s*(\d+)/)?.[1] || '0';
      const prodTitle = decodeText.match(/Product Title:\s*([a-zA-Z0-9\s]+)/)?.[1] || '';
      const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];
  
      if (orderId && orderNumber && productId) {
        localStorage.setItem("order_id", orderId);
        localStorage.setItem("order_number", orderNumber);
        localStorage.setItem("product_id", productId);
  
        populateModal(document.getElementById("scanModal"), {
          orderId, orderNumber, productId, prodTitle, 
          firstName, lastName, quantity
        });
  
        document.getElementById("fulfill-btn").onclick = () => {
          handleOrderFulfillment(orderId, orderNumber, firstName, lastName, quantity, prodTitle, productId);
        };
      } else if (orderNumber?.toLowerCase() === 'mpesa') {
        handleSpecialTicket("MPESA", firstName, lastName, quantity, prodTitle);
      } else if (orderNumber?.toLowerCase() === 'complimentary') {
        handleSpecialTicket("Complimentary", firstName, lastName, quantity, prodTitle);
      } else {
        alert("Failed to extract order details from the QR code.");
      }
    }
  
    // Initialize scanner
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { 
      fps: 10, 
      qrbos: 250 
    });
    htmlscanner.render(onScanSuccess);
  });