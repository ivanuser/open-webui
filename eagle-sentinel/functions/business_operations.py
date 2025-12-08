"""
title: Eagle Sentinel Business Operations
description: Internal business operations tools for project tracking, client management, proposals, and time tracking. For internal Eagle Sentinel use only.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json


class Tools:
    """Eagle Sentinel Internal Business Operations Tools"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        default_hourly_rate: float = Field(default=175.0, description="Default hourly billing rate")
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_service_catalog()
        self._init_engagement_types()

    def _init_service_catalog(self):
        """Initialize Eagle Sentinel service catalog"""
        self.services = {
            "rmf-full": {
                "name": "Full RMF Authorization Support",
                "description": "End-to-end RMF authorization support from categorization through ATO",
                "phases": ["Categorization", "Control Selection", "Implementation", "Assessment", "Authorization", "Continuous Monitoring"],
                "deliverables": ["FIPS 199 Categorization", "SSP", "SAR", "POA&M", "ATO Package"],
                "typical_duration_weeks": 24,
                "base_price_range": {"low": 75000, "high": 250000},
                "hourly_estimate": {"low": 400, "high": 1400}
            },
            "rmf-assessment": {
                "name": "Security Control Assessment",
                "description": "Independent assessment of security control implementation",
                "phases": ["Planning", "Assessment", "Reporting"],
                "deliverables": ["SAP", "SAR", "Risk Assessment"],
                "typical_duration_weeks": 8,
                "base_price_range": {"low": 25000, "high": 75000},
                "hourly_estimate": {"low": 140, "high": 420}
            },
            "rmf-conmon": {
                "name": "Continuous Monitoring Support",
                "description": "Ongoing continuous monitoring and compliance maintenance",
                "phases": ["Setup", "Monthly Monitoring", "Annual Assessment"],
                "deliverables": ["ConMon Plan", "Monthly Reports", "POA&M Updates", "Annual SAR"],
                "typical_duration_weeks": 52,
                "base_price_range": {"low": 36000, "high": 120000},
                "hourly_estimate": {"low": 200, "high": 700}
            },
            "ssp-development": {
                "name": "System Security Plan Development",
                "description": "Development or major revision of System Security Plan",
                "phases": ["Discovery", "Drafting", "Review", "Finalization"],
                "deliverables": ["SSP", "Control Implementation Statements", "Diagrams"],
                "typical_duration_weeks": 12,
                "base_price_range": {"low": 30000, "high": 80000},
                "hourly_estimate": {"low": 170, "high": 450}
            },
            "gap-assessment": {
                "name": "Compliance Gap Assessment",
                "description": "Assessment of current security posture against RMF requirements",
                "phases": ["Document Review", "Interviews", "Analysis", "Reporting"],
                "deliverables": ["Gap Analysis Report", "Remediation Roadmap", "Cost Estimates"],
                "typical_duration_weeks": 4,
                "base_price_range": {"low": 15000, "high": 40000},
                "hourly_estimate": {"low": 80, "high": 220}
            },
            "fedramp-readiness": {
                "name": "FedRAMP Readiness Assessment",
                "description": "Assessment and preparation for FedRAMP authorization",
                "phases": ["Readiness Assessment", "Gap Remediation", "3PAO Prep"],
                "deliverables": ["Readiness Report", "Remediation Plan", "FedRAMP Package Review"],
                "typical_duration_weeks": 16,
                "base_price_range": {"low": 50000, "high": 150000},
                "hourly_estimate": {"low": 280, "high": 850}
            },
            "training": {
                "name": "RMF Training & Workshops",
                "description": "Custom training on RMF processes and requirements",
                "phases": ["Curriculum Development", "Delivery", "Follow-up"],
                "deliverables": ["Training Materials", "Hands-on Exercises", "Certificates"],
                "typical_duration_weeks": 2,
                "base_price_range": {"low": 5000, "high": 25000},
                "hourly_estimate": {"low": 25, "high": 140}
            },
            "poam-remediation": {
                "name": "POA&M Remediation Support",
                "description": "Support for remediating POA&M items and security findings",
                "phases": ["Analysis", "Remediation Planning", "Implementation Support", "Verification"],
                "deliverables": ["Remediation Plan", "Updated POA&M", "Closure Evidence"],
                "typical_duration_weeks": 8,
                "base_price_range": {"low": 20000, "high": 60000},
                "hourly_estimate": {"low": 110, "high": 340}
            },
            "consulting-hourly": {
                "name": "Advisory Consulting (Hourly)",
                "description": "Ad-hoc consulting and advisory services",
                "phases": ["As Needed"],
                "deliverables": ["Consulting Hours", "Written Guidance"],
                "typical_duration_weeks": 0,
                "base_price_range": {"low": 150, "high": 250},
                "hourly_estimate": {"low": 1, "high": 1}
            }
        }

    def _init_engagement_types(self):
        """Initialize engagement complexity factors"""
        self.complexity_factors = {
            "system_complexity": {
                "simple": {"factor": 0.8, "description": "Single application, limited integrations"},
                "moderate": {"factor": 1.0, "description": "Multiple components, standard integrations"},
                "complex": {"factor": 1.3, "description": "Distributed system, many integrations"},
                "highly_complex": {"factor": 1.6, "description": "Enterprise system, complex architecture"}
            },
            "impact_level": {
                "low": {"factor": 0.7, "description": "Low impact system"},
                "moderate": {"factor": 1.0, "description": "Moderate impact system"},
                "high": {"factor": 1.4, "description": "High impact system"}
            },
            "client_readiness": {
                "mature": {"factor": 0.8, "description": "Established security program, good documentation"},
                "developing": {"factor": 1.0, "description": "Some security controls, partial documentation"},
                "immature": {"factor": 1.3, "description": "Limited security program, minimal documentation"}
            },
            "timeline": {
                "relaxed": {"factor": 0.9, "description": "Flexible timeline, no hard deadline"},
                "standard": {"factor": 1.0, "description": "Normal timeline expectations"},
                "accelerated": {"factor": 1.25, "description": "Compressed timeline, expedited delivery"},
                "urgent": {"factor": 1.5, "description": "Emergency/critical timeline"}
            }
        }

    def generate_proposal_estimate(
        self,
        service_type: str,
        client_name: str,
        system_complexity: str = "moderate",
        impact_level: str = "moderate",
        client_readiness: str = "developing",
        timeline: str = "standard",
        notes: str = ""
    ) -> str:
        """
        Generate a cost estimate for a client proposal.

        :param service_type: Type of service (rmf-full, rmf-assessment, ssp-development, gap-assessment, fedramp-readiness, training, poam-remediation, consulting-hourly, rmf-conmon)
        :param client_name: Name of the client organization
        :param system_complexity: simple, moderate, complex, or highly_complex
        :param impact_level: low, moderate, or high
        :param client_readiness: mature, developing, or immature
        :param timeline: relaxed, standard, accelerated, or urgent
        :param notes: Additional notes or requirements
        :return: Detailed cost estimate for the proposal
        """
        service_type = service_type.lower().strip()

        if service_type not in self.services:
            available = ", ".join(self.services.keys())
            return f"Unknown service type '{service_type}'. Available services: {available}"

        service = self.services[service_type]

        # Calculate complexity factor
        factors = {
            "system_complexity": self.complexity_factors["system_complexity"].get(system_complexity, {"factor": 1.0}),
            "impact_level": self.complexity_factors["impact_level"].get(impact_level, {"factor": 1.0}),
            "client_readiness": self.complexity_factors["client_readiness"].get(client_readiness, {"factor": 1.0}),
            "timeline": self.complexity_factors["timeline"].get(timeline, {"factor": 1.0})
        }

        total_factor = 1.0
        for f in factors.values():
            total_factor *= f["factor"]

        # Calculate estimates
        base_low = service["base_price_range"]["low"]
        base_high = service["base_price_range"]["high"]
        hours_low = service["hourly_estimate"]["low"]
        hours_high = service["hourly_estimate"]["high"]

        adjusted_low = int(base_low * total_factor)
        adjusted_high = int(base_high * total_factor)
        adjusted_hours_low = int(hours_low * total_factor)
        adjusted_hours_high = int(hours_high * total_factor)

        # Adjust duration
        base_weeks = service["typical_duration_weeks"]
        if timeline == "accelerated":
            adjusted_weeks = int(base_weeks * 0.75)
        elif timeline == "urgent":
            adjusted_weeks = int(base_weeks * 0.5)
        elif timeline == "relaxed":
            adjusted_weeks = int(base_weeks * 1.25)
        else:
            adjusted_weeks = base_weeks

        result = f"""## Proposal Estimate: {service['name']}

### Client: {client_name}
**Date Generated:** {datetime.now().strftime('%Y-%m-%d')}

---

### Service Overview
**Service:** {service['name']}
**Description:** {service['description']}

### Engagement Parameters

| Factor | Selection | Impact |
|--------|-----------|--------|
| System Complexity | {system_complexity.title()} | {factors['system_complexity']['description']} |
| Impact Level | {impact_level.title()} | {factors['impact_level']['description']} |
| Client Readiness | {client_readiness.title()} | {factors['client_readiness']['description']} |
| Timeline | {timeline.title()} | {factors['timeline']['description']} |

**Combined Adjustment Factor:** {total_factor:.2f}x

---

### Cost Estimate

| Metric | Low Estimate | High Estimate |
|--------|--------------|---------------|
| **Total Cost** | ${adjusted_low:,} | ${adjusted_high:,} |
| **Estimated Hours** | {adjusted_hours_low} hrs | {adjusted_hours_high} hrs |
| **Effective Rate** | ${adjusted_low/max(adjusted_hours_low,1):.0f}/hr | ${adjusted_high/max(adjusted_hours_high,1):.0f}/hr |
| **Duration** | {adjusted_weeks} weeks | {adjusted_weeks} weeks |

**Recommended Quote:** ${int((adjusted_low + adjusted_high) / 2):,}

---

### Phases & Deliverables

**Phases:**
"""
        for i, phase in enumerate(service["phases"], 1):
            result += f"{i}. {phase}\n"

        result += f"""
**Deliverables:**
"""
        for deliverable in service["deliverables"]:
            result += f"- {deliverable}\n"

        if notes:
            result += f"""
---

### Additional Notes
{notes}
"""

        result += f"""
---

### Pricing Notes
- Estimate based on Eagle Sentinel standard pricing model
- Final price subject to detailed scoping discussion
- Travel expenses billed separately if required
- Payment terms: 50% at signing, 50% at completion (or monthly for ongoing)

*This is an internal estimate. Final proposal should be reviewed before sending to client.*
"""
        return result

    def list_services(self) -> str:
        """
        List all Eagle Sentinel service offerings with pricing ranges.

        :return: Complete service catalog with descriptions and pricing.
        """
        result = """## Eagle Sentinel Service Catalog

"""
        for service_id, service in self.services.items():
            result += f"""### {service['name']}
**ID:** `{service_id}`
**Description:** {service['description']}
**Typical Duration:** {service['typical_duration_weeks']} weeks
**Price Range:** ${service['base_price_range']['low']:,} - ${service['base_price_range']['high']:,}
**Hour Estimate:** {service['hourly_estimate']['low']} - {service['hourly_estimate']['high']} hours

**Deliverables:** {', '.join(service['deliverables'])}

---

"""
        return result

    def calculate_billable_hours(
        self,
        hours_worked: float,
        rate_type: str = "standard",
        description: str = "",
        client_name: str = ""
    ) -> str:
        """
        Calculate billable amount for hours worked.

        :param hours_worked: Number of hours worked
        :param rate_type: standard, senior, expert, or rush
        :param description: Description of work performed
        :param client_name: Client name for the time entry
        :return: Billable amount calculation
        """
        rates = {
            "standard": {"rate": 175, "description": "Standard consulting rate"},
            "senior": {"rate": 225, "description": "Senior consultant rate"},
            "expert": {"rate": 275, "description": "Expert/Principal rate"},
            "rush": {"rate": 262, "description": "Rush/after-hours rate (1.5x standard)"}
        }

        rate_info = rates.get(rate_type.lower(), rates["standard"])
        total = hours_worked * rate_info["rate"]

        result = f"""## Time Entry Calculation

**Client:** {client_name if client_name else 'Not specified'}
**Date:** {datetime.now().strftime('%Y-%m-%d')}

### Details
- **Hours Worked:** {hours_worked}
- **Rate Type:** {rate_type.title()} - {rate_info['description']}
- **Hourly Rate:** ${rate_info['rate']}/hr

### Calculation
{hours_worked} hours × ${rate_info['rate']}/hr = **${total:,.2f}**

"""
        if description:
            result += f"""### Work Description
{description}
"""

        return result

    def create_project_status(
        self,
        client_name: str,
        project_name: str,
        service_type: str,
        start_date: str,
        current_phase: str,
        percent_complete: int,
        budget_total: float,
        budget_spent: float,
        hours_budgeted: float,
        hours_spent: float,
        risks: str = "",
        next_steps: str = "",
        blockers: str = ""
    ) -> str:
        """
        Generate a project status report.

        :param client_name: Client organization name
        :param project_name: Name of the project/system
        :param service_type: Type of engagement
        :param start_date: Project start date (YYYY-MM-DD)
        :param current_phase: Current project phase
        :param percent_complete: Percentage complete (0-100)
        :param budget_total: Total project budget
        :param budget_spent: Budget spent to date
        :param hours_budgeted: Total hours budgeted
        :param hours_spent: Hours spent to date
        :param risks: Current risks or concerns
        :param next_steps: Next steps/upcoming activities
        :param blockers: Current blockers or issues
        :return: Formatted project status report
        """
        budget_remaining = budget_total - budget_spent
        budget_percent = (budget_spent / budget_total * 100) if budget_total > 0 else 0
        hours_remaining = hours_budgeted - hours_spent
        hours_percent = (hours_spent / hours_budgeted * 100) if hours_budgeted > 0 else 0

        # Health indicators
        if percent_complete >= budget_percent + 10:
            budget_health = "GREEN - Under budget"
        elif percent_complete >= budget_percent - 10:
            budget_health = "YELLOW - On track"
        else:
            budget_health = "RED - Over budget risk"

        if percent_complete >= hours_percent + 10:
            hours_health = "GREEN - Under hours"
        elif percent_complete >= hours_percent - 10:
            hours_health = "YELLOW - On track"
        else:
            hours_health = "RED - Over hours risk"

        result = f"""## Project Status Report

### {project_name}
**Client:** {client_name}
**Service Type:** {service_type}
**Report Date:** {datetime.now().strftime('%Y-%m-%d')}

---

### Progress Overview

| Metric | Status |
|--------|--------|
| **Current Phase** | {current_phase} |
| **Overall Progress** | {percent_complete}% complete |
| **Start Date** | {start_date} |

### Budget Status

| Metric | Amount | Percentage |
|--------|--------|------------|
| Total Budget | ${budget_total:,.2f} | 100% |
| Spent to Date | ${budget_spent:,.2f} | {budget_percent:.1f}% |
| Remaining | ${budget_remaining:,.2f} | {100-budget_percent:.1f}% |

**Budget Health:** {budget_health}

### Hours Status

| Metric | Hours | Percentage |
|--------|-------|------------|
| Total Budgeted | {hours_budgeted:.1f} hrs | 100% |
| Spent to Date | {hours_spent:.1f} hrs | {hours_percent:.1f}% |
| Remaining | {hours_remaining:.1f} hrs | {100-hours_percent:.1f}% |

**Hours Health:** {hours_health}

---

### Progress Bar
[{'█' * (percent_complete // 5)}{'░' * (20 - percent_complete // 5)}] {percent_complete}%

"""

        if next_steps:
            result += f"""### Next Steps
{next_steps}

"""

        if risks:
            result += f"""### Risks & Concerns
{risks}

"""

        if blockers:
            result += f"""### Current Blockers
{blockers}

"""

        result += """---
*Report generated by Eagle Sentinel Business Operations*
"""
        return result

    def generate_invoice_summary(
        self,
        client_name: str,
        project_name: str,
        billing_period: str,
        line_items: str,
        notes: str = ""
    ) -> str:
        """
        Generate an invoice summary for client billing.

        :param client_name: Client organization name
        :param project_name: Project or engagement name
        :param billing_period: Billing period (e.g., "November 2024" or "2024-11-01 to 2024-11-30")
        :param line_items: Semicolon-separated line items in format "description:hours:rate" (e.g., "SSP Development:40:175;Assessment Support:20:225")
        :param notes: Additional notes for the invoice
        :return: Formatted invoice summary
        """
        # Parse line items
        items = []
        total = 0
        total_hours = 0

        for item in line_items.split(';'):
            parts = item.strip().split(':')
            if len(parts) >= 3:
                desc = parts[0].strip()
                hours = float(parts[1].strip())
                rate = float(parts[2].strip())
                amount = hours * rate
                items.append({
                    "description": desc,
                    "hours": hours,
                    "rate": rate,
                    "amount": amount
                })
                total += amount
                total_hours += hours

        invoice_num = f"ES-{datetime.now().strftime('%Y%m')}-001"

        result = f"""## Invoice Summary

### Eagle Sentinel LLC
*RMF Consulting Services*

---

**Invoice #:** {invoice_num}
**Date:** {datetime.now().strftime('%Y-%m-%d')}
**Due Date:** {(datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')}

**Bill To:**
{client_name}

**Project:** {project_name}
**Billing Period:** {billing_period}

---

### Services Rendered

| Description | Hours | Rate | Amount |
|-------------|-------|------|--------|
"""

        for item in items:
            result += f"| {item['description']} | {item['hours']:.1f} | ${item['rate']:.2f} | ${item['amount']:,.2f} |\n"

        result += f"""| **TOTAL** | **{total_hours:.1f}** | | **${total:,.2f}** |

---

### Payment Information
**Amount Due:** ${total:,.2f}
**Payment Terms:** Net 30

**Payment Methods:**
- ACH Transfer (preferred)
- Check payable to "Eagle Sentinel LLC"
- Credit Card (+3% processing fee)

"""

        if notes:
            result += f"""### Notes
{notes}

"""

        result += """---
*Thank you for your business!*
"""
        return result

    def meeting_notes_template(
        self,
        meeting_type: str,
        client_name: str = "",
        attendees: str = "",
        agenda: str = ""
    ) -> str:
        """
        Generate a meeting notes template.

        :param meeting_type: Type of meeting (kickoff, status, technical, assessment, internal)
        :param client_name: Client name if external meeting
        :param attendees: Comma-separated list of attendees
        :param agenda: Meeting agenda items
        :return: Meeting notes template
        """
        templates = {
            "kickoff": "Project Kickoff Meeting",
            "status": "Status Update Meeting",
            "technical": "Technical Working Session",
            "assessment": "Assessment Planning/Debrief",
            "internal": "Internal Team Meeting"
        }

        meeting_title = templates.get(meeting_type.lower(), "Meeting")

        result = f"""## {meeting_title} Notes

**Date:** {datetime.now().strftime('%Y-%m-%d')}
**Time:** [START TIME] - [END TIME]
"""

        if client_name:
            result += f"**Client:** {client_name}\n"

        if attendees:
            result += f"**Attendees:** {attendees}\n"

        result += f"""
---

### Agenda
"""
        if agenda:
            for i, item in enumerate(agenda.split(','), 1):
                result += f"{i}. {item.strip()}\n"
        else:
            result += """1. [Agenda item 1]
2. [Agenda item 2]
3. [Agenda item 3]
"""

        result += """
---

### Discussion Notes

#### Topic 1: [TOPIC NAME]
- [Key point]
- [Key point]
- [Decision made]

#### Topic 2: [TOPIC NAME]
- [Key point]
- [Key point]

---

### Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action item] | [Name] | [Date] | Pending |
| [Action item] | [Name] | [Date] | Pending |

---

### Decisions Made
1. [Decision 1]
2. [Decision 2]

### Parking Lot (Future Discussion)
- [Item for future discussion]

---

### Next Meeting
**Date:** [NEXT DATE]
**Time:** [TIME]
**Agenda Preview:** [TOPICS]

---
*Notes taken by: [YOUR NAME]*
"""
        return result
