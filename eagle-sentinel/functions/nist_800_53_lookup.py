"""
title: NIST 800-53 Control Lookup
description: Search and retrieve NIST 800-53 Rev. 5 security control details including control statements, supplemental guidance, related controls, and baseline applicability.
author: Eagle Sentinel
version: 1.0.0
requirements:
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Tools:
    """NIST 800-53 Rev. 5 Security Control Lookup Tool"""

    class Valves(BaseModel):
        """Configuration for the tool"""
        pass

    def __init__(self):
        self.valves = self.Valves()
        self._init_control_families()
        self._init_controls_database()

    def _init_control_families(self):
        """Initialize control family metadata"""
        self.control_families = {
            "AC": {"name": "Access Control", "description": "Policies and procedures for system access management"},
            "AT": {"name": "Awareness and Training", "description": "Security awareness and training programs"},
            "AU": {"name": "Audit and Accountability", "description": "Audit logging, review, and protection"},
            "CA": {"name": "Assessment, Authorization, and Monitoring", "description": "Security assessments and continuous monitoring"},
            "CM": {"name": "Configuration Management", "description": "Baseline configurations and change control"},
            "CP": {"name": "Contingency Planning", "description": "Business continuity and disaster recovery"},
            "IA": {"name": "Identification and Authentication", "description": "User and device identity management"},
            "IR": {"name": "Incident Response", "description": "Incident handling and reporting"},
            "MA": {"name": "Maintenance", "description": "System maintenance procedures"},
            "MP": {"name": "Media Protection", "description": "Media handling, storage, and sanitization"},
            "PE": {"name": "Physical and Environmental Protection", "description": "Physical access and environmental controls"},
            "PL": {"name": "Planning", "description": "Security planning and system security plans"},
            "PM": {"name": "Program Management", "description": "Organization-wide security program"},
            "PS": {"name": "Personnel Security", "description": "Personnel screening and termination"},
            "PT": {"name": "PII Processing and Transparency", "description": "Privacy controls for personal information"},
            "RA": {"name": "Risk Assessment", "description": "Risk identification and analysis"},
            "SA": {"name": "System and Services Acquisition", "description": "Secure development and acquisition"},
            "SC": {"name": "System and Communications Protection", "description": "Network and communications security"},
            "SI": {"name": "System and Information Integrity", "description": "Malware protection and system monitoring"},
            "SR": {"name": "Supply Chain Risk Management", "description": "Supply chain security controls"}
        }

    def _init_controls_database(self):
        """Initialize the controls database with commonly used controls"""
        self.controls = {
            # Access Control (AC) Family
            "AC-1": {
                "id": "AC-1",
                "family": "AC",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] access control policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the access control policy and the associated access controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the access control policy and procedures; and c. Review and update the current access control: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Access control policy and procedures address the controls in the AC family that are implemented within systems and organizations. The risk management strategy is an important factor in establishing such policies and procedures. Policies and procedures contribute to security and privacy assurance.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "AC-2": {
                "id": "AC-2",
                "family": "AC",
                "title": "Account Management",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Define and document the types of accounts allowed and specifically prohibited for use within the system; b. Assign account managers; c. Require [Assignment: organization-defined prerequisites and criteria] for group and role membership; d. Specify: 1. Authorized users of the system; 2. Group and role membership; and 3. Access authorizations (i.e., privileges) and [Assignment: organization-defined attributes (as required)] for each account; e. Require approvals by [Assignment: organization-defined personnel or roles] for requests to create accounts; f. Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria]; g. Monitor the use of accounts; h. Notify account managers and [Assignment: organization-defined personnel or roles] within: 1. [Assignment: organization-defined time period] when accounts are no longer required; 2. [Assignment: organization-defined time period] when users are terminated or transferred; and 3. [Assignment: organization-defined time period] when system usage or need-to-know changes for an individual; i. Authorize access to the system based on: 1. A valid access authorization; 2. Intended system usage; and 3. [Assignment: organization-defined attributes (as required)]; j. Review accounts for compliance with account management requirements [Assignment: organization-defined frequency]; k. Establish and implement a process for changing shared or group account authenticators (if deployed) when individuals are removed from the group; and l. Align account management processes with personnel termination and transfer processes.",
                "guidance": "Examples of system account types include individual, shared, group, system, guest, anonymous, emergency, developer, temporary, and service. Identification of authorized system users and the specification of access privileges reflects the requirements in other controls in the security plan.",
                "related": ["AC-3", "AC-5", "AC-6", "AC-17", "AC-18", "AC-20", "AC-24", "AU-2", "AU-12", "CM-5", "IA-2", "IA-4", "IA-5", "IA-8", "MA-3", "MA-5", "PE-2", "PL-4", "PS-2", "PS-4", "PS-5", "PS-7", "PT-2", "PT-3", "SC-7", "SC-12", "SC-13", "SC-37"],
                "enhancements": ["AC-2(1)", "AC-2(2)", "AC-2(3)", "AC-2(4)", "AC-2(5)", "AC-2(6)", "AC-2(7)", "AC-2(8)", "AC-2(9)", "AC-2(11)", "AC-2(12)", "AC-2(13)"]
            },
            "AC-3": {
                "id": "AC-3",
                "family": "AC",
                "title": "Access Enforcement",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.",
                "guidance": "Access control policies control access between active entities or subjects (i.e., users or processes acting on behalf of users) and passive entities or objects (i.e., devices, files, records, domains) in organizational systems. Access enforcement mechanisms can be employed at the application and service level to provide increased information security and privacy.",
                "related": ["AC-2", "AC-4", "AC-5", "AC-6", "AC-16", "AC-17", "AC-18", "AC-19", "AC-20", "AC-21", "AC-22", "AC-24", "AC-25", "AT-2", "AT-3", "AU-9", "CA-9", "CM-5", "CM-11", "IA-2", "IA-5", "IA-6", "IA-7", "IA-11", "MA-3", "MA-4", "MA-5", "MP-4", "PM-2", "PS-3", "PT-2", "PT-3", "SA-17", "SC-2", "SC-3", "SC-4", "SC-12", "SC-13", "SC-28", "SC-31", "SC-34", "SI-4"],
                "enhancements": ["AC-3(1)", "AC-3(2)", "AC-3(3)", "AC-3(4)", "AC-3(5)", "AC-3(7)", "AC-3(8)", "AC-3(9)", "AC-3(10)", "AC-3(11)", "AC-3(12)", "AC-3(13)", "AC-3(14)", "AC-3(15)"]
            },
            "AC-6": {
                "id": "AC-6",
                "family": "AC",
                "title": "Least Privilege",
                "baseline": {"low": False, "moderate": True, "high": True},
                "statement": "Employ the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks.",
                "guidance": "Organizations employ least privilege for specific duties and systems. The principle of least privilege is also applied to system processes, ensuring that the processes have access to systems and operate at privilege levels no higher than necessary to accomplish organizational missions or business functions.",
                "related": ["AC-2", "AC-3", "AC-5", "AC-16", "CM-5", "CM-11", "PL-2", "PM-12", "SA-8", "SA-15", "SA-17", "SC-38"],
                "enhancements": ["AC-6(1)", "AC-6(2)", "AC-6(3)", "AC-6(4)", "AC-6(5)", "AC-6(6)", "AC-6(7)", "AC-6(8)", "AC-6(9)", "AC-6(10)"]
            },
            "AC-7": {
                "id": "AC-7",
                "family": "AC",
                "title": "Unsuccessful Logon Attempts",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Enforce a limit of [Assignment: organization-defined number] consecutive invalid logon attempts by a user during a [Assignment: organization-defined time period]; and b. Automatically [Selection (one or more): lock the account or node for an [Assignment: organization-defined time period]; lock the account or node until released by an administrator; delay next logon prompt per [Assignment: organization-defined delay algorithm]; notify system administrator; take other [Assignment: organization-defined action]] when the maximum number of unsuccessful attempts is exceeded.",
                "guidance": "The need to limit unsuccessful logon attempts and take subsequent action when the maximum number of attempts is exceeded applies regardless of whether the logon occurs via a local or network connection.",
                "related": ["AC-2", "AC-9", "AU-2", "AU-6", "IA-5"],
                "enhancements": ["AC-7(1)", "AC-7(2)", "AC-7(3)", "AC-7(4)"]
            },
            "AC-17": {
                "id": "AC-17",
                "family": "AC",
                "title": "Remote Access",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Establish and document usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed; and b. Authorize each type of remote access to the system prior to allowing such connections.",
                "guidance": "Remote access is access to organizational systems (or processes acting on behalf of users) that communicates through external networks such as the Internet. Types of remote access include dial-up, broadband, and wireless.",
                "related": ["AC-2", "AC-3", "AC-4", "AC-18", "AC-19", "AC-20", "CA-3", "CM-10", "IA-2", "IA-3", "IA-8", "MA-4", "PE-17", "PL-2", "PL-4", "SC-10", "SC-12", "SC-13", "SI-4"],
                "enhancements": ["AC-17(1)", "AC-17(2)", "AC-17(3)", "AC-17(4)", "AC-17(6)", "AC-17(9)", "AC-17(10)"]
            },
            # Audit and Accountability (AU) Family
            "AU-1": {
                "id": "AU-1",
                "family": "AU",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] audit and accountability policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the audit and accountability policy and the associated audit and accountability controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the audit and accountability policy and procedures; and c. Review and update the current audit and accountability: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Audit and accountability policy and procedures address the controls in the AU family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "AU-2": {
                "id": "AU-2",
                "family": "AU",
                "title": "Event Logging",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Identify the types of events that the system is capable of logging in support of the audit function: [Assignment: organization-defined event types that the system is capable of logging]; b. Coordinate the event logging function with other organizational entities requiring audit-related information to guide and inform the selection criteria for events to be logged; c. Specify the following event types for logging within the system: [Assignment: organization-defined event types (subset of the event types defined in AU-2a.) along with the frequency of (or situation requiring) logging for each identified event type]; d. Provide a rationale for why the event types selected for logging are deemed to be adequate to support after-the-fact investigations of incidents; and e. Review and update the event types selected for logging [Assignment: organization-defined frequency].",
                "guidance": "An event is an observable occurrence in a system. The types of events that require logging are those events that are significant and relevant to the security of systems and the privacy of individuals.",
                "related": ["AC-2", "AC-3", "AC-6", "AC-7", "AC-8", "AC-16", "AC-17", "AU-3", "AU-4", "AU-5", "AU-6", "AU-7", "AU-11", "AU-12", "CM-3", "CM-5", "CM-6", "CM-13", "IA-3", "MA-4", "MP-4", "PE-3", "PM-21", "PT-2", "PT-7", "RA-8", "SA-8", "SC-7", "SC-18", "SI-3", "SI-4", "SI-7", "SI-10", "SI-11"],
                "enhancements": ["AU-2(1)"]
            },
            "AU-6": {
                "id": "AU-6",
                "family": "AU",
                "title": "Audit Record Review, Analysis, and Reporting",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity; b. Report findings to [Assignment: organization-defined personnel or roles]; and c. Adjust the level of audit record review, analysis, and reporting within the system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.",
                "guidance": "Audit record review, analysis, and reporting covers information security and privacy-related logging performed by organizations.",
                "related": ["AC-2", "AC-3", "AC-5", "AC-6", "AC-7", "AC-17", "AT-3", "AU-7", "AU-16", "CA-2", "CA-7", "CM-2", "CM-5", "CM-6", "CM-11", "IA-2", "IA-3", "IA-5", "IR-5", "IR-6", "MA-4", "PE-3", "PE-6", "PE-14", "PE-16", "PM-12", "RA-5", "SA-8", "SC-7", "SC-18", "SC-38", "SI-3", "SI-4", "SI-7"],
                "enhancements": ["AU-6(1)", "AU-6(3)", "AU-6(4)", "AU-6(5)", "AU-6(6)", "AU-6(7)", "AU-6(8)", "AU-6(9)", "AU-6(10)"]
            },
            # Configuration Management (CM) Family
            "CM-1": {
                "id": "CM-1",
                "family": "CM",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] configuration management policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the configuration management policy and the associated configuration management controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the configuration management policy and procedures; and c. Review and update the current configuration management: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Configuration management policy and procedures address the controls in the CM family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "CM-2": {
                "id": "CM-2",
                "family": "CM",
                "title": "Baseline Configuration",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and maintain under configuration control, a current baseline configuration of the system; and b. Review and update the baseline configuration of the system: 1. [Assignment: organization-defined frequency]; 2. When required due to [Assignment: organization-defined circumstances]; and 3. When system components are installed or upgraded.",
                "guidance": "Baseline configurations for systems and system components include connectivity, operational, and communications aspects of systems. Baseline configurations are documented, formally reviewed, and agreed-upon specifications for systems or configuration items within those systems.",
                "related": ["AC-19", "AU-6", "CA-9", "CM-1", "CM-3", "CM-5", "CM-6", "CM-8", "CM-9", "CP-9", "CP-10", "CP-12", "MA-2", "PL-8", "PM-5", "SA-8", "SA-10", "SA-15", "SC-18"],
                "enhancements": ["CM-2(1)", "CM-2(2)", "CM-2(3)", "CM-2(6)", "CM-2(7)"]
            },
            "CM-6": {
                "id": "CM-6",
                "family": "CM",
                "title": "Configuration Settings",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Establish and document configuration settings for components employed within the system that reflect the most restrictive mode consistent with operational requirements using [Assignment: organization-defined common secure configurations]; b. Implement the configuration settings; c. Identify, document, and approve any deviations from established configuration settings for [Assignment: organization-defined system components] based on [Assignment: organization-defined operational requirements]; and d. Monitor and control changes to the configuration settings in accordance with organizational policies and procedures.",
                "guidance": "Configuration settings are the parameters that can be changed in the hardware, software, or firmware components of the system that affect the security and privacy posture or functionality of the system.",
                "related": ["AC-3", "AC-19", "AU-2", "AU-6", "CA-9", "CM-2", "CM-3", "CM-5", "CM-7", "CM-11", "CP-7", "CP-9", "CP-10", "IA-5", "PL-8", "PL-9", "RA-5", "SA-4", "SA-5", "SA-8", "SA-9", "SC-18", "SC-28", "SC-43", "SI-2", "SI-4", "SI-6"],
                "enhancements": ["CM-6(1)", "CM-6(2)"]
            },
            # Identification and Authentication (IA) Family
            "IA-1": {
                "id": "IA-1",
                "family": "IA",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] identification and authentication policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the identification and authentication policy and the associated identification and authentication controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the identification and authentication policy and procedures; and c. Review and update the current identification and authentication: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Identification and authentication policy and procedures address the controls in the IA family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "IA-2": {
                "id": "IA-2",
                "family": "IA",
                "title": "Identification and Authentication (Organizational Users)",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users.",
                "guidance": "Organizations can satisfy the identification and authentication requirements by complying with the requirements in HSPD 12. Organizational users include employees or individuals who organizations consider to have an equivalent status to employees.",
                "related": ["AC-2", "AC-3", "AC-4", "AC-14", "AC-17", "AC-18", "AU-1", "AU-6", "IA-4", "IA-5", "IA-8", "MA-4", "MA-5", "PE-2", "PL-4", "SA-4", "SA-8"],
                "enhancements": ["IA-2(1)", "IA-2(2)", "IA-2(5)", "IA-2(6)", "IA-2(8)", "IA-2(12)", "IA-2(13)"]
            },
            "IA-5": {
                "id": "IA-5",
                "family": "IA",
                "title": "Authenticator Management",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "Manage system authenticators by: a. Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, service, or device receiving the authenticator; b. Establishing initial authenticator content for any authenticators issued by the organization; c. Ensuring that authenticators have sufficient strength of mechanism for their intended use; d. Establishing and implementing administrative procedures for initial authenticator distribution, for lost or compromised or damaged authenticators, and for revoking authenticators; e. Changing default authenticators prior to first use; f. Changing or refreshing authenticators [Assignment: organization-defined time period by authenticator type] or when [Assignment: organization-defined events] occur; g. Protecting authenticator content from unauthorized disclosure and modification; h. Requiring individuals to take, and having devices implement, specific controls to protect authenticators; and i. Changing authenticators for group or role accounts when membership to those accounts changes.",
                "guidance": "Authenticators include passwords, cryptographic devices, biometrics, certificates, one-time password devices, and ID badges.",
                "related": ["AC-3", "AC-6", "CM-6", "IA-2", "IA-4", "IA-7", "IA-8", "IA-9", "MA-4", "PE-2", "PL-4", "SC-12", "SC-13"],
                "enhancements": ["IA-5(1)", "IA-5(2)", "IA-5(5)", "IA-5(6)", "IA-5(7)", "IA-5(8)", "IA-5(9)", "IA-5(10)", "IA-5(12)", "IA-5(13)", "IA-5(14)", "IA-5(15)", "IA-5(16)", "IA-5(17)", "IA-5(18)"]
            },
            # System and Communications Protection (SC) Family
            "SC-1": {
                "id": "SC-1",
                "family": "SC",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] system and communications protection policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the system and communications protection policy and the associated system and communications protection controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and communications protection policy and procedures; and c. Review and update the current system and communications protection: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "System and communications protection policy and procedures address the controls in the SC family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "SC-7": {
                "id": "SC-7",
                "family": "SC",
                "title": "Boundary Protection",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Monitor and control communications at the external managed interfaces to the system and at key internal managed interfaces within the system; b. Implement subnetworks for publicly accessible system components that are [Selection: physically; logically] separated from internal organizational networks; and c. Connect to external networks or systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security and privacy architecture.",
                "guidance": "Managed interfaces include gateways, routers, firewalls, guards, network-based malicious code analysis, virtualization systems, or encrypted tunnels implemented within a security architecture.",
                "related": ["AC-4", "AC-17", "AC-18", "AC-19", "AC-20", "AU-13", "CA-3", "CM-2", "CM-4", "CM-7", "CM-10", "CP-8", "IR-4", "MA-4", "PE-3", "PL-8", "PM-12", "SA-8", "SA-17", "SC-5", "SC-8", "SC-18", "SC-32", "SC-35", "SC-38", "SC-43", "SI-4"],
                "enhancements": ["SC-7(3)", "SC-7(4)", "SC-7(5)", "SC-7(7)", "SC-7(8)", "SC-7(9)", "SC-7(10)", "SC-7(11)", "SC-7(12)", "SC-7(13)", "SC-7(14)", "SC-7(15)", "SC-7(16)", "SC-7(17)", "SC-7(18)", "SC-7(19)", "SC-7(20)", "SC-7(21)", "SC-7(22)", "SC-7(23)", "SC-7(24)", "SC-7(25)", "SC-7(26)", "SC-7(27)", "SC-7(28)", "SC-7(29)"]
            },
            "SC-8": {
                "id": "SC-8",
                "family": "SC",
                "title": "Transmission Confidentiality and Integrity",
                "baseline": {"low": False, "moderate": True, "high": True},
                "statement": "Protect the [Selection (one or more): confidentiality; integrity] of transmitted information.",
                "guidance": "Protecting the confidentiality and integrity of transmitted information applies to internal and external networks as well as any system components that can transmit information.",
                "related": ["AC-17", "AC-18", "AU-10", "IA-3", "IA-8", "IA-9", "MA-4", "PE-4", "SA-4", "SA-8", "SC-7", "SC-12", "SC-13", "SC-16", "SC-20", "SC-21", "SC-22", "SC-23", "SC-28"],
                "enhancements": ["SC-8(1)", "SC-8(2)", "SC-8(3)", "SC-8(4)", "SC-8(5)"]
            },
            # System and Information Integrity (SI) Family
            "SI-1": {
                "id": "SI-1",
                "family": "SI",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] system and information integrity policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the system and information integrity policy and the associated system and information integrity controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and information integrity policy and procedures; and c. Review and update the current system and information integrity: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "System and information integrity policy and procedures address the controls in the SI family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "SI-2": {
                "id": "SI-2",
                "family": "SI",
                "title": "Flaw Remediation",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Identify, report, and correct system flaws; b. Test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation; c. Install security-relevant software and firmware updates within [Assignment: organization-defined time period] of the release of the updates; and d. Incorporate flaw remediation into the organizational configuration management process.",
                "guidance": "The need to remediate system flaws applies to all types of software and firmware. Organizations identify systems affected by software flaws, including potential vulnerabilities resulting from those flaws, and report this information to designated organizational personnel with information security and privacy responsibilities.",
                "related": ["CA-5", "CM-3", "CM-4", "CM-5", "CM-6", "CM-8", "IR-4", "MA-2", "RA-5", "SA-8", "SA-10", "SA-11", "SI-3", "SI-5", "SI-7", "SI-11"],
                "enhancements": ["SI-2(1)", "SI-2(2)", "SI-2(3)", "SI-2(4)", "SI-2(5)", "SI-2(6)"]
            },
            "SI-3": {
                "id": "SI-3",
                "family": "SI",
                "title": "Malicious Code Protection",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Implement [Selection (one or more): signature-based; non-signature-based] malicious code protection mechanisms at system entry and exit points to detect and eradicate malicious code; b. Automatically update malicious code protection mechanisms as new releases are available in accordance with organizational configuration management policy and procedures; c. Configure malicious code protection mechanisms to: 1. Perform periodic scans of the system [Assignment: organization-defined frequency] and real-time scans of files from external sources at [Selection (one or more): endpoint; network entry and exit points] as the files are downloaded, opened, or executed in accordance with organizational policy; and 2. [Selection (one or more): block malicious code; quarantine malicious code; take [Assignment: organization-defined action]]; and send alert to [Assignment: organization-defined personnel or roles] in response to malicious code detection; and d. Address the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the system.",
                "guidance": "System entry and exit points include firewalls, remote access servers, workstations, electronic mail servers, web servers, proxy servers, notebook computers, and mobile devices.",
                "related": ["AC-4", "AC-19", "CM-3", "CM-8", "IR-4", "MA-3", "MA-4", "PL-9", "RA-5", "SC-7", "SC-23", "SC-26", "SC-28", "SC-44", "SI-2", "SI-4", "SI-7", "SI-8", "SI-15"],
                "enhancements": ["SI-3(1)", "SI-3(2)", "SI-3(4)", "SI-3(6)", "SI-3(8)", "SI-3(10)"]
            },
            "SI-4": {
                "id": "SI-4",
                "family": "SI",
                "title": "System Monitoring",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Monitor the system to detect: 1. Attacks and indicators of potential attacks in accordance with the following monitoring objectives: [Assignment: organization-defined monitoring objectives]; and 2. Unauthorized local, network, and remote connections; b. Identify unauthorized use of the system through the following techniques and methods: [Assignment: organization-defined techniques and methods]; c. Invoke internal monitoring capabilities or deploy monitoring devices: 1. Strategically within the system to collect organization-determined essential information; and 2. At ad hoc locations within the system to track specific types of transactions of interest to the organization; d. Analyze detected events and anomalies; e. Adjust the level of system monitoring activity when there is a change in risk to organizational operations and assets, individuals, other organizations, or the Nation; f. Obtain legal opinion regarding system monitoring activities; and g. Provide [Assignment: organization-defined system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection (one or more): as needed; [Assignment: organization-defined frequency]].",
                "guidance": "System monitoring includes external and internal monitoring. External monitoring includes the observation of events occurring at external interfaces to the system. Internal monitoring includes the observation of events occurring within the system.",
                "related": ["AC-2", "AC-3", "AC-4", "AC-8", "AC-17", "AU-2", "AU-6", "AU-7", "AU-9", "AU-12", "AU-13", "AU-14", "CA-7", "CM-3", "CM-8", "CM-11", "IA-10", "IR-4", "MA-3", "MA-4", "PE-3", "PE-6", "PM-12", "RA-5", "RA-10", "SC-5", "SC-7", "SC-18", "SC-26", "SC-31", "SC-35", "SC-36", "SC-37", "SC-45", "SI-3", "SI-6", "SI-7", "SR-9", "SR-10"],
                "enhancements": ["SI-4(1)", "SI-4(2)", "SI-4(3)", "SI-4(4)", "SI-4(5)", "SI-4(7)", "SI-4(9)", "SI-4(10)", "SI-4(11)", "SI-4(12)", "SI-4(13)", "SI-4(14)", "SI-4(15)", "SI-4(16)", "SI-4(17)", "SI-4(18)", "SI-4(19)", "SI-4(20)", "SI-4(21)", "SI-4(22)", "SI-4(23)", "SI-4(24)", "SI-4(25)"]
            },
            # Risk Assessment (RA) Family
            "RA-1": {
                "id": "RA-1",
                "family": "RA",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] risk assessment policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the risk assessment policy and the associated risk assessment controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the risk assessment policy and procedures; and c. Review and update the current risk assessment: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Risk assessment policy and procedures address the controls in the RA family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "RA-5": {
                "id": "RA-5",
                "family": "RA",
                "title": "Vulnerability Monitoring and Scanning",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Monitor and scan for vulnerabilities in the system and hosted applications [Assignment: organization-defined frequency and/or randomly in accordance with organization-defined process] and when new vulnerabilities potentially affecting the system are identified and reported; b. Employ vulnerability monitoring tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for: 1. Enumerating platforms, software flaws, and improper configurations; 2. Formatting checklists and test procedures; and 3. Measuring vulnerability impact; c. Analyze vulnerability scan reports and results from vulnerability monitoring; d. Remediate legitimate vulnerabilities [Assignment: organization-defined response times] in accordance with an organizational assessment of risk; e. Share information obtained from the vulnerability monitoring process and control assessments with [Assignment: organization-defined personnel or roles] to help eliminate similar vulnerabilities in other systems; and f. Employ vulnerability monitoring tools that include the capability to readily update the vulnerabilities to be scanned.",
                "guidance": "Security categorization of information and systems guides the frequency and comprehensiveness of vulnerability monitoring (including scans). Organizations determine the required vulnerability monitoring for system components.",
                "related": ["CA-2", "CA-7", "CA-8", "CM-2", "CM-4", "CM-6", "CM-8", "RA-2", "RA-3", "SA-11", "SA-15", "SC-38", "SI-2", "SI-3", "SI-4", "SI-7", "SR-11"],
                "enhancements": ["RA-5(1)", "RA-5(2)", "RA-5(3)", "RA-5(4)", "RA-5(5)", "RA-5(6)", "RA-5(8)", "RA-5(10)", "RA-5(11)"]
            },
            # Incident Response (IR) Family
            "IR-1": {
                "id": "IR-1",
                "family": "IR",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] incident response policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the incident response policy and the associated incident response controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the incident response policy and procedures; and c. Review and update the current incident response: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Incident response policy and procedures address the controls in the IR family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "IR-4": {
                "id": "IR-4",
                "family": "IR",
                "title": "Incident Handling",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Implement an incident handling capability for incidents that is consistent with the incident response plan and includes preparation, detection and analysis, containment, eradication, and recovery; b. Coordinate incident handling activities with contingency planning activities; c. Incorporate lessons learned from ongoing incident handling activities into incident response procedures, training, and testing, and implement the resulting changes accordingly; and d. Ensure the rigor, intensity, scope, and results of incident handling activities are comparable and predictable across the organization.",
                "guidance": "Organizations recognize that incident response capabilities are dependent on the capabilities of organizational systems and the mission and business processes being supported by those systems.",
                "related": ["AC-19", "AU-6", "AU-7", "CM-6", "CP-2", "CP-3", "CP-4", "IR-2", "IR-3", "IR-5", "IR-6", "IR-8", "PE-6", "PL-2", "PM-12", "SA-8", "SC-5", "SC-7", "SI-3", "SI-4", "SI-7"],
                "enhancements": ["IR-4(1)", "IR-4(2)", "IR-4(3)", "IR-4(4)", "IR-4(5)", "IR-4(6)", "IR-4(7)", "IR-4(8)", "IR-4(9)", "IR-4(10)", "IR-4(11)", "IR-4(12)", "IR-4(13)", "IR-4(14)", "IR-4(15)"]
            },
            # Contingency Planning (CP) Family
            "CP-1": {
                "id": "CP-1",
                "family": "CP",
                "title": "Policy and Procedures",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] contingency planning policy that: (a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and (b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and 2. Procedures to facilitate the implementation of the contingency planning policy and the associated contingency planning controls; b. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the contingency planning policy and procedures; and c. Review and update the current contingency planning: 1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and 2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].",
                "guidance": "Contingency planning policy and procedures address the controls in the CP family that are implemented within systems and organizations.",
                "related": ["PM-9", "PS-8", "SI-12"],
                "enhancements": []
            },
            "CP-9": {
                "id": "CP-9",
                "family": "CP",
                "title": "System Backup",
                "baseline": {"low": True, "moderate": True, "high": True},
                "statement": "a. Conduct backups of user-level information contained in [Assignment: organization-defined system components] [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; b. Conduct backups of system-level information contained in the system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; c. Conduct backups of system documentation, including security- and privacy-related documentation [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; and d. Protect the confidentiality, integrity, and availability of backup information.",
                "guidance": "System-level information includes system state information, operating system software, middleware, application software, and licenses. User-level information includes information other than system-level information.",
                "related": ["CP-2", "CP-6", "CP-10", "MP-4", "MP-5", "SC-8", "SC-12", "SC-13", "SI-4", "SI-13"],
                "enhancements": ["CP-9(1)", "CP-9(2)", "CP-9(3)", "CP-9(5)", "CP-9(6)", "CP-9(7)", "CP-9(8)"]
            }
        }

    def get_control(self, control_id: str) -> str:
        """
        Retrieve detailed information about a specific NIST 800-53 security control.

        :param control_id: The control identifier (e.g., AC-2, SI-4, SC-7). Case insensitive.
        :return: Detailed control information including title, statement, guidance, and related controls.
        """
        control_id = control_id.upper().strip()

        if control_id in self.controls:
            control = self.controls[control_id]
            baseline_str = ", ".join([
                f"{level.capitalize()}: {'Yes' if included else 'No'}"
                for level, included in control["baseline"].items()
            ])

            result = f"""## {control['id']} - {control['title']}

