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
│   └── control_inheritance_mapper.py # Control inheritance mapping tool
└── knowledge/                        # Knowledge base documentation
    └── README.md                     # Guide for setting up knowledge bases
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

| Tool | Description | Functions |
|------|-------------|-----------|
| **NIST 800-53 Control Lookup** | Query NIST 800-53 Rev. 5 security controls | `get_control`, `search_controls`, `list_control_family`, `get_baseline`, `list_families`, `get_related_controls` |
| **FIPS 199 Calculator** | Calculate system security categorization | `calculate_categorization`, `list_information_types`, `get_information_type`, `explain_impact_levels`, `compare_baselines` |
| **Control Inheritance Mapper** | Map control inheritance relationships | `determine_inheritance`, `map_fedramp_inheritance`, `list_common_controls`, `generate_inheritance_matrix`, `explain_inheritance_types` |

### Knowledge Bases (Workspace > Knowledge)

| Knowledge Base | Purpose |
|----------------|---------|
| **NIST RMF Core Publications** | SP 800-37, 800-53, 800-53A/B, FIPS 199/200 |
| **NIST Supporting Guidelines** | SP 800-30, 800-60, 800-137, 800-128 |
| **FedRAMP Documentation** | FedRAMP SAF, templates, guidance |
| **Client Project Documents** | Client SSPs, POA&Ms, authorization packages |
| **Eagle Sentinel Templates** | Internal templates and procedures |

### User Groups (Admin > Users > Groups)

| Group | Description | Permissions |
|-------|-------------|-------------|
| **Founders** | Founding partners | Full admin access |
| **RMF Consultants** | Consulting team | Models, knowledge, prompts |
| **Security Assessors** | Independent assessors | Knowledge, prompts only |
| **Client Users** | External clients | Limited chat access |

### Prompt Templates (Workspace > Prompts)

- `/rmf` - Quick RMF assistance
- `/categorize` - FIPS 199 categorization helper
- `/control` - NIST 800-53 control explainer
- `/ssp-review` - SSP implementation reviewer
- `/poam` - POA&M entry generator
- `/inheritance` - Control inheritance mapper
- `/baseline` - Control baseline generator
- `/assessment` - Assessment preparation helper

## Next Steps

1. **Upload NIST Documents** - Go to Knowledge bases and upload PDF versions of NIST publications
2. **Add Team Members** - Create user accounts and assign to appropriate groups
3. **Configure Base Model** - Edit RMF Expert and select your preferred LLM (GPT-4, Claude, etc.)
4. **Enable Tools** - Edit RMF Expert model and enable all three tools
5. **Link Knowledge Bases** - Connect NIST knowledge bases to RMF Expert model
