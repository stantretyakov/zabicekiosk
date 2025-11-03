# Template Resolution Guide

## Overview

Templates enable dynamic data flow between pipeline steps using `{{step_id.field}}` syntax. Values resolve at workflow execution time, not validation time.

---

## Syntax Reference

### Basic Field Access

Reference any field from a previous step's output.

**Syntax**: `{{step_id.field_name}}`

**Example**:
```yaml
steps:
  - id: "collect_twitter"
    type: "crawler"
    method: "crawler_twitter_profile"
    inputs:
      username:
        from: "alice_crypto"
    outputs:
      profile: "twitter_data"

  - id: "analyze_sentiment"
    type: "ml_model"
    inputs:
      username:
        from: "{{collect_twitter.username}}"  # Resolves to "alice_crypto"
    depends_on: ["collect_twitter"]
```

**Result**: `username` receives the string `"alice_crypto"`

---

### Array Splat Operator

Extract a specific field from all items in an array.

**Syntax**: `{{step_id.array_field[*].nested_field}}`

**Example**:
```yaml
steps:
  - id: "collect_twitter"
    outputs:
      # Returns: {
      #   "username": "alice_crypto",
      #   "recent_posts": [
      #     {"post_id": "p1", "text": "First tweet"},
      #     {"post_id": "p2", "text": "Second tweet"}
      #   ]
      # }

  - id: "analyze_sentiment"
    inputs:
      texts:
        from: "{{collect_twitter.recent_posts[*].text}}"  # Extract "text" from each post
    depends_on: ["collect_twitter"]
```

**Result**: `texts` receives the list `["First tweet", "Second tweet"]`

---

### Nested Path Navigation

Access fields in nested objects using dot notation.

**Syntax**: `{{step_id.nested.object.field}}`

**Example**:
```yaml
steps:
  - id: "collect_profile"
    outputs:
      # Returns: {
      #   "profile": {
      #     "settings": {
      #       "privacy": "public"
      #     }
      #   }
      # }

  - id: "check_privacy"
    inputs:
      privacy_level:
        from: "{{collect_profile.profile.settings.privacy}}"  # Navigate nested path
    depends_on: ["collect_profile"]
```

**Result**: `privacy_level` receives the string `"public"`

---

### Recursive Resolution

Templates resolve recursively in lists and dictionaries.

#### In Lists

**Example**:
```yaml
inputs:
  images:
    from: ["{{step1.image_url}}", "{{step2.image_url}}"]  # List with templates
```

**Result**: Both templates resolve, returning list of URLs

#### In Dictionaries

**Example**:
```yaml
inputs:
  config:
    from:
      username: "{{step1.username}}"
      api_key: "{{step2.key}}"
```

**Result**: Both template values resolve within the dictionary

---

## Common Patterns

### Pattern 1: Chaining Steps

Pass output from one step as input to the next.

```yaml
steps:
  - id: "fetch_user"
    outputs:
      user_id: "user_data"

  - id: "fetch_posts"
    inputs:
      user_id:
        from: "{{fetch_user.user_id}}"
    depends_on: ["fetch_user"]

  - id: "analyze_posts"
    inputs:
      post_texts:
        from: "{{fetch_posts.posts[*].text}}"
    depends_on: ["fetch_posts"]
```

---

### Pattern 2: Extracting from Multiple Sources

Combine data from different steps.

```yaml
steps:
  - id: "collect_twitter"
  - id: "collect_facebook"
  - id: "analyze_combined"
    inputs:
      twitter_texts:
        from: "{{collect_twitter.posts[*].text}}"
      facebook_texts:
        from: "{{collect_facebook.posts[*].content}}"
    depends_on: ["collect_twitter", "collect_facebook"]
```

---

### Pattern 3: ML Model Inputs

Extract text for sentiment/NER analysis.

```yaml
steps:
  - id: "crawl_social"
    outputs:
      # Returns array of posts with metadata

  - id: "sentiment_analysis"
    type: "ml_model"
    model: "sentiment_analysis_v1"
    inputs:
      texts:
        from: "{{crawl_social.posts[*].text}}"  # Extract only text field
    depends_on: ["crawl_social"]
```

---

### Pattern 4: Face Recognition

Pass image URLs to ML models.

```yaml
steps:
  - id: "collect_profile"
    outputs:
      profile_picture: "https://example.com/image.jpg"

  - id: "recognize_faces"
    type: "ml_model"
    model: "face_recognition_v3"
    inputs:
      images:
        from: ["{{collect_profile.profile_picture}}"]  # List of image URLs
    depends_on: ["collect_profile"]
```

**Note**: Face recognition expects `List[str]`, so wrap single URL in list.

---

### Pattern 5: Email Breach Lookup

