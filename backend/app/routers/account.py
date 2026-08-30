from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["account"])


@router.delete("/account", status_code=204)
def delete_account() -> None:
    raise HTTPException(status_code=501, detail="account deletion is implemented by ticket #5")
