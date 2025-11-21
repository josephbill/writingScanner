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
    const scanSearch = document.getElementById("scan-search");
    const clearSearch = document.getElementById("clear-search");
    const clearScans = document.getElementById("clear-all-scans");
  
    // State management
    let currentOrder = null;
    let scannedTickets = JSON.parse(localStorage.getItem("scannedTickets")) || [];
    // Shared list of special ticket order numbers (lowercase)
    const SPECIAL_TICKETS = ['complimentary', 'mpesa', 'sponsors', 'sfa-c'];
  
    // Enhanced scan grouping with special ticket handling
    function getScansByOrderNumber() {
      const ordersMap = new Map();
      
      scannedTickets.forEach(scan => {
        // Use composite key for special tickets (firstname + order_number)
        const isSpecialTicket = scan.order_number && SPECIAL_TICKETS.includes(scan.order_number.toLowerCase());
        const trackingKey = isSpecialTicket 
          ? `${scan.first_name}_${scan.order_number}` 
          : scan.order_number;
          
        if (!ordersMap.has(trackingKey)) {
          ordersMap.set(trackingKey, {
            order: scan,
            scans: [],
            fulfilled: false,
            lastScanTime: 0,
            quantity: scan.quantity || 1 // Default to 1 if not specified
          });
        }
        
        const orderData = ordersMap.get(trackingKey);
        orderData.scans.push(scan);
        
        // Track most recent scan time
        const scanTime = new Date(scan.timestamp).getTime();
        orderData.lastScanTime = Math.max(orderData.lastScanTime, scanTime);
        
        // Mark as fulfilled if any scan was a fulfillment
        if (scan.action === 'fulfillment' || scan.status === 'fulfilled') {
          orderData.fulfilled = true;
        }
      });
      
      return ordersMap;
    }
  
    // Enhanced scan history update
    function updateScanHistory(filter = '') {
      if (filter) {
        filterScans(filter);
        return;
      }
      
      const ordersMap = getScansByOrderNumber();
      const recentOrders = Array.from(ordersMap.values())
        .sort((a, b) => b.lastScanTime - a.lastScanTime) // Sort by most recent
        .slice(0, 5) // Get top 5
        .map(orderData => ({
          ...orderData.order,
          scannedCount: orderData.scans.length,
          quantity: orderData.quantity
        }));
      
      scanHistory.innerHTML = recentOrders.map(order => `
        <div class="scan-item ${order.status}">
          <span class="order-number">${order.order_number}</span>
          <span class="name">${order.first_name}</span>
          <span class="product">${order.prod_title}</span>
          <span class="status">${order.status}</span>
          <span class="count">${order.scannedCount || 1}/${order.quantity}</span>
          <span class="time">${new Date(order.timestamp).toLocaleTimeString()}</span>
        </div>
      `).join("");
    }
  
    // Search functionality
    function filterScans(searchTerm) {
      const allScans = scannedTickets.slice(0, 50);
      searchTerm = searchTerm.toLowerCase().trim();
      
      if (!searchTerm) {
        updateScanHistory();
        return;
      }
      
      const filtered = allScans.filter(scan => {
        return (
          scan.order_number.toLowerCase().includes(searchTerm) ||
          (scan.first_name && scan.first_name.toLowerCase().includes(searchTerm)) ||
          (scan.prod_title && scan.prod_title.toLowerCase().includes(searchTerm)) ||
          (scan.status && scan.status.toLowerCase().includes(searchTerm)));
      });
      
      scanHistory.innerHTML = filtered.map(ticket => {
        const highlight = (text, field) => {
          if (!text) return '';
          const str = String(text);
          const index = str.toLowerCase().indexOf(searchTerm);
          if (index >= 0) {
            const before = str.substring(0, index);
            const match = str.substring(index, index + searchTerm.length);
            const after = str.substring(index + searchTerm.length);
            return `${before}<span class="highlight">${match}</span>${after}`;
          }
          return str;
        };
        
        return `
          <div class="scan-item ${ticket.status}">
            <span class="order-number">${highlight(ticket.order_number, 'order_number')}</span>
            <span class="name">${highlight(ticket.first_name, 'first_name')}</span>
            <span class="product">${highlight(ticket.prod_title, 'prod_title')}</span>
            <span class="status">${highlight(ticket.status, 'status')}</span>
            <span class="count">${ticket.scannedCount || 1}/${ticket.quantity}</span>
            <span class="time">${new Date(ticket.timestamp).toLocaleTimeString()}</span>
          </div>
        `;
      }).join("");
      
      if (filtered.length === 0) {
        scanHistory.innerHTML = '<div class="no-results">No matching scans found</div>';
      }
    }
  
    // Enhanced ticket info display with quantity tracking
    function showTicketInfo(order) {
      const isSpecialTicket = order.order_number && SPECIAL_TICKETS.includes(order.order_number.toLowerCase());
      const trackingKey = isSpecialTicket 
        ? `${order.first_name}_${order.order_number}`
        : order.order_number;
      
      const ordersMap = getScansByOrderNumber();
      const orderData = ordersMap.get(trackingKey);
      
      // Set default quantity if not provided
      order.quantity = order.quantity || 1;
      
      // Update counts based on existing scans
      const currentScans = orderData ? orderData.scans.length : 0;
      order.scannedCount = currentScans;
      order.status = (orderData && orderData.fulfilled) ? 'fulfilled' : 'unfulfilled';
      
      currentOrder = order;
      ticketDetails.innerHTML = `
        <p><strong>Order:</strong> ${order.order_number}</p>
        ${isSpecialTicket ? `<p><strong>Guest:</strong> ${order.first_name}</p>` : ''}
        <p><strong>Product:</strong> ${order.prod_title}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Scanned:</strong> ${currentScans}/${order.quantity}</p>
        <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
        <p><strong>Seats:</strong> ${order.seats} / ${order.ticket}</p>
        ${currentScans >= order.quantity ? 
         '<p class="notice warning">This ticket is fully redeemed.</p>' : 
         order.status === 'fulfilled' ? 
         '<p class="notice">Marking additional attendance.</p>' : ''}
      `;
      
      // Update count display
      scannedCount.textContent = currentScans;
      totalCount.textContent = order.quantity;
      ticketCount.classList.remove("hidden");
      
      // Update button state based on scan count
      if (currentScans >= order.quantity) {
        processBtn.disabled = true;
        processBtn.textContent = 'Fully Redeemed';
        processBtn.classList.remove('btn-success', 'btn-primary');
        processBtn.classList.add('btn-secondary');
      } else if (order.status === 'fulfilled') {
        processBtn.disabled = false;
        processBtn.textContent = 'Mark Attendance';
        processBtn.classList.remove('btn-success', 'btn-secondary');
        processBtn.classList.add('btn-primary');
      } else {
        processBtn.disabled = false;
        processBtn.textContent = 'Fulfill Order';
        processBtn.classList.remove('btn-primary', 'btn-secondary');
        processBtn.classList.add('btn-success');
      }
      
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
  
    // Enhanced scan processing with quantity validation
    function processTicket() {
      if (!currentOrder) return;
      
      const isSpecialTicket = currentOrder.order_number && SPECIAL_TICKETS.includes(currentOrder.order_number.toLowerCase());
      const trackingKey = isSpecialTicket 
        ? `${currentOrder.first_name}_${currentOrder.order_number}`
        : currentOrder.order_number;
      
      const ordersMap = getScansByOrderNumber();
      const orderData = ordersMap.get(trackingKey);
      const currentScans = orderData ? orderData.scans.length : 0;
      
      // Validate against quantity
      if (currentScans >= currentOrder.quantity) {
        playSound('error');
        updateStatus('error', `Maximum scans (${currentOrder.quantity}) reached`);
        return;
      }
      
      updateStatus('processing', 'Processing...');
      
      // Unified processing for all ticket types
      const processScan = () => {
        const isAlreadyFulfilled = currentOrder.status === 'fulfilled';
        const scanRecord = {
          ...currentOrder,
          status: 'fulfilled',
          scannedCount: currentScans + 1,
          timestamp: new Date().toISOString(),
          action: isAlreadyFulfilled ? 'attendance' : 'fulfillment',
          quantity: currentOrder.quantity || 1
        };
        
        // Add to scan history
        scannedTickets.unshift(scanRecord);
        localStorage.setItem("scannedTickets", JSON.stringify(scannedTickets));
        
        playSound('success');
        
        // Update display counts
        const newCount = currentScans + 1;
        const remaining = currentOrder.quantity - newCount;
        
        if (remaining > 0) {
          updateStatus('success', `Accepted (${newCount}/${currentOrder.quantity})`);
          showTicketInfo(currentOrder);
        } else {
          updateStatus('success', 'Fully redeemed!');
          setTimeout(() => {
            currentTicket.classList.add("hidden");
            updateStatus('ready', 'Ready to scan next ticket');
          }, 1500);
        }
        
        updateScanHistory();
      };
      
      // Special tickets don't need API calls
      if (isSpecialTicket) {
        processScan();
        return;
      }
      
      // Normal tickets use API
      const isAlreadyFulfilled = currentOrder.status === 'fulfilled';
      const endpoint = isAlreadyFulfilled ? 
        'https://adverteyez.onrender.com/create_ticket_attendance' : 
        'https://adverteyez.onrender.com/fulfill_order';
      
      fetch(endpoint, {
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
      })
      .then(response => response.json())
      .then(data => {
        if (data.success || (data.details && data.details.fulfillment)) {
          processScan();
        } else {
          throw new Error(data.message || 'Processing failed');
        }
      })
      .catch(error => {
        playSound('error');
        console.error("Request failed:", error);
        updateStatus('error', error.message || "Network error");
        showTicketInfo(currentOrder);
      });
    }
  
    // Cancel current operation
    function cancelOperation() {
      currentTicket.classList.add("hidden");
      updateStatus('ready', 'Ready to scan');
    }
  
    // Enhanced QR code scanning with quantity validation
    function onScanSuccess(decodeText, decodeResult) {
      console.log("QR code data:", decodeText, decodeResult);
      
      // Parse QR code data
      const orderId = decodeText.match(/Order ID:\s*(\d+)/)?.[1];
      const orderNumber = decodeText.match(/Order Number:\s*([A-Za-z0-9_\-]+)/)?.[1];
      const firstName = decodeText.match(/First Name:\s*([a-zA-Z\s]+)/)?.[1];
      const lastname = decodeText.match(/Last Name:\s*([a-zA-Z\s]+)/)?.[1];
      const quantity = parseInt(decodeText.match(/Quantity:\s*(\d+)/)?.[1]) || 1;
      const prod_title = decodeText.match(/Product Title:\s*([a-zA-Z0-9\s\-]+)/)?.[1];
      const productId = decodeText.match(/Product ID:\s*(\d+)/)?.[1];
      const seats = decodeText.match(/Seats:\s*([^\n]+)/)?.[1] || 'N/A';
      const ticket = decodeText.match(/Ticket:\s*([^\n]+)/)?.[1] || 'N/A';
      
      // Validate ticket
      const lowerOrderNumber = orderNumber ? orderNumber.toLowerCase() : '';
      const isSpecialTicket = SPECIAL_TICKETS.includes(lowerOrderNumber);
      
      // Special validation for complimentary tickets
      if (isSpecialTicket && !firstName) {
        playSound('error');
        updateStatus('error', 'Complimentary tickets require guest name');
        setTimeout(() => updateStatus('ready', 'Ready to scan'), 2000);
        return;
      }
      
      // Validate regular tickets
      if (!isSpecialTicket && (!orderId || !orderNumber || !productId)) {
        playSound('error');
        updateStatus('error', 'Invalid ticket format');
        setTimeout(() => updateStatus('ready', 'Ready to scan'), 2000);
        return;
      }
      
      updateStatus('scanned', 'Ticket scanned');
      
      // Create tracking key
      const trackingKey = isSpecialTicket 
        ? `${firstName}_${orderNumber}`
        : orderNumber;
      
      const ordersMap = getScansByOrderNumber();
      const orderData = ordersMap.get(trackingKey);
      const currentScans = orderData ? orderData.scans.length : 0;
      
      // Create order object
      const order = {
        order_id: orderId || 'N/A',
        order_number: orderNumber,
        first_name: firstName || 'Guest',
        lastname: lastname || '',
        quantity: quantity,
        prod_title: prod_title || (isSpecialTicket ? 'Special Ticket' : 'Unknown'),
        product_id: productId || 'N/A',
        seats: seats,
        ticket: ticket,
        status: isSpecialTicket ? 'fulfilled' : 'unfulfilled',
        scannedCount: currentScans
      };
      
      // Check if already fully redeemed
      if (currentScans >= quantity) {
        playSound('error');
        updateStatus('error', `Ticket already redeemed ${quantity}/${quantity} times`);
        setTimeout(() => updateStatus('ready', 'Ready to scan'), 2000);
        return;
      }
      
      showTicketInfo(order);
    }
  
    // Event listeners
    processBtn.addEventListener('click', processTicket);
    cancelBtn.addEventListener('click', cancelOperation);
    
    scanSearch.addEventListener('input', (e) => {
      filterScans(e.target.value);
    });
  
    clearSearch.addEventListener('click', () => {
      scanSearch.value = '';
      updateScanHistory();
    });
  
    clearScans.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all scan history?')) {
        localStorage.removeItem("scannedTickets");
        scannedTickets = [];
        updateScanHistory();
        currentTicket.classList.add("hidden");
        updateStatus('ready', 'Ready to scan');
      }
    });
  
    scanSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        scanSearch.value = '';
        updateScanHistory();
      }
    });
  
    // Initialize scanner and UI
    updateScanHistory();
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { 
      fps: 10, 
      qrbox: 250,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    });
    htmlscanner.render(onScanSuccess);
  });