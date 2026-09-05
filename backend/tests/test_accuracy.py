"""
TaskPilot AI — Accuracy Measurement Script

Measures actual pipeline accuracy against a golden dataset.
Run from backend/ directory: python -m tests.test_accuracy
"""
import json
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agent_2_extraction_agent import ExtractionAgent
from agents.agent_3_fusion_agent import FusionAgent
from agents.agent_2_validation import TaskValidator


def load_dataset():
    dataset_path = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_extraction_accuracy():
    """Test hidden task extraction against golden dataset."""
    print("=" * 60)
    print("TEST 1: Hidden Task Extraction Accuracy")
    print("=" * 60)

    agent = ExtractionAgent()
    validator = TaskValidator()
    dataset = load_dataset()

    extraction_cases = [d for d in dataset if d.get("type") != "deduplication"]
    total_expected = 0
    total_found = 0
    total_false_positives = 0
    correct_urgency = 0
    correct_confidence = 0

    for case in extraction_cases:
        source = case["source"]
        input_data = case["input"]
        expected = case.get("expected_tasks", [])
        min_expected = case.get("expected_hidden_count_min", 0)

        # Reset validator for each case
        validator.reset()

        # Extract tasks
        raw_tasks = agent.extract_hidden_tasks(source, input_data)
        validated_tasks = validator.validate_batch(raw_tasks, source)

        # Count matches
        matched = 0
        for exp in expected:
            title_contains = exp.get("title_contains", "").lower()
            found = False
            for task in validated_tasks:
                if title_contains in task.get("title", "").lower():
                    found = True
                    # Check urgency
                    if task.get("urgency") == exp.get("urgency"):
                        correct_urgency += 1
                    # Check confidence
                    if task.get("confidence", 0) >= exp.get("min_confidence", 0):
                        correct_confidence += 1
                    break
            if found:
                matched += 1

        total_expected += max(len(expected), min_expected)
        total_found += matched

        # False positives: tasks extracted but not expected
        false_positives = max(0, len(validated_tasks) - len(expected))
        total_false_positives += false_positives

        status = "PASS" if matched >= min_expected else "FAIL"
        print(f"  [{status}] {case['id']}: {case['description']}")
        print(f"          Expected: {len(expected)} tasks, Found: {len(validated_tasks)} tasks, Matched: {matched}")

    recall = total_found / total_expected if total_expected > 0 else 0
    precision = total_found / (total_found + total_false_positives) if (total_found + total_false_positives) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    print(f"\n  --- Results ---")
    print(f"  Recall:    {recall:.1%} ({total_found}/{total_expected})")
    print(f"  Precision: {precision:.1%}")
    print(f"  F1 Score:  {f1:.1%}")
    if total_expected > 0:
        print(f"  Urgency Accuracy: {correct_urgency}/{total_expected} ({correct_urgency/total_expected:.1%})")
    print()

    return {"recall": recall, "precision": precision, "f1": f1}


def test_deduplication_accuracy():
    """Test task deduplication against golden dataset."""
    print("=" * 60)
    print("TEST 2: Deduplication Accuracy")
    print("=" * 60)

    agent = FusionAgent()
    dataset = load_dataset()

    dedup_cases = [d for d in dataset if d.get("type") == "deduplication"]
    correct = 0
    total = len(dedup_cases)
    total_confidence = 0

    for case in dedup_cases:
        task_a = case["task_a"]
        task_b = case["task_b"]
        expected_dup = case["expected_is_duplicate"]

        result = agent.check_duplicate(task_a, task_b)
        predicted_dup = result.get("is_duplicate", False)
        confidence = result.get("confidence", 0)

        match = predicted_dup == expected_dup
        if match:
            correct += 1
        total_confidence += confidence

        status = "PASS" if match else "FAIL"
        print(f"  [{status}] {case['id']}: {case['description']}")
        print(f"          Expected: {'duplicate' if expected_dup else 'unique'}, "
              f"Got: {'duplicate' if predicted_dup else 'unique'} "
              f"(confidence: {confidence:.3f})")

    accuracy = correct / total if total > 0 else 0
    avg_confidence = total_confidence / total if total > 0 else 0

    print(f"\n  --- Results ---")
    print(f"  Accuracy:    {accuracy:.1%} ({correct}/{total})")
    print(f"  Avg Confidence: {avg_confidence:.3f}")
    print()

    return {"accuracy": accuracy, "avg_confidence": avg_confidence}


def test_validation_accuracy():
    """Test the validation layer noise filtering."""
    print("=" * 60)
    print("TEST 3: Validation Layer (Noise Filtering)")
    print("=" * 60)

    validator = TaskValidator()

    noise_tasks = [
        {"title": "test", "urgency": "medium"},
        {"title": "update", "urgency": "high"},
        {"title": "fix this", "urgency": "critical"},
        {"title": "follow up", "urgency": "medium"},
        {"title": "AB", "urgency": "low"},  # too short
        {"title": "", "urgency": "medium"},  # empty
        {"title": "Fix production database connection pool timeout", "urgency": "high", "confidence": 0.85},
        {"title": "Review and approve OAuth PR #212", "urgency": "medium", "confidence": 0.9, "assignee": "user-002"},
        {"title": "Deploy hotfix to production environment by EOD", "urgency": "critical", "confidence": 0.95, "deadline": "today"},
    ]

    expected_pass = 3  # Only the last 3 are valid tasks
    passed = 0
    filtered = 0

    for task in noise_tasks:
        result = validator.validate(task.copy(), "email")
        if result is not None:
            passed += 1
            print(f"  [PASS] '{task['title'][:50]}' -> kept")
        else:
            filtered += 1
            print(f"  [FILTERED] '{task['title'][:50]}' -> removed")

    print(f"\n  --- Results ---")
    print(f"  Valid tasks kept:    {passed}/{expected_pass}")
    print(f"  Noise filtered:      {filtered}/{len(noise_tasks) - expected_pass}")
    print()

    return {"passed": passed, "filtered": filtered}


def run_all_tests():
    print("\n" + "=" * 60)
    print("TaskPilot AI — Accuracy Measurement Suite")
    print("=" * 60 + "\n")

    results = {}
    results["extraction"] = test_extraction_accuracy()
    results["deduplication"] = test_deduplication_accuracy()
    results["validation"] = test_validation_accuracy()

    print("=" * 60)
    print("OVERALL SUMMARY")
    print("=" * 60)
    print(f"  Extraction Recall:    {results['extraction']['recall']:.1%}")
    print(f"  Extraction F1:        {results['extraction']['f1']:.1%}")
    print(f"  Deduplication Accuracy: {results['deduplication']['accuracy']:.1%}")
    print(f"  Validation Noise Filter: {results['validation']['filtered']} tasks removed")
    print("=" * 60)

    return results


if __name__ == "__main__":
    run_all_tests()
