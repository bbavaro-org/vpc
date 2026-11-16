# Dashboard Ideas for a Psychology Practice

Prepared for: Vancouver Psychology Centre – AI Software Developer application
Author: Bryan Bavaro

## Purpose

The dashboard answers one question: **are people who reach out getting into care quickly, and is the admin work behind that shrinking?**

All figures are aggregated. No client names or clinical details appear anywhere on the dashboard.

## Layout (sample figures, last 30 days)

### 1. Headline metrics

| Metric | Sample value | Why it matters |
| --- | --- | --- |
| New inquiries | 142 (+12% vs last month) | Demand and marketing reach |
| Inquiry to first session | 6.4 days (down from 9.1) | The key access-to-care number: a long wait is when people give up |
| Clinician utilization | 84% (target 80–90%) | Capacity balance: too low wastes time, too high leads to burnout |
| No-show rate | 4.2% (+0.6 pts) | Lost revenue and lost appointment slots |

### 2. Intake funnel

| Stage | Count |
| --- | --- |
| Inquiries | 142 |
| Intake form completed | 108 |
| Matched to clinician | 90 |
| First session booked | 78 |

Shows where people drop off. In this example the biggest drop is people who start the intake form but don't finish it (34 people). That's a direct target for intake automation: a simpler form, a chatbot that helps people through it, or an automatic follow-up reminder.

### 3. Where new clients come from

| Source | Share |
| --- | --- |
| Google search | 38% |
| Physician referral | 25% |
| Insurance / EAP | 18% |
| Social media | 12% |
| Word of mouth | 7% |

Supports marketing decisions: whether to spend on Google ads, build physician relationships, or post more on social media.

### 4. Clinician capacity (next 2 weeks)

| Specialty | Booked |
| --- | --- |
| Child / youth | 98% |
| Adult anxiety | 92% |
| Couples | 71% |
| Assessments | 64% |

Shows which specialties are full. Waitlist: 21 people, mostly child / youth. Marketing can avoid promoting services with no open spots and focus on those with room.

### 5. Automation impact

| Measure | Sample value |
| --- | --- |
| Admin hours saved | 46 h |
| Intake forms auto-filed | 108 |
| Appointment reminders sent | 612 |
| Sync errors between systems | 3 |

Shows the value of the automation work and flags sync errors between systems (for example, Jane App and the CRM) before staff notice them.

## Data sources

- **Booking system** (likely Jane App): appointments, no-shows, clinician schedules, waitlist
- **CRM** (such as Go High Level): inquiries, lead sources, follow-ups
- **Google Analytics / ad platforms**: website traffic and campaign performance
- **Automation logs**: tasks completed, errors, time saved

Data is pulled through each platform's API.

## Privacy and security (PIPEDA)

- Show only aggregated counts and percentages, never names or clinical details
- Limit access by role, so front-desk staff, clinicians, marketing and management each see only what they need
- Keep data in Canada where possible, and encrypt it in transit and at rest
- Keep audit logs of who accessed which views
- Pull only the fields each metric needs (data minimization)
