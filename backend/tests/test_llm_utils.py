from services.llm_utils import strip_markdown_fences, parse_llm_json


class TestStripMarkdownFences:
    def test_plain_json(self):
        assert strip_markdown_fences('{"key": "value"}') == '{"key": "value"}'

    def test_json_with_fences(self):
        input_text = '```json\n{"key": "value"}\n```'
        assert strip_markdown_fences(input_text) == '{"key": "value"}'

    def test_fences_without_language(self):
        input_text = '```\n{"key": "value"}\n```'
        assert strip_markdown_fences(input_text) == '{"key": "value"}'

    def test_whitespace_around(self):
        input_text = '  ```json\n{"key": "value"}\n```  '
        assert strip_markdown_fences(input_text) == '{"key": "value"}'

    def test_trailing_fence_only(self):
        input_text = '{"key": "value"}\n```'
        assert strip_markdown_fences(input_text) == '{"key": "value"}'

    def test_empty_string(self):
        assert strip_markdown_fences("") == ""

    def test_no_fence_single_line(self):
        assert strip_markdown_fences("hello world") == "hello world"


class TestParseLlmJson:
    def test_valid_json(self):
        result = parse_llm_json('{"name": "test"}', {})
        assert result == {"name": "test"}

    def test_json_with_fences(self):
        input_text = '```json\n{"name": "test"}\n```'
        result = parse_llm_json(input_text, {})
        assert result == {"name": "test"}

    def test_invalid_json_returns_fallback(self):
        fallback = {"default": True}
        result = parse_llm_json("not json at all", fallback)
        assert result == fallback

    def test_empty_response_returns_fallback(self):
        fallback = {"empty": True}
        result = parse_llm_json("", fallback)
        assert result == fallback

    def test_partial_json_returns_fallback(self):
        fallback = {"partial": True}
        result = parse_llm_json("{incomplete", fallback)
        assert result == fallback

    def test_complex_json(self):
        data = '{"skills": ["python", "js"], "score": 0.85}'
        result = parse_llm_json(data, {})
        assert result["skills"] == ["python", "js"]
        assert result["score"] == 0.85

    def test_json_with_surrounding_text(self):
        input_text = 'Here is the result:\n```json\n{"key": "val"}\n```\nDone.'
        result = parse_llm_json(input_text, {})
        assert result == {"key": "val"}
