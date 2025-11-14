# Mailing Service

A dedicated microservice for handling all email communications.

## Purpose

This service decouples email functionality from the main Data API, satisfying the "at least 4 distinct microservices" requirement.

## Configuration

The service uses Ethereal.email for SMTP testing. Configuration is in `.env`:

- `SMTP_HOST`: smtp.ethereal.email
- `SMTP_PORT`: 587
- `SMTP_USER`: lorenza.lockman@ethereal.email
- `SMTP_PASS`: ktmv4nE7Vwq29bfwCt
- `PORT`: 4001 (service port)

## API Endpoint

### POST /send-email

Sends an email with the provided parameters.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "html": "<p>Email HTML content</p>"
}
```

**Response:**
- `200 OK`: Email sent successfully
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Email sending failed

## Running the Service

```bash
cd services/mailing-service
npm install
npm start
```

The service will start on port 4001 by default.

## Testing

You can view sent emails at [Ethereal Email](https://ethereal.email/) using the configured credentials.