Pass static or dynamic email addresses.

```yaml
steps:
  - id: "extract_email"
    outputs:
      email: "user@example.com"

  - id: "check_breaches"
    type: "function"
    method: "breach_db_lookup"
    inputs:
      email:
        from: "{{extract_email.email}}"
    depends_on: ["extract_email"]
```

---

## Resolution Rules

| Rule | Description |
|------|-------------|
| **Execution time** | Templates resolve when workflow executes, not at validation |
| **Dependencies** | Step must complete before its outputs can be referenced (use `depends_on`) |
| **Type preservation** | Resolved values keep original types (string, number, boolean, array, object) |
| **Missing fields** | Return `null` or raise error depending on configuration |
| **Recursive** | Templates in lists/dicts resolve automatically |

---

## Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Step 'X' not found in previous results` | Step hasn't executed yet OR typo in step ID | Add `depends_on: ["X"]` or fix step ID |
| `Field 'Y' not found in step 'X' output` | Field doesn't exist OR typo | Check step output schema, fix field name |
| `Cannot apply [*] to non-array` | Used `[*]` on non-array field | Remove `[*]` or fix field path |
| `Template syntax error` | Malformed template (missing `}}`, etc.) | Check template syntax |
| `Circular dependency detected` | Step A depends on B, B depends on A | Restructure pipeline dependencies |

---

## Troubleshooting

### Issue: Template not resolving

**Symptom**:
```json
{
  "error": "Step 'collect_twitter' not found in previous results",
  "available_steps": []
}
```

**Causes**:
1. Missing `depends_on` declaration
2. Step hasn't executed yet
3. Typo in step ID

**Solution**:
```yaml
# Add depends_on to ensure execution order
steps:
  - id: "collect_twitter"
    # ...

  - id: "analyze"
    inputs:
      data:
        from: "{{collect_twitter.field}}"
    depends_on: ["collect_twitter"]  # ← REQUIRED
```

---

### Issue: Wrong field path

**Symptom**:
```json
{
  "error": "Field 'profile.recent_posts' not found",
  "step": "collect_twitter"
}
```

**Cause**: Field path doesn't match actual output structure.

**Solution**:
```bash
# 1. Check step output schema
curl http://localhost:18090/api/v1/methods/crawler_twitter_profile | jq '.output_schema'

# 2. Verify actual output structure
# Check Temporal UI for step execution results

# 3. Fix template path
# If output is: {"recent_posts": [...]}
# Use: "{{collect_twitter.recent_posts}}"
# NOT: "{{collect_twitter.profile.recent_posts}}"
```

---

### Issue: Array splat not working

**Symptom**: Receives array of objects instead of array of strings.

**Example**:
```yaml
# Wrong: Missing [*]
from: "{{collect_twitter.recent_posts}}"
# Result: [{"text": "..."}, {"text": "..."}]

# Correct: With [*]
from: "{{collect_twitter.recent_posts[*].text}}"
# Result: ["...", "..."]
```

---

### Issue: Type mismatch

**Symptom**:
```json
{
  "error": "Expected List[str] but received str"
}
```

**Cause**: ML model expects list but template resolves to single value.

**Solution**:
```yaml
# Wrong: Single string
inputs:
  images:
    from: "{{step.profile_picture}}"  # Returns: "https://..."

# Correct: List with one string
inputs:
  images:
    from: ["{{step.profile_picture}}"]  # Returns: ["https://..."]
```

---

## Implementation Details

**Files**:
- Workflow: `services/execution/workflows/pipeline_workflow.py`
- Unit tests: `tests/unit/workflows/test_template_resolution.py`

**Methods**:
- `resolve_inputs()`: Processes `from:` syntax
- `_resolve_template_value()`: Recursively resolves templates in any data structure
- `_resolve_template_path()`: Navigates dot notation paths
- `_navigate_segment()`: Handles array splat operator `[*]`

**Test coverage**: 46 unit tests covering all syntax patterns and edge cases.

---

## Limitations

| Limitation | Description | Workaround |
|------------|-------------|------------|
| **No computed expressions** | Cannot use `{{step.count + 1}}` | Add explicit transformation step |
| **No conditionals** | Cannot use `{{step.field if condition}}` | Use separate validation step |
| **No filters** | Jinja2-style `| filter()` not supported | Add explicit filter step |
| **No loops** | Cannot iterate with `{{loop.*}}` | Use explicit loop construct in YAML |

---

## See Also

- [YAML DSL Specification](../architecture/execution-platform.md#yaml-workflow-specification)
- [Pipeline Examples](../../examples/pipelines/)
- [Troubleshooting Guide](../troubleshooting.md)
- [Testing Documentation](../development/testing.md)
