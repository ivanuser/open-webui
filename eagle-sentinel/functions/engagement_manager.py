"""
title: RMF Engagement Manager
description: Tools for managing RMF consulting engagements including client onboarding, POA&M tracking, evidence management, and deliverable checklists.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json


class Tools:
    """RMF Engagement Management Tools for Eagle Sentinel"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_checklists()
        self._init_evidence_requirements()

    def _init_checklists(self):
        """Initialize engagement checklists"""
        self.checklists = {
            "client_onboarding": {
                "name": "Client Onboarding Checklist",
                "phases": {
                    "pre_engagement": [
                        {"item": "NDA executed", "responsible": "BD Lead", "critical": True},
                        {"item": "MSA/Contract signed", "responsible": "BD Lead", "critical": True},
                        {"item": "SOW approved", "responsible": "Project Lead", "critical": True},
                        {"item": "Kickoff meeting scheduled", "responsible": "Project Lead", "critical": True},
                        {"item": "Project folder created in document management", "responsible": "Project Lead", "critical": False},
                        {"item": "Client added to project management system", "responsible": "Admin", "critical": False},
                        {"item": "Invoice schedule established", "responsible": "BD Lead", "critical": True}
                    ],
                    "kickoff": [
                        {"item": "Kickoff meeting conducted", "responsible": "Project Lead", "critical": True},
                        {"item": "Key stakeholders identified", "responsible": "Project Lead", "critical": True},
                        {"item": "Communication plan established", "responsible": "Project Lead", "critical": False},
                        {"item": "Access to client systems/docs arranged", "responsible": "Client POC", "critical": True},
                        {"item": "Project timeline reviewed and confirmed", "responsible": "Project Lead", "critical": True},
                        {"item": "Risk register initialized", "responsible": "Project Lead", "critical": False},
                        {"item": "Status reporting cadence agreed", "responsible": "Project Lead", "critical": False}
                    ],
                    "discovery": [
                        {"item": "System documentation collected", "responsible": "Client POC", "critical": True},
                        {"item": "Authorization boundary defined/confirmed", "responsible": "Consultant", "critical": True},
                        {"item": "Information types identified", "responsible": "Consultant", "critical": True},
                        {"item": "Existing security documentation reviewed", "responsible": "Consultant", "critical": True},
                        {"item": "Key personnel interviews scheduled", "responsible": "Project Lead", "critical": False},
                        {"item": "Technical architecture documented", "responsible": "Consultant", "critical": True},
                        {"item": "Gap assessment (if applicable) completed", "responsible": "Consultant", "critical": False}
                    ]
                }
            },
            "authorization_package": {
                "name": "Authorization Package Checklist",
                "phases": {
                    "categorization": [
                        {"item": "Information types identified and documented", "responsible": "Consultant", "critical": True},
                        {"item": "FIPS 199 categorization completed", "responsible": "Consultant", "critical": True},
                        {"item": "Categorization rationale documented", "responsible": "Consultant", "critical": True},
                        {"item": "AO concurrence on categorization obtained", "responsible": "Client ISSO", "critical": True}
                    ],
                    "control_selection": [
                        {"item": "Applicable baseline identified", "responsible": "Consultant", "critical": True},
                        {"item": "Control tailoring documented", "responsible": "Consultant", "critical": True},
                        {"item": "Overlays applied (if applicable)", "responsible": "Consultant", "critical": False},
                        {"item": "Common controls identified", "responsible": "Consultant", "critical": True},
                        {"item": "Hybrid controls delineated", "responsible": "Consultant", "critical": True},
                        {"item": "Control selection approved by AO", "responsible": "Client ISSO", "critical": True}
                    ],
                    "ssp_development": [
                        {"item": "SSP template customized", "responsible": "Consultant", "critical": True},
                        {"item": "System description completed", "responsible": "Consultant", "critical": True},
                        {"item": "Authorization boundary diagram created", "responsible": "Consultant", "critical": True},
                        {"item": "Network architecture diagram created", "responsible": "Consultant", "critical": True},
                        {"item": "Data flow diagram created", "responsible": "Consultant", "critical": True},
                        {"item": "All control implementations documented", "responsible": "Consultant", "critical": True},
                        {"item": "Roles and responsibilities defined", "responsible": "Consultant", "critical": True},
                        {"item": "SSP reviewed by client SMEs", "responsible": "Client ISSO", "critical": True},
                        {"item": "SSP finalized and signed", "responsible": "Client ISSO", "critical": True}
                    ],
                    "assessment": [
                        {"item": "SAP developed and approved", "responsible": "Assessor", "critical": True},
                        {"item": "Assessment schedule coordinated", "responsible": "Assessor", "critical": True},
                        {"item": "Evidence collection completed", "responsible": "Client/Consultant", "critical": True},
                        {"item": "Control testing completed", "responsible": "Assessor", "critical": True},
                        {"item": "Findings documented", "responsible": "Assessor", "critical": True},
                        {"item": "SAR drafted", "responsible": "Assessor", "critical": True},
                        {"item": "SAR reviewed with client", "responsible": "Assessor", "critical": True},
                        {"item": "SAR finalized", "responsible": "Assessor", "critical": True}
                    ],
                    "authorization": [
                        {"item": "POA&M developed for all findings", "responsible": "Consultant", "critical": True},
                        {"item": "Risk assessment completed", "responsible": "Consultant", "critical": True},
                        {"item": "Authorization package assembled", "responsible": "Consultant", "critical": True},
                        {"item": "Package reviewed by ISSO", "responsible": "Client ISSO", "critical": True},
                        {"item": "Package submitted to AO", "responsible": "Client ISSO", "critical": True},
                        {"item": "AO briefing conducted", "responsible": "Consultant", "critical": False},
                        {"item": "ATO decision received", "responsible": "Client AO", "critical": True},
                        {"item": "ATO letter filed", "responsible": "Client ISSO", "critical": True}
                    ]
                }
            },
            "continuous_monitoring": {
                "name": "Continuous Monitoring Setup Checklist",
                "phases": {
                    "planning": [
                        {"item": "ConMon strategy document created", "responsible": "Consultant", "critical": True},
                        {"item": "Monitoring frequencies defined", "responsible": "Consultant", "critical": True},
                        {"item": "Automated monitoring tools identified", "responsible": "Consultant", "critical": True},
                        {"item": "Roles for ongoing monitoring assigned", "responsible": "Client ISSO", "critical": True},
                        {"item": "Reporting templates created", "responsible": "Consultant", "critical": False}
                    ],
                    "implementation": [
                        {"item": "Vulnerability scanning configured", "responsible": "Client IT", "critical": True},
                        {"item": "Log monitoring/SIEM configured", "responsible": "Client IT", "critical": True},
                        {"item": "POA&M tracking process established", "responsible": "Client ISSO", "critical": True},
                        {"item": "Change management process confirmed", "responsible": "Client ISSO", "critical": True},
                        {"item": "Incident response procedures confirmed", "responsible": "Client ISSO", "critical": True}
                    ],
                    "handoff": [
                        {"item": "ConMon documentation delivered", "responsible": "Consultant", "critical": True},
                        {"item": "Client team trained on processes", "responsible": "Consultant", "critical": True},
                        {"item": "First monthly report template provided", "responsible": "Consultant", "critical": False},
                        {"item": "Escalation procedures documented", "responsible": "Consultant", "critical": False},
                        {"item": "Annual assessment schedule established", "responsible": "Consultant", "critical": True}
                    ]
                }
            }
        }

    def _init_evidence_requirements(self):
        """Initialize evidence requirements by control family"""
        self.evidence_types = {
            "AC": {
                "family": "Access Control",
                "common_evidence": [
                    "Access control policy document",
                    "User account listing with roles",
                    "Access request/approval records",
                    "Access review records (quarterly/annual)",
                    "Privileged user listing",
                    "Account termination records",
                    "Remote access configuration",
                    "Session timeout settings screenshot"
                ]
            },
            "AT": {
                "family": "Awareness and Training",
                "common_evidence": [
                    "Security awareness training policy",
                    "Training completion records",
                    "Training materials/curriculum",
                    "Role-based training records",
                    "Phishing test results",
                    "New hire training acknowledgments"
                ]
            },
            "AU": {
                "family": "Audit and Accountability",
                "common_evidence": [
                    "Audit policy document",
                    "Audit log samples (multiple systems)",
                    "Log retention configuration",
                    "SIEM/log aggregation screenshots",
                    "Audit review records",
                    "Alert configuration documentation",
                    "Time synchronization configuration"
                ]
            },
            "CA": {
                "family": "Assessment, Authorization, Monitoring",
                "common_evidence": [
                    "Security assessment plan",
                    "Security assessment report",
                    "POA&M document",
                    "Authorization letter (ATO)",
                    "Continuous monitoring plan",
                    "Penetration test reports",
                    "Vulnerability scan reports"
                ]
            },
            "CM": {
                "family": "Configuration Management",
                "common_evidence": [
                    "Configuration management policy",
                    "Baseline configuration documentation",
                    "Change management records",
                    "Software inventory",
                    "Hardware inventory",
                    "Approved software list",
                    "Configuration scan results (SCAP/STIG)",
                    "Patch management records"
                ]
            },
            "CP": {
                "family": "Contingency Planning",
                "common_evidence": [
                    "Contingency plan document",
                    "Business impact analysis",
                    "Backup configuration/schedules",
                    "Backup test/restore records",
                    "DR test results",
                    "Alternate site documentation",
                    "Recovery time objectives documentation"
                ]
            },
            "IA": {
                "family": "Identification and Authentication",
                "common_evidence": [
                    "Authentication policy document",
                    "Password policy configuration",
                    "MFA configuration screenshots",
                    "PIV/CAC implementation evidence",
                    "Service account inventory",
                    "Authentication mechanism documentation",
                    "Failed login lockout configuration"
                ]
            },
            "IR": {
                "family": "Incident Response",
                "common_evidence": [
                    "Incident response plan",
                    "Incident response procedures",
                    "Incident tracking records",
                    "IR team roster and contacts",
                    "IR training records",
                    "IR test/exercise results",
                    "Lessons learned documentation"
                ]
            },
            "MA": {
                "family": "Maintenance",
                "common_evidence": [
                    "Maintenance policy document",
                    "Maintenance records/logs",
                    "Approved maintenance personnel list",
                    "Remote maintenance procedures",
                    "Maintenance tool inventory"
                ]
            },
            "MP": {
                "family": "Media Protection",
                "common_evidence": [
                    "Media protection policy",
                    "Media inventory/tracking records",
                    "Media sanitization records",
                    "Encryption configuration (data at rest)",
                    "Media transport procedures",
                    "Media disposal records"
                ]
            },
            "PE": {
                "family": "Physical and Environmental",
                "common_evidence": [
                    "Physical security policy",
                    "Facility access list",
                    "Visitor logs",
                    "Physical access control configuration",
                    "Environmental control documentation",
                    "Fire suppression documentation",
                    "Power redundancy documentation",
                    "Physical security assessment"
                ]
            },
            "PL": {
                "family": "Planning",
                "common_evidence": [
                    "System Security Plan (SSP)",
                    "Rules of behavior",
                    "Privacy impact assessment",
                    "Security architecture documentation"
                ]
            },
            "PS": {
                "family": "Personnel Security",
                "common_evidence": [
                    "Personnel security policy",
                    "Background check records (sanitized)",
                    "Position risk designations",
                    "Access agreements",
                    "Termination procedures",
                    "Personnel transfer procedures"
                ]
            },
            "RA": {
                "family": "Risk Assessment",
                "common_evidence": [
                    "Risk assessment report",
                    "Vulnerability scan reports",
                    "Threat assessment documentation",
                    "Risk register",
                    "Penetration test results"
                ]
            },
            "SA": {
                "family": "System and Services Acquisition",
                "common_evidence": [
                    "System development lifecycle documentation",
                    "Security requirements in contracts",
                    "Third-party security assessments",
                    "Supply chain risk documentation",
                    "Developer security training records",
                    "Code review records"
                ]
            },
            "SC": {
                "family": "System and Communications Protection",
                "common_evidence": [
                    "Network architecture diagram",
                    "Firewall rules/configuration",
                    "Encryption configuration (in transit)",
                    "Boundary protection documentation",
                    "DMZ configuration",
                    "TLS/SSL certificate inventory",
                    "VPN configuration",
                    "Network segmentation documentation"
                ]
            },
            "SI": {
                "family": "System and Information Integrity",
                "common_evidence": [
                    "Malware protection configuration",
                    "Antivirus/EDR deployment evidence",
                    "Patch management records",
                    "Vulnerability remediation records",
                    "System monitoring configuration",
                    "Integrity monitoring configuration",
                    "Security alert procedures"
                ]
            },
            "SR": {
                "family": "Supply Chain Risk Management",
                "common_evidence": [
                    "Supply chain risk management policy",
                    "Vendor risk assessments",
                    "Third-party inventory",
                    "Acquisition security requirements",
                    "Component authenticity procedures"
                ]
            }
        }

    def generate_onboarding_checklist(
        self,
        client_name: str,
        project_name: str,
        service_type: str,
        start_date: str,
        project_lead: str
    ) -> str:
        """
        Generate a client onboarding checklist for a new engagement.

        :param client_name: Name of the client organization
        :param project_name: Name of the project/system
        :param service_type: Type of service engagement
        :param start_date: Project start date (YYYY-MM-DD)
        :param project_lead: Name of the Eagle Sentinel project lead
        :return: Complete onboarding checklist with all phases
        """
        checklist = self.checklists["client_onboarding"]

        result = f"""## Client Onboarding Checklist

### Engagement Details
- **Client:** {client_name}
- **Project:** {project_name}
- **Service:** {service_type}
- **Start Date:** {start_date}
- **Project Lead:** {project_lead}
- **Generated:** {datetime.now().strftime('%Y-%m-%d')}

---

"""
        for phase_name, items in checklist["phases"].items():
            phase_title = phase_name.replace("_", " ").title()
            result += f"### {phase_title}\n\n"
            result += "| Status | Item | Responsible | Critical | Date Completed |\n"
            result += "|--------|------|-------------|----------|----------------|\n"

            for item in items:
                critical = "Yes" if item["critical"] else "No"
                result += f"| [ ] | {item['item']} | {item['responsible']} | {critical} | |\n"

            result += "\n"

        result += """---

### Notes
- Complete all critical items before proceeding to next phase
- Update this checklist weekly during onboarding
- Escalate blockers to project lead immediately

### Signatures

| Role | Name | Date |
|------|------|------|
| Project Lead | | |
| Client POC | | |
"""
        return result

    def generate_authorization_checklist(
        self,
        client_name: str,
        system_name: str,
        impact_level: str,
        target_ato_date: str
    ) -> str:
        """
        Generate an authorization package checklist for RMF ATO.

        :param client_name: Name of the client organization
        :param system_name: Name of the system
        :param impact_level: FIPS 199 impact level (Low, Moderate, High)
        :param target_ato_date: Target ATO date (YYYY-MM-DD)
        :return: Complete authorization package checklist
        """
        checklist = self.checklists["authorization_package"]

        result = f"""## Authorization Package Checklist

### System Information
- **Client:** {client_name}
- **System:** {system_name}
- **Impact Level:** {impact_level}
- **Target ATO Date:** {target_ato_date}
- **Generated:** {datetime.now().strftime('%Y-%m-%d')}

---

"""
        phase_order = ["categorization", "control_selection", "ssp_development", "assessment", "authorization"]

        for phase_name in phase_order:
            items = checklist["phases"][phase_name]
            phase_title = phase_name.replace("_", " ").title()
            result += f"### Phase: {phase_title}\n\n"
            result += "| Status | Item | Responsible | Critical | Date |\n"
            result += "|--------|------|-------------|----------|------|\n"

            for item in items:
                critical = "Yes" if item["critical"] else "No"
                result += f"| [ ] | {item['item']} | {item['responsible']} | {critical} | |\n"

            result += "\n"

        result += f"""---

### Key Milestones

| Milestone | Target Date | Actual Date | Status |
|-----------|-------------|-------------|--------|
| Categorization Complete | | | Pending |
| Control Selection Approved | | | Pending |
| SSP Finalized | | | Pending |
| Assessment Complete | | | Pending |
| POA&M Finalized | | | Pending |
| ATO Decision | {target_ato_date} | | Pending |

### Authorization Package Contents
- [ ] System Security Plan (SSP)
- [ ] Security Assessment Report (SAR)
- [ ] Plan of Action & Milestones (POA&M)
- [ ] Risk Assessment Report
- [ ] Authorization Recommendation
- [ ] Supporting Artifacts/Evidence

---

*Track progress weekly. Update status in project management system.*
"""
        return result

    def generate_evidence_checklist(
        self,
        system_name: str,
        control_families: str,
        impact_level: str = "Moderate"
    ) -> str:
        """
        Generate an evidence collection checklist for assessment.

        :param system_name: Name of the system
        :param control_families: Comma-separated control families (e.g., "AC, AU, SC, SI") or "all"
        :param impact_level: Impact level for context
        :return: Evidence collection checklist by family
        """
        families = [f.strip().upper() for f in control_families.split(',')]

        if "ALL" in families:
            families = list(self.evidence_types.keys())

        result = f"""## Evidence Collection Checklist

### System: {system_name}
### Impact Level: {impact_level}
### Generated: {datetime.now().strftime('%Y-%m-%d')}

---

"""
        for family in families:
            if family not in self.evidence_types:
                result += f"### {family} - Unknown family\n\n"
                continue

            evidence = self.evidence_types[family]
            result += f"### {family} - {evidence['family']}\n\n"
            result += "| Collected | Evidence Item | Location/Notes |\n"
            result += "|-----------|---------------|----------------|\n"

            for item in evidence["common_evidence"]:
                result += f"| [ ] | {item} | |\n"

            result += "\n"

        result += """---

### Evidence Collection Guidelines

1. **Naming Convention:** `[SystemName]_[ControlID]_[EvidenceType]_[Date].[ext]`
   - Example: `ACME_AC-2_UserListing_20241201.xlsx`

2. **Sensitive Data:** Redact/sanitize PII, passwords, and sensitive details

3. **Screenshots:** Include date/time stamp, system name visible

4. **Configuration Files:** Export full config, note any redactions

5. **Logs:** Minimum 30 days, representative sample of activity

6. **Documentation:** Current versions only, note revision dates

### Evidence Quality Checks
- [ ] All evidence is dated within assessment period
- [ ] Screenshots are legible and complete
- [ ] Sensitive data has been redacted
- [ ] Evidence matches control implementation statements
- [ ] File naming convention followed
"""
        return result

    def create_poam_entry(
        self,
        finding_id: str,
        control_id: str,
        weakness_description: str,
        risk_level: str,
        remediation_plan: str,
        responsible_party: str,
        due_date: str,
        milestones: str = "",
        resources_required: str = ""
    ) -> str:
        """
        Create a formatted POA&M entry for a finding.

        :param finding_id: Unique identifier for the finding (e.g., "2024-001")
        :param control_id: Affected NIST 800-53 control (e.g., "AC-2")
        :param weakness_description: Description of the weakness/finding
        :param risk_level: Risk level (Very Low, Low, Moderate, High, Very High)
        :param remediation_plan: Planned corrective actions
        :param responsible_party: POC responsible for remediation
        :param due_date: Scheduled completion date (YYYY-MM-DD)
        :param milestones: Semicolon-separated milestones with dates (e.g., "Milestone 1:2024-12-15;Milestone 2:2024-12-30")
        :param resources_required: Required resources (funding, tools, personnel)
        :return: Formatted POA&M entry
        """
        risk_colors = {
            "very low": "Low priority",
            "low": "Low priority",
            "moderate": "Medium priority",
            "high": "High priority - expedite",
            "very high": "Critical - immediate action"
        }

        priority = risk_colors.get(risk_level.lower(), "Review priority")

        result = f"""## POA&M Entry: {finding_id}

### Finding Details
| Field | Value |
|-------|-------|
| **Finding ID** | {finding_id} |
| **Control ID** | {control_id} |
| **Risk Level** | {risk_level} |
| **Priority** | {priority} |
| **Status** | Open |
| **Date Identified** | {datetime.now().strftime('%Y-%m-%d')} |
| **Scheduled Completion** | {due_date} |

### Weakness Description
{weakness_description}

### Recommended Remediation
{remediation_plan}

### Responsible Party
**POC:** {responsible_party}

"""
        if milestones:
            result += "### Milestones\n\n"
            result += "| Milestone | Target Date | Status |\n"
            result += "|-----------|-------------|--------|\n"

            for milestone in milestones.split(';'):
                parts = milestone.strip().split(':')
                if len(parts) >= 2:
                    result += f"| {parts[0].strip()} | {parts[1].strip()} | Pending |\n"

            result += "\n"

        if resources_required:
            result += f"""### Resources Required
{resources_required}

"""

        result += """### Status Updates
| Date | Update | Updated By |
|------|--------|------------|
| | | |

### Closure Information
- **Actual Completion Date:**
- **Closure Evidence:**
- **Verified By:**
- **Closure Date:**

---
*POA&M entries should be reviewed and updated at least monthly.*
"""
        return result

    def generate_weekly_status(
        self,
        client_name: str,
        project_name: str,
        reporting_period: str,
        accomplishments: str,
        next_week_plans: str,
        risks_issues: str = "",
        metrics: str = ""
    ) -> str:
        """
        Generate a weekly client status report.

        :param client_name: Client organization name
        :param project_name: Project/engagement name
        :param reporting_period: Week of (e.g., "December 2-6, 2024")
        :param accomplishments: This week's accomplishments (semicolon-separated)
        :param next_week_plans: Next week's planned activities (semicolon-separated)
        :param risks_issues: Current risks or issues (semicolon-separated)
        :param metrics: Key metrics (semicolon-separated as "metric:value")
        :return: Formatted weekly status report
        """
        result = f"""## Weekly Status Report

### {project_name}
**Client:** {client_name}
**Reporting Period:** {reporting_period}
**Report Date:** {datetime.now().strftime('%Y-%m-%d')}

---

### This Week's Accomplishments
"""
        for item in accomplishments.split(';'):
            if item.strip():
                result += f"- {item.strip()}\n"

        result += """
### Next Week's Plan
"""
        for item in next_week_plans.split(';'):
            if item.strip():
                result += f"- {item.strip()}\n"

        if risks_issues:
            result += """
### Risks & Issues
| Item | Impact | Mitigation | Status |
|------|--------|------------|--------|
"""
            for item in risks_issues.split(';'):
                if item.strip():
                    result += f"| {item.strip()} | | | Open |\n"

        if metrics:
            result += """
### Key Metrics
| Metric | Value |
|--------|-------|
"""
            for item in metrics.split(';'):
                parts = item.strip().split(':')
                if len(parts) >= 2:
                    result += f"| {parts[0].strip()} | {parts[1].strip()} |\n"

        result += """
---

### Overall Project Health
| Area | Status | Notes |
|------|--------|-------|
| Schedule | | |
| Budget | | |
| Scope | | |
| Quality | | |

**Overall Status:** [GREEN/YELLOW/RED]

---

**Prepared by:** Eagle Sentinel
**Next Report Due:** [DATE]
"""
        return result

    def list_evidence_families(self) -> str:
        """
        List all control families and their typical evidence requirements.

        :return: Summary of evidence types by control family
        """
        result = """## Evidence Requirements by Control Family

"""
        for family_id, family_data in sorted(self.evidence_types.items()):
            result += f"### {family_id} - {family_data['family']}\n"
            result += f"**Typical Evidence Items:** {len(family_data['common_evidence'])}\n\n"
            for item in family_data['common_evidence'][:5]:
                result += f"- {item}\n"
            if len(family_data['common_evidence']) > 5:
                result += f"- ... and {len(family_data['common_evidence']) - 5} more\n"
            result += "\n"

        result += """---

Use `generate_evidence_checklist(system_name, families)` for a complete checklist.
"""
        return result
