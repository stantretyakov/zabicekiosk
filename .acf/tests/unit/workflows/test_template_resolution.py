"""
Unit tests for template resolution in PipelineWorkflow

Tests the resolve_inputs() method which handles template variable resolution
with syntax like {{step.field[*].nested}}.
"""

import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# Add services/execution to path for imports
EXECUTION_PATH = os.path.join(
    os.path.dirname(__file__), "../../../services/execution"
)
sys.path.insert(0, EXECUTION_PATH)


# Create mock workflow module with proper decorators
class MockLogger:
    """Mock logger"""
    @staticmethod
    def info(*args, **kwargs):
        pass

    @staticmethod
    def debug(*args, **kwargs):
        pass

    @staticmethod
    def error(*args, **kwargs):
        pass

    @staticmethod
    def warning(*args, **kwargs):
        pass


class MockUnsafe:
    """Mock unsafe context"""
    class imports_passed_through:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass


def mock_defn(cls):
    """Mock workflow.defn decorator - returns class unchanged"""
    return cls


class MockRun:
    """Mock workflow.run decorator - returns method unchanged"""
    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)


# Create mock workflow module
class MockWorkflowModule:
    """Mock temporalio.workflow module"""
    unsafe = MockUnsafe()
    logger = MockLogger()
    defn = staticmethod(mock_defn)
    run = MockRun

    @staticmethod
    async def execute_activity(*args, **kwargs):
        return {"status": "mocked"}


# Create complete mock modules
class MockCommon:
    """Mock temporalio.common module"""
    class RetryPolicy:
        def __init__(self, **kwargs):
            self.kwargs = kwargs


class MockTemporalio:
    """Mock temporalio module"""
    workflow = MockWorkflowModule
    common = MockCommon


# Mock the temporalio modules BEFORE import
sys.modules["temporalio"] = MockTemporalio
sys.modules["temporalio.workflow"] = MockWorkflowModule
sys.modules["temporalio.common"] = MockCommon

# Mock activity modules
mock_activities = MagicMock()
sys.modules["activities"] = mock_activities
sys.modules["activities.crawler_activities"] = mock_activities
sys.modules["activities.ml_activities"] = mock_activities
sys.modules["activities.function_activities"] = mock_activities
sys.modules["activities.event_activities"] = mock_activities

# Now import the workflow - it will use our mocks
from workflows.pipeline_workflow import PipelineWorkflow


@pytest.fixture
def workflow():
    """Create a PipelineWorkflow instance for testing"""
    return PipelineWorkflow()


@pytest.fixture
def sample_twitter_result():
    """Sample Twitter crawler result for testing"""
    return {
        "username": "alice_crypto",
        "profile": {
            "bio": "Crypto enthusiast and blockchain developer",
            "followers": 1523,
            "location": "San Francisco",
        },
        "recent_posts": [
            {"post_id": "p1", "text": "First tweet about crypto", "likes": 42},
            {"post_id": "p2", "text": "Second tweet about NFTs", "likes": 38},
            {"post_id": "p3", "text": "Third tweet about DeFi", "likes": 55},
        ],
    }


@pytest.fixture
def sample_ml_result():
    """Sample ML model result for testing"""
    return {
        "faces": [
            {"face_id": "f1", "confidence": 0.95, "bbox": [10, 20, 100, 120]},
            {"face_id": "f2", "confidence": 0.87, "bbox": [150, 30, 200, 130]},
        ],
        "model_version": "v1.2.3",
    }


# 1. Basic Template Resolution
@pytest.mark.unit
def test_basic_field_resolution(workflow, sample_twitter_result):
    """Test {{step.field}} resolves to step's field value"""
    inputs = {"text": {"from": "{{twitter.username}}"}}
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"text": "alice_crypto"}


# 2. Nested Field Access
@pytest.mark.unit
def test_nested_field_resolution(workflow, sample_twitter_result):
    """Test {{step.a.b.c}} resolves nested paths"""
    inputs = {"bio": {"from": "{{twitter.profile.bio}}"}}
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"bio": "Crypto enthusiast and blockchain developer"}


@pytest.mark.unit
def test_deep_nested_field_resolution(workflow, sample_twitter_result):
    """Test multiple levels of nesting"""
    inputs = {
        "location": {"from": "{{twitter.profile.location}}"},
        "followers": {"from": "{{twitter.profile.followers}}"},
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"location": "San Francisco", "followers": 1523}


