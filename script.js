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
            <p><strong>Name:</strong> ${order.first_name} ${order.lastname}</p>
            <p><strong>Product:</strong> ${order.prod_title}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
        `;
        
        // Update counts
        if (order.quantity > 1) {
            scannedCount.textContent = order.scannedCount || 1;
            totalCount.textContent = order.quantity;
            ticketCount.classList.remove("hidden");
        } else {
            ticketCount.classList.add("hidden");
        }
        
        // Update button text based on status
        processBtn.textContent = order.status === 'fulfilled' ? 'Mark Attendance' : 'Fulfill Order';
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
    
    // Process order fulfillment
    function fulfillOrder() {
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
                    if (data.details) {
                        currentOrder.scannedCount = data.details.fulfilled;
                    } else {
                        currentOrder.scannedCount = (currentOrder.scannedCount || 0) + 1;
                    }
                    
                    // Add to scan history
                    scannedTickets.unshift({
                        ...currentOrder,
                        timestamp: new Date().toISOString()
                    });
                    localStorage.setItem("scannedTickets", JSON.stringify(scannedTickets));
                    
                    updateStatus('success', isAlreadyFulfilled ? 'Attendance marked!' : 'Order fulfilled!');
                    updateScanHistory();
                    
                    if (currentOrder.scannedCount >= currentOrder.quantity) {
                        // All tickets scanned
                        setTimeout(() => {
                            currentTicket.classList.add("hidden");
                            updateStatus('ready', 'Ready to scan next ticket');
                        }, 1500);
                    } else {
                        // More tickets to scan
                        showTicketInfo(currentOrder);
                    }
                } else {
                    playSound('error');
                    updateStatus('error', data.message || 'Processing failed');
                }
            })
            .catch(error => {
                playSound('error');
                console.error("Request failed:", error);
                updateStatus('error', "Network error");
            });
    }
    
    // Cancel current operation
    function cancelOperation() {
        currentTicket.classList.add("hidden");
        updateStatus('ready', 'Ready to scan');
    }
    
    // Button event listeners
    processBtn.addEventListener('click', fulfillOrder);
    cancelBtn.addEventListener('click', cancelOperation);
    
    // QR Code Scanner
    function onScanSuccess(decodeText, decodeResult) {
        console.log("QR code data:", decodeText, decodeResult);
        
        const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
        const orderNumber = decodeText.match(/Order Number:\s*([a-zA-Z0-9]+)/)?.[1];
        const firstName = decodeText.match(/First Name:\s*([a-zA-Z\s]+)/)?.[1];
        const lastname = decodeText.match(/Last Name:\s*([a-zA-Z\s]+)/)?.[1];
        const quantity = decodeText.match(/Quantity:\s*([a-zA-Z0-9]+)/)?.[1];
        const prod_title = decodeText.match(/Product Title:\s*([a-zA-Z0-9\s]+)/)?.[1];
        const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];
        
        if (orderId && orderNumber && productId) {
            updateStatus('scanned', 'Ticket scanned');
            
            // Check if this is a special ticket type
            const lowerOrderNumber = orderNumber.toLowerCase();
            let status = 'unfulfilled';
            
            if (lowerOrderNumber === 'mpesa' || lowerOrderNumber === 'complimentary') {
                status = 'fulfilled';
            }
            
            // Create order object
            const order = {
                order_id: orderId,
                order_number: orderNumber,
                first_name: firstName,
                lastname: lastname,
                quantity: parseInt(quantity) || 1,
                prod_title: prod_title,
                product_id: productId,
                status: status
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