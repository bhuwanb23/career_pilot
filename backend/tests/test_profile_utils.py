from services.profile_utils import coerce_string_list


def test_coerce_string_list_from_strings():
    assert coerce_string_list(["Python", "React"]) == ["Python", "React"]


def test_coerce_string_list_from_skill_dicts():
    items = [{"name": "Python", "level": "Advanced"}, {"name": "React", "level": "Expert"}]
    assert coerce_string_list(items) == ["Python (Advanced)", "React (Expert)"]


def test_coerce_string_list_from_strength_dicts():
    items = [{"name": "Leadership", "description": "Led teams of 5+"}]
    assert coerce_string_list(items) == ["Leadership (Led teams of 5+)"]


def test_coerce_string_list_comma_string():
    assert coerce_string_list("Python, JavaScript") == ["Python", "JavaScript"]
