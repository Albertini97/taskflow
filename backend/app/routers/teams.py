from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/", response_model=schemas.TeamRead, status_code=201)
def create_team(
    team_data: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    team = models.Team(name=team_data.name, owner_id=current_user.id)
    db.add(team)
    db.flush()  # Get ID before commit

    # Creator is automatically a member with role "owner"
    member = models.TeamMember(team_id=team.id, user_id=current_user.id, role="owner")
    db.add(member)
    db.commit()
    db.refresh(team)
    return team


@router.get("/", response_model=List[schemas.TeamRead])
def get_my_teams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    team_ids = [m.team_id for m in current_user.team_memberships]
    return db.query(models.Team).filter(models.Team.id.in_(team_ids)).all()


@router.get("/{team_id}", response_model=schemas.TeamRead)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    is_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="No perteneces a este equipo")
    return team


@router.post("/{team_id}/invite")
def invite_to_team(
    team_id: int,
    invite: schemas.TeamInvite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el owner puede invitar miembros")

    invitee = db.query(models.User).filter(models.User.email == invite.email).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    already_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == invitee.id,
    ).first()
    if already_member:
        raise HTTPException(status_code=400, detail="El usuario ya es miembro del equipo")

    member = models.TeamMember(team_id=team_id, user_id=invitee.id, role="member")
    db.add(member)
    db.commit()
    return {"message": f"{invitee.username} añadido al equipo correctamente"}


@router.delete("/{team_id}/members/{user_id}", status_code=204)
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el owner puede eliminar miembros")

    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    db.delete(member)
    db.commit()
