    function domReady(fn) {
      if (document.readyState === "complete" || document.readyState === "interactive") {
          setTimeout(fn, 1000);
      } else {
          document.addEventListener("DOMContentLoaded", fn);
      }
  }
  
  domReady(function () {
      function onScanSuccess(decodeText, decodeResult) {
          console.log("QR Code Data:", decodeText, decodeResult);
  
          // Extract details using regex
          const extractField = (regex) => decodeText.match(regex)?.[1];
          const orderId = extractField(/Order ID:\s*(\d+)/);
          const orderNumber = extractField(/Order Number:\s*([a-zA-Z0-9]+)/);
          const firstName = extractField(/First Name:\s*([a-zA-Z]+)/);
          const lastName = extractField(/Last Name:\s*([a-zA-Z]+)/);
          const quantity = extractField(/Quantity:\s*([a-zA-Z0-9]+)/);
          const prodTitle = extractField(/Product Title:\s*([a-zA-Z0-9 ]+)/);
          const productId = extractField(/Product ID:\s*(\d+)/);
  
          if (orderId && orderNumber && productId) {
              populateModal({
                  orderId,
                  orderNumber,
                  firstName,
                  lastName,
                  quantity,
                  prodTitle,
                  productId,
              });
  
              setupModalButtons({
                  orderId,
                  orderNumber,
                  firstName,
                  lastName,
                  quantity,
                  prodTitle,
                  status: "fulfilled",
              });
          } else if (orderNumber?.toLowerCase() === "mpesa") {
              handleSpecialTicket({
                  type: "Mpesa",
                  orderId,
                  orderNumber,
                  firstName,
                  lastName,
                  quantity,
                  prodTitle,
                  productId,
              });
          } else if (orderNumber?.toLowerCase() === "complimentary") {
              handleSpecialTicket({
                  type: "Complimentary",
                  orderId,
                  orderNumber,
                  firstName,
                  lastName,
                  quantity,
                  prodTitle,
                  productId,
              });
          } else {
              alert("Invalid QR code data. Please try again.");
          }
      }
  
      function populateModal(details) {
          const modalDetails = document.getElementById("modal-order-details");
          modalDetails.innerHTML = `
              <strong>Order ID:</strong> ${details.orderId}<br>
              <strong>Order Number:</strong> ${details.orderNumber}<br>
              <strong>Product ID:</strong> ${details.productId}<br>
              <strong>Product Title:</strong> ${details.prodTitle}<br>
              <strong>Order Name:</strong> ${details.firstName} ${details.lastName}<br>
              <strong>Quantity:</strong> ${details.quantity}
          `;
          document.getElementById("scanModal").style.display = "block";
      }
  
      function setupModalButtons(details) {
          const fulfillBtn = document.getElementById("fulfill-btn");
          const cancelBtn = document.getElementById("cancel-btn");
  
          fulfillBtn.textContent = "Fulfill Order";
          fulfillBtn.onclick = () => fulfillOrder(details);
  
          cancelBtn.onclick = () => {
              document.getElementById("scanModal").style.display = "none";
          };
      }
  
      function fulfillOrder(details) {
          fetch("https://adverteyez.onrender.com/fulfill_order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: details.orderId }),
          })
              .then((response) => response.json())
              .then((data) => {
                  if (data.details?.fulfillment) {
                      alert(`Fulfillment processed. Status: ${data.details.fulfillment.status}`);
                      submitAttendance(details);
                  } else {
                      alert(`Error: ${data.message || "Fulfillment failed."}`);
                  }
              })
              .catch((error) => {
                  console.error("Fulfillment request failed:", error);
                  alert("Error during the fulfillment process.");
              });
      }
  
      function submitAttendance(details) {
          fetch("https://adverteyez.onrender.com/create_ticket_attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
          })
              .then((response) => response.json())
              .then((result) => {
                  if (result.success) {
                      alert("Attendance recorded successfully.");
                  } else {
                      alert(`Error: ${result.message}`);
                  }
              })
              .catch((error) => {
                  console.error("Attendance submission failed:", error);
                  alert("Error during attendance submission.");
              });
      }
  
      function handleSpecialTicket({ type, ...details }) {
          alert(`${type} Ticket Verified.`);
          populateModal(details);
  
          const fulfillBtn = document.getElementById("fulfill-btn");
          fulfillBtn.textContent = `Mark Attendance for ${type}`;
          fulfillBtn.onclick = () => submitAttendance(details);
  
          const cancelBtn = document.getElementById("cancel-btn");
          cancelBtn.onclick = () => {
              document.getElementById("scanModal").style.display = "none";
          };
      }
  });
  