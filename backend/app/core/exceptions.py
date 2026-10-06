class NotFoundError(Exception):
    def __init__(self, entity: str, entity_id: int) -> None:
        super().__init__(f"{entity} {entity_id} not found")


class ConflictError(Exception):
    pass


class BusinessRuleError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass
