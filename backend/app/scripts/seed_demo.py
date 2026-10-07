"""Rellena la BD con datos de demostración: usuarios, proveedores, piezas e incidencias.

Las fechas se reparten en los últimos meses para que los KPIs tengan sentido.
Uso, desde backend/: python -m app.scripts.seed_demo
Todos los usuarios demo tienen la contraseña "demo1234".
"""

import random
import sys
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import ActionPlan, Incident, IncidentHistory, Part, Supplier, Task, User
from app.models.enums import IncidentStatus, Role, Severity

DEMO_PASSWORD = "demo1234"

USERS = [
    ("operario@demo.com", "Lucía Navarro", Role.OPERATOR),
    ("operario2@demo.com", "Marcos Ferrer", Role.OPERATOR),
    ("ingeniero@demo.com", "Elena Soler", Role.ENGINEER),
    ("ingeniero2@demo.com", "David Ribera", Role.ENGINEER),
    ("admin@demo.com", "Pablo Martí", Role.ADMIN),
]

SUPPLIERS = [
    ("Metalex", "calidad@metalex.example"),
    ("Plastiformas Levante", "sqa@plastiformas.example"),
    ("Tornillería Hispana", "pedidos@tornilleria.example"),
    ("CableTech Ibérica", "quality@cabletech.example"),
    ("Fundiciones Turia", None),
]

# (proveedor, referencia, descripción, defectos típicos)
PARTS = [
    (0, "SP-2041", "Front bumper bracket", ["Off-centre mounting holes", "Burrs on cut edges"]),
    (0, "SP-2187", "Seat rail support", ["Weld spatter on contact surface", "Bent flange"]),
    (1, "PL-0310", "Door trim clip", ["Short shot on clip tab", "Wrong colour batch"]),
    (1, "PL-0452", "Air vent housing", ["Sink marks on visible face", "Flash on parting line"]),
    (2, "TH-M8x25", "Hex flange bolt M8x25", ["Thread out of tolerance", "Missing zinc coating"]),
    (2, "TH-M6x16", "Torx screw M6x16", ["Mixed lengths in batch", "Head cracks"]),
    (3, "CT-HX-118", "Rear light wiring harness", ["Crimp pull-out below spec", "Wrong connector"]),
    (4, "FT-AL-77", "Aluminium gearbox cover", ["Porosity on sealing face", "Out of tolerance"]),
]

TASK_TEMPLATES = [
    "Quarantine affected lot in warehouse",
    "Request 8D report from supplier",
    "Sort and rework stock on site",
    "Update incoming inspection plan",
    "Verify supplier containment actions",
    "Audit supplier production line",
]


def main() -> None:
    rng = random.Random(42)
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == USERS[0][0])) is not None:
            sys.exit("Demo data already loaded")
        seed(db, rng)
        db.commit()
    print(f"Demo data loaded. Log in with operario@demo.com / {DEMO_PASSWORD}")


def seed(db: Session, rng: random.Random) -> None:
    now = datetime.now(UTC)
    users = [
        User(email=email, full_name=name, role=role, password_hash=hash_password(DEMO_PASSWORD))
        for email, name, role in USERS
    ]
    db.add_all(users)
    operators = [u for u in users if u.role == Role.OPERATOR]
    engineers = [u for u in users if u.role == Role.ENGINEER]

    suppliers = [Supplier(name=name, contact_email=email) for name, email in SUPPLIERS]
    db.add_all(suppliers)

    parts = []
    for supplier_index, reference, description, defects in PARTS:
        for _ in range(2):
            lot = f"L{rng.randint(24, 26)}-{rng.randint(1000, 9999)}"
            part = Part(
                supplier=suppliers[supplier_index],
                reference=reference,
                lot=lot,
                description=description,
            )
            parts.append((part, defects))
    db.add_all(part for part, _ in parts)

    # Metalex aparece más a menudo para que el ranking de proveedores tenga un "peor" claro
    weights = [4 if part.supplier is suppliers[0] else 1 for part, _ in parts]
    severities = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]

    for _ in range(28):
        part, defects = rng.choices(parts, weights=weights)[0]
        created = now - timedelta(days=rng.uniform(1, 150), hours=rng.uniform(0, 8))
        incident = Incident(
            part=part,
            title=f"{rng.choice(defects)} — {part.reference}",
            description=(
                f"Detected at incoming inspection on lot {part.lot}. "
                f"{rng.randint(3, 60)} of {rng.choice([100, 200, 500])} sampled units affected."
            ),
            severity=rng.choices(severities, weights=[3, 4, 3, 1])[0],
            reported_by=rng.choice(operators),
            created_at=created,
        )
        db.add(incident)
        _add_event(
            db, incident, incident.reported_by, "created", None, IncidentStatus.OPEN, created
        )
        _advance(db, rng, incident, engineers, created, now)


