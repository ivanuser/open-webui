"""
title: FIPS 199 Security Categorization Calculator
description: Calculate system security categorization based on FIPS 199 and NIST SP 800-60. Includes information type mapping, impact level determination, and high-water mark calculation.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Tools:
    """FIPS 199 Security Categorization Calculator based on NIST SP 800-60"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_information_types()

    def _init_information_types(self):
        """Initialize NIST SP 800-60 information type catalog"""
        # Information types from NIST SP 800-60 Vol. 2
        self.information_types = {
            # Services Delivery Support Functions (C.2.1)
            "C.2.1.1": {
                "name": "Controls and Oversight",
                "description": "Corrective action, program evaluation, program monitoring",
                "provisional": {"confidentiality": "Low", "integrity": "Low", "availability": "Low"},
                "category": "Services Delivery Support"
            },
            "C.2.1.2": {
                "name": "Regulatory Development",
                "description": "Policy and guidance development, public comment tracking, regulatory creation",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Services Delivery Support"
            },
            "C.2.1.3": {
                "name": "Planning and Budgeting",
                "description": "Budget formulation, capital planning, enterprise architecture, strategic planning",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Services Delivery Support"
            },
            "C.2.1.4": {
                "name": "Internal Risk Management and Mitigation",
                "description": "Contingency planning, continuity of operations, service recovery planning",
                "provisional": {"confidentiality": "Low", "integrity": "Low", "availability": "Moderate"},
                "category": "Services Delivery Support"
            },
            "C.2.1.5": {
                "name": "Revenue Collection",
                "description": "Debt collection, user fee collection, federal asset sales",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Services Delivery Support"
            },
            "C.2.1.6": {
                "name": "Public Affairs",
                "description": "Customer services, official information dissemination, product outreach, public relations",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Services Delivery Support"
            },
            "C.2.1.7": {
                "name": "Legislative Relations",
                "description": "Legislation tracking, legislation testimony, proposal development",
                "provisional": {"confidentiality": "Low", "integrity": "Low", "availability": "Low"},
                "category": "Services Delivery Support"
            },
            "C.2.1.8": {
                "name": "General Government",
                "description": "Central fiscal operations, legislative functions, executive functions, central property management",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Services Delivery Support"
            },

            # Government Resource Management (C.2.2)
            "C.2.2.1": {
                "name": "Administrative Management",
                "description": "Facilities, fleet, and equipment management; help desk services; security management; travel",
                "provisional": {"confidentiality": "Low", "integrity": "Low", "availability": "Low"},
                "category": "Government Resource Management"
            },
            "C.2.2.2": {
                "name": "Financial Management",
                "description": "Accounting, payments, collections, asset and liability management, reporting and information",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Government Resource Management"
            },
            "C.2.2.3": {
                "name": "Human Resource Management",
                "description": "HR strategy, staff acquisition, organization and position management, compensation management, benefits management, employee performance management, employee relations, labor relations, separation management, human resources development",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Low"},
                "category": "Government Resource Management"
            },
            "C.2.2.4": {
                "name": "Supply Chain Management",
                "description": "Goods acquisition, inventory control, logistics management, services acquisition",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Government Resource Management"
            },
            "C.2.2.5": {
                "name": "Information and Technology Management",
                "description": "System development, lifecycle/change management, system maintenance, IT infrastructure maintenance, information security, record retention, information management",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Government Resource Management"
            },

            # Defense and National Security (C.3.1)
            "C.3.1.1": {
                "name": "Strategic National and Theater Defense",
                "description": "Strategic deterrence, theater nuclear operations, strategic mobility",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "High"},
                "category": "Defense and National Security"
            },
            "C.3.1.2": {
                "name": "Operational Defense",
                "description": "Land combat operations, air combat operations, sea combat operations, special operations",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "High"},
                "category": "Defense and National Security"
            },
            "C.3.1.3": {
                "name": "Tactical Defense",
                "description": "Combat support, infrastructure, logistics, personnel support",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Defense and National Security"
            },

            # Intelligence Operations (C.3.2)
            "C.3.2.1": {
                "name": "Intelligence Planning",
                "description": "Intelligence planning operations",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Intelligence Operations"
            },
            "C.3.2.2": {
                "name": "Intelligence Collection",
                "description": "HUMINT, SIGINT, IMINT, MASINT collection operations",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Intelligence Operations"
            },
            "C.3.2.3": {
                "name": "Intelligence Analysis and Production",
                "description": "Intelligence analysis, all-source intelligence production",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Intelligence Operations"
            },

            # Law Enforcement (C.3.3)
            "C.3.3.1": {
                "name": "Criminal Apprehension",
                "description": "Criminal investigation, criminal surveillance, fugitive apprehension",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Law Enforcement"
            },
            "C.3.3.2": {
                "name": "Criminal Investigation and Surveillance",
                "description": "Criminal investigation, surveillance operations",
                "provisional": {"confidentiality": "Moderate", "integrity": "High", "availability": "Moderate"},
                "category": "Law Enforcement"
            },
            "C.3.3.3": {
                "name": "Citizen Protection",
                "description": "Witness and victim protection, protection of critical infrastructure",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Law Enforcement"
            },
            "C.3.3.4": {
                "name": "Crime Prevention",
                "description": "Community-based crime prevention, crime analysis",
                "provisional": {"confidentiality": "Low", "integrity": "Moderate", "availability": "Low"},
                "category": "Law Enforcement"
            },
            "C.3.3.5": {
                "name": "Leadership Protection",
                "description": "VIP/leadership protection operations",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Law Enforcement"
            },

            # Health Care (C.3.4)
            "C.3.4.1": {
                "name": "Access to Care",
                "description": "Enrollment, eligibility, patient referral",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Health Care"
            },
            "C.3.4.2": {
                "name": "Population Health Management",
                "description": "Immunization, screening, medical care, behavioral health",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Health Care"
            },
            "C.3.4.3": {
                "name": "Health Care Administration",
                "description": "Health care delivery, provider credentialing, privacy policy",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Health Care"
            },
            "C.3.4.4": {
                "name": "Health Care Delivery Services",
                "description": "Diagnostic services, treatment services, patient management",
                "provisional": {"confidentiality": "Moderate", "integrity": "High", "availability": "High"},
                "category": "Health Care"
            },
            "C.3.4.5": {
                "name": "Health Care Research",
                "description": "Medical research, clinical trials, health statistics",
                "provisional": {"confidentiality": "Moderate", "integrity": "High", "availability": "Low"},
                "category": "Health Care"
            },

            # Financial Services (C.3.5)
            "C.3.5.1": {
                "name": "Central Bank Operations",
                "description": "Monetary policy, currency operations, banking services",
                "provisional": {"confidentiality": "Moderate", "integrity": "High", "availability": "High"},
                "category": "Financial Services"
            },
            "C.3.5.2": {
                "name": "Financial Sector Oversight",
                "description": "Bank supervision, securities regulation, consumer protection",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Moderate"},
                "category": "Financial Services"
            },

            # Critical Infrastructure Protection (C.3.6)
            "C.3.6.1": {
                "name": "Energy Production",
                "description": "Energy resource management, energy production",
                "provisional": {"confidentiality": "Low", "integrity": "High", "availability": "High"},
                "category": "Critical Infrastructure"
            },
            "C.3.6.2": {
                "name": "Energy Distribution",
                "description": "Energy supply, energy distribution, energy conservation",
                "provisional": {"confidentiality": "Low", "integrity": "High", "availability": "High"},
                "category": "Critical Infrastructure"
            },
            "C.3.6.3": {
                "name": "Water Resource Management",
                "description": "Water conservation, water treatment, water distribution",
                "provisional": {"confidentiality": "Low", "integrity": "High", "availability": "High"},
                "category": "Critical Infrastructure"
            },

            # Privacy Information Types
            "PII-General": {
                "name": "Personally Identifiable Information (General)",
                "description": "Name, address, SSN, date of birth, and other identifying information",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Low"},
                "category": "Privacy"
            },
            "PII-Sensitive": {
                "name": "Sensitive PII",
                "description": "SSN, financial account numbers, biometric data, medical records",
                "provisional": {"confidentiality": "High", "integrity": "Moderate", "availability": "Low"},
                "category": "Privacy"
            },
            "PHI": {
                "name": "Protected Health Information",
                "description": "Medical records, health status, treatment information under HIPAA",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Privacy"
            },

            # Common Business Types
            "Email": {
                "name": "Email Communications",
                "description": "Routine organizational email communications",
                "provisional": {"confidentiality": "Low", "integrity": "Low", "availability": "Low"},
                "category": "General Business"
            },
            "Email-Sensitive": {
                "name": "Sensitive Email Communications",
                "description": "Email containing sensitive business or personal information",
                "provisional": {"confidentiality": "Moderate", "integrity": "Moderate", "availability": "Low"},
                "category": "General Business"
            },
            "Authentication": {
                "name": "Authentication Credentials",
                "description": "Passwords, tokens, certificates, biometric templates",
                "provisional": {"confidentiality": "High", "integrity": "High", "availability": "Moderate"},
                "category": "Security"
            },
            "Audit-Logs": {
                "name": "Audit and Accountability Records",
                "description": "System audit logs, access records, security event logs",
                "provisional": {"confidentiality": "Low", "integrity": "High", "availability": "Low"},
                "category": "Security"
            }
        }

    def calculate_categorization(
        self,
        system_name: str,
        information_types: str,
        confidentiality_adjustments: str = "",
        integrity_adjustments: str = "",
        availability_adjustments: str = ""
    ) -> str:
        """
        Calculate FIPS 199 security categorization for a system based on its information types.

        :param system_name: Name of the system being categorized.
        :param information_types: Comma-separated list of information type IDs or names (e.g., "C.2.2.3, PII-General, PHI").
        :param confidentiality_adjustments: Optional adjustments with rationale (e.g., "C.2.2.3:High:Contains executive personnel data").
        :param integrity_adjustments: Optional adjustments with rationale.
        :param availability_adjustments: Optional adjustments with rationale.
        :return: Complete FIPS 199 categorization with rationale.
        """
        # Parse information types
        type_ids = [t.strip() for t in information_types.split(',') if t.strip()]

        if not type_ids:
            return "Error: Please provide at least one information type."

        # Parse adjustments
        def parse_adjustments(adj_str):
            adjustments = {}
            if adj_str:
                for adj in adj_str.split(';'):
                    parts = adj.strip().split(':')
                    if len(parts) >= 2:
                        type_id = parts[0].strip()
                        level = parts[1].strip().capitalize()
                        rationale = parts[2].strip() if len(parts) > 2 else "Organizational determination"
                        adjustments[type_id] = {"level": level, "rationale": rationale}
            return adjustments

        conf_adj = parse_adjustments(confidentiality_adjustments)
        int_adj = parse_adjustments(integrity_adjustments)
        avail_adj = parse_adjustments(availability_adjustments)

        # Process each information type
        results = []
        impact_values = {"Low": 1, "Moderate": 2, "High": 3}
        impact_names = {1: "Low", 2: "Moderate", 3: "High"}

        max_conf = 0
        max_int = 0
        max_avail = 0

        for type_id in type_ids:
            # Try to find the information type
            info_type = None
            matched_id = None

            # Direct ID match
            if type_id in self.information_types:
                info_type = self.information_types[type_id]
                matched_id = type_id
            else:
                # Search by name
                for tid, tdata in self.information_types.items():
                    if type_id.lower() in tdata["name"].lower():
                        info_type = tdata
                        matched_id = tid
                        break

            if not info_type:
                results.append({
                    "id": type_id,
                    "name": "Unknown",
                    "error": f"Information type '{type_id}' not found. Use list_information_types() to see available types."
                })
                continue

            # Get provisional levels
            prov_conf = info_type["provisional"]["confidentiality"]
            prov_int = info_type["provisional"]["integrity"]
            prov_avail = info_type["provisional"]["availability"]

            # Apply adjustments
            final_conf = conf_adj.get(matched_id, {}).get("level", prov_conf)
            final_int = int_adj.get(matched_id, {}).get("level", prov_int)
            final_avail = avail_adj.get(matched_id, {}).get("level", prov_avail)

            conf_rationale = conf_adj.get(matched_id, {}).get("rationale", "Per SP 800-60 provisional")
            int_rationale = int_adj.get(matched_id, {}).get("rationale", "Per SP 800-60 provisional")
            avail_rationale = avail_adj.get(matched_id, {}).get("rationale", "Per SP 800-60 provisional")

            results.append({
                "id": matched_id,
                "name": info_type["name"],
                "category": info_type["category"],
                "provisional": info_type["provisional"],
                "final": {
                    "confidentiality": final_conf,
                    "integrity": final_int,
                    "availability": final_avail
                },
                "rationale": {
                    "confidentiality": conf_rationale,
                    "integrity": int_rationale,
                    "availability": avail_rationale
                }
            })

            # Track high water mark
            max_conf = max(max_conf, impact_values.get(final_conf, 0))
            max_int = max(max_int, impact_values.get(final_int, 0))
            max_avail = max(max_avail, impact_values.get(final_avail, 0))

        # Determine overall categorization
        overall_conf = impact_names.get(max_conf, "Low")
        overall_int = impact_names.get(max_int, "Low")
        overall_avail = impact_names.get(max_avail, "Low")
        overall_impact = impact_names.get(max(max_conf, max_int, max_avail), "Low")

        # Generate report
        report = f"""## FIPS 199 Security Categorization

### System: {system_name}

---

### Overall System Categorization

**SC {system_name} = {{(confidentiality, {overall_conf}), (integrity, {overall_int}), (availability, {overall_avail})}}**

**Overall Impact Level: {overall_impact.upper()}**

*Per FIPS 199 high-water mark principle, the system impact level is the highest impact level among confidentiality, integrity, and availability.*

---

### Information Type Analysis

"""
        for result in results:
            if "error" in result:
                report += f"**{result['id']}**: {result['error']}\n\n"
            else:
                report += f"""#### {result['id']} - {result['name']}
**Category:** {result['category']}

| Security Objective | Provisional | Final | Rationale |
|-------------------|-------------|-------|-----------|
| Confidentiality | {result['provisional']['confidentiality']} | {result['final']['confidentiality']} | {result['rationale']['confidentiality']} |
| Integrity | {result['provisional']['integrity']} | {result['final']['integrity']} | {result['rationale']['integrity']} |
| Availability | {result['provisional']['availability']} | {result['final']['availability']} | {result['rationale']['availability']} |

"""

        report += f"""---

### High Water Mark Calculation

| Security Objective | Highest Impact | Contributing Types |
|-------------------|----------------|-------------------|
| Confidentiality | {overall_conf} | {', '.join([r['id'] for r in results if 'final' in r and r['final']['confidentiality'] == overall_conf])} |
| Integrity | {overall_int} | {', '.join([r['id'] for r in results if 'final' in r and r['final']['integrity'] == overall_int])} |
| Availability | {overall_avail} | {', '.join([r['id'] for r in results if 'final' in r and r['final']['availability'] == overall_avail])} |

---

### Required Baseline

Based on the **{overall_impact.upper()}** impact categorization, this system requires **NIST SP 800-53 {overall_impact.upper()} baseline controls**.

### Next Steps
1. Document this categorization in the System Security Plan (SSP)
2. Select applicable controls from the {overall_impact} baseline
3. Identify any additional controls based on system-specific risks
4. Submit for Authorizing Official (AO) review and approval
"""

        return report

    def list_information_types(self, category: str = "") -> str:
        """
        List available information types from NIST SP 800-60.

        :param category: Optional filter by category (e.g., "Privacy", "Health Care", "Law Enforcement").
        :return: List of information types with their provisional impact levels.
        """
        category_filter = category.lower() if category else ""

        # Group by category
        categories = {}
        for type_id, info in self.information_types.items():
            cat = info["category"]
            if category_filter and category_filter not in cat.lower():
                continue
            if cat not in categories:
                categories[cat] = []
            categories[cat].append({
                "id": type_id,
                "name": info["name"],
                "provisional": info["provisional"]
            })

        if not categories:
            return f"No information types found matching category '{category}'. Available categories: Services Delivery Support, Government Resource Management, Defense and National Security, Intelligence Operations, Law Enforcement, Health Care, Financial Services, Critical Infrastructure, Privacy, General Business, Security"

        result = "## NIST SP 800-60 Information Types\n\n"

        for cat in sorted(categories.keys()):
            result += f"### {cat}\n\n"
            result += "| ID | Name | C | I | A |\n"
            result += "|-------|------|---|---|---|\n"

            for info in sorted(categories[cat], key=lambda x: x["id"]):
                c = info["provisional"]["confidentiality"][0]
                i = info["provisional"]["integrity"][0]
                a = info["provisional"]["availability"][0]
                result += f"| {info['id']} | {info['name']} | {c} | {i} | {a} |\n"

            result += "\n"

        result += "\n*C=Confidentiality, I=Integrity, A=Availability. L=Low, M=Moderate, H=High*"
        return result

    def get_information_type(self, type_id: str) -> str:
        """
        Get detailed information about a specific information type.

        :param type_id: The information type ID (e.g., "C.2.2.3", "PHI", "PII-Sensitive").
        :return: Detailed information including description and provisional impact levels.
        """
        # Direct match
        if type_id in self.information_types:
            info = self.information_types[type_id]
        else:
            # Search by name
            found = None
            for tid, tdata in self.information_types.items():
                if type_id.lower() in tdata["name"].lower() or type_id.lower() in tid.lower():
                    info = tdata
                    type_id = tid
                    found = True
                    break
            if not found:
                return f"Information type '{type_id}' not found. Use list_information_types() to see available types."

        result = f"""## Information Type: {info['name']}

**ID:** {type_id}
**Category:** {info['category']}

### Description
{info['description']}

### Provisional Impact Levels (NIST SP 800-60)

| Security Objective | Impact Level | Rationale |
|-------------------|--------------|-----------|
| Confidentiality | {info['provisional']['confidentiality']} | Per SP 800-60 Vol. 2 |
| Integrity | {info['provisional']['integrity']} | Per SP 800-60 Vol. 2 |
| Availability | {info['provisional']['availability']} | Per SP 800-60 Vol. 2 |

### Usage Notes
- These are **provisional** impact levels that may be adjusted based on organizational context
- Adjustments must be documented with rationale
- Increases typically require stronger justification than decreases
- Consider operational environment and data sensitivity when adjusting
"""
        return result

    def explain_impact_levels(self) -> str:
        """
        Explain FIPS 199 impact levels and their definitions.

        :return: Detailed explanation of Low, Moderate, and High impact levels for each security objective.
        """
        return """## FIPS 199 Impact Level Definitions

### Confidentiality
*"Preserving authorized restrictions on information access and disclosure"*

| Level | Definition |
|-------|------------|
| **Low** | Unauthorized disclosure could be expected to have a **limited adverse effect** on organizational operations, assets, or individuals |
| **Moderate** | Unauthorized disclosure could be expected to have a **serious adverse effect** on organizational operations, assets, or individuals |
| **High** | Unauthorized disclosure could be expected to have a **severe or catastrophic adverse effect** on organizational operations, assets, or individuals |

### Integrity
*"Guarding against improper information modification or destruction"*

| Level | Definition |
|-------|------------|
| **Low** | Unauthorized modification or destruction could be expected to have a **limited adverse effect** on organizational operations, assets, or individuals |
| **Moderate** | Unauthorized modification or destruction could be expected to have a **serious adverse effect** on organizational operations, assets, or individuals |
| **High** | Unauthorized modification or destruction could be expected to have a **severe or catastrophic adverse effect** on organizational operations, assets, or individuals |

### Availability
*"Ensuring timely and reliable access to and use of information"*

| Level | Definition |
|-------|------------|
| **Low** | Disruption of access could be expected to have a **limited adverse effect** on organizational operations, assets, or individuals |
| **Moderate** | Disruption of access could be expected to have a **serious adverse effect** on organizational operations, assets, or individuals |
| **High** | Disruption of access could be expected to have a **severe or catastrophic adverse effect** on organizational operations, assets, or individuals |

---

### Adverse Effect Examples

**Limited Adverse Effect:**
- Minor financial loss
- Minor damage to organizational assets
- Minor harm to individuals

**Serious Adverse Effect:**
- Significant financial loss
- Significant damage to organizational assets
- Significant harm to individuals (not life-threatening)
- Loss of organizational capability for an extended period

**Severe or Catastrophic Adverse Effect:**
- Major financial loss
- Major damage to organizational assets
- Severe harm to individuals (potential loss of life)
- Loss of major organizational capability
- Threat to national security

---

### High Water Mark Principle

The overall system categorization is determined by the **highest** impact level among confidentiality, integrity, and availability:

**SC System = {(confidentiality, X), (integrity, Y), (availability, Z)}**

**Overall Impact = MAX(X, Y, Z)**

Example: If C=Low, I=Moderate, A=High → System is **HIGH** impact
"""

    def compare_baselines(self) -> str:
        """
        Compare control requirements across FIPS 199 impact level baselines.

        :return: Summary comparison of Low, Moderate, and High baseline requirements.
        """
        return """## FIPS 199 Baseline Comparison

### Control Count by Baseline (NIST SP 800-53 Rev. 5)

| Family | Low | Moderate | High |
|--------|-----|----------|------|
| AC (Access Control) | 12 | 21 | 25 |
| AT (Awareness & Training) | 4 | 4 | 5 |
| AU (Audit) | 10 | 12 | 14 |
| CA (Assessment) | 7 | 9 | 11 |
| CM (Configuration Mgmt) | 9 | 12 | 14 |
| CP (Contingency Planning) | 9 | 12 | 13 |
| IA (Identification & Auth) | 8 | 11 | 12 |
| IR (Incident Response) | 8 | 9 | 11 |
| MA (Maintenance) | 5 | 6 | 6 |
| MP (Media Protection) | 6 | 8 | 8 |
| PE (Physical Protection) | 14 | 18 | 20 |
| PL (Planning) | 6 | 7 | 7 |
| PM (Program Mgmt) | 16 | 16 | 16 |
| PS (Personnel Security) | 8 | 8 | 8 |
| PT (Privacy) | 8 | 8 | 8 |
| RA (Risk Assessment) | 6 | 7 | 8 |
| SA (System Acquisition) | 13 | 19 | 22 |
| SC (System & Comms) | 16 | 26 | 35 |
| SI (System & Info Integrity) | 10 | 13 | 16 |
| SR (Supply Chain) | 5 | 9 | 12 |
| **TOTAL** | **~180** | **~235** | **~270** |

### Key Differences

**Low → Moderate:**
- Multi-factor authentication requirements (IA-2 enhancements)
- Enhanced audit requirements
- Encryption for data at rest and in transit
- Vulnerability scanning requirements
- Additional access control mechanisms

**Moderate → High:**
- Stronger cryptographic protections
- Additional system monitoring
- Enhanced boundary protection
- Stricter personnel security
- More comprehensive contingency planning
- Mandatory code review and security testing

### Resource Implications

| Impact Level | Typical Resources | Annual Cost Range |
|--------------|-------------------|-------------------|
| Low | Basic security controls | $50K - $200K |
| Moderate | Enhanced controls, dedicated staff | $200K - $500K |
| High | Comprehensive program, 24/7 monitoring | $500K - $2M+ |

*Costs vary significantly based on system size, complexity, and existing security posture.*
"""
