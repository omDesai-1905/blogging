# Follow Request System - Testing Guide

## Complete Flow Test

### Setup:

- **User A**: Has a private account
- **User B**: Wants to follow User A

---

## Step-by-Step Test:

### 1. User B Sends Follow Request to User A (Private Account)

**What happens:**

1. User B visits User A's profile
2. Sees "🔒 Private Account" badge
3. Sees stats (posts, followers, following) but NOT the posts
4. Clicks "Follow" button

**Expected Result:**

- ✅ Button changes from "Follow" → "Requested"
- ✅ Button color changes to yellow/warning
- ✅ Posts remain hidden with message: "This Account is Private - Follow this account to see their posts"
- ✅ Follow request created in database with `status: "pending"`

**Backend endpoint:** `POST /api/user/:userId/follow`
**Response:** `{ success: true, data: { status: "pending" }, message: "Follow request sent successfully" }`

---

### 2. User A Checks Follow Requests

**What happens:**

1. User A clicks "Requests" in header navigation
2. Views "Received Requests" tab

**Expected Result:**

- ✅ User A sees User B in the pending requests list
- ✅ Shows User B's name, username, avatar, and request timestamp
- ✅ Two buttons visible: "Accept" (green) and "Reject" (gray)

**Backend endpoint:** `GET /api/user/follow-requests/pending`
**Response:** Array of pending follow requests with follower details

---

### 3. User A Accepts the Request

**What happens:**

1. User A clicks "Accept" button

**Expected Result:**

- ✅ Request disappears from pending list
- ✅ User B is now following User A
- ✅ Follow status in database changes: `status: "pending"` → `status: "accepted"`

**Backend endpoint:** `POST /api/user/follow-requests/:requestId/accept`

---

### 4. User B Can Now View Posts

**What happens:**

1. User B refreshes or revisits User A's profile

**Expected Result:**

- ✅ Button shows "Unfollow" (gray)
- ✅ Posts are now visible
- ✅ Can see all of User A's content
- ✅ Private account message is gone

---

### 5. Optional: User B Cancels Pending Request

**Alternative flow if User A hasn't accepted yet:**

**What happens:**

1. User B clicks "Requested" button (yellow)

**Expected Result:**

- ✅ Follow request is cancelled
- ✅ Button changes back to "Follow"
- ✅ Request disappears from User A's pending list

**Backend endpoint:** `DELETE /api/user/:userId/follow-request/cancel`

---

### 6. Unfollow Feature

**What happens:**

1. After being accepted, User B clicks "Unfollow"

**Expected Result:**

- ✅ Follow relationship removed
- ✅ Button changes back to "Follow"
- ✅ Posts become hidden again (if account is still private)

**Backend endpoint:** `DELETE /api/user/:userId/unfollow`

---

## Quick Troubleshooting:

### Button not changing?

- Check browser console (F12) for errors
- Verify backend server is running
- Check if user is authenticated (logged in)

### Request not showing in User A's list?

- Verify the request was created: Check database `follows` collection
- Ensure `status: "pending"`
- Ensure `following` field = User A's ID
- Ensure `follower` field = User B's ID

### Posts still hidden after accept?

- Refresh User B's page
- Check follow status in database is `"accepted"`
- Verify `isFollowing: true` in profile data

---

## API Endpoints Summary:

| Action                | Method | Endpoint                                      | Auth Required |
| --------------------- | ------ | --------------------------------------------- | ------------- |
| Send Follow Request   | POST   | `/api/user/:userId/follow`                    | ✓             |
| Cancel Follow Request | DELETE | `/api/user/:userId/follow-request/cancel`     | ✓             |
| Unfollow User         | DELETE | `/api/user/:userId/unfollow`                  | ✓             |
| Get Pending Requests  | GET    | `/api/user/follow-requests/pending`           | ✓             |
| Get Sent Requests     | GET    | `/api/user/follow-requests/sent`              | ✓             |
| Accept Request        | POST   | `/api/user/follow-requests/:requestId/accept` | ✓             |
| Reject Request        | DELETE | `/api/user/follow-requests/:requestId/reject` | ✓             |

---

## Button States:

| Status          | Button Text | Button Color | Can Click To   |
| --------------- | ----------- | ------------ | -------------- |
| Not Following   | "Follow"    | Blue         | Send request   |
| Pending Request | "Requested" | Yellow       | Cancel request |
| Following       | "Unfollow"  | Gray         | Unfollow       |

---

## Database Schema:

```javascript
{
  follower: ObjectId,        // User B's ID
  following: ObjectId,       // User A's ID
  status: "pending" | "accepted",
  createdAt: Date,
  updatedAt: Date
}
```

---

**Test it now and it should work perfectly!** 🎉
