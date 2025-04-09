function domReady(fn) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(fn, 1000);
  } else {
      document.addEventListener("DOMContentLoaded", fn);
  }
}

domReady(function () {
  // DOM elements
  const statusIndicator = document.getElementById("scan-indicator");
  const statusText = document.getElementById("status-text");
  const ticketCount = document.getElementById("ticket-count");
  const scannedCount = document.getElementById("scanned-count");
  const totalCount = document.getElementById("total-count");
  const currentTicket = document.getElementById("current-ticket");
  const ticketDetails = document.getElementById("ticket-details");
  const processBtn = document.getElementById("process-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const scanHistory = document.getElementById("scan-history");
  const successSound = document.getElementById("success-sound");
  const errorSound = document.getElementById("error-sound");
  
  // State management
  let currentOrder = null;
  let scannedTickets = JSON.parse(localStorage.getItem("scannedTickets")) || [];
  
  // Update UI with scan history
  function updateScanHistory() {
      scanHistory.innerHTML = scannedTickets.slice(0, 5).map(ticket => `
          <div class="scan-item ${ticket.status}">
              <span class="order-number">${ticket.order_number}</span>
              <span class="name">${ticket.first_name}</span>
              <span class="status">${ticket.status}</span>
              <span class="time">${new Date(ticket.timestamp).toLocaleTimeString()}</span>
          </div>
      `).join("");
  }
  
  // Show current ticket info
  function showTicketInfo(order) {
      currentOrder = order;
      ticketDetails.innerHTML = `
          <p><strong>Order:</strong> ${order.order_number}</p>
          <p><strong>Name:</strong> ${order.first_name} ${order.last_name}</p>
          <p><strong>Product:</strong> ${order.prod_title}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
          ${order.status === 'fulfilled' ? '<p class="notice">This ticket is already fulfilled. Mark attendance for additional guests.</p>' : ''}
      `;
      
      // Always show count for orders with quantity > 1
      if (order.quantity > 1) {
          scannedCount.textContent = order.scannedCount || (order.status === 'fulfilled' ? order.quantity : 1);
          totalCount.textContent = order.quantity;
          ticketCount.classList.remove("hidden");
      } else {
          ticketCount.classList.add("hidden");
      }
      
      // Update button text and behavior based on status
      if (order.status === 'fulfilled') {
          processBtn.textContent = 'Mark Attendance';
          processBtn.classList.remove('btn-success');
          processBtn.classList.add('btn-primary');
      } else {
          processBtn.textContent = 'Fulfill Order';
          processBtn.classList.remove('btn-primary');
          processBtn.classList.add('btn-success');
      }
      
      // Always show cancel button
      cancelBtn.style.display = 'inline-block';
      
      currentTicket.classList.remove("hidden");
  }
  
  // Update status display
  function updateStatus(status, message) {
      statusIndicator.className = `indicator ${status}`;
      statusText.textContent = message;
  }
  
  // Play sound feedback
  function playSound(type) {
      if (type === 'success') {
          successSound.currentTime = 0;
          successSound.play();
      } else {
          errorSound.currentTime = 0;
          errorSound.play();
      }
  }
  
  // Process order fulfillment or attendance marking
  function processTicket() {
      if (!currentOrder) return;
      
      updateStatus('processing', 'Processing...');
      
      const isAlreadyFulfilled = currentOrder.status === 'fulfilled';
      const endpoint = isAlreadyFulfilled ? 
          'https://adverteyez.onrender.com/create_ticket_attendance' : 
          'https://adverteyez.onrender.com/fulfill_order';
      
      const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              order_id: currentOrder.order_id,
              first_name: `${currentOrder.first_name} ${currentOrder.lastname}`,
              order_number: currentOrder.order_number,
              quantity: currentOrder.quantity,
              prod_title: currentOrder.prod_title,
              status: "fulfilled"
          })
      };
      
      fetch(endpoint, requestOptions)
          .then(response => response.json())
          .then(data => {
              if (data.success || (data.details && data.details.fulfillment)) {
                  playSound('success');
                  
                  // Update order status
                  currentOrder.status = 'fulfilled';
                  
                  // Update scanned count
                  if (data.details) {
                      currentOrder.scannedCount = data.details.fulfilled;
                  } else {
                      currentOrder.scannedCount = (currentOrder.scannedCount || 0) + 1;
                  }
                  
                  // Add to scan history
                  const scanRecord = {
                      ...currentOrder,
                      timestamp: new Date().toISOString(),
                      action: isAlreadyFulfilled ? 'attendance' : 'fulfillment'
                  };
                  scannedTickets.unshift(scanRecord);
                  localStorage.setItem("scannedTickets", JSON.stringify(scannedTickets));
                  
                  updateStatus('success', isAlreadyFulfilled ? 'Attendance marked!' : 'Order fulfilled!');
                  updateScanHistory();
                  
                  // For fulfilled orders with remaining quantity, keep the ticket visible
                  if (currentOrder.quantity > 1 && currentOrder.scannedCount < currentOrder.quantity) {
                      showTicketInfo(currentOrder);
                      updateStatus('ready', `Scan next ticket (${currentOrder.scannedCount}/${currentOrder.quantity})`);
                  } else {
                      setTimeout(() => {
                          currentTicket.classList.add("hidden");
                          updateStatus('ready', 'Ready to scan next ticket');
                      }, 1500);
                  }
              } else {
                  playSound('error');
                  updateStatus('error', data.message || 'Processing failed');
                  // Keep the ticket visible so user can try again
                  showTicketInfo(currentOrder);
              }
          })
          .catch(error => {
              playSound('error');
              console.error("Request failed:", error);
              updateStatus('error', "Network error");
              // Keep the ticket visible so user can try again
              showTicketInfo(currentOrder);
          });
  }
  
  // Cancel current operation
  function cancelOperation() {
      currentTicket.classList.add("hidden");
      updateStatus('ready', 'Ready to scan');
  }
  
  // Button event listeners
  processBtn.addEventListener('click', processTicket);
  cancelBtn.addEventListener('click', cancelOperation);
  
  // QR Code Scanner
  function onScanSuccess(decodeText, decodeResult) {
      console.log("QR code data:", decodeText, decodeResult);
      
      const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
      const orderNumber = decodeText.match(/Order Number:\s*([a-zA-Z0-9]+)/)?.[1];
      const firstName = decodeText.match(/First Name:\s*([a-zA-Z\s]+)/)?.[1];
      const lastname = decodeText.match(/Last Name:\s*([a-zA-Z\s]+)/)?.[1];
      const quantity = parseInt(decodeText.match(/Quantity:\s*([a-zA-Z0-9]+)/)?.[1]) || 1;
      const prod_title = decodeText.match(/Product Title:\s*([a-zA-Z0-9\s]+)/)?.[1];
      const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];
      
      if (orderId && orderNumber && productId) {
          updateStatus('scanned', 'Ticket scanned');
          
          // Check if this order was already scanned
          const existingScan = scannedTickets.find(t => t.order_id === orderId);
          let status = 'unfulfilled';
          let scannedCount = 0;
          
          if (existingScan) {
              status = existingScan.status;
              scannedCount = existingScan.scannedCount || 1;
          }
          
          // Check if this is a special ticket type
          const lowerOrderNumber = orderNumber.toLowerCase();
          if (lowerOrderNumber === 'mpesa' || lowerOrderNumber === 'complimentary') {
              status = 'fulfilled';
          }
          
          // Create order object
          const order = {
              order_id: orderId,
              order_number: orderNumber,
              first_name: firstName,
              lastname: lastname,
              quantity: quantity,
              prod_title: prod_title,
              product_id: productId,
              status: status,
              scannedCount: scannedCount
          };
          
          showTicketInfo(order);
      } else {
          playSound('error');
          updateStatus('error', 'Invalid ticket format');
          setTimeout(() => updateStatus('ready', 'Ready to scan'), 2000);
      }
  }
  
  // Initialize scanner
  let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { 
      fps: 10, 
      qrbox: 250,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
  });
  
  // Initialize UI
  updateScanHistory();
  htmlscanner.render(onScanSuccess);
});