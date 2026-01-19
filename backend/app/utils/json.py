import json
from typing import Any, Dict
from jsonschema import validate
from jsonschema.exceptions import ValidationError


def parse_json_strict(text: str) -> Dict[str, Any]:
    return json.loads((text or "").strip())


def validate_or_raise(data: Dict[str, Any], schema: Dict[str, Any]) -> None:
    try:
        validate(instance=data, schema=schema)
    except ValidationError as e:
        raise ValueError(f"Schema validation failed: {e.message}") from e