# 3. Array Extraction with [*]
@pytest.mark.unit
def test_array_extraction(workflow, sample_twitter_result):
    """Test {{step.items[*].field}} extracts field from all array items"""
    inputs = {"texts": {"from": "{{twitter.recent_posts[*].text}}"}}
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "texts": [
            "First tweet about crypto",
            "Second tweet about NFTs",
            "Third tweet about DeFi",
        ]
    }


@pytest.mark.unit
def test_array_extraction_multiple_fields(workflow, sample_twitter_result):
    """Test extracting multiple fields from array"""
    inputs = {
        "texts": {"from": "{{twitter.recent_posts[*].text}}"},
        "post_ids": {"from": "{{twitter.recent_posts[*].post_id}}"},
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "texts": [
            "First tweet about crypto",
            "Second tweet about NFTs",
            "Third tweet about DeFi",
        ],
        "post_ids": ["p1", "p2", "p3"],
    }


@pytest.mark.unit
def test_array_without_extraction_returns_full_array(workflow, sample_twitter_result):
    """Test {{step.array[*]}} returns the full array"""
    inputs = {"posts": {"from": "{{twitter.recent_posts[*]}}"}}
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"posts": sample_twitter_result["recent_posts"]}


# 4. Multiple Templates in One Input
@pytest.mark.unit
def test_multiple_templates_in_string(workflow, sample_twitter_result):
    """Test resolving multiple {{...}} in same value"""
    inputs = {
        "message": {
            "from": "User {{twitter.username}} has {{twitter.profile.followers}} followers"
        }
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"message": "User alice_crypto has 1523 followers"}


