# WhatsApp Gateway Service

This service handles the connection to WhatsApp, abstracting the underlying protocol (Baileys or Cloud API) from the main LiraOS Core.

## Architecture

- **Standalone Process:** Runs independently to prevent socket crashes from taking down the main API.
- **Communication:**
  - **Inbound (WhatsApp -> Core):** Forwards normalized events (Messages, Joins, Leaves) to the Core API via HTTP Webhooks or Internal Event Bus.
  - **Outbound (Core -> WhatsApp):** Exposes a local HTTP API for the Core to send messages.

## Setup & Run

1.  **Install Dependencies:**

    ```bash
    cd backend/services/whatsapp-gateway
    npm install
    ```

2.  **Start the Service:**

    ```bash
    npm start
    ```

    - On the first run, a **QR Code** will appear in the terminal.
    - Open WhatsApp on your phone > Linked Devices > Link a Device.
    - Scan the QR Code.

3.  **Verification:**
    - Once connected, you will see `WhatsApp connection opened!` in the logs.
    - Send a message `@Lira hello` in a group to test the loop.

## Environment Variables

- `PORT`: Port for the Gateway API (default 3001).
- `CORE_API_URL`: URL of the main LiraOS Core (default `http://localhost:4000`).
- `WHATSAPP_MODE`: Override config mode (`official` | `experimental`).
