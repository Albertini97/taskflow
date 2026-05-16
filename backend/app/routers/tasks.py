from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[schemas.TaskRead])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Returns own tasks + tasks from teams the user belongs to."""
    team_ids = [m.team_id for m in current_user.team_memberships]
    return (
        db.query(models.Task)
        .filter(
            (models.Task.owner_id == current_user.id)
            | (models.Task.team_id.in_(team_ids))
        )
        .order_by(models.Task.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.TaskRead, status_code=201)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # If team_id provided, verify user is a member
    if task_data.team_id:
        is_member = db.query(models.TeamMember).filter(
            models.TeamMember.team_id == task_data.team_id,
            models.TeamMember.user_id == current_user.id,
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="No perteneces a ese equipo")

    task = models.Task(**task_data.model_dump(), owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=schemas.TaskRead)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permiso para editar esta tarea")

    for field, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permiso para eliminar esta tarea")

    db.delete(task)
    db.commit()
