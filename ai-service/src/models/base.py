from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    Base Pydantic v2 model supporting both camelCase (NestJS API convention)
    and snake_case (Pythonic PEP 8 convention).
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        protected_namespaces=(),
    )
