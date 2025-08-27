# API Documentation

## Authentication

### Register
- **POST** `/api/auth/register`
- **Body:**
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required)
- **Success Response:**
  - Status: 201
  - Body:
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2025-08-27T10:00:00.000Z"
      }
    }
    ```
- **Error Responses:**
  - 400: Missing fields or email exists
  - 500: Internal server error

---

### Login
- **POST** `/api/auth/login`
- **Body:**
  - `email` (string, required)
  - `password` (string, required)
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "data": {
        "user": {
          "id": 1,
          "full_name": "John Doe",
          "email": "john@example.com",
          "phone_number": null,
          "birth_date": null
        },
        "token": "<jwt_token>"
      }
    }
    ```
- **Error Responses:**
  - 400: Missing fields
  - 401: Invalid credentials
  - 500: Internal server error

---

### Get Profile
- **GET** `/api/auth/profile`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "data": {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone_number": null,
        "birth_date": null,
        "created_at": "2025-08-27T10:00:00.000Z",
        "updated_at": "2025-08-27T10:00:00.000Z"
      }
    }
    ```
- **Error Responses:**
  - 401: No token
  - 403: Invalid/expired token
  - 404: User not found
  - 500: Internal server error

---

## Events

### Create Event
- **POST** `/api/events`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  - `title`, `category`, `location`, `time`, `total_slots`, `duration` (required)
- **Success Response:**
  - Status: 201
  - Body:
    ```json
    {
      "status": "success",
      "message": "Event created successfully",
      "data": { /* event object */ }
    }
    ```
- **Error Responses:**
  - 400: Missing/invalid fields
  - 500: Internal server error

---

### List Events
- **GET** `/api/events`
- **Query:** `category`, `location`, `q` (optional)
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "data": [ /* array of event objects */ ]
    }
    ```
- **Error Responses:**
  - 500: Internal server error

---

### Get Event Detail
- **GET** `/api/events/:id`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "data": { /* event object */ }
    }
    ```
- **Error Responses:**
  - 400: Invalid id
  - 404: Not found
  - 500: Internal server error

---

### Update Event
- **PUT** `/api/events/:id`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  - Any updatable event field
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "message": "Event updated successfully",
      "data": { /* event object */ }
    }
    ```
- **Error Responses:**
  - 400: Invalid id/fields
  - 403: Not authorized
  - 404: Not found
  - 500: Internal server error

---

### Delete Event
- **DELETE** `/api/events/:id`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "message": "Event deleted successfully"
    }
    ```
- **Error Responses:**
  - 400: Invalid id
  - 403: Not authorized
  - 404: Not found
  - 500: Internal server error

---

### RSVP Join Event
- **POST** `/api/events/:id/rsvp`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "message": "Joined event successfully",
      "data": { "event_id": 1, "available_slots": 9 }
    }
    ```
- **Error Responses:**
  - 400: Invalid id/no slots/creator join
  - 404: Not found
  - 409: Already joined
  - 500: Internal server error

---

### RSVP Cancel
- **DELETE** `/api/events/:id/rsvp`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "message": "Cancelled RSVP successfully",
      "data": { "event_id": 1, "available_slots": 10 }
    }
    ```
- **Error Responses:**
  - 400: Invalid id
  - 404: Not joined/not found
  - 500: Internal server error

---

### Get Event Feedbacks
- **GET** `/api/events/:id/feedback`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "user": { "id": 2, "name": "Jane", "email": "jane@example.com" },
          "rating": 5,
          "comment": "Great event!",
          "created_at": "2025-08-27T12:00:00.000Z"
        }
      ]
    }
    ```
- **Error Responses:**
  - 400: Invalid id
  - 500: Internal server error

---

### Submit Feedback
- **POST** `/api/events/:id/feedback`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  - `rating` (1-5, required), `comment` (optional)
- **Success Response:**
  - Status: 201
  - Body:
    ```json
    {
      "status": "success",
      "message": "Feedback submitted",
      "data": { /* feedback object */ }
    }
    ```
- **Error Responses:**
  - 400: Invalid id/rating
  - 403: Not joined/event not finished
  - 404: Not found
  - 409: Already feedback
  - 500: Internal server error

---

### Get Event Average Rating
- **GET** `/api/events/:id/rating`
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "event_id": 1,
      "avg_rating": "4.50",
      "count": 2
    }
    ```
- **Error Responses:**
  - 400: Invalid id
  - 500: Internal server error

---

## AI Chat Recommendation

### Get Event Recommendations (AI)
- **POST** `/api/events/recommend/chat`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  - `history` (array of chat messages, required)
- **Success Response:**
  - Status: 200
  - Body:
    ```json
    {
      "status": "success",
      "ai_reply": "...jawaban AI...",
      "events": [
        { "id": 1, "title": "Futsal Seru", "category": "soccer", "location": "Jakarta", "time": "2025-08-28T10:00:00.000Z", "duration": 90 }
      ]
    }
    ```
- **Error Responses:**
  - 400: No history
  - 500: Internal server error

---

## Status Codes
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

---

## Notes
- Semua response error memiliki format:
  ```json
  {
    "status": "error",
    "message": "...",
    "error": "..." // opsional
  }
  ```
- Semua endpoint yang butuh login harus mengirimkan header Authorization: Bearer <token>
- Socket.IO events tidak didokumentasikan di sini, hanya REST API.
