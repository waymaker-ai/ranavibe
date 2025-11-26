# Lead & Client Tracking Spreadsheet Template

**Purpose:** Track all leads, proposals, and clients in one place

---

## 📊 Google Sheets Setup

### Step 1: Create New Spreadsheet

1. Go to sheets.google.com
2. Create new spreadsheet
3. Name it: "Waymaker Agency - Leads & Clients 2025"
4. Create 4 tabs:
   - **LEADS** (main tracking)
   - **PROPOSALS** (proposal tracking)
   - **CLIENTS** (active projects)
   - **REVENUE** (financial tracking)

---

## 📋 Tab 1: LEADS

### Column Headers (Row 1)

```
A: Date Submitted
B: Name
C: Email
D: App URL
E: Built With
F: Source
G: Status
H: Audit Sent
I: Follow-Up Date
J: Notes
K: Next Action
```

### Column Formats

- **Date Submitted:** Date format
- **Status:** Dropdown with values:
  - New
  - Audit In Progress
  - Audit Sent
  - Waiting for Response
  - Interested
  - Proposal Sent
  - Won (move to CLIENTS tab)
  - Lost
  - Not Qualified
- **Audit Sent:** Date format
- **Follow-Up Date:** Date format

### Sample Data (Row 2)

```
Date: 2025-01-15
Name: John Smith
Email: john@example.com
App URL: https://v0.dev/chat/abc123
Built With: v0.dev
Source: Twitter
Status: Audit Sent
Audit Sent: 2025-01-15
Follow-Up: 2025-01-16
Notes: Looks like good fit, 60/100 scores
Next Action: Follow up if no response by tomorrow
```

### Conditional Formatting Rules

1. **Status = "Proposal Sent"** → Highlight row in **light blue**
2. **Status = "Interested"** → Highlight row in **light green**
3. **Follow-Up Date < TODAY()** → Highlight cell in **red**
4. **Status = "Won"** → Highlight row in **dark green**
5. **Status = "Lost"** → Highlight row in **light gray**

### Formulas

**Cell M1:** "Days Since Submitted"
**Cell M2:** `=TODAY()-A2`

**Cell N1:** "Conversion Rate"
**Cell N2:** `=COUNTIF(G:G,"Won")/COUNTA(G:G)`

---

## 💼 Tab 2: PROPOSALS

### Column Headers

```
A: Date Sent
B: Name
C: Email
D: Service
E: Price Quoted
F: Status
G: Expected Close Date
H: Actual Close Date
I: Won/Lost
J: Lost Reason
K: Notes
```

### Status Values

- Sent
- Opened
- Follow-Up Needed
- Negotiating
- Won
- Lost

### Sample Data

```
Date Sent: 2025-01-16
Name: John Smith
Email: john@example.com
Service: AI Prototype Finishing
Price: $3,900 (early adopter)
Status: Sent
Expected Close: 2025-01-20
Won/Lost: [blank until closed]
Notes: Responded positively to audit, sent proposal
```

### Formulas

**Win Rate (Cell L1):**
`=COUNTIF(I:I,"Won")/COUNTA(I:I)`

**Average Deal Size (Cell L2):**
`=AVERAGEIF(I:I,"Won",E:E)`

**Proposals This Week (Cell L3):**
`=COUNTIFS(A:A,">="&TODAY()-7,A:A,"<="&TODAY())`

---

## 👥 Tab 3: CLIENTS

### Column Headers

```
A: Client Name
B: Email
C: Service
D: Price
E: Start Date
F: Expected Delivery
G: Actual Delivery
H: Status
I: Payment Status
J: Day 4 Review Done
K: Training Scheduled
L: Testimonial Received
M: Notes
```

### Status Values

- Kickoff Scheduled
- In Progress - Security (Day 1-2)
- In Progress - SEO (Day 3-4)
- Day 4 Review
- In Progress - Mobile (Day 5)
- In Progress - Deployment (Day 6-7)
- Delivered
- Complete

### Payment Status Values

- Deposit Paid (50%)
- Full Payment Received
- Overdue

### Sample Data

```
Client: John Smith
Email: john@example.com
Service: AI Prototype Finishing
Price: $3,900
Start: 2025-01-20
Expected Delivery: 2025-01-29
Status: In Progress - Security (Day 1-2)
Payment: Deposit Paid (50%)
Day 4 Review: [blank]
Training: [blank]
Testimonial: [blank]
Notes: v0 app, straightforward project
```

### Conditional Formatting

1. **Expected Delivery < TODAY() AND Status != "Complete"** → Red highlight (overdue)
2. **Status = "Day 4 Review"** → Yellow highlight (action needed)
3. **Payment Status = "Overdue"** → Red highlight
4. **Status = "Complete" AND Testimonial = blank** → Orange highlight (request testimonial)

### Formulas

**Days Until Delivery (Column N):**
`=F2-TODAY()`

**Days Since Start (Column O):**
`=TODAY()-E2`

---

## 💰 Tab 4: REVENUE

### Section 1: Monthly Revenue Tracker

