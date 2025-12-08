# Eagle Sentinel Knowledge Bases

This directory contains guidance for setting up and using knowledge bases for RMF consulting.

## Pre-Created Knowledge Bases

The following knowledge bases have been created in Eagle Sentinel:

### 1. NIST RMF Core Publications
**Purpose:** Essential NIST RMF publications for security control implementation and assessment.

**Recommended Documents to Upload:**
- NIST SP 800-37 Rev. 2 - Risk Management Framework
- NIST SP 800-53 Rev. 5 - Security and Privacy Controls
- NIST SP 800-53A Rev. 5 - Assessing Security and Privacy Controls
- NIST SP 800-53B - Control Baselines
- FIPS 199 - Security Categorization
- FIPS 200 - Minimum Security Requirements

**Download Links:**
- https://csrc.nist.gov/publications/detail/sp/800-37/rev-2/final
- https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- https://csrc.nist.gov/publications/detail/sp/800-53a/rev-5/final
- https://csrc.nist.gov/publications/detail/sp/800-53b/final
- https://csrc.nist.gov/publications/detail/fips/199/final
- https://csrc.nist.gov/publications/detail/fips/200/final

### 2. NIST Supporting Guidelines
**Purpose:** Additional NIST publications supporting the RMF process.

**Recommended Documents:**
- NIST SP 800-30 Rev. 1 - Risk Assessment Guide
- NIST SP 800-60 Vol. 1 & 2 - Information Type Mapping
- NIST SP 800-137 - Continuous Monitoring
- NIST SP 800-128 - Configuration Management
- NIST SP 800-137A - Continuous Monitoring Assessment
- NIST SP 800-171 Rev. 2 - Protecting CUI
- NIST SP 800-172 - Enhanced Security for CUI

### 3. FedRAMP Documentation
**Purpose:** FedRAMP-specific guidance and templates.

**Recommended Documents:**
- FedRAMP Security Assessment Framework (SAF)
- FedRAMP SSP Template
- FedRAMP SAR Template
- FedRAMP POA&M Template
- FedRAMP Authorization Boundary Guidance
- FedRAMP Continuous Monitoring Strategy Guide

**Download from:** https://www.fedramp.gov/documents-templates/

### 4. Client Project Documents
**Purpose:** Client-specific documentation (SSPs, POA&Ms, SARs).

**Usage:**
- Create subfolders per client/project
- Upload client SSPs for AI-assisted review
- Store authorization packages
- Keep POA&M tracking documents

**Access Control:** Consider restricting to specific team members per project.

### 5. Eagle Sentinel Templates
**Purpose:** Internal templates and best practices.

**Suggested Content:**
- SSP template (customized for Eagle Sentinel)
- Control implementation statement templates
- Assessment checklist templates
- Client onboarding documentation
- Standard operating procedures

## How to Upload Documents

### Via Web UI:
1. Go to **Workspace** > **Knowledge**
2. Click on the knowledge base you want to add documents to
3. Click **Add Files** or drag and drop PDF/document files
4. Wait for processing to complete (status shows "completed")

### Best Practices for Document Upload:
1. **Use PDF format** - Best text extraction
2. **Clean documents** - Remove scanned images where possible; use OCR'd versions
3. **Split large documents** - Break 500+ page documents into sections
4. **Verify indexing** - After upload, test with a query to confirm retrieval works

## Connecting Knowledge Bases to Models

### Link to RMF Expert:
1. Go to **Workspace** > **Models**
2. Edit **RMF Expert**
3. Scroll to **Knowledge** section
4. Select the knowledge bases to enable:
   - NIST RMF Core Publications
   - NIST Supporting Guidelines
5. Save the model

### Create Specialized Models:
You can create additional model variants with specific knowledge:

**FedRAMP Specialist:**
- Base: Your preferred LLM
- Knowledge: NIST Core + FedRAMP Documentation
- System Prompt: Focus on FedRAMP authorization process

**Client Project Assistant:**
- Base: Your preferred LLM
- Knowledge: Client Project Documents (specific client)
- System Prompt: Focus on that client's system

## RAG Configuration

For optimal retrieval of compliance documents, consider these settings:

### Recommended Settings (Admin > Settings > Documents):
```
Chunk Size: 1500
Chunk Overlap: 300
Text Splitter: Recursive Character (default)
Top K Results: 5
Enable Hybrid Search: Yes (if available)
```

### Why These Settings:
- **Larger chunks** preserve control definitions and guidance together
- **More overlap** maintains context between control sections
- **Top K of 5** balances relevance with context length
- **Hybrid search** improves keyword matching for control IDs (AC-2, SC-7, etc.)

## Querying Knowledge Bases

Once documents are uploaded and linked to models, you can ask:

**Direct Control Queries:**
- "What does NIST say about AC-2 Account Management?"
- "Show me the assessment procedures for SC-7"
- "What are the FedRAMP requirements for continuous monitoring?"

**Implementation Guidance:**
- "How should I implement AU-6 for a cloud system?"
- "What evidence is needed for IA-2 assessment?"

**Document Analysis:**
- Upload a client's SSP: "Review this SSP for AC-2 compliance"
- "Compare this implementation statement to NIST requirements"

## Maintenance

### Regular Updates:
- Re-upload documents when NIST releases updates
- Remove outdated versions
- Review and clean up client documents periodically

### Reindexing:
If retrieval quality degrades:
1. Go to **Admin** > **Settings** > **Documents**
2. Click **Reindex** to rebuild the vector database