def _advance(db, rng, incident, engineers, created, now) -> None:
    age_days = (now - created).days
    # Cuanto más antigua es la incidencia, más probable es que esté cerrada
    if age_days < 4:
        target = rng.choice([IncidentStatus.OPEN, IncidentStatus.IN_ANALYSIS])
    elif age_days < 30:
        target = rng.choice(list(IncidentStatus)[1:])
    else:
        target = rng.choices(list(IncidentStatus)[1:], weights=[1, 1, 6])[0]
    if target == IncidentStatus.OPEN:
        return

    engineer = rng.choice(engineers)
    analysed = created + timedelta(hours=rng.uniform(2, 48))
    incident.status = IncidentStatus.IN_ANALYSIS
    incident.analyzed_by = engineer
    _add_event(
        db,
        incident,
        engineer,
        "status_changed",
        IncidentStatus.OPEN,
        IncidentStatus.IN_ANALYSIS,
        analysed,
    )
    if target == IncidentStatus.IN_ANALYSIS:
        return

    planned = analysed + timedelta(days=rng.uniform(1, 4))
    titles = rng.sample(TASK_TEMPLATES, k=rng.randint(2, 4))
    closing = target == IncidentStatus.CLOSED
    tasks = []
    for i, title in enumerate(titles):
        due = (planned + timedelta(days=rng.randint(3, 20))).date()
        done = closing or rng.random() < 0.4
        completed_at = planned + timedelta(days=rng.uniform(1, 12) + i) if done else None
        if completed_at and completed_at > now:
            completed_at = now - timedelta(hours=rng.uniform(1, 24))
        tasks.append(
            Task(
                title=title,
                assigned_to=rng.choice(engineers),
                due_date=due,
                completed_at=completed_at,
            )
        )
    db.add(
        ActionPlan(
            incident=incident,
            created_by=engineer,
            description="Contain the lot, get the root cause from the supplier and verify the fix.",
            created_at=planned,
            tasks=tasks,
        )
    )
    incident.status = IncidentStatus.CORRECTIVE_ACTION
    _add_event(
        db,
        incident,
        engineer,
        "action_plan_created",
        IncidentStatus.IN_ANALYSIS,
        IncidentStatus.CORRECTIVE_ACTION,
        planned,
    )
    for task in tasks:
        if task.completed_at:
            _add_event(
                db, incident, task.assigned_to, "task_completed", None, None, task.completed_at
            )
    if not closing:
        return

    closed = max(task.completed_at for task in tasks) + timedelta(hours=rng.uniform(2, 30))
    closed = min(closed, now)
    incident.status = IncidentStatus.CLOSED
    incident.closed_at = closed
    _add_event(
        db,
        incident,
        engineer,
        "status_changed",
        IncidentStatus.CORRECTIVE_ACTION,
        IncidentStatus.CLOSED,
        closed,
    )


def _add_event(db, incident, user, action, from_status, to_status, when) -> None:
    db.add(
        IncidentHistory(
            incident=incident,
            user=user,
            action=action,
            from_status=from_status,
            to_status=to_status,
            created_at=when,
        )
    )


if __name__ == "__main__":
    main()