Headers:
```
A: Month
B: Leads Generated
C: Proposals Sent
D: Clients Closed
E: Revenue
F: Expenses
G: Profit
H: Profit Margin
```

Sample Row:
```
Month: January 2025
Leads: 30
Proposals: 10
Clients: 5
Revenue: $21,000
Expenses: $3,000
Profit: $18,000
Margin: 85.7%
```

Formula for Profit Margin (H2):
`=(G2/E2)*100`

---

### Section 2: Service Breakdown

Headers (Starting Row 15):
```
A: Service
B: Clients This Month
C: Revenue This Month
D: Clients Total
E: Revenue Total
```

Sample Data:
```
Service: AI Prototype Finishing
Clients This Month: 4
Revenue This Month: $17,900
Clients Total: 12
Revenue Total: $52,900

Service: AI Cost Rescue
Clients This Month: 2
Revenue This Month: $5,800
Clients Total: 5
Revenue Total: $14,500
```

---

### Section 3: Key Metrics Dashboard (Starting Row 25)

```
A: Metric | B: Value | C: Target | D: Status

Lead-to-Audit Conversion: [formula] | 90% | ✅
Audit-to-Proposal Conversion: [formula] | 33% | ✅
Proposal-to-Close Conversion: [formula] | 50% | ✅
Average Deal Size: [formula] | $4,500 | ✅
Revenue This Month: [formula] | $21,000 | ✅
Profit Margin: [formula] | 65% | ✅
```

Formulas:

**Lead-to-Audit Conversion (B26):**
`=COUNTIF(LEADS!G:G,"Audit Sent")/COUNTA(LEADS!G:G)`

**Audit-to-Proposal Conversion (B27):**
`=COUNTIF(PROPOSALS!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))/COUNTIF(LEADS!H:H,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))`

**Proposal-to-Close (B28):**
`=COUNTIF(PROPOSALS!I:I,"Won")/COUNTA(PROPOSALS!I:I)`

**Average Deal Size (B29):**
`=AVERAGEIF(PROPOSALS!I:I,"Won",PROPOSALS!E:E)`

**Revenue This Month (B30):**
`=SUMIF(CLIENTS!E:E,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),CLIENTS!D:D)`

---

## 📈 Automation Setup (Optional)

### Connect Google Form to LEADS Tab

1. In Google Forms, click "Responses" tab
2. Click green Sheets icon
3. Select "Create new spreadsheet" or link to existing
4. Form responses auto-populate LEADS tab

### Email Notifications

1. Extensions → Apps Script
2. Paste this code:

```javascript
function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("LEADS");
  var lastRow = sheet.getLastRow();

  // Get data from last row
  var name = sheet.getRange(lastRow, 2).getValue();
  var email = sheet.getRange(lastRow, 3).getValue();
  var appUrl = sheet.getRange(lastRow, 4).getValue();

  // Send email notification
  MailApp.sendEmail({
    to: "your-email@waymaker.cx",
    subject: "🔔 New Lead: " + name,
    body: "New lead submitted!\n\n" +
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          "App URL: " + appUrl + "\n\n" +
          "View in sheet: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });

  // Send auto-responder to lead
  MailApp.sendEmail({
    to: email,
    subject: "We're auditing your app now!",
    body: "Hi " + name + ",\n\n" +
          "Thanks for requesting a free audit!\n\n" +
          "We're analyzing your app now and will send a detailed report within 24 hours.\n\n" +
          "The report will show:\n" +
          "✓ Security vulnerabilities\n" +
          "✓ SEO opportunities\n" +
          "✓ Mobile issues\n" +
          "✓ Performance problems\n\n" +
          "Talk soon,\n" +
          "Ashley\n" +
          "Waymaker\n" +
          "waymaker.cx"
  });
}
```

3. Save
4. Click "Triggers" (clock icon)
5. Add trigger: onFormSubmit → From spreadsheet → On form submit
6. Save and authorize

---

## 📊 Weekly Review Checklist

### Every Monday Morning (30 minutes)

**Review LEADS tab:**
- [ ] Check "Follow-Up Date" column for overdue follow-ups (red highlights)
- [ ] Move "Won" leads to PROPOSALS tab
- [ ] Move "Lost" leads to bottom of sheet
- [ ] Update status for all "Waiting for Response" leads
- [ ] Sort by "Date Submitted" (newest first)

**Review PROPOSALS tab:**
- [ ] Follow up on proposals sent >3 days ago
- [ ] Check "Expected Close Date" for proposals closing this week
- [ ] Update status for all open proposals
- [ ] Move "Won" proposals to CLIENTS tab

**Review CLIENTS tab:**
- [ ] Check delivery dates - any overdue? (red highlights)
- [ ] Update status for all active projects
- [ ] Schedule Day 4 reviews for projects reaching Day 4
- [ ] Schedule training sessions for projects near completion
- [ ] Request testimonials from completed projects (orange highlights)

**Review REVENUE tab:**
- [ ] Update monthly numbers
- [ ] Check if on track for monthly goal
- [ ] Review key metrics vs targets
- [ ] Adjust strategy if needed

---

## 📱 Mobile Access

### Google Sheets Mobile App

