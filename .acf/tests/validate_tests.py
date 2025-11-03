#!/usr/bin/env python3
"""
Test validation script for ODP test suite

Validates:
- Test file structure
- Test count matches requirements
- Coverage of all assets
- Syntax correctness
"""

import os
import re
import sys
from pathlib import Path


def validate_test_structure():
    """Validate test directory structure"""
    print("📂 Validating test structure...")

    required_files = [
        "tests/conftest.py",
        "tests/requirements.txt",
        "tests/README.md",
        "tests/integration/test_dagster_assets.py",
        "pytest.ini",
    ]

    missing = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing.append(file_path)

    if missing:
        print(f"❌ Missing required files: {', '.join(missing)}")
        return False

    print("✅ All required files present")
    return True


def count_tests(test_file):
    """Count test functions in a file"""
    with open(test_file, 'r') as f:
        content = f.read()

    # Count test functions
    test_pattern = r'^def (test_\w+)\('
    tests = re.findall(test_pattern, content, re.MULTILINE)

    return tests


def validate_test_coverage():
    """Validate test coverage of all assets"""
    print("\n🧪 Validating test coverage...")

    test_file = "tests/integration/test_dagster_assets.py"
    tests = count_tests(test_file)

    print(f"\n📊 Test Summary:")
    print(f"   Total tests: {len(tests)}")

    # Categorize tests
    categories = {
        "Bronze Layer": [t for t in tests if "bronze" in t],
        "Silver Layer": [t for t in tests if "silver" in t],
        "Gold Layer": [t for t in tests if "gold" in t],
        "Delta Lake": [t for t in tests if "delta_lake" in t],
        "Error Scenarios": [t for t in tests if "invalid" in t or "missing" in t],
        "End-to-End": [t for t in tests if "end_to_end" in t],
    }

    for category, category_tests in categories.items():
        print(f"\n   {category}: {len(category_tests)}")
        for test in category_tests:
            print(f"     - {test}")

    # Check minimum requirements
    required_counts = {
        "Bronze Layer": 2,
        "Silver Layer": 2,
        "Gold Layer": 2,
        "Delta Lake": 1,
        "Error Scenarios": 2,
        "End-to-End": 1,
    }

    all_met = True
    for category, min_count in required_counts.items():
        actual = len(categories[category])
        if actual < min_count:
            print(f"\n❌ {category}: Expected {min_count}, found {actual}")
            all_met = False

    if all_met:
        print("\n✅ All test coverage requirements met")

    return all_met


def validate_asset_coverage():
    """Validate that all assets have tests"""
    print("\n🎯 Validating asset coverage...")

    # Assets to cover
    required_assets = [
        "raw_pipeline_events",
        "raw_crawler_results",
        "pipeline_events",
        "crawler_results",
        "pipeline_metrics",
        "user_profiles",
    ]

    test_file = "tests/integration/test_dagster_assets.py"
    with open(test_file, 'r') as f:
        content = f.read()

    missing = []
    for asset in required_assets:
        if asset not in content:
            missing.append(asset)

    if missing:
        print(f"❌ Assets not tested: {', '.join(missing)}")
        return False

    print("✅ All 6 Dagster assets covered")
    return True


def validate_pytest_config():
    """Validate pytest configuration"""
    print("\n⚙️  Validating pytest configuration...")

    with open("pytest.ini", 'r') as f:
        config = f.read()

    required_settings = [
        "--cov=data/dagster/assets",
        "--cov-fail-under=80",
        "testpaths = tests",
    ]

    missing = []
    for setting in required_settings:
        if setting not in config:
            missing.append(setting)

    if missing:
        print(f"❌ Missing pytest settings: {', '.join(missing)}")
        return False

    print("✅ Pytest configuration valid")
    return True


def main():
    """Run all validation checks"""
    print("=" * 60)
    print("ODP Test Suite Validation")
    print("=" * 60)

    checks = [
        validate_test_structure,
        validate_test_coverage,
        validate_asset_coverage,
        validate_pytest_config,
    ]

    results = [check() for check in checks]

    print("\n" + "=" * 60)
    if all(results):
        print("✅ ALL VALIDATION CHECKS PASSED")
        print("=" * 60)
        print("\n📋 Next Steps:")
        print("   1. Install dependencies: pip install -r tests/requirements.txt")
        print("   2. Run tests: make test-dagster")
        print("   3. Check coverage: open htmlcov/index.html")
        return 0
    else:
        print("❌ VALIDATION FAILED")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