**Control Family:** {self.control_families[control['family']]['name']} ({control['family']})

**Baseline Applicability:** {baseline_str}

### Control Statement
{control['statement']}

### Supplemental Guidance
{control['guidance']}

### Related Controls
{', '.join(control['related']) if control['related'] else 'None identified'}

### Control Enhancements
{', '.join(control['enhancements']) if control['enhancements'] else 'None'}
"""
            return result
        else:
            # Try to provide helpful info about the family
            family_code = control_id.split('-')[0] if '-' in control_id else control_id
            if family_code in self.control_families:
                family = self.control_families[family_code]
                available = [cid for cid in self.controls.keys() if cid.startswith(family_code)]
                return f"Control {control_id} not found in database. Family {family_code} ({family['name']}) is valid. Available controls in this family: {', '.join(available) if available else 'None in current database'}. Note: This tool contains a subset of commonly-used controls. For the complete control, refer to NIST SP 800-53 Rev. 5."
            else:
                return f"Control {control_id} not found. Valid control family codes are: {', '.join(self.control_families.keys())}. Control IDs follow the format: FAMILY-NUMBER (e.g., AC-2, SC-7, SI-4)."

    def search_controls(self, keyword: str) -> str:
        """
        Search for NIST 800-53 controls by keyword in titles, statements, or guidance.

        :param keyword: Search term to find in control text. Case insensitive.
        :return: List of matching controls with their IDs and titles.
        """
        keyword = keyword.lower()
        matches = []

        for control_id, control in self.controls.items():
            searchable = f"{control['title']} {control['statement']} {control['guidance']}".lower()
            if keyword in searchable:
                matches.append({
                    "id": control_id,
                    "title": control["title"],
                    "family": self.control_families[control["family"]]["name"]
                })

        if matches:
            result = f"## Controls matching '{keyword}'\n\nFound {len(matches)} matching controls:\n\n"
            for match in sorted(matches, key=lambda x: x["id"]):
                result += f"- **{match['id']}** - {match['title']} ({match['family']})\n"
            result += "\nUse `get_control(control_id)` to get full details for any control."
            return result
        else:
            return f"No controls found matching '{keyword}'. Try broader search terms like 'access', 'audit', 'backup', 'encryption', 'monitoring', or 'authentication'."

    def list_control_family(self, family_code: str) -> str:
        """
        List all controls in a specific NIST 800-53 control family.

        :param family_code: Two-letter family code (e.g., AC, AU, SC, SI). Case insensitive.
        :return: List of controls in the family with baseline applicability.
        """
        family_code = family_code.upper().strip()

        if family_code not in self.control_families:
            return f"Invalid family code '{family_code}'. Valid codes are: {', '.join(sorted(self.control_families.keys()))}"

        family = self.control_families[family_code]
        family_controls = {k: v for k, v in self.controls.items() if v["family"] == family_code}

        result = f"## {family['name']} ({family_code}) Family\n\n"
        result += f"**Description:** {family['description']}\n\n"

        if family_controls:
            result += f"**Controls in database ({len(family_controls)}):**\n\n"
            result += "| Control | Title | Low | Mod | High |\n"
            result += "|---------|-------|-----|-----|------|\n"

            for control_id in sorted(family_controls.keys()):
                control = family_controls[control_id]
                low = "X" if control["baseline"]["low"] else ""
                mod = "X" if control["baseline"]["moderate"] else ""
                high = "X" if control["baseline"]["high"] else ""
                result += f"| {control_id} | {control['title']} | {low} | {mod} | {high} |\n"
        else:
            result += "*No controls from this family in the current database subset.*\n"

        result += f"\nNote: This is a subset of the {family_code} family. NIST SP 800-53 Rev. 5 contains additional controls."
        return result

    def get_baseline(self, impact_level: str) -> str:
        """
        Get all controls required for a specific FIPS 199 impact level baseline.

        :param impact_level: The impact level - 'low', 'moderate', or 'high'. Case insensitive.
        :return: List of required controls organized by family.
        """
        impact_level = impact_level.lower().strip()

        if impact_level not in ["low", "moderate", "high"]:
            return "Invalid impact level. Please specify 'low', 'moderate', or 'high'."

        baseline_controls = {}
        for control_id, control in self.controls.items():
            if control["baseline"].get(impact_level, False):
                family = control["family"]
                if family not in baseline_controls:
                    baseline_controls[family] = []
                baseline_controls[family].append(control_id)

        result = f"## {impact_level.capitalize()} Baseline Controls\n\n"
        result += f"Controls required for {impact_level.upper()} impact systems per NIST SP 800-53B:\n\n"

        total = 0
        for family in sorted(baseline_controls.keys()):
            controls = sorted(baseline_controls[family])
            total += len(controls)
            family_name = self.control_families[family]["name"]
            result += f"### {family_name} ({family})\n"
            result += ", ".join(controls) + "\n\n"

        result += f"**Total controls in database for {impact_level.capitalize()} baseline: {total}**\n\n"
        result += "Note: This represents a subset of commonly-used controls. Refer to NIST SP 800-53B for the complete baseline."
        return result

    def list_families(self) -> str:
        """
        List all NIST 800-53 control families with descriptions.

        :return: Complete list of all 20 control families with their codes and descriptions.
        """
        result = "## NIST 800-53 Rev. 5 Control Families\n\n"
        result += "| Code | Family Name | Description |\n"
        result += "|------|-------------|-------------|\n"

        for code in sorted(self.control_families.keys()):
            family = self.control_families[code]
            result += f"| {code} | {family['name']} | {family['description']} |\n"

        result += f"\n**Total: {len(self.control_families)} control families**"
        return result

    def get_related_controls(self, control_id: str) -> str:
        """
        Get controls that are related to a specific control.

        :param control_id: The control identifier (e.g., AC-2, SI-4). Case insensitive.
        :return: List of related controls with brief descriptions.
        """
        control_id = control_id.upper().strip()

        if control_id not in self.controls:
            return f"Control {control_id} not found in database."

        control = self.controls[control_id]
        related = control["related"]

        if not related:
            return f"No related controls identified for {control_id}."

        result = f"## Controls Related to {control_id} ({control['title']})\n\n"

        for related_id in sorted(related):
            if related_id in self.controls:
                rel_control = self.controls[related_id]
                result += f"- **{related_id}** - {rel_control['title']}\n"
            else:
                family_code = related_id.split('-')[0]
                family_name = self.control_families.get(family_code, {}).get("name", "Unknown")
                result += f"- **{related_id}** - ({family_name} family, not in database)\n"

        result += f"\n**Total related controls: {len(related)}**"
        return result
