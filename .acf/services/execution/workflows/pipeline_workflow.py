"""
ODP Pipeline Workflow
Executes investigation pipelines based on YAML specifications
"""

from datetime import timedelta
from typing import Any
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities.crawler_activities import crawl_twitter, crawl_facebook, crawl_linkedin
    from activities.ml_activities import run_face_recognition, run_sentiment_analysis, run_ner
    from activities.function_activities import lookup_breach_db
    from activities.event_activities import publish_event


@workflow.defn
class PipelineWorkflow:
    """Main workflow for executing ODP pipelines"""

    @workflow.run
    async def run(self, yaml_spec: dict) -> dict:
        """
        Execute pipeline based on YAML specification

        Args:
            yaml_spec: Parsed YAML pipeline specification

        Returns:
            Execution results
        """
        pipeline_id = yaml_spec.get("pipeline_id", "unknown")
        workspace_id = yaml_spec.get("workspace_id", "unknown")
        steps = yaml_spec.get("steps", [])

        workflow.logger.info(f"Starting pipeline: {pipeline_id}")

        # Publish start event
        await workflow.execute_activity(
            publish_event,
            {
                "event_type": "pipeline.execution.started",
                "pipeline_id": pipeline_id,
                "workspace_id": workspace_id,
            },
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Execute steps sequentially (TODO: handle depends_on for parallelism)
        results = {}
        for step in steps:
            step_id = step.get("id")
            step_type = step.get("type")

            workflow.logger.info(f"Executing step: {step_id} (type: {step_type})")

            # Publish step start event
            await workflow.execute_activity(
                publish_event,
                {
                    "event_type": "pipeline.step.started",
                    "pipeline_id": pipeline_id,
                    "step_id": step_id,
                },
                start_to_close_timeout=timedelta(seconds=10),
            )

            try:
                # Route to appropriate activity based on step type
                step_result = await self.execute_step(step, results)
                results[step_id] = step_result

                # Publish step completion
                await workflow.execute_activity(
                    publish_event,
                    {
                        "event_type": "pipeline.step.completed",
                        "pipeline_id": pipeline_id,
                        "step_id": step_id,
                        "result": step_result,
                    },
                    start_to_close_timeout=timedelta(seconds=10),
                )

            except Exception as e:
                workflow.logger.error(f"Step {step_id} failed: {e}")

                # Publish step failure
                await workflow.execute_activity(
                    publish_event,
                    {
                        "event_type": "pipeline.step.failed",
                        "pipeline_id": pipeline_id,
                        "step_id": step_id,
                        "error": str(e),
                    },
                    start_to_close_timeout=timedelta(seconds=10),
                )

                # TODO: Handle error based on on_error config in YAML
                raise

        # Publish completion event
        await workflow.execute_activity(
            publish_event,
            {
                "event_type": "pipeline.completed",
                "pipeline_id": pipeline_id,
                "workspace_id": workspace_id,
                "results": results,
            },
            start_to_close_timeout=timedelta(seconds=10),
        )

        workflow.logger.info(f"Pipeline completed: {pipeline_id}")

        return {
            "pipeline_id": pipeline_id,
            "status": "completed",
            "results": results,
        }

    async def execute_step(self, step: dict, previous_results: dict) -> dict:
        """Execute a single pipeline step"""
        step_type = step.get("type")
        method = step.get("method")
        model = step.get("model")
        inputs = step.get("inputs", {})

        # Default retry policy
        retry_policy = RetryPolicy(
            maximum_attempts=step.get("retry_policy", {}).get("max_attempts", 3),
            initial_interval=timedelta(seconds=1),
            maximum_interval=timedelta(seconds=60),
        )

        # Resolve input values from previous results
        resolved_inputs = self.resolve_inputs(inputs, previous_results)

        # Route to appropriate activity
        if step_type == "crawler":
            return await self.execute_crawler(method, resolved_inputs, retry_policy)
        elif step_type == "ml_model":
            return await self.execute_ml_model(model, resolved_inputs, retry_policy)
        elif step_type == "function":
            return await self.execute_function(method, resolved_inputs, retry_policy)
        elif step_type == "loop":
            # TODO: Implement loop execution
            return {"status": "skipped", "reason": "Loop not yet implemented"}
        elif step_type == "validation":
            # TODO: Implement validation
            return {"status": "passed"}
        elif step_type == "output":
            # TODO: Implement output generation
            return {"status": "generated"}
        elif step_type == "data_transform":
            # TODO: Implement Dagster integration
            return {"status": "skipped", "reason": "Data transform not yet implemented"}
        else:
            raise ValueError(f"Unknown step type: {step_type}")

    async def execute_crawler(self, method: str, inputs: dict, retry_policy: RetryPolicy) -> dict:
        """Execute crawler activity"""
        if method == "crawler_twitter_profile":
            return await workflow.execute_activity(
                crawl_twitter,
                inputs,
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=retry_policy,
            )
        elif method == "crawler_facebook_profile":
            return await workflow.execute_activity(
                crawl_facebook,
                inputs,
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=retry_policy,
            )
        elif method == "crawler_linkedin_profile":
            return await workflow.execute_activity(
                crawl_linkedin,
                inputs,
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=retry_policy,
            )
        else:
            raise ValueError(f"Unknown crawler method: {method}")

    async def execute_ml_model(self, model: str, inputs: dict, retry_policy: RetryPolicy) -> dict:
        """Execute ML model activity"""
        if "face_recognition" in model:
            return await workflow.execute_activity(
                run_face_recognition,
                inputs,
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=retry_policy,
            )
        elif "sentiment" in model:
            return await workflow.execute_activity(
                run_sentiment_analysis,
                inputs,
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=retry_policy,
            )
        elif "ner" in model:
            return await workflow.execute_activity(
                run_ner,
                inputs,
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=retry_policy,
            )
        else:
            raise ValueError(f"Unknown ML model: {model}")

    async def execute_function(self, method: str, inputs: dict, retry_policy: RetryPolicy) -> dict:
        """Execute function activity"""
        if method == "breach_db_lookup":
            return await workflow.execute_activity(
                lookup_breach_db,
                inputs,
                start_to_close_timeout=timedelta(seconds=20),
                retry_policy=retry_policy,
            )
        else:
            raise ValueError(f"Unknown function method: {method}")

    def resolve_inputs(self, inputs: dict, previous_results: dict) -> dict:
        """
        Resolve input values from previous step results using template syntax.

        Supported template patterns:
        - {{step_id.field}} - Access nested field from step result
        - {{step_id.array[*].field}} - Extract field from all array items
        - {{step_id.nested.path.field}} - Deep nested field access

        Examples:
        - "{{collect_twitter.username}}" → "alice_crypto"
        - "{{collect_twitter.recent_posts[*].text}}" → ["text1", "text2", ...]
        - "{{collect_twitter.profile.bio}}" → "Bio text..."

        Args:
            inputs: Input specification from YAML (may contain templates)
            previous_results: Dictionary of previous step results by step_id

        Returns:
            Resolved inputs with templates replaced by actual values

        Raises:
            ValueError: If step_id not found or field path invalid
        """
        workflow.logger.info(f"[DEBUG] resolve_inputs called with inputs={inputs}, previous_results keys={list(previous_results.keys())}")
        resolved: dict = {}

        for key, value in inputs.items():
            workflow.logger.info(f"[DEBUG] Processing input key='{key}', value={repr(value)}, type={type(value).__name__}")
            # Handle "from" syntax: {"from": "{{template}}"}
            if isinstance(value, dict) and "from" in value:
                template_value = value["from"]
                workflow.logger.info(f"[DEBUG] Found 'from' syntax, template_value={repr(template_value)}, type={type(template_value).__name__}")
                resolved[key] = self._resolve_template_value(
                    template_value, previous_results
                )
                workflow.logger.info(f"[DEBUG] Resolved '{key}' to: {repr(resolved[key])}")
            else:
                # Direct value (no template)
                workflow.logger.info(f"[DEBUG] Direct value (no 'from'), keeping as-is")
                resolved[key] = value

        workflow.logger.info(f"[DEBUG] Final resolved inputs: {resolved}")
        return resolved

    def _resolve_template_value(self, value: Any, previous_results: dict) -> Any:
        """
        Resolve a single value that may contain template strings.

        Handles strings, lists, dicts, and nested structures recursively.

        Supports:
        - String templates: "{{step.field}}" → resolved value
        - Lists with templates: ["{{step.field}}"] → [resolved value]
        - Nested structures: recursively resolves all templates
        - Primitives: returned unchanged (numbers, booleans, None)

        Examples:
        - "{{step.field}}" → "value"
        - ["{{step.field}}"] → ["value"]
        - ["{{step1.field}}", "{{step2.field}}"] → ["value1", "value2"]
        - {"key": "{{step.field}}"} → {"key": "value"}
        - [{"nested": "{{step.field}}"}] → [{"nested": "value"}]
        """
        import re

        workflow.logger.info(f"[DEBUG] _resolve_template_value called with value={repr(value)}, type={type(value).__name__}")

        # Handle lists: resolve each element recursively
        if isinstance(value, list):
            workflow.logger.info(f"[DEBUG] Handling list with {len(value)} items")
            return [self._resolve_template_value(item, previous_results) for item in value]

        # Handle dicts: resolve each value recursively
        if isinstance(value, dict):
            workflow.logger.info(f"[DEBUG] Handling dict with keys: {list(value.keys())}")
            return {k: self._resolve_template_value(v, previous_results) for k, v in value.items()}

        # Handle strings: resolve templates
        if isinstance(value, str):
            workflow.logger.info(f"[DEBUG] Handling string: '{value}'")
            # Find all template patterns: {{...}}
            template_pattern = r'\{\{([^}]+)\}\}'
            matches = re.findall(template_pattern, value)
            workflow.logger.info(f"[DEBUG] Regex matches: {matches}")

            if not matches:
                # No templates, return as-is
                workflow.logger.info(f"[DEBUG] No template matches, returning string as-is")
                return value

            # If the entire value is a single template, return the resolved data structure
            # Otherwise, perform string substitution
            if len(matches) == 1 and value == f"{{{{{matches[0]}}}}}":
                # Single template occupying entire value
                workflow.logger.info(f"[DEBUG] Single template, resolving path: {matches[0]}")
                return self._resolve_template_path(matches[0].strip(), previous_results)
            else:
                # Multiple templates or template within string - substitute as strings
                workflow.logger.info(f"[DEBUG] Multiple templates or embedded template, doing string substitution")
                resolved_value = value
                for match in matches:
                    template_result = self._resolve_template_path(
                        match.strip(), previous_results
                    )
                    # Convert to string for substitution
                    resolved_value = resolved_value.replace(
                        f"{{{{{match}}}}}",
                        str(template_result)
                    )
                return resolved_value

        # Handle primitives: return unchanged (numbers, booleans, None)
        workflow.logger.info(f"[DEBUG] Handling primitive, returning as-is")
        return value

    def _resolve_template_path(self, path: str, previous_results: dict) -> Any:
        """
        Resolve a template path like "step_id.field.nested[*].value".

        Args:
            path: Template path (without {{ }})
            previous_results: Dictionary of previous step results

        Returns:
            Resolved value from the path

        Raises:
            ValueError: If step not found or path invalid
        """
        workflow.logger.debug(f"Resolving template path: {path}")

        # Split path by dots
        segments = path.split('.')

        if not segments:
            raise ValueError("Empty template path")

        # First segment is the step_id
        step_id = segments[0]

        if step_id not in previous_results:
            raise ValueError(
                f"Step '{step_id}' not found in previous results. "
                f"Available steps: {list(previous_results.keys())}"
            )

        # Start with step result
        current_value = previous_results[step_id]

        # Navigate through remaining segments
        for segment in segments[1:]:
            current_value = self._navigate_segment(
                current_value, segment, step_id, path
            )

        workflow.logger.debug(
            f"Resolved '{path}' to: {current_value if not isinstance(current_value, list) or len(str(current_value)) < 100 else f'[list with {len(current_value)} items]'}"
        )

        return current_value

    def _navigate_segment(
        self,
        data: Any,
        segment: str,
        step_id: str,
        full_path: str
    ) -> Any:
        """
        Navigate a single segment of the path, handling arrays and nested fields.

        Args:
            data: Current data structure
            segment: Path segment (may include [*] syntax)
            step_id: Original step ID (for error messages)
            full_path: Full template path (for error messages)

        Returns:
            Value at this segment
        """
        import re

        # Check for array extraction syntax: field[*]
        array_match = re.match(r'^(.+)\[\*\]$', segment)

        if array_match:
            # Array extraction: first get the field, then extract from array items
            field_name = array_match.group(1)

            # First navigate to the field
            if data is None:
                raise ValueError(
                    f"Cannot access field '{field_name}' on null value in '{full_path}'"
                )

            if not isinstance(data, dict):
                raise ValueError(
                    f"Cannot access field '{field_name}' on {type(data).__name__} at '{full_path}'"
                )

            if field_name not in data:
                raise ValueError(
                    f"Field '{field_name}' not found in step '{step_id}' result. "
                    f"Available fields: {list(data.keys())}"
                )

            array_data = data[field_name]

            # Now check if it's an array
            if not isinstance(array_data, list):
                raise ValueError(
                    f"Field '{field_name}' is not an array at '{full_path}'. "
                    f"Cannot apply [*] syntax. Got {type(array_data).__name__}"
                )

            # Extract field from each array item (no nested field after [*] in this segment)
            # The segment is "field[*]", meaning "get field as array"
            # If user wants "field[*].subfield", that will be handled in next segment
            return array_data

        else:
            # Regular field access
            if data is None:
                raise ValueError(
                    f"Cannot access field '{segment}' on null value in '{full_path}'"
                )

            if isinstance(data, dict):
                if segment not in data:
                    raise ValueError(
                        f"Field '{segment}' not found in step '{step_id}' result. "
                        f"Available fields: {list(data.keys())}"
                    )
                return data[segment]

            elif isinstance(data, list):
                # If we're accessing a field on an array, apply it to ALL items
                # This handles the case where the previous segment returned an array
                # and we're now accessing a field on each item
                results = []
                for idx, item in enumerate(data):
                    if not isinstance(item, dict):
                        raise ValueError(
                            f"Cannot access field '{segment}' on non-dict item "
                            f"at index {idx} in '{full_path}'. "
                            f"Got {type(item).__name__}"
                        )

                    if segment not in item:
                        workflow.logger.warning(
                            f"Field '{segment}' not found in array item {idx} "
                            f"at '{full_path}'. Skipping."
                        )
                        continue

                    results.append(item[segment])

                return results

            else:
                raise ValueError(
                    f"Cannot navigate into {type(data).__name__} at '{full_path}'"
                )
