# Comments System Features

The comments system now includes advanced features to make your site more interactive and engaging.

## Features

### 1. **Voting System** 👍👎
- Users can upvote or downvote comments
- Vote counts are displayed with color coding:
  - Green for positive scores
  - Red for negative scores
  - Gray for neutral
- Each user can vote once per comment (tracked by IP address)
- Users can change their vote or remove it

### 2. **Nested Comments (Threading)** 💬
- Users can reply to any comment
- Replies are displayed in a threaded format with indentation
- Visual hierarchy shows parent-child relationships
- Replies are sorted chronologically for natural conversation flow

### 3. **Email Notifications** 📧
- When someone replies to a comment, the original commenter receives an email notification
- Email includes:
  - The original comment snippet
  - The reply content
  - A link to view the full conversation
- Email notifications are currently logged to console (see setup below)

### 4. **Comment Moderation** ✅
- All comments require moderation before appearing publicly
- Admin can approve/reject comments in the admin panel
- Only approved comments are visible to users

## Setup Email Notifications

Currently, email notifications are logged to the console. To enable actual email sending:

### Option 1: Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Uncomment the Resend code in `app/api/comments/notify/route.ts`
5. Update the `from` email address to your verified domain

### Option 2: SendGrid
1. Sign up at https://sendgrid.com
2. Get your API key
3. Install: `npm install @sendgrid/mail`
4. Add to `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
5. Uncomment the SendGrid code in `app/api/comments/notify/route.ts`
6. Update the `from` email address

### Option 3: Custom SMTP
You can integrate any SMTP service using `nodemailer`:
1. Install: `npm install nodemailer`
2. Configure SMTP settings in `app/api/comments/notify/route.ts`
3. Add credentials to `.env`

## Future Enhancements

Here are some ideas for making the comments system even more engaging:

### 1. **Comment Sorting Options**
- Sort by: newest, oldest, most upvoted, most controversial
- Add UI controls to switch sorting modes

### 2. **User Profiles** (Future)
- User accounts with avatars
- Comment history
- Reputation system based on upvotes

### 3. **Comment Reactions** (Future)
- Emoji reactions (👍, ❤️, 😂, etc.)
- More nuanced than just up/down votes

### 4. **Subscribe to Threads**
- Users can subscribe to get notified of all replies in a thread
- Email digest of new comments

### 5. **Comment Search**
- Search within comments of an article
- Filter by author, date, etc.

### 6. **Rich Text in Comments**
- Support for markdown or rich text
- Image uploads in comments
- Code syntax highlighting

### 7. **Comment Suggestions**
- "People also asked" based on comment content
- Related articles based on comment topics

### 8. **Community Features**
- Best comment of the week
- Top contributors
- Comment badges/achievements

### 9. **Article Topic Suggestions**
- Allow users to suggest article topics
- Voting on suggested topics
- Admin can see most requested topics

### 10. **Live Updates**
- Real-time comment updates using WebSockets
- See new comments as they're approved
- Live vote count updates

## Technical Notes

- Votes are tracked by IP address (can be enhanced with user IDs later)
- Comment tree structure is built server-side for performance
- All comments require moderation for spam prevention
- Email notifications are sent asynchronously to avoid blocking the response