1. Download Google Sheets app (iOS/Android)
2. Open your tracking spreadsheet
3. Enable notifications for comments/edits
4. Quick view on the go

### Key Views for Mobile

- **LEADS tab:** Check new leads, update follow-ups
- **CLIENTS tab:** Update project status, check delivery dates
- **REVENUE tab:** Quick glance at monthly numbers

---

## 🎯 Key Metrics to Watch

### Daily
- New leads (goal: 2-3/day after ads launch)
- Follow-ups needed (RED highlights in LEADS)
- Projects overdue (RED highlights in CLIENTS)

### Weekly
- Leads generated (goal: 10+/week)
- Audits delivered (goal: 5-10/week)
- Proposals sent (goal: 2-3/week)
- Clients closed (goal: 1/week)

### Monthly
- Total revenue (goal: Month 1 = $21K, Month 3 = $63K)
- Profit margin (goal: 65%+)
- Conversion rates (lead→audit 90%, audit→proposal 33%, proposal→close 50%)
- Average deal size (goal: $4,500+)

---

## 🚨 Alert Triggers

### Set Up Conditional Notifications

**High Priority (Check Daily):**
- New lead submitted → Email/SMS notification
- Proposal opened (if using tracking) → Email notification
- Payment received → Email notification
- Client requests support → Email notification

**Medium Priority (Check Weekly):**
- Follow-up date overdue → Weekly digest email
- Proposal sent >5 days ago with no response → Reminder
- Testimonial not received 2 weeks after delivery → Reminder

---

## 📋 Sample Data for Testing

### LEADS Tab Sample Data

```
Date       | Name          | Email              | App URL                    | Built With | Source  | Status
-----------|---------------|--------------------|-----------------------------|------------|---------|----------
2025-01-15 | John Smith    | john@example.com   | v0.dev/chat/abc123         | v0.dev     | Twitter | Won
2025-01-16 | Jane Doe      | jane@example.com   | bolt.new/xyz789            | Bolt.new   | Google  | Audit Sent
2025-01-17 | Bob Johnson   | bob@example.com    | lovable.dev/app/456        | Lovable    | Twitter | Interested
2025-01-18 | Alice Williams| alice@example.com  | myapp.com                  | v0.dev     | Google  | New
2025-01-19 | Mike Brown    | mike@example.com   | testapp.vercel.app         | Bolt.new   | Twitter | Lost
```

---

## 💡 Pro Tips

### 1. Use Filters
- Create filter views for different statuses
- View 1: "Hot Leads" (Status = Interested or Proposal Sent)
- View 2: "Follow-Up Needed" (Follow-Up Date < TODAY)
- View 3: "This Week" (Date Submitted >= THIS WEEK)

### 2. Color Coding
- Green: Good/Won
- Yellow: Action needed
- Red: Urgent/Overdue
- Blue: Proposal sent
- Gray: Lost/Closed

### 3. Weekly Backup
- File → Download → Excel (.xlsx)
- Save to Dropbox/Google Drive
- Keep monthly backups

### 4. Share with Team (When Scaling)
- Share spreadsheet with team members
- Set permissions (Edit vs View)
- Use comments for collaboration
- Assign tasks with @mentions

---

## 📊 Example Dashboard (Chart Ideas)

### Chart 1: Lead Source Breakdown (Pie Chart)
- Data: LEADS tab, Source column
- Shows: Twitter vs Google Ads vs Referral vs Other

### Chart 2: Monthly Revenue Trend (Line Chart)
- Data: REVENUE tab, rows 2-13
- X-axis: Month
- Y-axis: Revenue
- Target line at $21K (Month 1 goal)

### Chart 3: Conversion Funnel (Bar Chart)
- Leads → Audits → Proposals → Closed
- Shows drop-off at each stage
- Highlights where to improve

### Chart 4: Revenue by Service (Bar Chart)
- Data: REVENUE tab, Section 2
- X-axis: Service name
- Y-axis: Revenue
- Shows which services are winning

---

## ✅ Quick Start Checklist

To set up your tracking spreadsheet:

- [ ] Create Google Sheet with 4 tabs (LEADS, PROPOSALS, CLIENTS, REVENUE)
- [ ] Add column headers to each tab
- [ ] Set up conditional formatting rules
- [ ] Add formulas for key metrics
- [ ] Connect Google Form to LEADS tab (optional)
- [ ] Set up email notifications (optional)
- [ ] Create mobile app shortcut
- [ ] Add sample data to test
- [ ] Create filter views
- [ ] Schedule weekly review (Monday mornings)

---

## 🎯 Success Metrics

After 1 month of tracking, you should see:
- 30+ leads in LEADS tab
- 10+ proposals in PROPOSALS tab
- 5+ clients in CLIENTS tab
- $21K+ in REVENUE tab
- Clear trends showing what's working

Use this data to:
- Double down on best lead sources
- Improve weak conversion points
- Forecast future revenue
- Make data-driven decisions

---

*Tracking Spreadsheet Template*
*Waymaker Agency Services*
*2025-11-10*

**Track everything. Know your numbers. Scale with confidence. 📊**