@pytest.mark.unit
def test_multiple_templates_different_steps(workflow, sample_twitter_result, sample_ml_result):
    """Test templates referencing different steps"""
    inputs = {
        "user": {"from": "{{twitter.username}}"},
        "face_count": {"from": "{{ml.faces[*]}}"},
    }
    previous_results = {
        "twitter": sample_twitter_result,
        "ml": sample_ml_result,
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved["user"] == "alice_crypto"
    assert len(resolved["face_count"]) == 2


# 5. Non-Template Pass-Through
@pytest.mark.unit
def test_non_template_passthrough(workflow):
    """Test non-template values pass through unchanged"""
    inputs = {
        "static": "hello world",
        "number": 42,
        "bool": True,
        "null": None,
        "list": [1, 2, 3],
        "dict": {"nested": "value"},
    }
    previous_results = {}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == inputs


@pytest.mark.unit
def test_mixed_template_and_static(workflow, sample_twitter_result):
    """Test mix of template and static values"""
    inputs = {
        "username": {"from": "{{twitter.username}}"},
        "static_value": "constant",
        "number": 123,
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "username": "alice_crypto",
        "static_value": "constant",
        "number": 123,
    }


# 6. Error Handling - Missing Step
@pytest.mark.unit
def test_missing_step_error(workflow):
    """Test clear error when referenced step doesn't exist"""
    inputs = {"text": {"from": "{{nonexistent.field}}"}}
    previous_results = {"other_step": {"data": "value"}}

    with pytest.raises(ValueError, match="Step 'nonexistent' not found"):
        workflow.resolve_inputs(inputs, previous_results)


@pytest.mark.unit
def test_missing_step_shows_available_steps(workflow, sample_twitter_result):
    """Test error message includes available steps"""
    inputs = {"text": {"from": "{{wrong_name.username}}"}}
    previous_results = {"twitter": sample_twitter_result, "ml": {"data": "value"}}

    with pytest.raises(ValueError) as exc_info:
        workflow.resolve_inputs(inputs, previous_results)

    error_msg = str(exc_info.value)
    assert "wrong_name" in error_msg
    assert "twitter" in error_msg
    assert "ml" in error_msg


# 7. Error Handling - Invalid Path
@pytest.mark.unit
def test_invalid_path_error(workflow, sample_twitter_result):
    """Test error when field path doesn't exist"""
    inputs = {"bio": {"from": "{{twitter.profile.missing_field}}"}}
    previous_results = {"twitter": sample_twitter_result}

    with pytest.raises(ValueError, match="Field 'missing_field' not found"):
        workflow.resolve_inputs(inputs, previous_results)


@pytest.mark.unit
def test_invalid_nested_path_error(workflow, sample_twitter_result):
    """Test error when intermediate path doesn't exist"""
    inputs = {"text": {"from": "{{twitter.nonexistent.field}}"}}
    previous_results = {"twitter": sample_twitter_result}

    with pytest.raises(ValueError, match="Field 'nonexistent' not found"):
        workflow.resolve_inputs(inputs, previous_results)


# 8. Error Handling - Array Operation on Non-Array
@pytest.mark.unit
def test_array_op_on_non_array_error(workflow, sample_twitter_result):
    """Test error when [*] applied to non-array"""
    inputs = {"texts": {"from": "{{twitter.username[*]}}"}}
    previous_results = {"twitter": sample_twitter_result}

    with pytest.raises(ValueError, match="is not an array"):
        workflow.resolve_inputs(inputs, previous_results)


@pytest.mark.unit
def test_array_op_on_string_error(workflow):
    """Test error when [*] applied to string"""
    inputs = {"chars": {"from": "{{step1.text[*]}}"}}
    previous_results = {"step1": {"text": "hello"}}

    with pytest.raises(ValueError, match="is not an array"):
        workflow.resolve_inputs(inputs, previous_results)


# 9. Edge Cases - Null and Missing Values
@pytest.mark.unit
def test_null_field_resolution(workflow):
    """Test null fields resolve to None"""
    inputs = {"bio": {"from": "{{twitter.bio}}"}}
    previous_results = {"twitter": {"bio": None, "username": "alice"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"bio": None}


@pytest.mark.unit
def test_accessing_field_on_null_raises_error(workflow):
    """Test accessing nested field on null raises error"""
    inputs = {"location": {"from": "{{twitter.profile.location}}"}}
    previous_results = {"twitter": {"profile": None}}

    with pytest.raises(ValueError, match="Cannot access field .* on null value"):
        workflow.resolve_inputs(inputs, previous_results)


@pytest.mark.unit
def test_empty_array(workflow):
    """Test resolving from empty array"""
    inputs = {"texts": {"from": "{{twitter.posts[*].text}}"}}
    previous_results = {"twitter": {"posts": []}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"texts": []}


@pytest.mark.unit
def test_array_with_missing_field_in_some_items(workflow):
    """Test array extraction when some items lack the field"""
    inputs = {"texts": {"from": "{{posts.items[*].text}}"}}
    previous_results = {
        "posts": {
            "items": [
                {"text": "First post"},
                {"id": "no-text"},  # Missing 'text' field
                {"text": "Third post"},
            ]
        }
    }

    # Should extract available fields and skip missing ones
    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"texts": ["First post", "Third post"]}


# 10. Complex Real-World Scenarios
@pytest.mark.unit
def test_real_pipeline_scenario(workflow, sample_twitter_result):
    """Test realistic multi-step pipeline with nested data"""
    inputs = {
        "texts": {"from": "{{twitter.recent_posts[*].text}}"},
        "user": {"from": "{{twitter.username}}"},
        "bio": {"from": "{{twitter.profile.bio}}"},
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "texts": [
            "First tweet about crypto",
            "Second tweet about NFTs",
            "Third tweet about DeFi",
        ],
        "user": "alice_crypto",
        "bio": "Crypto enthusiast and blockchain developer",
    }


@pytest.mark.unit
def test_multi_step_pipeline_with_dependencies(workflow, sample_twitter_result, sample_ml_result):
    """Test pipeline where later steps depend on earlier ones"""
    inputs = {
        "username": {"from": "{{twitter.username}}"},
        "face_ids": {"from": "{{face_detection.faces[*].face_id}}"},
        "model_version": {"from": "{{face_detection.model_version}}"},
    }
    previous_results = {
        "twitter": sample_twitter_result,
        "face_detection": sample_ml_result,
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "username": "alice_crypto",
        "face_ids": ["f1", "f2"],
        "model_version": "v1.2.3",
    }


@pytest.mark.unit
def test_complex_nested_array_extraction(workflow):
    """Test extracting from deeply nested array structures"""
    inputs = {"all_names": {"from": "{{data.results[*].user.name}}"}}
    previous_results = {
        "data": {
            "results": [
                {"user": {"name": "Alice", "id": 1}},
                {"user": {"name": "Bob", "id": 2}},
                {"user": {"name": "Charlie", "id": 3}},
            ]
        }
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"all_names": ["Alice", "Bob", "Charlie"]}


# 11. Parametrized Tests for Similar Cases
@pytest.mark.unit
@pytest.mark.parametrize(
    "template,expected",
    [
        ("{{twitter.username}}", "alice_crypto"),
        ("{{twitter.profile.bio}}", "Crypto enthusiast and blockchain developer"),
        ("{{twitter.profile.followers}}", 1523),
        ("{{twitter.profile.location}}", "San Francisco"),
    ],
)
def test_various_field_accesses(workflow, sample_twitter_result, template, expected):
    """Test various field access patterns"""
    inputs = {"result": {"from": template}}
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved["result"] == expected


@pytest.mark.unit
@pytest.mark.parametrize(
    "invalid_template,error_pattern",
    [
        ("{{missing.field}}", "Step 'missing' not found"),
        ("{{twitter.invalid}}", "Field 'invalid' not found"),
        ("{{twitter.profile.invalid}}", "Field 'invalid' not found"),
        ("{{twitter.username[*]}}", "is not an array"),
    ],
)
def test_various_error_cases(workflow, sample_twitter_result, invalid_template, error_pattern):
    """Test various error cases with parametrization"""
    inputs = {"result": {"from": invalid_template}}
    previous_results = {"twitter": sample_twitter_result}

    with pytest.raises(ValueError, match=error_pattern):
        workflow.resolve_inputs(inputs, previous_results)


# 12. Edge Cases with Special Characters and Types
@pytest.mark.unit
def test_numeric_values_in_templates(workflow):
    """Test templates resolving to numeric values"""
    inputs = {
        "count": {"from": "{{stats.count}}"},
        "ratio": {"from": "{{stats.ratio}}"},
    }
    previous_results = {
        "stats": {"count": 42, "ratio": 0.85}
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"count": 42, "ratio": 0.85}


@pytest.mark.unit
def test_boolean_values_in_templates(workflow):
    """Test templates resolving to boolean values"""
    inputs = {
        "is_valid": {"from": "{{validation.is_valid}}"},
        "has_errors": {"from": "{{validation.has_errors}}"},
    }
    previous_results = {
        "validation": {"is_valid": True, "has_errors": False}
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"is_valid": True, "has_errors": False}


@pytest.mark.unit
def test_template_with_underscore_field_names(workflow):
    """Test field names with underscores"""
    inputs = {"user_id": {"from": "{{data.user_id}}"}}
    previous_results = {"data": {"user_id": "usr_12345"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"user_id": "usr_12345"}


@pytest.mark.unit
def test_empty_string_value(workflow):
    """Test resolving to empty string"""
    inputs = {"text": {"from": "{{data.empty}}"}}
    previous_results = {"data": {"empty": ""}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"text": ""}


# 13. Input Validation Edge Cases
@pytest.mark.unit
def test_empty_inputs(workflow):
    """Test with empty inputs dictionary"""
    inputs = {}
    previous_results = {"step1": {"data": "value"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {}


@pytest.mark.unit
def test_inputs_without_from_syntax(workflow):
    """Test inputs that don't use 'from' syntax"""
    inputs = {
        "static": "value",
        "number": 123,
        "templated": {"from": "{{step1.field}}"},
    }
    previous_results = {"step1": {"field": "resolved_value"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "static": "value",
        "number": 123,
        "templated": "resolved_value",
    }


@pytest.mark.unit
def test_dict_value_without_from_key(workflow):
    """Test that dict values without 'from' key pass through"""
    inputs = {
        "config": {"timeout": 30, "retries": 3},
    }
    previous_results = {}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"config": {"timeout": 30, "retries": 3}}


# 14. List Template Resolution (BUG FIX)
@pytest.mark.unit
def test_list_with_single_template(workflow, sample_twitter_result):
    """Test from: ["{{step.field}}"] resolves to [value]"""
    inputs = {"images": {"from": ["{{collect_twitter.profile_picture}}"]}}
    previous_results = {
        "collect_twitter": {
            "profile_picture": "https://example.com/image.jpg",
            "username": "alice",
        }
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"images": ["https://example.com/image.jpg"]}


@pytest.mark.unit
def test_list_with_multiple_templates(workflow):
    """Test from: ["{{step1.field}}", "{{step2.field}}"] resolves to [value1, value2]"""
    inputs = {
        "images": {
            "from": [
                "{{collect_twitter.profile_picture}}",
                "{{collect_facebook.profile_picture}}",
            ]
        }
    }
    previous_results = {
        "collect_twitter": {
            "profile_picture": "https://twitter.com/image.jpg",
        },
        "collect_facebook": {
            "profile_picture": "https://facebook.com/image.jpg",
        },
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "images": [
            "https://twitter.com/image.jpg",
            "https://facebook.com/image.jpg",
        ]
    }


@pytest.mark.unit
def test_list_with_mixed_templates_and_static(workflow):
    """Test list with mix of templates and static values"""
    inputs = {
        "values": {
            "from": [
                "{{step1.name}}",
                "static_value",
                "{{step2.name}}",
            ]
        }
    }
    previous_results = {
        "step1": {"name": "alice"},
        "step2": {"name": "bob"},
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "values": ["alice", "static_value", "bob"]
    }


@pytest.mark.unit
def test_nested_dict_in_list_with_template(workflow):
    """Test from: [{"key": "{{step.field}}"}] resolves to [{"key": value}]"""
    inputs = {
        "records": {
            "from": [
                {"url": "{{step1.url}}", "type": "twitter"},
                {"url": "{{step2.url}}", "type": "facebook"},
            ]
        }
    }
    previous_results = {
        "step1": {"url": "https://twitter.com/profile"},
        "step2": {"url": "https://facebook.com/profile"},
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "records": [
            {"url": "https://twitter.com/profile", "type": "twitter"},
            {"url": "https://facebook.com/profile", "type": "facebook"},
        ]
    }


@pytest.mark.unit
def test_deeply_nested_template_resolution(workflow):
    """Test deeply nested structures with templates"""
    inputs = {
        "config": {
            "from": {
                "sources": [
                    {"name": "twitter", "username": "{{step1.username}}"},
                    {"name": "facebook", "username": "{{step2.username}}"},
                ],
                "options": {
                    "max_results": 100,
                    "filter": "{{step1.filter}}",
                },
            }
        }
    }
    previous_results = {
        "step1": {"username": "alice", "filter": "verified"},
        "step2": {"username": "bob"},
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "config": {
            "sources": [
                {"name": "twitter", "username": "alice"},
                {"name": "facebook", "username": "bob"},
            ],
            "options": {
                "max_results": 100,
                "filter": "verified",
            },
        }
    }


@pytest.mark.unit
def test_list_with_array_extraction_template(workflow, sample_twitter_result):
    """Test list containing array extraction template"""
    inputs = {
        "all_texts": {
            "from": ["{{twitter.recent_posts[*].text}}"]
        }
    }
    previous_results = {"twitter": sample_twitter_result}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    # Should resolve to a list containing a single element (which is itself a list)
    assert resolved == {
        "all_texts": [
            [
                "First tweet about crypto",
                "Second tweet about NFTs",
                "Third tweet about DeFi",
            ]
        ]
    }


@pytest.mark.unit
def test_empty_list_from_syntax(workflow):
    """Test from: [] returns empty list"""
    inputs = {"items": {"from": []}}
    previous_results = {"step1": {"data": "value"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"items": []}


@pytest.mark.unit
def test_list_with_none_values(workflow):
    """Test list containing None values and templates"""
    inputs = {
        "values": {
            "from": [
                "{{step1.value}}",
                None,
                "{{step2.value}}",
            ]
        }
    }
    previous_results = {
        "step1": {"value": "first"},
        "step2": {"value": "second"},
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {
        "values": ["first", None, "second"]
    }


# REGRESSION TEST - Plain string in "from" syntax (no template)
@pytest.mark.unit
def test_plain_string_in_from_syntax(workflow):
    """Test that plain strings in from: syntax are returned unchanged (REGRESSION BUG)"""
    inputs = {
        "username": {"from": "alice_crypto"},
        "age": {"from": 25},
        "active": {"from": True},
    }
    previous_results = {}  # No previous results needed for static values

    resolved = workflow.resolve_inputs(inputs, previous_results)

    # Plain strings WITHOUT {{...}} should pass through unchanged
    assert resolved == {
        "username": "alice_crypto",
        "age": 25,
        "active": True,
    }
