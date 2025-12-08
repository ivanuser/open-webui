"""
title: Control Inheritance Mapper
description: Map and track security control inheritance relationships between systems, common control providers, and cloud service providers. Supports FedRAMP shared responsibility models.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Tools:
    """Control Inheritance Mapper for RMF Authorization Packages"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_common_controls()
        self._init_cloud_inheritance()

    def _init_common_controls(self):
        """Initialize typical common control patterns"""
        self.common_control_patterns = {
            "organization": {
                "name": "Organization-Wide Common Controls",
                "description": "Controls typically provided at the enterprise/organization level",
                "controls": {
                    "fully_inherited": [
                        "AC-1", "AT-1", "AU-1", "CA-1", "CM-1", "CP-1", "IA-1", "IR-1",
                        "MA-1", "MP-1", "PE-1", "PL-1", "PM-1", "PM-2", "PM-3", "PM-4",
                        "PM-5", "PM-6", "PM-7", "PM-8", "PM-9", "PM-10", "PM-11", "PM-12",
                        "PM-13", "PM-14", "PM-15", "PM-16", "PS-1", "PT-1", "RA-1", "SA-1",
                        "SC-1", "SI-1", "SR-1", "AT-2", "AT-3", "AT-4", "PS-2", "PS-3",
                        "PS-4", "PS-5", "PS-6", "PS-7", "PS-8"
                    ],
                    "hybrid": [
                        "AC-2", "AU-6", "CA-2", "CA-5", "CA-7", "CM-3", "CM-4", "CP-2",
                        "IR-4", "IR-6", "IR-8", "PL-2", "PL-4", "RA-3", "RA-5", "SA-2",
                        "SA-3", "SA-4", "SA-9"
                    ]
                },
                "provider": "Enterprise Security Office / CISO"
            },
            "datacenter": {
                "name": "Data Center / Physical Infrastructure",
                "description": "Controls provided by physical facility and infrastructure",
                "controls": {
                    "fully_inherited": [
                        "PE-2", "PE-3", "PE-4", "PE-5", "PE-6", "PE-8", "PE-9", "PE-10",
                        "PE-11", "PE-12", "PE-13", "PE-14", "PE-15", "PE-16", "PE-17",
                        "PE-18"
                    ],
                    "hybrid": [
                        "PE-1", "CP-6", "CP-7", "CP-8"
                    ]
                },
                "provider": "Facility Management / Data Center Operations"
            },
            "network": {
                "name": "Enterprise Network Infrastructure",
                "description": "Controls provided by network operations and security",
                "controls": {
                    "fully_inherited": [
                        "SC-7", "SC-8", "SC-20", "SC-21", "SC-22"
                    ],
                    "hybrid": [
                        "AC-4", "AC-17", "AC-18", "AC-19", "AC-20", "AU-3", "AU-4",
                        "AU-5", "AU-9", "AU-11", "CA-3", "SC-5", "SC-10", "SC-12",
                        "SC-13", "SI-3", "SI-4"
                    ]
                },
                "provider": "Network Operations Center / Network Security"
            }
        }

    def _init_cloud_inheritance(self):
        """Initialize cloud service provider inheritance models"""
        self.cloud_models = {
            "IaaS": {
                "name": "Infrastructure as a Service",
                "description": "Cloud provider manages physical infrastructure; customer manages everything above hypervisor",
                "examples": ["AWS EC2", "Azure VMs", "Google Compute Engine"],
                "provider_responsible": {
                    "fully": [
                        "PE-2", "PE-3", "PE-4", "PE-5", "PE-6", "PE-8", "PE-9", "PE-10",
                        "PE-11", "PE-12", "PE-13", "PE-14", "PE-15", "PE-16", "PE-17",
                        "PE-18", "SC-7(Perimeter)"
                    ],
                    "shared": [
                        "AC-2", "AC-3", "AC-4", "AC-17", "AU-2", "AU-3", "AU-6", "AU-9",
                        "CA-3", "CM-2", "CM-6", "CM-7", "CP-6", "CP-7", "CP-9", "IA-2",
                        "IA-5", "IR-4", "IR-6", "SC-5", "SC-7", "SC-8", "SC-12", "SC-13",
                        "SI-2", "SI-3", "SI-4"
                    ]
                },
                "customer_responsible": [
                    "AC-1", "AC-5", "AC-6", "AC-7", "AC-11", "AC-14", "AT-*", "AU-1",
                    "AU-12", "CA-1", "CA-2", "CA-5", "CA-7", "CM-1", "CM-3", "CM-4",
                    "CM-5", "CM-8", "CM-9", "CM-10", "CM-11", "CP-1", "CP-2", "CP-3",
                    "CP-4", "CP-10", "IA-1", "IA-4", "IA-6", "IA-7", "IA-8", "IR-1",
                    "IR-2", "IR-3", "IR-5", "IR-7", "IR-8", "MA-*", "MP-*", "PL-*",
                    "PM-*", "PS-*", "PT-*", "RA-*", "SA-*", "SC-1", "SC-2", "SC-3",
                    "SC-4", "SC-15", "SC-18", "SC-28", "SI-1", "SI-5", "SI-7",
                    "SI-10", "SI-11", "SI-12", "SR-*"
                ]
            },
            "PaaS": {
                "name": "Platform as a Service",
                "description": "Cloud provider manages infrastructure and platform; customer manages applications and data",
                "examples": ["AWS Elastic Beanstalk", "Azure App Service", "Google App Engine", "Heroku"],
                "provider_responsible": {
                    "fully": [
                        "PE-*", "SC-7(Perimeter)", "CM-2(Platform)", "CM-6(Platform)",
                        "CM-7(Platform)", "SI-2(Platform)", "SI-3(Platform)"
                    ],
                    "shared": [
                        "AC-2", "AC-3", "AC-4", "AC-17", "AU-*", "CA-3", "CM-2", "CM-6",
                        "CM-7", "CP-6", "CP-7", "CP-9", "IA-2", "IA-5", "IR-4", "IR-6",
                        "SC-5", "SC-7", "SC-8", "SC-12", "SC-13", "SC-28", "SI-2",
                        "SI-3", "SI-4"
                    ]
                },
                "customer_responsible": [
                    "AC-1", "AC-5", "AC-6", "AC-7", "AT-*", "AU-1", "CA-1", "CA-2",
                    "CA-5", "CA-7", "CM-1", "CM-3", "CM-4", "CM-5", "CM-8(App)",
                    "CP-1", "CP-2", "CP-3", "CP-4", "CP-10", "IA-1", "IA-4", "IR-1",
                    "IR-2", "IR-3", "IR-5", "IR-7", "IR-8", "PL-*", "PM-*", "PS-*",
                    "PT-*", "RA-*", "SA-*", "SC-1", "SC-4(App)", "SC-18", "SI-1",
                    "SI-5", "SI-10", "SI-11", "SI-12", "SR-*"
                ]
            },
            "SaaS": {
                "name": "Software as a Service",
                "description": "Cloud provider manages everything; customer manages users and data configuration",
                "examples": ["Microsoft 365", "Salesforce", "ServiceNow", "Workday"],
                "provider_responsible": {
                    "fully": [
                        "PE-*", "SC-7", "SC-8", "CM-2", "CM-6", "CM-7", "SI-2", "SI-3",
                        "SI-4", "CP-6", "CP-7", "CP-9", "MA-*", "MP-*"
                    ],
                    "shared": [
                        "AC-2", "AC-3", "AC-4", "AC-6", "AC-7", "AC-17", "AU-*",
                        "CA-3", "IA-2", "IA-5", "IR-4", "IR-6", "SC-12", "SC-13",
                        "SC-28"
                    ]
                },
                "customer_responsible": [
                    "AC-1", "AC-5", "AC-14", "AT-*", "AU-1", "CA-1", "CA-2", "CA-5",
                    "CA-7", "CM-1", "CP-1", "CP-2", "CP-3", "CP-4", "IA-1", "IA-4",
                    "IA-8", "IR-1", "IR-2", "IR-3", "IR-5", "IR-7", "IR-8", "PL-*",
                    "PM-*", "PS-*", "PT-*", "RA-*", "SA-4(SaaS)", "SA-9", "SC-1",
                    "SI-1", "SI-5", "SI-12", "SR-*"
                ]
            }
        }

    def determine_inheritance(self, control_id: str, system_type: str = "on-premises", cloud_model: str = "") -> str:
        """
        Determine the inheritance status for a specific control based on system type.

        :param control_id: The NIST 800-53 control ID (e.g., AC-2, PE-3, SC-7).
        :param system_type: Type of system - "on-premises", "cloud", or "hybrid".
        :param cloud_model: If cloud/hybrid, specify "IaaS", "PaaS", or "SaaS".
        :return: Inheritance determination with responsibilities breakdown.
        """
        control_id = control_id.upper().strip()
        system_type = system_type.lower().strip()
        cloud_model = cloud_model.upper().strip()

        result = f"## Control Inheritance Analysis: {control_id}\n\n"
        result += f"**System Type:** {system_type.title()}\n"
        if cloud_model:
            result += f"**Cloud Model:** {cloud_model}\n"
        result += "\n---\n\n"

        # Determine inheritance type
        inheritance_type = "System-Specific"
        provider = "System Owner"
        customer_responsibilities = []
        provider_responsibilities = []

        # Check organization common controls
        for pattern_id, pattern in self.common_control_patterns.items():
            if control_id in pattern["controls"]["fully_inherited"]:
                inheritance_type = "Fully Inherited (Common Control)"
                provider = pattern["provider"]
                provider_responsibilities = ["Full implementation and maintenance"]
                customer_responsibilities = ["Ensure common control is documented in SSP", "Verify control effectiveness during assessment"]
                break
            elif control_id in pattern["controls"]["hybrid"]:
                inheritance_type = "Hybrid"
                provider = pattern["provider"]
                provider_responsibilities = ["Partial implementation as common control"]
                customer_responsibilities = ["System-specific implementation", "Integration with common control"]
                break

        # Check cloud inheritance if applicable
        if system_type in ["cloud", "hybrid"] and cloud_model in self.cloud_models:
            cloud = self.cloud_models[cloud_model]

            # Check if fully provider responsibility
            for ctrl in cloud["provider_responsible"]["fully"]:
                if control_id == ctrl or (ctrl.endswith("*") and control_id.startswith(ctrl[:-1])):
                    inheritance_type = f"Inherited from CSP ({cloud_model})"
                    provider = f"Cloud Service Provider ({cloud_model})"
                    provider_responsibilities = ["Full implementation", "Continuous monitoring", "Evidence provision"]
                    customer_responsibilities = ["Verify CSP authorization (FedRAMP)", "Review CSP POA&Ms", "Document inheritance in SSP"]
                    break

            # Check if shared responsibility
            for ctrl in cloud["provider_responsible"]["shared"]:
                if control_id == ctrl or (ctrl.endswith("*") and control_id.startswith(ctrl[:-1])):
                    if inheritance_type == "System-Specific":  # Not already set
                        inheritance_type = f"Shared Responsibility ({cloud_model})"
                        provider = f"Cloud Service Provider ({cloud_model}) + Customer"
                        provider_responsibilities = ["Infrastructure-level implementation", "Platform security features"]
                        customer_responsibilities = ["Configuration and enablement", "Application-level implementation", "Monitoring and response"]
                    break

        result += f"### Inheritance Determination\n\n"
        result += f"**Type:** {inheritance_type}\n\n"
        result += f"**Primary Provider:** {provider}\n\n"

        result += "### Responsibility Matrix\n\n"
        result += "| Responsible Party | Responsibilities |\n"
        result += "|-------------------|------------------|\n"

        if provider_responsibilities:
            result += f"| Provider | {'; '.join(provider_responsibilities)} |\n"
        if customer_responsibilities:
            result += f"| Customer/System Owner | {'; '.join(customer_responsibilities)} |\n"

        result += "\n### SSP Documentation Requirements\n\n"

        if "Fully Inherited" in inheritance_type or "Inherited from CSP" in inheritance_type:
            result += """For **fully inherited** controls:
1. Identify the common control provider
2. Reference the provider's security documentation
3. Document the inheritance relationship
4. Describe how the control is implemented by the provider
5. Note any customer configuration requirements

**Example SSP Language:**
> This control is fully inherited from [Provider Name]. [Provider Name] implements this control as documented in their [Security Plan/FedRAMP Package]. The system owner has verified that the inherited implementation meets the control requirements.
"""
        elif "Hybrid" in inheritance_type or "Shared" in inheritance_type:
            result += """For **hybrid/shared** controls:
1. Clearly delineate provider vs. customer responsibilities
2. Document the inherited portion with provider reference
3. Detail the system-specific implementation
4. Explain how the portions integrate

**Example SSP Language:**
> This control is partially inherited from [Provider Name] and partially implemented at the system level.
>
> **Inherited Portion:** [Provider Name] provides [specific capability]. See [Provider Documentation].
>
> **System-Specific Portion:** The system implements [specific capability] by [implementation details].
"""
        else:
            result += """For **system-specific** controls:
1. Provide complete implementation details
2. Identify responsible parties
3. Document tools and processes used
4. Include evidence references

**Example SSP Language:**
> This control is implemented at the system level. [Detailed implementation description including who, what, when, where, and how].
"""

        return result

    def map_fedramp_inheritance(self, cloud_provider: str, impact_level: str = "moderate") -> str:
        """
        Generate FedRAMP inheritance mapping for a cloud service provider.

        :param cloud_provider: Name or type of CSP (e.g., "AWS", "Azure", "IaaS", "PaaS", "SaaS").
        :param impact_level: FedRAMP impact level - "low", "moderate", or "high".
        :return: Comprehensive inheritance map for FedRAMP authorization.
        """
        cloud_provider = cloud_provider.upper().strip()
        impact_level = impact_level.lower().strip()

        # Determine cloud model
        cloud_model = None
        if cloud_provider in ["IAAS", "AWS EC2", "AZURE VM", "GCP COMPUTE"]:
            cloud_model = "IaaS"
        elif cloud_provider in ["PAAS", "AWS BEANSTALK", "AZURE APP SERVICE", "HEROKU"]:
            cloud_model = "PaaS"
        elif cloud_provider in ["SAAS", "M365", "SALESFORCE", "SERVICENOW"]:
            cloud_model = "SaaS"
        else:
            # Default to IaaS for generic cloud
            cloud_model = "IaaS"

        cloud = self.cloud_models[cloud_model]

        result = f"""## FedRAMP Inheritance Mapping

### Cloud Service Provider Analysis
**Provider Type:** {cloud_provider}
**Service Model:** {cloud_model} - {cloud['name']}
**Target Impact Level:** {impact_level.upper()}

**Description:** {cloud['description']}

**Examples:** {', '.join(cloud['examples'])}

---

### Shared Responsibility Model

"""
        result += "#### CSP Fully Responsible Controls\n"
        result += "*These controls are completely managed by the CSP. Customer inherits them fully.*\n\n"
        result += "```\n"
        result += ", ".join(cloud["provider_responsible"]["fully"])
        result += "\n```\n\n"

        result += "#### Shared Responsibility Controls\n"
        result += "*Both CSP and customer have responsibilities for these controls.*\n\n"
        result += "```\n"
        result += ", ".join(cloud["provider_responsible"]["shared"])
        result += "\n```\n\n"

        result += "#### Customer Fully Responsible Controls\n"
        result += "*Customer must implement these controls; CSP provides no coverage.*\n\n"
        result += "```\n"
        result += ", ".join(cloud["customer_responsible"])
        result += "\n```\n\n"

        result += """---

### FedRAMP Documentation Requirements

#### For Inherited Controls:
1. **Verify CSP FedRAMP Authorization**
   - Confirm CSP has appropriate FedRAMP authorization level
   - Review CSP's FedRAMP Marketplace listing
   - Obtain CSP's Customer Responsibility Matrix (CRM)

2. **Document in SSP**
   - Reference CSP's FedRAMP package ID
   - List specific inherited controls
   - Include CSP contact for security coordination

3. **Continuous Monitoring**
   - Subscribe to CSP security notifications
   - Review CSP's ConMon reports
   - Monitor CSP's POA&M status

#### For Shared Controls:
1. **Obtain CSP Implementation Details**
   - Request CSP's control implementation descriptions
   - Understand configuration options available
   - Identify customer configuration requirements

2. **Document Both Portions**
   - Clearly separate CSP vs. customer responsibilities
   - Document customer-side implementation
   - Reference CSP documentation for their portion

3. **Coordinate Assessment**
   - Determine which portions 3PAO will assess
   - Obtain CSP assessment artifacts
   - Plan customer-side assessment activities

---

### Customer Responsibility Matrix Template

| Control | CSP Responsibility | Customer Responsibility | Evidence Required |
|---------|-------------------|------------------------|-------------------|
| AC-2 | IAM service infrastructure | User provisioning, access reviews | Access review records |
| AU-2 | Logging infrastructure | Log configuration, retention | Logging configuration |
| SC-7 | VPC/network infrastructure | Security group rules, NACLs | Network diagrams |
| SI-4 | Platform monitoring | Application monitoring, alerting | Alert configurations |

"""
        return result

    def list_common_controls(self) -> str:
        """
        List typical common control patterns and providers.

        :return: Overview of common control categories with example controls.
        """
        result = "## Common Control Patterns\n\n"
        result += "*Common controls are security controls whose implementation is shared by multiple systems.*\n\n"

        for pattern_id, pattern in self.common_control_patterns.items():
            result += f"### {pattern['name']}\n\n"
            result += f"**Description:** {pattern['description']}\n\n"
            result += f"**Typical Provider:** {pattern['provider']}\n\n"

            result += "**Fully Inherited Controls:**\n"
            result += f"```\n{', '.join(pattern['controls']['fully_inherited'])}\n```\n\n"

            result += "**Hybrid Controls:**\n"
            result += f"```\n{', '.join(pattern['controls']['hybrid'])}\n```\n\n"
            result += "---\n\n"

        result += """### Benefits of Common Controls

1. **Efficiency** - Implement once, inherit many times
2. **Consistency** - Uniform implementation across systems
3. **Cost Savings** - Shared resources and expertise
4. **Simplified Assessment** - Assess once at provider level

### Documentation Requirements

For each common control provider:
- Maintain a Common Control Provider Plan
- Document control implementation details
- Establish monitoring and reporting procedures
- Define interface with inheriting systems
"""
        return result

    def generate_inheritance_matrix(self, system_name: str, control_list: str, system_type: str = "hybrid", cloud_model: str = "IaaS") -> str:
        """
        Generate a control inheritance matrix for a system.

        :param system_name: Name of the system.
        :param control_list: Comma-separated list of control IDs to analyze (e.g., "AC-2, AU-2, SC-7, PE-3").
        :param system_type: Type of system - "on-premises", "cloud", or "hybrid".
        :param cloud_model: If cloud/hybrid, specify "IaaS", "PaaS", or "SaaS".
        :return: Inheritance matrix for the specified controls.
        """
        controls = [c.strip().upper() for c in control_list.split(',') if c.strip()]
        cloud_model = cloud_model.upper()

        if not controls:
            return "Error: Please provide at least one control ID."

        result = f"""## Control Inheritance Matrix

### System: {system_name}
**System Type:** {system_type.title()}
"""
        if system_type in ["cloud", "hybrid"]:
            result += f"**Cloud Model:** {cloud_model}\n"

        result += "\n---\n\n"
        result += "| Control | Inheritance Type | Provider | Customer Responsibility |\n"
        result += "|---------|-----------------|----------|------------------------|\n"

        summary = {"inherited": 0, "hybrid": 0, "system_specific": 0}

        for control_id in controls:
            inheritance_type = "System-Specific"
            provider = "System Owner"
            customer_resp = "Full implementation"

            # Check organization common controls
            for pattern_id, pattern in self.common_control_patterns.items():
                if control_id in pattern["controls"]["fully_inherited"]:
                    inheritance_type = "Inherited"
                    provider = pattern["provider"].split("/")[0].strip()
                    customer_resp = "Verify & document"
                    summary["inherited"] += 1
                    break
                elif control_id in pattern["controls"]["hybrid"]:
                    inheritance_type = "Hybrid"
                    provider = pattern["provider"].split("/")[0].strip()
                    customer_resp = "System-specific portion"
                    summary["hybrid"] += 1
                    break
            else:
                # Check cloud if applicable
                if system_type in ["cloud", "hybrid"] and cloud_model in self.cloud_models:
                    cloud = self.cloud_models[cloud_model]

                    for ctrl in cloud["provider_responsible"]["fully"]:
                        if control_id == ctrl or (ctrl.endswith("*") and control_id.startswith(ctrl[:-1])):
                            inheritance_type = "CSP Inherited"
                            provider = f"CSP ({cloud_model})"
                            customer_resp = "Verify CSP auth"
                            summary["inherited"] += 1
                            break
                    else:
                        for ctrl in cloud["provider_responsible"]["shared"]:
                            if control_id == ctrl or (ctrl.endswith("*") and control_id.startswith(ctrl[:-1])):
                                inheritance_type = "Shared (CSP)"
                                provider = f"CSP + Customer"
                                customer_resp = "Config & app-level"
                                summary["hybrid"] += 1
                                break
                        else:
                            summary["system_specific"] += 1
                else:
                    summary["system_specific"] += 1

            result += f"| {control_id} | {inheritance_type} | {provider} | {customer_resp} |\n"

        result += f"""
---

### Summary

- **Fully Inherited:** {summary['inherited']} controls
- **Hybrid/Shared:** {summary['hybrid']} controls
- **System-Specific:** {summary['system_specific']} controls
- **Total:** {len(controls)} controls

### Inheritance Percentage
- CSP/Common Control Coverage: {((summary['inherited'] + summary['hybrid']) / len(controls) * 100):.1f}%
- Customer Implementation Required: {(summary['system_specific'] / len(controls) * 100):.1f}%

### Next Steps
1. Document each inheritance relationship in the SSP
2. Obtain evidence from common control providers
3. Implement system-specific controls
4. Coordinate assessment activities with providers
"""
        return result

    def explain_inheritance_types(self) -> str:
        """
        Explain the different types of control inheritance in RMF.

        :return: Detailed explanation of common, hybrid, and system-specific controls.
        """
        return """## Control Inheritance Types in RMF

### Overview
Control inheritance allows organizations to leverage security controls implemented by other entities, reducing redundancy and improving efficiency.

---

### Common Controls (Fully Inherited)

**Definition:** Security controls whose implementation satisfies the control requirements of multiple systems.

**Characteristics:**
- Implemented once by a common control provider
- Multiple systems inherit the implementation
- Provider maintains documentation and evidence
- Provider responsible for continuous monitoring

**Examples:**
- Physical security controls (PE family) from facility management
- Personnel security controls (PS family) from HR
- Security awareness training (AT-2, AT-3) from security office
- Organization-wide policies (XX-1 controls)

**SSP Documentation:**
```
Inheritance: Fully Inherited
Provider: [Common Control Provider Name]
Description: This control is fully inherited from [Provider].
See [Provider's Security Plan] for implementation details.
Customer Responsibility: None (verify effectiveness during assessment)
```

---

### Hybrid Controls

**Definition:** Controls where implementation is shared between a provider and the system.

**Characteristics:**
- Provider implements a portion
- System implements remaining portion
- Both portions must be documented
- Clear delineation of responsibilities required

**Examples:**
- AC-2 (Account Management): Enterprise IAM + system-specific accounts
- AU-6 (Audit Review): SOC monitoring + system-specific log review
- CM-2 (Baseline Configuration): Enterprise standards + system configuration

**SSP Documentation:**
```
Inheritance: Hybrid
Provider: [Common Control Provider Name]

Inherited Portion:
[Provider] provides [specific capability] as documented in [reference].

System-Specific Portion:
The system implements [specific capability] through [implementation details].
```

---

### System-Specific Controls

**Definition:** Controls implemented entirely by and for the specific system.

**Characteristics:**
- No inheritance from external providers
- System owner fully responsible
- Must provide complete implementation details
- Full assessment required

**Examples:**
- Application-specific access controls
- Custom audit logging
- System-specific encryption
- Application security testing

**SSP Documentation:**
```
Inheritance: System-Specific
Responsible Party: [System Owner/Team]

Implementation:
[Complete description of how the control is implemented, including
who, what, when, where, and how. Reference specific tools, processes,
and procedures used.]

Evidence:
[List of artifacts demonstrating implementation]
```

---

### Provider vs. Consumer Responsibilities

| Aspect | Provider | Consumer |
|--------|----------|----------|
| Implementation | Implements the control | Verifies inheritance claim |
| Documentation | Maintains detailed documentation | References provider documentation |
| Assessment | Assessed independently or provides evidence | Ensures inheritance is valid |
| Monitoring | Continuous monitoring of control | Monitors interface points |
| POA&M | Manages findings for their implementation | Reviews provider POA&Ms |
| Updates | Notifies consumers of changes | Incorporates changes as needed |

---

### Best Practices

1. **Document Clearly** - Explicitly state inheritance relationships
2. **Verify Authorization** - Ensure providers have appropriate authority
3. **Maintain Communication** - Establish channels with providers
4. **Review Regularly** - Periodically verify inheritance remains valid
5. **Plan for Changes** - Have contingency if provider changes
"""
