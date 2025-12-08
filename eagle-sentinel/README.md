# Eagle Sentinel - RMF AI Platform

Custom configurations and tools for Eagle Sentinel's RMF consulting platform built on Open WebUI.

## Directory Structure

```
eagle-sentinel/
├── models/                           # Custom model presets (AI assistants)
│   ├── rmf-expert.json               # RMF Expert model configuration
│   └── rmf-expert-system-prompt.txt  # System prompt for manual setup
├── prompts/                          # Reusable prompt templates
│   └── rmf-prompts.json              # 8 RMF-focused prompt templates
├── functions/                        # Custom Python tools
│   ├── nist_800_53_lookup.py         # NIST 800-53 control lookup tool
│   ├── fips_199_calculator.py        # FIPS 199 categorization calculator
│   ├── control_inheritance_mapper.py # Control inheritance mapping tool
│   ├── business_operations.py        # Internal business operations tool
│   ├── engagement_manager.py         # RMF engagement management tool
│   └── compliance_reports.py         # Compliance report generator
└── knowledge/                        # Knowledge base documentation
    ├── README.md                     # Guide for setting up knowledge bases
    └── market_positioning.md         # Competitive analysis & positioning
```

## Setup Instructions

### 1. Import RMF Expert Model

The RMF Expert is a model preset that provides expert guidance on NIST RMF compliance.

**To import via UI:**
1. Log in as admin
2. Go to **Workspace** > **Models**
3. Click the **Import** button (download icon)
4. Select `eagle-sentinel/models/rmf-expert.json`
5. After import, edit the model to set your preferred **Base Model** (e.g., GPT-4, Claude, Llama)

**To import via API:**
```bash
curl -X POST http://localhost:3000/api/v1/models/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @eagle-sentinel/models/rmf-expert.json
```

### 2. Import RMF Prompts

The prompt templates provide quick access to common RMF tasks.

**To import via UI:**
1. Go to **Workspace** > **Prompts**
2. Click the **Import** button
3. Select `eagle-sentinel/prompts/rmf-prompts.json`

**Available prompts after import:**
- `/rmf` - Quick RMF assistance
- `/categorize` - FIPS 199 categorization helper
- `/control` - NIST 800-53 control explainer
- `/ssp-review` - SSP implementation reviewer
- `/poam` - POA&M entry generator
- `/inheritance` - Control inheritance mapper
- `/baseline` - Control baseline generator
- `/assessment` - Assessment preparation helper

### 3. Configure Base Model

After importing the RMF Expert model, you must select a base model:

1. Go to **Workspace** > **Models**
2. Click on **RMF Expert**
3. In the **Base Model** dropdown, select your preferred LLM:
   - For best results: GPT-4o, Claude 3.5 Sonnet, or similar
   - For local: Llama 3.1 70B or Mixtral 8x22B
4. Click **Save & Update**

## Usage

### Using RMF Expert Model

1. Start a new chat
2. Select **RMF Expert** from the model dropdown
3. The assistant will have the RMF system prompt and suggested prompts ready

### Using Prompt Templates

1. In any chat, type `/` followed by the command
2. Example: Type `/control` to get the control explainer template
3. Fill in the template variables (shown as `{{variable}}`)
4. Send the message

## RMF Expert Capabilities

The RMF Expert assistant specializes in:

- **NIST RMF Steps**: Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor
- **Key Publications**: SP 800-37, 800-53, 800-53A, 800-60, FIPS 199/200
- **Document Review**: SSP, POA&M, SAR, authorization packages
- **Control Analysis**: Baselines, inheritance, tailoring
- **Assessment Prep**: Evidence gathering, interview preparation
- **FedRAMP/CMMC**: Federal and DoD compliance requirements

## Installed Components

### AI Tools (Workspace > Tools)

#### RMF Compliance Tools

| Tool | Description | Functions |
|------|-------------|-----------|
| **NIST 800-53 Control Lookup** | Query NIST 800-53 Rev. 5 security controls | `get_control`, `search_controls`, `list_control_family`, `get_baseline`, `list_families`, `get_related_controls` |
| **FIPS 199 Calculator** | Calculate system security categorization | `calculate_categorization`, `list_information_types`, `get_information_type`, `explain_impact_levels`, `compare_baselines` |
| **Control Inheritance Mapper** | Map control inheritance relationships | `determine_inheritance`, `map_fedramp_inheritance`, `list_common_controls`, `generate_inheritance_matrix`, `explain_inheritance_types` |

#### Engagement & Delivery Tools

| Tool | Description | Functions |
|------|-------------|-----------|
| **RMF Engagement Manager** | Manage consulting engagements and deliverables | `generate_onboarding_checklist`, `generate_authorization_checklist`, `generate_evidence_checklist`, `create_poam_entry`, `generate_weekly_status`, `list_evidence_families` |
| **Compliance Report Generator** | Generate RMF reports and deliverables | `generate_executive_summary`, `generate_finding_report`, `generate_control_status_report`, `generate_risk_summary`, `list_report_types` |

#### Business Operations Tools

