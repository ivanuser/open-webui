"""
title: Compliance Report Generator
description: Generate RMF compliance reports, executive summaries, assessment findings, and deliverable templates for client engagements.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json


class Tools:
    """Compliance Report Generation Tools for Eagle Sentinel"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_templates()

    def _init_templates(self):
        """Initialize report templates and frameworks"""
        self.impact_control_counts = {
            "Low": {"total": 156, "technical": 89, "operational": 42, "management": 25},
            "Moderate": {"total": 325, "technical": 178, "operational": 92, "management": 55},
            "High": {"total": 421, "technical": 231, "operational": 118, "management": 72}
        }

        self.finding_categories = {
            "configuration": "System Configuration",
            "documentation": "Documentation Gap",
            "implementation": "Implementation Deficiency",
            "policy": "Policy/Procedure Gap",
            "access": "Access Control Issue",
            "monitoring": "Monitoring/Logging Gap",
            "training": "Training/Awareness Gap",
            "process": "Process Deficiency"
        }

        self.risk_matrix = {
            "Very High": {"likelihood": "High", "impact": "High", "color": "RED"},
            "High": {"likelihood": "High", "impact": "Moderate", "color": "RED"},
            "Moderate": {"likelihood": "Moderate", "impact": "Moderate", "color": "YELLOW"},
            "Low": {"likelihood": "Low", "impact": "Moderate", "color": "GREEN"},
            "Very Low": {"likelihood": "Low", "impact": "Low", "color": "GREEN"}
        }

    def generate_executive_summary(
        self,
        client_name: str,
        system_name: str,
        assessment_type: str,
        impact_level: str,
        total_findings: int,
        high_findings: int,
        moderate_findings: int,
        low_findings: int,
        key_strengths: str,
        key_weaknesses: str,
        recommendation: str
    ) -> str:
        """
        Generate an executive summary for security assessment results.

        :param client_name: Client organization name
        :param system_name: Name of the assessed system
        :param assessment_type: Type of assessment (Initial, Annual, Continuous Monitoring)
        :param impact_level: FIPS 199 impact level (Low, Moderate, High)
        :param total_findings: Total number of findings
        :param high_findings: Number of high/critical findings
        :param moderate_findings: Number of moderate findings
        :param low_findings: Number of low findings
        :param key_strengths: Semicolon-separated list of key strengths
        :param key_weaknesses: Semicolon-separated list of key weaknesses
        :param recommendation: Overall recommendation (Authorize, Authorize with Conditions, Deny)
        :return: Formatted executive summary
        """
        # Calculate percentages
        control_counts = self.impact_control_counts.get(impact_level, self.impact_control_counts["Moderate"])

        if high_findings > 0:
            overall_risk = "HIGH"
            risk_color = "RED"
        elif moderate_findings > 5:
            overall_risk = "MODERATE"
            risk_color = "YELLOW"
        else:
            overall_risk = "LOW"
            risk_color = "GREEN"

        result = f"""# Executive Summary

## Security Assessment Report
### {system_name}

---

| Field | Value |
|-------|-------|
| **Client** | {client_name} |
| **System** | {system_name} |
| **Assessment Type** | {assessment_type} |
| **Impact Level** | {impact_level} |
| **Assessment Date** | {datetime.now().strftime('%B %Y')} |
| **Prepared By** | Eagle Sentinel |

---

## Overall Assessment

**Recommendation: {recommendation.upper()}**

**Overall Risk Level: {overall_risk}** ({risk_color})

The {system_name} was assessed against the NIST 800-53 Rev. 5 {impact_level}-impact baseline
consisting of {control_counts['total']} security controls across 18 control families.

---

## Findings Summary

| Risk Level | Count | Percentage |
|------------|-------|------------|
| High/Critical | {high_findings} | {high_findings/max(total_findings,1)*100:.1f}% |
| Moderate | {moderate_findings} | {moderate_findings/max(total_findings,1)*100:.1f}% |
| Low | {low_findings} | {low_findings/max(total_findings,1)*100:.1f}% |
| **Total** | **{total_findings}** | **100%** |

"""

        # Finding severity distribution chart (text-based)
        result += f"""### Finding Distribution by Severity

```
High/Critical  [{'#' * min(high_findings, 30):30}] {high_findings}
Moderate       [{'#' * min(moderate_findings, 30):30}] {moderate_findings}
Low            [{'#' * min(low_findings, 30):30}] {low_findings}
```

---

## Key Strengths

"""
        for strength in key_strengths.split(';'):
            if strength.strip():
                result += f"- {strength.strip()}\n"

        result += """
## Key Areas for Improvement

"""
        for weakness in key_weaknesses.split(';'):
            if weakness.strip():
                result += f"- {weakness.strip()}\n"

        result += f"""
---

## Recommendations

### Immediate Actions (0-30 days)
1. Remediate all high-risk findings
2. Develop POA&M entries with realistic milestones
3. Assign ownership for each finding

### Short-Term Actions (30-90 days)
1. Address moderate-risk findings
2. Implement enhanced monitoring where needed
3. Update security documentation

### Long-Term Actions (90+ days)
1. Complete remaining low-risk remediation
2. Establish continuous monitoring program
3. Plan for next assessment cycle

---

## Authorization Recommendation

**{recommendation}**

Based on the assessment results, Eagle Sentinel recommends that the Authorizing Official
**{recommendation.lower()}** the operation of {system_name}.

"""
        if recommendation.lower() == "authorize with conditions":
            result += """The following conditions should be met:
1. POA&M must be developed for all findings within 30 days
2. High-risk findings must be remediated or mitigated within 90 days
3. Monthly status reports on remediation progress required

"""
        elif recommendation.lower() == "deny":
            result += """The following issues must be addressed before resubmission:
1. Critical security gaps present unacceptable risk
2. System architecture requires significant changes
3. Comprehensive remediation plan must be developed

"""

        result += """---

*This executive summary was prepared by Eagle Sentinel. Full assessment details
are available in the Security Assessment Report (SAR).*
"""
        return result

    def generate_finding_report(
        self,
        finding_id: str,
        control_id: str,
        control_title: str,
        finding_type: str,
        risk_level: str,
        description: str,
        evidence: str,
        root_cause: str,
        recommendation: str,
        affected_assets: str = "",
        references: str = ""
    ) -> str:
        """
        Generate a detailed finding report for a security assessment finding.

        :param finding_id: Unique finding identifier
        :param control_id: NIST 800-53 control ID (e.g., AC-2)
        :param control_title: Control title
        :param finding_type: Type of finding (configuration, documentation, implementation, policy, access, monitoring, training, process)
        :param risk_level: Risk level (Very High, High, Moderate, Low, Very Low)
        :param description: Detailed description of the finding
        :param evidence: Evidence observed during assessment
        :param root_cause: Root cause analysis
        :param recommendation: Recommended remediation actions
        :param affected_assets: Comma-separated list of affected assets
        :param references: Relevant reference documents or standards
        :return: Formatted finding report
        """
        category = self.finding_categories.get(finding_type.lower(), finding_type)
        risk_info = self.risk_matrix.get(risk_level, self.risk_matrix["Moderate"])

        result = f"""# Security Finding Report

## Finding ID: {finding_id}

---

### Finding Overview

| Field | Value |
|-------|-------|
| **Finding ID** | {finding_id} |
| **Control ID** | {control_id} |
| **Control Title** | {control_title} |
| **Category** | {category} |
| **Risk Level** | {risk_level} |
| **Risk Color** | {risk_info['color']} |
| **Likelihood** | {risk_info['likelihood']} |
| **Impact** | {risk_info['impact']} |
| **Status** | Open |
| **Date Identified** | {datetime.now().strftime('%Y-%m-%d')} |

---

### Finding Description

{description}

---

### Evidence

{evidence}

---

### Root Cause Analysis

{root_cause}

"""
        if affected_assets:
            result += """### Affected Assets

"""
            for asset in affected_assets.split(','):
                if asset.strip():
                    result += f"- {asset.strip()}\n"
            result += "\n"

        result += f"""---

### Recommended Remediation

{recommendation}

### Remediation Priority

Based on the risk level of **{risk_level}**, this finding should be remediated:

"""
        if risk_level in ["Very High", "High"]:
            result += """- **Timeline:** Within 30 days
- **Priority:** Immediate action required
- **Escalation:** Executive visibility recommended
"""
        elif risk_level == "Moderate":
            result += """- **Timeline:** Within 90 days
- **Priority:** Include in next sprint/release
- **Escalation:** Manager visibility
"""
        else:
            result += """- **Timeline:** Within 180 days
- **Priority:** Plan for future release
- **Escalation:** Standard tracking
"""

        if references:
            result += f"""
### References

{references}
"""

        result += """
---

### Verification Requirements

To close this finding, the following must be demonstrated:
1. Evidence that the recommended remediation has been implemented
2. Testing results confirming the vulnerability is addressed
3. Updated documentation reflecting the changes
4. Approval from system owner or ISSO

---

*Finding documented by Eagle Sentinel Assessment Team*
"""
        return result

    def generate_control_status_report(
        self,
        system_name: str,
        impact_level: str,
        satisfied_controls: int,
        partially_satisfied: int,
        not_satisfied: int,
        not_applicable: int,
        family_breakdown: str
    ) -> str:
        """
        Generate a control implementation status report.

        :param system_name: Name of the system
        :param impact_level: FIPS 199 impact level
        :param satisfied_controls: Number of fully satisfied controls
        :param partially_satisfied: Number of partially satisfied controls
        :param not_satisfied: Number of not satisfied controls
        :param not_applicable: Number of not applicable controls
        :param family_breakdown: JSON string of family status (e.g., '{"AC": {"satisfied": 20, "partial": 3, "not_sat": 1}}')
        :return: Control implementation status report
        """
        total_controls = satisfied_controls + partially_satisfied + not_satisfied + not_applicable
        testable_controls = total_controls - not_applicable
        compliance_rate = (satisfied_controls / max(testable_controls, 1)) * 100

        try:
            families = json.loads(family_breakdown)
        except:
            families = {}

        result = f"""# Control Implementation Status Report

## {system_name}

---

### Report Information

| Field | Value |
|-------|-------|
| **System** | {system_name} |
| **Impact Level** | {impact_level} |
| **Report Date** | {datetime.now().strftime('%Y-%m-%d')} |
| **Prepared By** | Eagle Sentinel |

---

## Overall Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| Satisfied | {satisfied_controls} | {satisfied_controls/max(total_controls,1)*100:.1f}% |
| Partially Satisfied | {partially_satisfied} | {partially_satisfied/max(total_controls,1)*100:.1f}% |
| Not Satisfied | {not_satisfied} | {not_satisfied/max(total_controls,1)*100:.1f}% |
| Not Applicable | {not_applicable} | {not_applicable/max(total_controls,1)*100:.1f}% |
| **Total** | **{total_controls}** | **100%** |

### Compliance Rate

**{compliance_rate:.1f}%** of testable controls are fully satisfied.

"""
        # Visual compliance bar
        filled = int(compliance_rate / 2)
        result += f"""```
Compliance: [{'#' * filled}{'.' * (50 - filled)}] {compliance_rate:.1f}%
            0%                    50%                   100%
```

---

## Status by Control Family

| Family | Description | Satisfied | Partial | Not Sat | N/A | Rate |
|--------|-------------|-----------|---------|---------|-----|------|
"""
        family_names = {
            "AC": "Access Control",
            "AT": "Awareness & Training",
            "AU": "Audit & Accountability",
            "CA": "Assessment & Authorization",
            "CM": "Configuration Management",
            "CP": "Contingency Planning",
            "IA": "Identification & Auth",
            "IR": "Incident Response",
            "MA": "Maintenance",
            "MP": "Media Protection",
            "PE": "Physical & Environmental",
            "PL": "Planning",
            "PS": "Personnel Security",
            "RA": "Risk Assessment",
            "SA": "System Acquisition",
            "SC": "System & Comm Protection",
            "SI": "System & Info Integrity",
            "SR": "Supply Chain Risk Mgmt"
        }

        for fam_id, fam_data in sorted(families.items()):
            fam_name = family_names.get(fam_id, fam_id)
            sat = fam_data.get("satisfied", 0)
            part = fam_data.get("partial", 0)
            not_sat = fam_data.get("not_sat", 0)
            na = fam_data.get("na", 0)
            fam_total = sat + part + not_sat
            fam_rate = (sat / max(fam_total, 1)) * 100
            result += f"| {fam_id} | {fam_name} | {sat} | {part} | {not_sat} | {na} | {fam_rate:.0f}% |\n"

        result += f"""
---

## Areas Requiring Attention

### Critical Gaps (Not Satisfied)
Controls marked as "Not Satisfied" require immediate attention and must be addressed
in the Plan of Action & Milestones (POA&M).

### Partial Implementations
Controls with partial implementation need additional work to achieve full compliance.
Consider prioritizing these for quick wins.

---

## Recommendations

1. **Immediate (0-30 days):** Address all Not Satisfied controls with High/Critical risk
2. **Short-term (30-90 days):** Complete partial implementations
3. **Ongoing:** Maintain satisfied controls through continuous monitoring

---

*Report generated by Eagle Sentinel*
"""
        return result

    def generate_risk_summary(
        self,
        system_name: str,
        overall_risk: str,
        risk_factors: str,
        mitigations: str,
        residual_risks: str,
        risk_acceptance: str = ""
    ) -> str:
        """
        Generate a risk summary for authorization decision support.

        :param system_name: Name of the system
        :param overall_risk: Overall risk level (Low, Moderate, High, Very High)
        :param risk_factors: Semicolon-separated risk factors
        :param mitigations: Semicolon-separated mitigating factors
        :param residual_risks: Semicolon-separated residual risks after mitigation
        :param risk_acceptance: Risk acceptance statement if applicable
        :return: Risk summary report
        """
        result = f"""# Risk Summary Report

## {system_name}

---

### Report Information

| Field | Value |
|-------|-------|
| **System** | {system_name} |
| **Overall Risk** | {overall_risk} |
| **Assessment Date** | {datetime.now().strftime('%Y-%m-%d')} |
| **Prepared By** | Eagle Sentinel |

---

## Executive Risk Statement

Based on the security assessment of {system_name}, the overall risk to organizational
operations, organizational assets, individuals, and other organizations is assessed as
**{overall_risk.upper()}**.

---

## Risk Factors Identified

"""
        for i, factor in enumerate(risk_factors.split(';'), 1):
            if factor.strip():
                result += f"{i}. {factor.strip()}\n"

        result += """
---

## Mitigating Factors

"""
        for i, mitigation in enumerate(mitigations.split(';'), 1):
            if mitigation.strip():
                result += f"{i}. {mitigation.strip()}\n"

        result += """
---

## Residual Risks

The following risks remain after implementation of security controls and planned mitigations:

"""
        for i, risk in enumerate(residual_risks.split(';'), 1):
            if risk.strip():
                result += f"{i}. {risk.strip()}\n"

        if risk_acceptance:
            result += f"""
---

## Risk Acceptance Statement

{risk_acceptance}

**Accepted By:** _________________________________ **Date:** _______________

**Title:** Authorizing Official

"""

        result += """
---

## Risk Monitoring

The following residual risks will be monitored through the continuous monitoring program:

| Risk | Monitoring Frequency | Metric | Threshold |
|------|---------------------|--------|-----------|
| | Monthly | | |
| | Quarterly | | |
| | Annually | | |

---

*Risk summary prepared by Eagle Sentinel for authorization decision support*
"""
        return result

    def list_report_types(self) -> str:
        """
        List all available report types and their purposes.

        :return: Description of available reports
        """
        return """# Available Compliance Reports

## Report Types

### 1. Executive Summary
**Function:** `generate_executive_summary`

Generates a high-level summary of security assessment results suitable for
executive leadership and Authorizing Officials. Includes:
- Overall risk assessment
- Finding summary by severity
- Key strengths and weaknesses
- Authorization recommendation

### 2. Finding Report
**Function:** `generate_finding_report`

Creates a detailed finding report for individual security assessment findings.
Includes:
- Finding details and classification
- Evidence and root cause analysis
- Recommended remediation
- Verification requirements

### 3. Control Status Report
**Function:** `generate_control_status_report`

Summarizes control implementation status across all families. Includes:
- Overall compliance rate
- Status breakdown (Satisfied/Partial/Not Satisfied)
- Family-by-family analysis
- Gap identification

### 4. Risk Summary
**Function:** `generate_risk_summary`

Provides risk analysis for authorization decisions. Includes:
- Risk factors identified
- Mitigating factors
- Residual risks
- Risk acceptance statement template

---

## Usage Examples

### Executive Summary
```
generate_executive_summary(
    client_name="ACME Corp",
    system_name="Enterprise Portal",
    assessment_type="Initial",
    impact_level="Moderate",
    total_findings=15,
    high_findings=2,
    moderate_findings=8,
    low_findings=5,
    key_strengths="Strong access control;Good documentation;Active monitoring",
    key_weaknesses="Patch management gaps;Incomplete logging;Training outdated",
    recommendation="Authorize with Conditions"
)
```

### Finding Report
```
generate_finding_report(
    finding_id="2024-001",
    control_id="AC-2",
    control_title="Account Management",
    finding_type="configuration",
    risk_level="High",
    description="User accounts are not being disabled within 24 hours of termination",
    evidence="Review of terminated user accounts showed 5 accounts active 30+ days post-termination",
    root_cause="No automated process exists to sync HR terminations with IT account management",
    recommendation="Implement automated account disablement triggered by HR system termination events"
)
```

---

*Eagle Sentinel Compliance Report Generator v1.0*
"""