| Tool | Description | Functions |
|------|-------------|-----------|
| **Eagle Sentinel Business Operations** | Internal business and billing tools | `generate_proposal_estimate`, `list_services`, `calculate_billable_hours`, `create_project_status`, `generate_invoice_summary`, `meeting_notes_template` |

### Knowledge Bases (Workspace > Knowledge)

#### RMF & Compliance Knowledge

| Knowledge Base | Purpose |
|----------------|---------|
| **NIST RMF Core Publications** | SP 800-37, 800-53, 800-53A/B, FIPS 199/200 |
| **NIST Supporting Guidelines** | SP 800-30, 800-60, 800-137, 800-128 |
| **FedRAMP Documentation** | FedRAMP SAF, templates, guidance |
| **Client Project Documents** | Client SSPs, POA&Ms, authorization packages |
| **Eagle Sentinel Templates** | Internal templates and procedures |

#### Internal Business Knowledge

| Knowledge Base | Purpose |
|----------------|---------|
| **Eagle Sentinel SOPs** | Standard operating procedures, methodologies |
| **Training & Onboarding** | New employee resources, training materials |
| **Sales & Marketing** | Proposals, case studies, competitive analysis |
| **Contracts & Legal** | Contract templates, NDA, MSA |
| **Meeting Notes & Decisions** | Internal meeting records, decisions |

### User Groups (Admin > Users > Groups)

| Group | Description | Permissions |
|-------|-------------|-------------|
| **Founders** | Founding partners | Full admin access |
| **RMF Consultants** | Consulting team | Models, knowledge, prompts |
| **Security Assessors** | Independent assessors | Knowledge, prompts only |
| **Client Users** | External clients | Limited chat access |

### AI Model Presets (Workspace > Models)

| Model | Purpose | Recommended Base |
|-------|---------|------------------|
| **RMF Expert** | NIST RMF compliance guidance | GPT-4o, Claude 3.5 |
| **Business Assistant** | Internal operations, proposals, billing | GPT-4o, Claude 3.5 |

### Prompt Templates (Workspace > Prompts)

- `/rmf` - Quick RMF assistance
- `/categorize` - FIPS 199 categorization helper
- `/control` - NIST 800-53 control explainer
- `/ssp-review` - SSP implementation reviewer
- `/poam` - POA&M entry generator
- `/inheritance` - Control inheritance mapper
- `/baseline` - Control baseline generator
- `/assessment` - Assessment preparation helper

## Tool Usage Examples

### RMF Engagement Manager

```
# Generate client onboarding checklist
generate_onboarding_checklist(
    client_name="ACME Corp",
    project_name="Cloud Portal ATO",
    service_type="Full SSP Development",
    start_date="2024-12-15",
    project_lead="John Smith"
)

# Generate evidence checklist for specific control families
generate_evidence_checklist(
    system_name="ACME Cloud Portal",
    control_families="AC, AU, SC, SI",
    impact_level="Moderate"
)

# Create POA&M entry
create_poam_entry(
    finding_id="2024-001",
    control_id="AC-2",
    weakness_description="User accounts not disabled within 24 hours of termination",
    risk_level="High",
    remediation_plan="Implement automated account disablement via HR integration",
    responsible_party="IT Security Manager",
    due_date="2025-02-15"
)
```

### Compliance Report Generator

```
# Generate executive summary
generate_executive_summary(
    client_name="ACME Corp",
    system_name="Enterprise Portal",
    assessment_type="Initial",
    impact_level="Moderate",
    total_findings=15,
    high_findings=2,
    moderate_findings=8,
    low_findings=5,
    key_strengths="Strong access control;Good documentation",
    key_weaknesses="Patch management gaps;Incomplete logging",
    recommendation="Authorize with Conditions"
)

# Generate detailed finding report
generate_finding_report(
    finding_id="2024-001",
    control_id="AC-2",
    control_title="Account Management",
    finding_type="configuration",
    risk_level="High",
    description="User accounts not disabled timely",
    evidence="5 accounts active 30+ days post-termination",
    root_cause="No automated HR-IT integration",
    recommendation="Implement automated account lifecycle management"
)
```

### Business Operations

```
# Generate proposal estimate
generate_proposal_estimate(
    client_name="New Client Inc",
    service_type="ssp_development",
    impact_level="Moderate",
    complexity="Standard"
)

# Calculate billable hours
calculate_billable_hours(
    start_time="2024-12-01 09:00",
    end_time="2024-12-01 17:30",
    breaks_minutes=60,
    rate_type="senior"
)
```

## Next Steps

1. **Upload NIST Documents** - Go to Knowledge bases and upload PDF versions of NIST publications
2. **Add Team Members** - Create user accounts and assign to appropriate groups
3. **Configure Base Model** - Edit RMF Expert and select your preferred LLM (GPT-4, Claude, etc.)
4. **Enable Tools** - Edit RMF Expert model and enable relevant tools
5. **Link Knowledge Bases** - Connect NIST knowledge bases to RMF Expert model
6. **Customize Pricing** - Update business_operations.py with your actual rates and services
7. **Add Company Content** - Upload SOPs, templates, and case studies to knowledge bases
